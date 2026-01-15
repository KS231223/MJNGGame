from player import Player
from game import Game

class Table:
    def __init__(self, table_id):
        self.id = table_id
        self.players = {}
        self.game = Game()
    
    def add_player(self, player: Player):
        self.players[player.sid] = player
        self.game.add_player(player)
    
    def remove_player(self, player_sid):
        self.players.pop(player_sid, None)
    
    def start_game(self):
        self.game.start_game()



