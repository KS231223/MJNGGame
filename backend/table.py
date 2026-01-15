from player import Player
from game import Game

class Table:
    def __init__(self, table_id):
        self.id = table_id
        self.players = {}
        self.game = Game()
    
    def add_player(self, player: Player):
        used = {p.seat for p in self.players.values()}
        for seat in range(4):
            if seat not in used:
                player.seat = seat
                break
        self.players[player.sid] = player
        self.game.add_player(player)
    
    def remove_player(self, player_sid):
        self.players.pop(player_sid, None)
    
    def start_game(self):
        self.game.start_game()

    def to_state(self, for_sid: str):
        player_objs = list(self.players.values())

        players_state = [
            {
                "id": p.sid,
                "seat": p.seat,
                "name": p.name or p.sid[:5],
            }
            for p in player_objs
        ]

        me = self.players.get(for_sid)

        state = {
            "tableId": self.id,

            # IMPORTANT: this must become True after start_game()
            "started": bool(getattr(self.game, "started", False)),

            "players": players_state,

            "dealerSeat": getattr(self.game, "dealer_seat", None),
            "currentTurnSeat": getattr(self.game, "current_turn_seat", None),

            "discards": getattr(self.game, "discards", {0: [], 1: [], 2: [], 3: []}),
            "melds": getattr(self.game, "melds", {0: [], 1: [], 2: [], 3: []}),
            "wallCount": getattr(self.game, "wall_count", None),

            "yourSeat": me.seat if me else None,
            "yourHand": me.hand if me else [],
        }
        return state
