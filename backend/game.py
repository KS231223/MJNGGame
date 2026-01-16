from deck import Deck
import validator as Validator 
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
        self.deck.create_deck()
        self.gameWon = False
        self.discardPile = []
        self.lastDiscardedTile = None

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
    def discard_tile(self):
        # HAVE TO PUT THE SOCKET HERE TO DISCARD TILE WHICH EMITS TO THE APP.PY TO ASK WHICH TILE TO DISCARD AND RETURNS THE TILE
        tileID = None #placeholder for now realistically what should happen is that you hear for the correct tileID and then that tile ID is emitted
        self.lastDiscardedTile = self.players[self.turn_index].discard_tile(tileID)
        self.discardPile.append(self.lastDiscardedTile)
        
        

    def first_phase(self):
        if self.gameWon:
            return
        drawnTile = self.deck.draw_tile
        self.players[self.turn_index].add_tile(drawnTile)
        self.discard_tile()
        self.second_phase()
    def second_phase(self):
        if self.gameWon:
            return

        validator = Validator.Phase2Validator(self)
        reactions = validator.get_all_players_reactions(self.lastDiscardedTile)
        #this is a dummy  listener obviously it doesnt work because this just appends every possible action and there is no listener
        #also need to implement kang, pong and chi
        def dummy_listener(player_reactions):
            action_list = []
            for sid, actions in player_reactions.items():
                for action in actions:
                    action_list.append((sid, action))
            return action_list

        actions_queue = dummy_listener(reactions)
        if actions_queue:
            priority = {"win": 4, "kong": 3, "pong": 2, "chi": 1}
            actions_queue.sort(key=lambda x: priority.get(x[1], 0), reverse=True)
            top_action = actions_queue[0]

            sid, action = top_action
            player = next(p for p in self.players if p.sid == sid)

            if action == "win":
                self.gameWon = True
                return
            else:
                player.add_tile(self.lastDiscardedTile)
                self.discard_tile()

            self.second_phase()
        else:
            self.turn_index = (self.turn_index) % len(self.players) + 1
            self.first_phase()

            
        
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