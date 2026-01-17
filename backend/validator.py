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


def chi_options(player, last_discarded_tile: Dict[str, Any]) -> List[Tuple[int, int, int]]:
    """
    Returns all possible chi sequences (as tuples of numbers) the player can make
    using `last_discarded_tile`.

    Example return: [(3,4,5), (4,5,6)]
    """
    if not last_discarded_tile:
        return []

    # Chi only applies to suited "normal" tiles
    if last_discarded_tile.get("type") != "normal":
        return []

    suit = last_discarded_tile.get("suit")
    num = last_discarded_tile.get("number")

    if suit not in ("wan", "ball", "stick"):
        return []
    if not isinstance(num, int):
        return []

    # Count player's suited tiles by number
    nums = [
        t.get("number")
        for t in getattr(player, "tileHand", [])
        if t.get("type") == "normal" and t.get("suit") == suit
    ]
    counts = Counter(nums)

    options: List[Tuple[int, int, int]] = []

    # Possible sequences including num:
    # (num-2,num-1,num), (num-1,num,num+1), (num,num+1,num+2)
    for start in (num - 2, num - 1, num):
        a, b, c = start, start + 1, start + 2

        # Must be within 1..9
        if a < 1 or c > 9:
            continue

        # Need the other two numbers (excluding discarded num)
        needed = [x for x in (a, b, c) if x != num]

        if counts[needed[0]] >= 1 and counts[needed[1]] >= 1:
            options.append((a, b, c))

    return options

def same_tile(tile_1, tile_2):
    return tile_1["number"] == tile_2["number"] and tile_1["suit"] == tile_2["suit"]