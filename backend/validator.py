# THE PURPOSE OF THIS SCRIPT IS TO VALIDATE THE OPTIONS THAT A PLAYER MAY TAKE AT ANY GIVEN TURN. 
# IN THE CONTEXT OF THE FIRST PHASE(YOU DRAW) SECOND PHASE(OPEN UP THE BOARD FOR OTHERS TO PLAY) WE DISCUSSED THIS WOULD COVER
# MOSTLY THE SECOND PHASE STUFF THOUGH IT CAN EXTENDED TO COVER FIRST PHASE IF NECESSARY

class Phase1Validator:
    def __init__(self, game):
        self.game = game

    def get_current_players_actions(self,player):
        actions_by_player = {}
        actions_by_player[player.sid] = []
        #do check for win or self-kang here
        actions_by_player[player.sid].append("draw")
        return actions_by_player


class Phase2Validator:
    def __init__(self, game):
        self.game = game

    def get_all_players_reactions(self, last_discarded_tile):
        reactions_by_player = {}

        if not last_discarded_tile:
            return reactions_by_player

        for player in self.game.players:
            actions = []

            count = sum(1 for t in player.tileHand if t.ID == last_discarded_tile.ID)
            if count >= 2:
                actions.append("pong")
                
            if count >= 3:
                actions.append("kong")
                

            next_seat = (self.game.turn_index + 1) % 4
            if player.seat == next_seat:
                tile_ids = set(t.ID for t in player.tileHand)
                for offset in [-2, -1, 0]:
                    sequence = {last_discarded_tile.ID + offset,
                                last_discarded_tile.ID + offset + 1,
                                last_discarded_tile.ID + offset + 2}
                    if sequence - {last_discarded_tile.ID} <= tile_ids:
                        actions.append("chi")
                        
                        break

            
            reactions_by_player[player.sid] = actions

        return reactions_by_player


