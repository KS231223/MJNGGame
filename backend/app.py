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
        emit("discard-tile", {"tile": tile, "sid": sid}, to=table_id)

        win, pong_or_kong, chi = table.game.second_phase()

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
            table.game.turn_index = (table.game.turn_index % 4) + 1
            emit_full_state(table)

@socketio.on("reaction-choice")
def reaction_choice(data):
    table_id = data["tableId"]
    sid = request.sid
    table = tables.get(table_id)

    if not table or not getattr(table.game, "pending", None):
        return

    pending = table.game.pending
    if sid not in pending["eligible"]:
        return

    choice = data.get("choice") or {}
    pending["responses"][sid] = choice

    # if someone takes action, resolve immediately
    if choice.get("type") != "pass":
        action = choice.get("type")  # "pong"|"kong"|"chi"|"win"
        tiles_to_use = choice.get("tiles_to_use", [])  # list of tile dicts

        # trust backend pending tile as the true last discard
        last_discarded_tile = pending["tile"]

        # call your new signature
        table.game.apply_reaction(sid, tiles_to_use, last_discarded_tile, action)

        table.game.pending = None

        emit_full_state(table)
        
        #if kong return back to phase one for the player who kong
        if action == "kong":
            possible_actions, tile = table.game.first_phase(sid)
            emit('possible-actions', {"actions": possible_actions[sid], "tile": tile}, to=sid)
        elif action in ["pong", "chi"]:
            possible_action = ["discard"]
            emit('possible-actions', {"actions": possible_action, "tile": None}, to=sid)
            print("discard sent!")


        return

    # everyone responded and all passed -> next tier
    if all(s in pending["responses"] for s in pending["eligible"]):
        tier = pending["tier"]
        if tier == "win" and pending.get("pong_or_kong"):
            send_action(table, "pong_or_kong", pending["pong_or_kong"])
        elif tier in ("win", "pong_or_kong") and pending.get("chi"):
            send_action(table, "chi", pending["chi"])
        else:
            table.game.pending = None
            print("all passed!")
            table.game.turn_index = (table.game.turn_index % 4) + 1

            emit_full_state(table)
            # continue game


  
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
    if table is None:
        return
    table.remove_player(request.sid)
    if len(table.players) < 1:
        tables.pop(table_id)
        print(f"table {table_id} deleted")

    emit("chat-message",
         {"sender": "system", "message": f"{request.sid} left {table_id}"},
         to=table_id)


#helper func
def send_action(table, tier, entries):
    """
    entries: list of tuples:
      (sid, using_tiles, take_tile, action_type)

    Example:
      (player.sid, tiles_same[:2], last_discarded_tile, "pong")
      (player.sid, tiles_same[:3], last_discarded_tile, "kong")
      (player.sid, chi_tiles,       last_discarded_tile, "chi")
    """

    table.game.pending["tier"] = tier

    # eligible sids (no weird unpacking)
    eligible = sorted({sid for (sid, _, _, _) in entries})
    table.game.pending["eligible"] = eligible
    table.game.pending["responses"] = {}  # sid -> response

    # group options per sid
    by_sid = {}
    for sid, using_tiles, take_tile, action_type in entries:
        option = {
            "action": action_type,     # "pong"/"kong"/"chi"/"win"
            "using": using_tiles,      # list of tile dicts from hand
            "take": take_tile,         # tile dict being claimed
        }
        by_sid.setdefault(sid, []).append(option)

    # emit only to those sids
    for sid, options in by_sid.items():
        message = {"tier": tier,          # e.g. "pong_or_kong" or "chi" or "win"
                "options": options,}    # list of {action, using, take}
        
        print("message: ")
        print(message)
        socketio.emit(
            "reaction-options",
            message,
            to=sid,
        )


def emit_full_state(table):
    table_state = table.to_state()  # MUST be public only (no tileHand for other players)

    for sid in table.players.keys():
        player_state = table.players[sid].to_state()  # includes tileHand for THIS player only
        socketio.emit(
            "table-update",
            {"table_state": table_state, "player_state": player_state},
            to=sid
        )

if __name__ == "__main__":
    socketio.run(app, host="127.0.0.1", port=5000, debug=True)