from deck import Deck
import random

class Game:
    def __init__(self):
        # for game states like turns, feng, banker etc
        self.state = "waiting for players" #3 states: waiting for players, in progress, game finished (all 4 fengs)
        self.deck = Deck()
        self.players = []
        self.round = 1
        self.turn_index = 1
        self.feng = 1
        self.banker_index = 1
        self.norm_direction = True

    def add_player(self, player):
        self.players.append(player)

    def start_game(self):
        self.state = "in progress"

        random.shuffle(self.players)

        for seat, p in enumerate(self.players, start=1):  # seats 1..4
            p.seat = seat


        #return player order for frontend to switch the seats
        #also return the starting hand

