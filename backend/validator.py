# THE PURPOSE OF THIS SCRIPT IS TO VALIDATE THE OPTIONS THAT A PLAYER MAY TAKE AT ANY GIVEN TURN. 
# IN THE CONTEXT OF THE FIRST PHASE(YOU DRAW) SECOND PHASE(OPEN UP THE BOARD FOR OTHERS TO PLAY) WE DISCUSSED THIS WOULD COVER
# MOSTLY THE SECOND PHASE STUFF THOUGH IT CAN EXTENDED TO COVER FIRST PHASE IF NECESSARY


from collections import Counter
from typing import List, Tuple, Dict, Any


class Phase1Validator:
    def __init__(self, game):
        self.game = game

    def get_current_players_actions(self,player):
        actions_by_player = {}
        actions_by_player[player.sid] = []
        #do check for win or self-kang here
        actions_by_player[player.sid].append("discard")
        return actions_by_player


class Phase2Validator:
    def __init__(self, game):
        self.game = game

    def get_all_players_reactions(self, last_discarded_tile):
        
        win = []
        pong_or_kong = []
        chi = []

        for player in self.game.players:
            if self.game.turn_index == player.seat:
                continue

            tiles_same = [t for t in player.tileHand if same_tile(t, last_discarded_tile)]
            count = len(tiles_same)
            if count >= 2:
                pong_or_kong.append((player.sid, tiles_same[:2], "pong"))  
            if count >= 3:
                pong_or_kong.append((player.sid, tiles_same[:3], "kong"))
                

            for tiles in chi_options(player, last_discarded_tile):
                chi.append((player.sid, tiles, "chi")) 

            if False:
                #this is just a placeholder until I get the win conditional
                win.append(player.sid, winning_tile_sequence, "win")     

        return win, pong_or_kong, chi


#helper func


def chi_options(player, last_discarded_tile: Dict[str, Any]):
    """
    Returns all possible chi sequences (as tuples of numbers) the player can make
    using `last_discarded_tile`.

    Example return: [(3,4,5), (4,5,6)]
    """
    playerHand = player.tileHand
    #this will be a list of dictionary of tiles.to_dict()
    tile = last_discarded_tile
    suitToCheckFor = tile["suit"]
    numberToCheckFor = tile["number"]
    allTilesOfSameSuit = [t for t in playerHand if same_suit(t, tile)]
    allNumbersOfSameSuit = []
    for i in range(len(allTilesOfSameSuit)):
        allNumbersOfSameSuit.append(allTilesOfSameSuit[i]["number"])
    allNumbersOfSameSuit = list(set([int(x) for x in allNumbersOfSameSuit]))
    allNumbersOfSameSuit.sort()
    chi1 = []
    chi2 = []
    chi3 = []
    for i in range(allNumbersOfSameSuit):
        if numberToCheckFor - 1 in allNumbersOfSameSuit and numberToCheckFor - 2 in allNumbersOfSameSuit:
            chi1.extend([numberToCheckFor - 1, numberToCheckFor - 2])
        if numberToCheckFor - 1 in allNumbersOfSameSuit and numberToCheckFor + 1 in allNumbersOfSameSuit:
            chi2.extend([numberToCheckFor - 1, numberToCheckFor + 1])
        if numberToCheckFor + 1 in allNumbersOfSameSuit and numberToCheckFor + 2 in allNumbersOfSameSuit:
            chi3.extend([numberToCheckFor + 1, numberToCheckFor + 2])
    possibleChis = [ chi for chi in [chi1, chi2, chi3] if len(chi) == 2]
    finalChis = []
    for chi in possibleChis:
        chiTiles = []
        for number in chi:
            for t in allTilesOfSameSuit:
                if t["number"] == number:
                    chiTiles.append(t)
                    break
        
        finalChis.append(chiTiles)
    return finalChis



def same_tile(tile_1, tile_2):
    return tile_1["number"] == tile_2["number"] and tile_1["suit"] == tile_2["suit"]

def same_suit(tile_1, tile_2):
    return tile_1["suit"] == tile_2["suit"]