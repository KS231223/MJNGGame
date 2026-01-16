from tile import Tile
import random


#do we need a dict to count number of each type of tile?
#should we create just one of each tile and then counter of num of that type? or each tile need unique?

class Deck:
    def __init__(self):
        self.tiles = self.create_deck()

    def create_deck(self):
        tiles = []

        norm_suits = ["ball", "wan", "stick"]
        for suit in norm_suits:
            for num in range(1,10):
                for id in range(1,5):
                    new = Tile("normal", suit, num, id)
                    tiles.append(new)

        for num in range(1,5):
            for id in range(1,5):
                new = Tile("special", "wind", num, id)
                tiles.append(new)

        for num in range(1,4):
            for id in range(1,5):
                new = Tile("power", "big", num, id)
                tiles.append(new)

        for num in range(1,5):
            for id in range(1,3):
                new = Tile("point", "flower", num, id)
                tiles.append(new)

        for num in range(1,5):
            new = Tile("point", "animal", num, 1)
            tiles.append(new)
        return tiles
    
    def draw_tile(self):
        tile = self.tiles.pop(random.randint(0, len(self.tiles)-1))
        return tile
    

    
if __name__ == "__main__":
    test = Deck()
    for tile in test.tiles:
        print(tile)
    print(len(test.tiles))
