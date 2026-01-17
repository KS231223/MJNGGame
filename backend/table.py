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
        self.game.remove_player(player_sid)
    
    def start_game(self):
        self.game.start_game()

    def to_state(self):        
        #need to return deck? actually no need horh. should i return like the top 5 of the deck?
        
        table_state = {
            "tableId": self.id,

            "started": bool(getattr(self.game, "started", False)),

            "banker_index": getattr(self.game, "banker_index", None),
            "turn_index": getattr(self.game, "turn_index", None),
            "feng": getattr(self.game, "feng", 1),
            "round": getattr(self.game, "round", 1),
            "norm_direction": getattr(self.game, "norm_direction", True),
            #like mini states for each player that should be public
            "players": [
                {"sid": p.sid, "seat": p.seat, 
                 "name": p.name, "money": p.money, 
                 "revealed_hand": p.revealedHand, 
                 "point_hand": p.pointHand}
                for p in self.players.values()
                ]
        }
        return table_state