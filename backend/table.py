from player import Player
from deck import Deck

class Table:
    def __init__(self, table_id):
        self.id = table_id
        self.players = {}
        self.game_start = False
        self.deck = Deck()
    
    def add_player(self, player: Player):
        self.players[player.sid] = player
    
    def remove_player(self, player_sid):
        self.players.pop(player_sid)