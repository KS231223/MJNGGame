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
    def add_tile(self,tile):
        self.tileHand.append(tile)
    def add_point(self,point):
        self.pointHand.append(point)
    def discard_tile(self,tileID):
        tileToReturn = None
        for i in range(len(self.tileHand)):
            tile = self.tileHand[i]
            if tileID == tile.ID:
                tileToReturn = self.tileHand.pop(i)
                break;
        return tileToReturn;
