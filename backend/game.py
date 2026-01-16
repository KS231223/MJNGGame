from deck import Deck
import random

class Game:
    def __init__(self):
        self.state = "waiting for players"
        self.deck = Deck()
        self.players = []
        self.round = 1
        self.turn_index = 1
        self.feng = 1
        self.banker_index = 1
        self.norm_direction = True
        self.started = False
        self.drawn = []

    def add_player(self, player):
        self.players.append(player)
    
    def remove_player(self, player_sid):
        self.players = [p for p in self.players if p.sid != player_sid]
    
    def initialize_hands(self):
        arrayOfHands = []
        #for each array there should be a dictionary called points and hand and each have their own array
        for _ in range(4):
            playerPoints = []
            playerTiles = []    
            while len(playerTiles) < 13:
                currentTile = self.deck.draw_tile()
                if currentTile.type != "point":
                    playerTiles.append(currentTile.to_dict())

                else:
                    playerPoints.append(currentTile.to_dict())
                self.drawn.append(currentTile)
            arrayOfHands.append({"tiles":playerTiles,
                                 "points":playerPoints})
        return arrayOfHands
    


    def start_game(self):
        self.state = "in progress"
        self.started = True
        random.shuffle(self.players)
        random.shuffle(self.deck.tiles)
        # p is player
        for seat, p in enumerate(self.players, start=1):  # seats 1..4
            p.seat = seat
        listOfHands = self.initialize_hands()
        for player in self.players:
            currentHand = listOfHands.pop()
            player.tileHand = currentHand.get("tiles")
            player.pointHand = currentHand.get("points")


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