from deck import Deck
from validator import Phase1Validator, Phase2Validator 
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
        self.gameWon = False
        self.discardPile = []
        self.lastDiscardedTile = None
        self.drawn = []
        self.pending_reaction = None
        self.validator_1 = Phase1Validator(self)
        self.validator_2 = Phase2Validator(self)

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
                self.drawn.append(currentTile.to_dict())
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

    def discard_tile(self, sid, tile):
        tile_id = tile.get("uid")
        player = self.players[self.turn_index - 1]
        self.lastDiscardedTile = player.discard_tile(tile_id)
        self.discardPile.append(self.lastDiscardedTile)
        self.drawn.append(tile)
        
        

    def first_phase(self, sid):

        if self.gameWon:
            return
        #check that the player calling this is correct turn

        player = self.players[self.turn_index - 1]
        if sid != player.sid:
            return
        drawnTile = self.deck.draw_tile()
        player.add_tile(drawnTile.to_dict())
        possible_actions = self.validator_1.get_current_players_actions(player)
        return possible_actions, drawnTile.to_dict()
        #i return here first because i think let app.py send back and get back the new action, only when app.py receive the discard then we call second phase
        # self.discard_tile()
        # self.second_phase()

    def second_phase(self):
        if self.gameWon:
            return

        validator = self.validator_2
        reactions = validator.get_all_players_reactions(self.lastDiscardedTile)
        return reactions
    
    def apply_reaction(self, sid, choice, pending):
        pass



        # top_action = actions_queue[0]

        # sid, action = top_action
        # player = next(p for p in self.players if p.sid == sid)

        # if action == "win":
        #     self.gameWon = True
        #     return
        # else:
        #     player.add_tile(self.lastDiscardedTile)
        #     self.discard_tile()

        # self.second_phase()
        # else:
        #     return None
        #     self.turn_index = (self.turn_index) % len(self.players) + 1
        #     self.first_phase()

    
        
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