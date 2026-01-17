from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from player import Player
from table import Table


app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
CORS(app,resources={r"/*":{"origins":"*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")


tables = {} #dict of table_id:table objects 

@app.route("/")
def home():
    return "server running"
    
@socketio.on("join-table")
def on_join_table(data):
    table_id = data["tableId"]
    join_room(table_id)
    player = Player(request.sid) #create the new player, add username?
    table = tables.get(table_id, None)

    if table is not None:
        table.add_player(player)
        message = f"{request.sid} joined {table_id}"
    else:
        tables[table_id] = Table(table_id)
        tables[table_id].add_player(player)
        message = f"{request.sid} created {table_id}"

    emit("chat-message",
         {"sender": "system", "message": message},
         to=table_id)
    
    # start game if 4 ppl
    table = tables.get(table_id)
    if len(table.players) == 4:
        table.start_game()
        emit("chat-message",
             {"sender": "system", "message": "Start Game!"},
             to=table_id)

        table_state = table.to_state()
        for player_sid in table.players.keys():
            player_state = table.players[player_sid].to_state()
            data = {"player_state": player_state, "table_state": table_state}
            emit("game-start", data, to=player_sid)

@socketio.on("game-action")
def game_action(data):
    table_id = data["tableId"]
    sid = request.sid
    table = tables.get(table_id)

    if data["type"] == "draw":
        possible_actions, tile = table.game.first_phase(sid)
        emit('possible-actions', {"actions": possible_actions[sid], "tile": tile}, to=sid)

    elif data["type"] == "discard":
        print("discarded!")
        tile = data["tile"]
        table.game.discard_tile(sid, tile)
        win, pong_or_kong, chi = table.game.second_phase()
        emit("discard-tile", {"tile": tile, "sid": sid}, to=table_id)

        # init pending decision state
        table.game.pending = {
            "tile": tile,
            "win": win,
            "pong_or_kong": pong_or_kong,
            "chi": chi,
            "tier": None,
            "eligible": [],
            "responses": {},  # sid -> choice
        }        
        #only send highest priority action
        print(table.game.pending)
        print()
        if win:
            send_action(table, "win", win) 
        elif pong_or_kong:
            send_action(table, "pong_or_kong", pong_or_kong)
        elif chi:
            send_action(table, "chi", chi)
        else:
            table.game.pending = None

@socketio.on("reaction-choice")
def reaction_choice(data):
    table_id = data["tableId"]
    sid = request.sid
    table = tables.get(table_id)

    if not table or not getattr(table, "pending", None):
        return

    pending = table.game.pending
    if sid not in pending["eligible"]:
        return

    choice = data.get("choice")  # {"type":"pass"} OR {"type":"pong","payload":...}
    pending["responses"][sid] = choice

    # if someone takes action, resolve immediately
    if choice and choice.get("type") != "pass":
        table.game.apply_reaction(sid, choice, pending["tile"])
        table.game.pending = None
        socketio.emit("table-update", table.to_state(), room=table_id)
        return

    # if everyone eligible has responded and all passed -> next tier
    if all(s in pending["responses"] for s in pending["eligible"]):
        tier = pending["tier"]
        if tier == "win" and pending["pong_or_kong"]:
            send_action(table, "pong_or_kong", pending["pong_or_kong"])
        elif tier in ("win", "pong_or_kong") and pending["chi"]:
            send_action(table, "chi", pending["chi"])
        else:
            table.game.pending = None
            # no reactions taken -> continue game


  
@socketio.on("send-message")
def on_send_message(data):
    table_id = data["tableId"]
    message = data["message"]
    sid = request.sid 

    emit("chat-message",
         {"sender": sid, "message": message},
         to=table_id)

@socketio.on("leave-table")
def on_leave_room(data):
    table_id = data["tableId"]
    leave_room(table_id)
    
    table = tables.get(table_id, None)
    table.remove_player(request.sid)
    if len(table.players) < 1:
        tables.pop(table_id)
        print(f"table {table_id} deleted")

    emit("chat-message",
         {"sender": "system", "message": f"{request.sid} left {table_id}"},
         to=table_id)


#helper func
def send_action(table, tier, entries):

    print(tier)
    print(entries)
    # entries is list of (sid, payload)
    table.game.pending["tier"] = tier
    table.game.pending["eligible"] = list({sid for sid, _, _ in entries})
    table.game.pending["responses"] = {}

    by_sid = {}
    for sid, _, payload in entries:
        by_sid.setdefault(sid, []).append(payload)

    for sid, payloads in by_sid.items():
        socketio.emit("reaction-options", {"tier": tier, "options": payloads}, to=sid)


if __name__ == "__main__":
    socketio.run(app, host="127.0.0.1", port=5000, debug=True)