from tile import Tile

class WinCondition:
    # Tile value schema:
    # 0-8: Ball suit (1-9 ball)
    # 9-17: Stick suit (1-9 stick)
    # 18-26: Wan suit (1-9 wan)
    # 27-30: Wind tiles (East, South, West, North)
    # 31-34: Dragon tiles (Red, Green, White/Big)
    
    def __init__(self):
        self.memo = {}  # Memoization dictionary
    
    def tile_to_value(self, tile: dict) -> int:
        """Convert a Tile object to its value index (0-34)"""
        suit = tile.get("suit")
        number = tile.get("number")
        if suit == "ball":
            return number - 1  # 0-8
        elif suit == "stick":
            return number - 1 + 9  # 9-17
        elif suit == "wan":
            return number - 1 + 18  # 18-26
        elif suit == "wind":
            return number - 1 + 27  # 27-30
        elif suit == "big":
            return number - 1 + 31  # 31-34
        else:
            return -1  # Flowers/animals not counted in hand
    
    def tiles_to_hand_tuple(self, tiles: list) -> tuple:
        """Convert list of Tile objects to 35-value tuple"""
        hand = [0] * 35
        for tile in tiles:
            value = self.tile_to_value(tile)
            if value >= 0:  # Skip flowers/animals
                hand[value] += 1
        return tuple(hand)
    
    
    def check_win(self, tile_hand: list, revealed_pong, revealed_chi, revealed_kang ) -> dict:
        """
        Check if the hand is a winning hand.
        
        Args:
            revealed_hand: List of Tile objects in revealed melds
            tile_hand: List of Tile objects in unrevealed hand
        
        Returns:
            dict with 'win': bool, 'pong_list': list, 'chi_list': list
            or None if not a winning hand
        """
        # Process revealed melds first
        pong_list = revealed_pong if revealed_pong else []
        chi_list  = revealed_chi  if revealed_chi  else []
        kang_list = revealed_kang if revealed_kang else []
        
        # Convert tile hand to tuple
        hand_tuple = self.tiles_to_hand_tuple(tile_hand)
        hand = list(hand_tuple)
        
        # Create memoization key
        memo_key = (tuple(hand), tuple(pong_list), tuple(chi_list), tuple(kang_list))
        if memo_key in self.memo:
            return self.memo[memo_key]
        #I am 100% this shit doesnt work
        #If got more time I will redo this
        
        # Start recursion
        result = self._find_melds(hand, pong_list, chi_list, kang_list)
        
        # Cache result
        self.memo[memo_key] = result
        
        return result
    
    def _find_melds(self, hand: list, pong_list: list, chi_list: list, kang_list: list) -> dict:
        """
        Recursively find valid meld combinations.
        
        Returns dict with win status and meld lists, or None if invalid.
        """
        # Check if hand is empty - valid win if we have pair + 4 melds
        total_tiles = sum(hand)
        if total_tiles == 0:
            total_melds = len(pong_list) + len(chi_list) + len(kang_list)
            if total_melds == 4:
                return {
                    'win': True,
                    'pong_list': pong_list.copy(),
                    'chi_list': chi_list.copy(),
                    'kang_list':kang_list.copy()
                }
            return None
        
        # Find first tile with count > 0
        for i in range(35):
            if hand[i] > 0:
                # Try taking pair first
                # We should establish the pair and have a sentinel value to check if pair already taken to prune more aggressively but this suffices for now
                if hand[i] >= 2:
                    new_hand = hand.copy()
                    new_hand[i] -= 2
                    result = self._find_melds(new_hand, pong_list.copy(), chi_list.copy(),kang_list.copy())
                    if result:
                        return result
                
                # Try taking pong
                if hand[i] >= 3:
                    new_hand = hand.copy()
                    new_hand[i] -= 3
                    new_pong = pong_list.copy()
                    new_pong.append(i)
                    result = self._find_melds(new_hand, new_pong, chi_list.copy(),kang_list.copy())
                    if result:
                        return result
                
                # Try taking chi (sequence)
                # Ball suit: 0-8
                if i <= 6 and hand[i] > 0 and hand[i+1] > 0 and hand[i+2] > 0:
                    new_hand = hand.copy()
                    new_hand[i] -= 1
                    new_hand[i+1] -= 1
                    new_hand[i+2] -= 1
                    new_chi = chi_list.copy()
                    new_chi.append(i)
                    result = self._find_melds(new_hand, pong_list.copy(), new_chi,kang_list.copy())
                    if result:
                        return result
                
                # Stick suit: 9-17
                if 9 <= i <= 15 and hand[i] > 0 and hand[i+1] > 0 and hand[i+2] > 0:
                    new_hand = hand.copy()
                    new_hand[i] -= 1
                    new_hand[i+1] -= 1
                    new_hand[i+2] -= 1
                    new_chi = chi_list.copy()
                    new_chi.append(i)
                    result = self._find_melds(new_hand, pong_list.copy(), new_chi,kang_list.copy())
                    if result:
                        return result
                
                # Wan suit: 18-26
                if 18 <= i <= 24 and hand[i] > 0 and hand[i+1] > 0 and hand[i+2] > 0:
                    new_hand = hand.copy()
                    new_hand[i] -= 1
                    new_hand[i+1] -= 1
                    new_hand[i+2] -= 1
                    new_chi = chi_list.copy()
                    new_chi.append(i)
                    result = self._find_melds(new_hand, pong_list.copy(), new_chi,kang_list.copy())
                    if result:
                        return result
                
                # If no valid meld found with this tile, hand is invalid
                return None
        
        # Should not reach here, but return None for safety
        return None


