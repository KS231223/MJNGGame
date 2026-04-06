#TODO MAKE A UTILS FUNC TO MAP power tile NAME TO REAL NAME

class Tile:
    def __init__(self, type:str, suit:str, number:int, id:int):
        
        #types: normal/power/points
        #suit: ball, wan, stick, wind, big, flower
        #see docs for labelling

        self.id = f"{type} {number} {suit} {id}"
        self.type = type
        self.suit = suit
        self.number = number
        pass

    def __str__(self):
        return self.id
    
    def to_dict(self):
        return {
            "uid": self.id,
            "type": self.type,
            "suit": self.suit,
            "number": self.number,
        }