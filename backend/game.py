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
        self.started = False
        self.deck.create_deck

    def add_player(self, player):
        self.players.append(player)
    
    def remove_player(self, player_sid):
        #doesnt work, this is list
        #TODO fix this shit
        self.players.pop(player_sid)

    def start_game(self):
        self.state = "in progress"
        self.started = True
        random.shuffle(self.players)
        # p is player
        for seat, p in enumerate(self.players, start=1):  # seats 1..4
            p.seat = seat
        listOfHands = self.deck.initialize_hands
        for player in self.players:
            currentHand = listOfHands.pop()
            player.tileHand = currentHand.tiles
            player.pointHand = currentHand.points


        #return player order for frontend to switch the seats
        #also return the starting hand
"""
Schema for player entity
class Player:
    def __init__(self, sid):
        self.sid = sid
        self.money = 1000
        self.points = 0
        self.seat = 0
        self.hand = []
        self.tileHand = []
        self.pointHand = []
        self.name = None

Schema for hands from initialize_hands
{"tiles":playerTiles,
"points":playerPoints}
"""