if __name__ == "__main__":
    from deck import Deck
    
    def value_to_string(value: int) -> str:
        """Convert value index back to readable string"""
        if value < 9:
            return f"{value+1}-ball"
        elif value < 18:
            return f"{value-8}-stick"
        elif value < 27:
            return f"{value-17}-wan"
        elif value < 31:
            winds = ["East", "South", "West", "North"]
            return f"{winds[value-27]}-wind"
        elif value < 35:
            dragons = ["Red", "Green", "White"]
            return f"{dragons[value-31]}-dragon"
        return "unknown"
    
    win_checker = WinCondition()
    
    # Test 1: Simple winning hand - all pongs
    print("=" * 60)
    print("TEST 1: All Pongs Hand (3x 1-ball, 3x 2-ball, 3x 3-ball, 3x 4-ball, 2x 5-ball)")
    print("=" * 60)
    test_tiles_1 = []
    for _ in range(3):
        test_tiles_1.append(Tile("normal", "ball", 1, 1).to_dict())
    for _ in range(3):
        test_tiles_1.append(Tile("normal", "ball", 2, 1).to_dict())
    for _ in range(3):
        test_tiles_1.append(Tile("normal", "ball", 3, 1).to_dict())
    for _ in range(3):
        test_tiles_1.append(Tile("normal", "ball", 4, 1).to_dict())
    for _ in range(2):
        test_tiles_1.append(Tile("normal", "ball", 5, 1).to_dict())
    
    result_1 = win_checker.check_win(test_tiles_1,[],[],[])
    print(f"Result: {result_1}")
    if result_1:
        print(f"Pongs: {[value_to_string(v) for v in result_1['pong_list']]}")
        print(f"Chis: {[value_to_string(v) for v in result_1['chi_list']]}")
    print()

    # Test 2: Winning hand with sequences
    print("=" * 60)
    print("TEST 2: Chi Hand (1-2-3 ball, 4-5-6 ball, 7-8-9 stick, 3x 1-wan, 2x 2-wan)")
    print("=" * 60)
    test_tiles_2 = []
    test_tiles_2.append(Tile("normal", "ball", 1, 1).to_dict())
    test_tiles_2.append(Tile("normal", "ball", 2, 1).to_dict())
    test_tiles_2.append(Tile("normal", "ball", 3, 1).to_dict())
    test_tiles_2.append(Tile("normal", "ball", 4, 1).to_dict())
    test_tiles_2.append(Tile("normal", "ball", 5, 1).to_dict())
    test_tiles_2.append(Tile("normal", "ball", 6, 1).to_dict())
    test_tiles_2.append(Tile("normal", "stick", 7, 1).to_dict())
    test_tiles_2.append(Tile("normal", "stick", 8, 1).to_dict())
    test_tiles_2.append(Tile("normal", "stick", 9, 1).to_dict())
    for _ in range(3):
        test_tiles_2.append(Tile("normal", "wan", 1, 1).to_dict())
    for _ in range(2):
        test_tiles_2.append(Tile("normal", "wan", 2, 1).to_dict())
    
    result_2 = win_checker.check_win(test_tiles_2,[],[],[])
    print(f"Result: {result_2}")
    if result_2:
        print(f"Pongs: {[value_to_string(v) for v in result_2['pong_list']]}")
        print(f"Chis: {[value_to_string(v) for v in result_2['chi_list']]}")
    print()

    # Test 3: Non-winning hand
    print("=" * 60)
    print("TEST 3: Invalid Hand (random tiles)")
    print("=" * 60)
    test_tiles_3 = []
    test_tiles_3.append(Tile("normal", "ball", 1, 1).to_dict())
    test_tiles_3.append(Tile("normal", "ball", 3, 1).to_dict())
    test_tiles_3.append(Tile("normal", "ball", 5, 1).to_dict())
    test_tiles_3.append(Tile("normal", "stick", 2, 1).to_dict())
    test_tiles_3.append(Tile("normal", "stick", 4, 1).to_dict())
    test_tiles_3.append(Tile("normal", "wan", 1, 1).to_dict())
    test_tiles_3.append(Tile("special", "wind", 1, 1).to_dict())
    for _ in range(7):
        test_tiles_3.append(Tile("normal", "wan", 7, 1).to_dict())
    
    result_3 = win_checker.check_win(test_tiles_3, [], [], [])
    print(f"Result: {result_3}")
    print()

    # Test 4: With revealed melds
    print("=" * 60)
    print("TEST 4: With Revealed Melds")
    print("Revealed: pong of 1-ball (3 tiles), chi 1-2-3 stick")
    print("Unrevealed: 3x 5-wan, 3x 6-wan, 2x 7-wan")
    print("=" * 60)
    
    unrevealed = []
    for _ in range(3):
        unrevealed.append(Tile("normal", "wan", 5, 1).to_dict())
    for _ in range(3):
        unrevealed.append(Tile("normal", "wan", 6, 1).to_dict())
    for _ in range(2):
        unrevealed.append(Tile("normal", "wan", 7, 1).to_dict())
    
    result_4 = win_checker.check_win(unrevealed,[1],[1],[])
    print(f"Result: {result_4}")
    if result_4:
        print(f"Total Pongs: {[value_to_string(v) for v in result_4['pong_list']]}")
        print(f"Total Chis: {[value_to_string(v) for v in result_4['chi_list']]}")
    print()

    # Test 5: Seven pairs edge case (should fail - not standard win)
    print("=" * 60)
    print("TEST 5: Seven Pairs (non-standard, should fail)")
    print("=" * 60)
    test_tiles_5 = []
    for num in range(1, 8):
        for _ in range(2):
            test_tiles_5.append(Tile("normal", "ball", num, 1).to_dict())
    
    result_5 = win_checker.check_win(test_tiles_5,[],[],[])
    print(f"Result: {result_5}")
    print("(Seven pairs is a special hand pattern not handled by standard meld logic)")
    print()
    
    # Test 6: Mixed suits with revealed kang
    print("=" * 60)
    print("TEST 6: With Revealed Kang (4 tiles)")
    print("Revealed: kang of 3-wan (4 tiles)")
    print("Unrevealed: 1-2-3 ball, 4-5-6 ball, 7-8-9 ball, 2x 5-stick")
    print("=" * 60)
    revealed_6 = []
    for _ in range(4):
        revealed_6.append(Tile("normal", "wan", 3, 1).to_dict())
    
    unrevealed_6 = []
    unrevealed_6.append(Tile("normal", "ball", 1, 1).to_dict())
    unrevealed_6.append(Tile("normal", "ball", 2, 1).to_dict())
    unrevealed_6.append(Tile("normal", "ball", 3, 1).to_dict())
    unrevealed_6.append(Tile("normal", "ball", 4, 1).to_dict())
    unrevealed_6.append(Tile("normal", "ball", 5, 1).to_dict())
    unrevealed_6.append(Tile("normal", "ball", 6, 1).to_dict())
    unrevealed_6.append(Tile("normal", "ball", 7, 1).to_dict())
    unrevealed_6.append(Tile("normal", "ball", 8, 1).to_dict())
    unrevealed_6.append(Tile("normal", "ball", 9, 1).to_dict())
    for _ in range(2):
        unrevealed_6.append(Tile("normal", "stick", 5, 1).to_dict())
    
    result_6 = win_checker.check_win(unrevealed_6,[],[],[34])
    print(f"Result: {result_6}")
    if result_6:
        print(f"Total Pongs: {[value_to_string(v) for v in result_6['pong_list']]}")
        print(f"Total Chis: {[value_to_string(v) for v in result_6['chi_list']]}")