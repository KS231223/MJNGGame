from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from player import Player
from table import Table


app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
CORS(app,resources={r"/*":{"origins":"*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")


tables = {} #dict of table_id:table objects (creating now)

@app.route("/")
def home():
    return "server running"
    
@socketio.on("join-table")
def on_join_table(data):
    table_id = data["tableId"]
    join_room(table_id)
    player = Player(request.sid) #create the new player, add username?
    table = tables.get(table_id)

    if table:
        table.add_player(player)
        message = f"{request.sid} created {table_id}"
    else:
        tables["table_id"] = Table(table_id, player)
        tables["table_id"].add_player(player)
        message = f"{request.sid} joined {table_id}"

    emit("chat-message",
         {"sender": "system", "message": message},
         to=table_id)
    
    if len(table.players) == 4:
        table.game_start = True
        emit("chat-message",
             {"sender": "system", "message": "Start Game!"},
             to=table_id)
    
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
    
    table = tables[table_id]
    table.remove_player(request.sid)
    if len(table.players) < 1:
        tables.pop(table_id)
        print(f"table {table_id} deleted")
    emit("chat-message",
         {"sender": "system", "message": f"{request.sid} left {table_id}"},
         to=table_id)
    
    


if __name__ == "__main__":
    socketio.run(app, host="127.0.0.1", port=5000, debug=True)