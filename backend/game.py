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

    def draw_tile_specific(self, sid, tile):
        #first get corresponding player
        correctPlayer = None
        for player in self.players:
            if player.sid == sid:
                correctPlayer = player
                break
        if correctPlayer:
            correctPlayer.add_tile(tile)                
        pass

    def draw_tile(self, sid):
        drawnTile = self.deck.draw_tile().to_dict()
        self.draw_tile_specific(sid, drawnTile) 


    def first_phase(self, sid):

        if self.gameWon:
            return

        player = self.players[self.turn_index - 1]
        if sid != player.sid:
            return
        drawnTile = self.deck.draw_tile().to_dict()
        while drawnTile["type"] == "point":
            player.add_point(drawnTile)
            drawnTile = self.deck.draw_tile().to_dict()
        
        player.add_tile(drawnTile)

        possible_actions = self.validator_1.get_current_players_actions(player)
        return possible_actions, drawnTile


    def second_phase(self):
        if self.gameWon:
            return

        validator = self.validator_2
        reactions = validator.get_all_players_reactions(self.lastDiscardedTile)
        return reactions
    
    def apply_reaction(self, sid, tiles_to_use, last_discarded_tile, action):
        print("action applied!")
        print(sid)
        print()
        print(tiles_to_use)
        print()
        print(last_discarded_tile)
        print()
        print(action)
        player = [p for p in self.players if p.sid == sid]
        player = player[0]
        #abv is hacky af but i cant be arsed
        tile_set = []

        if action == "chi":
            tile_set.append(tiles_to_use)
            tile_set.append(last_discarded_tile)
            tile_set.sort(key=lambda t: t.get("number"))
            player.revealedChi.append(tile_set)
            player.revealedHand.append(tile_set)
            for tile in tiles_to_use:
                player.tileHand.remove(tile)

        elif action == "pong":
            tile_set.append(tiles_to_use)
            tile_set.append(last_discarded_tile)
            player.revealedPong.append(tile_set)
            player.revealedHand.append(tile_set)
            for tile in tiles_to_use:
                player.tileHand.remove(tile)  
            

        elif action == "kong":
            tile_set.append(tiles_to_use)
            tile_set.append(last_discarded_tile)
            player.revealedKong.append(tile_set)
            player.revealedHand.append(tile_set)
            for tile in tiles_to_use:
                player.tileHand.remove(tile)
        
        self.turn_index = player.seat
            

        
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