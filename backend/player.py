class Player:
    def __init__(self, sid):
        self.sid = sid
        self.money = 1000
        self.points = 0
        self.seat = 0
        self.revealedHand = []
        self.revealedChi = []
        self.revealedPong = []
        self.revealedKang = []
        self.tileHand = []
        self.pointHand = []
        self.name = sid

    def add_tile(self,tile):
        self.tileHand.append(tile)

    def add_point(self,point):
        self.pointHand.append(point)

    def discard_tile(self,tileID):
        tileToReturn = None
        for i in range(len(self.tileHand)):
            tile = self.tileHand[i]
            if tileID == tile.get("uid"):
                tileToReturn = self.tileHand.pop(i)
                break
        return tileToReturn
    
    def to_state(self):

        """
        Schema for player
        self.sid = sid
        self.money = 1000
        self.points = 0
        self.seat = 0
        self.revealedhand = []
        self.tileHand = []
        self.pointHand = []
        self.name = None
        """
        player_state = {
                "id": self.sid,
                "seat": self.seat,
                "name": self.name,
                "revealedHand":self.revealedHand,
                "tileHand":self.tileHand,
                "pointHand":self.pointHand,
                "money":self.money
            }
        return player_state


