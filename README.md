# Multiplayer Mahjong Backend (Flask + Socket.IO)

This project implements a **real-time multiplayer Mahjong backend server** using **Flask** and **Socket.IO**. It manages game state, player actions, and real-time communication between clients.

---

## 🚀 Features

* Real-time multiplayer using WebSockets
* Table/room system for up to 4 players
* Turn-based Mahjong game logic
* Action validation (draw, discard, pong, chi, kong, win)
* Reaction priority system (win > pong/kong > chi)
* Per-player state visibility (hidden hands)
* Chat system within tables

---

## 🧠 Architecture Overview

The backend is structured into several core components:

### 1. Server (`app.py`)

* Handles WebSocket connections
* Manages game tables
* Routes player actions
* Broadcasts game state updates

### 2. Game Engine (`Game`)

* Core game logic and state
* Turn management
* Tile drawing and discarding
* Reaction resolution (chi, pong, kong, win)

### 3. Validators

* `Phase1Validator` → actions after drawing a tile
* `Phase2Validator` → reactions to a discarded tile

### 4. Models

* `Player` → stores player state (hand, points, seat, etc.)
* `Table` → manages players and game instance
* `Deck` → handles tile generation and drawing

---

## 🔌 WebSocket Events

### 🔹 Connection / Lobby

| Event          | Description                 |
| -------------- | --------------------------- |
| `join-table`   | Join or create a game table |
| `leave-table`  | Leave a table               |
| `send-message` | Send chat message           |

---

### 🔹 Game Flow

| Event              | Description                              |
| ------------------ | ---------------------------------------- |
| `game-start`       | Triggered when 4 players join            |
| `game-action`      | Player performs an action (draw/discard) |
| `reaction-options` | Server sends possible reactions          |
| `reaction-choice`  | Player responds to reaction              |
| `table-update`     | Broadcast updated game state             |

---

## 🔄 Game Flow

### 1. Joining a Table

* Players join using a `tableId`
* A new table is created if it doesn’t exist
* Game starts automatically when 4 players join

---

### 2. Game Start

* Players are shuffled and assigned seats
* Each player receives:

  * 13 tiles
  * Separate point tiles
* Deck is shuffled

---

### 3. Turn Cycle

Each turn consists of:

#### Phase 1 (Draw Phase)

* Current player draws a tile
* Possible actions:

  * `win`
  * `kong`
  * `discard`

---

#### Phase 2 (Reaction Phase)

* After a discard, other players may react:

  * `win` (highest priority)
  * `pong` / `kong`
  * `chi` (next player only)

* Server enforces priority resolution

---

### 4. Reaction Resolution

* Server tracks:

  * Eligible players
  * Response choices
* If a player acts → resolve immediately
* If all pass → move to next priority tier or next turn

---

## 🧩 Game State Management

### Table State

* Public information:

  * Discard pile
  * Turn index
  * Player positions
* Hidden information:

  * Other players’ hands are not exposed

### Player State

* Individual player receives:

  * Their full hand
  * Their available actions

---

## 🧪 Example Flow

1. Player joins table
2. 4 players reached → game starts
3. Player draws a tile (`game-action: draw`)
4. Player discards (`game-action: discard`)
5. Other players receive reaction options
6. One player chooses action OR all pass
7. Game state updates and next turn begins

---

## ⚙️ Setup & Run

### Run Server

```bash
python app.py
```

Server runs on:

```
http://127.0.0.1:5000
```

---

## 📁 Project Structure

```id="r1k3sz"
.
├── app.py              # Main server
├── game.py             # Game logic
├── validator.py        # Action validation
├── player.py           # Player model
├── table.py            # Table/room management
├── deck.py             # Tile deck
├── wincondition.py     # Win checking logic
```

---

## ⚠️ Notes

* This backend assumes a **frontend client** handles UI and user input
* Tile objects are passed as dictionaries (`{suit, number, uid}`)
* Some validation and edge cases may still need refinement
* Concurrency is handled using **Socket.IO threading mode**

---

## 🧩 Future Improvements

* Add authentication / usernames
* Improve error handling and validation
* Implement scoring system
* Add reconnection support
* Optimize game state syncing
* Add cards which add unique modifiers to existing hands such as swapping tiles. (Priority)

---

## 📜 License

This project is for educational purposes. Add a license if deploying publicly.

---

## 👨‍💻 Author Notes

* Designed for real-time multiplayer Mahjong gameplay
* Focus on clean separation between:

  * networking
  * game logic
  * validation

---
