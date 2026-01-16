// src/pages/TablePage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";
import Chat from "../components/chat";
import MahjongTable from "../components/MahjongTable";
import "./TablePage.css";

export default function TablePage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(true);

  const [tableState, setTableState] = useState(null);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  useEffect(() => {
    if (!tableId) return;

    socket.emit("join-table", { tableId });

    const onStart = ({ table_state, player_state }) => {
      // Merge shared + private into one object
      const merged = {
        ...table_state,
        ...player_state,
        // rename if you want:
        yourSid: player_state.id,
        yourSeat: player_state.seat,
      };

      // Build an ordered list of players by seat (works even if seat numbers aren't 0..3)
      const players = Array.isArray(table_state.players) ? [...table_state.players] : [];
      players.sort((a, b) => (a.seat ?? 0) - (b.seat ?? 0));

      // Find "me" inside the table_state list (by sid)
      const myIndex = players.findIndex((p) => p.sid === player_state.id);

      // If we can't find ourselves, still set state and bail
      if (myIndex === -1) {
        merged.players = players;
        setTableState(merged);
        return;
      }

      const n = players.length;

      // Relative positions (clockwise): you(bottom)=0, right=1, opposite=2, left=3
      const rel = (offset) => players[(myIndex + offset + n) % n];

      merged.seats = {
        bottom: rel(0),
        right: rel(1),
        top: rel(2),
        left: rel(3),
      };

      // Also keep players sorted for general use
      merged.players = players;

      // Your hand fields: normalize names for MahjongTable
      merged.yourHand = player_state.tileHand ?? [];
      merged.pointHand = player_state.pointHand ?? [];
      merged.revealedHand = player_state.revealedHand ?? [];

      setTableState(merged);
    };
    const onUpdate = (patch) => {
      // simplest version: backend sends full state as "patch"
      // later you can implement real patching/immer
      setTableState((prev) => ({ ...(prev ?? {}), ...patch }));
    };

    socket.on("game-start", onStart);
    socket.on("table-update", onUpdate);

    return () => {
      socket.off("game-start", onStart);
      socket.off("table-update", onUpdate);
      socket.emit("leave-table", { tableId });
    };
  }, [tableId]);

  // send actions to backend
  const actions = {
    draw: () => socket.emit("game-action", { tableId, type: "draw" }),
    discard: (tile) => socket.emit("game-action", { tableId, type: "discard", tile }),
    call: (callType) => socket.emit("game-action", { tableId, type: "call", callType }),
  };

  return (
    <div className={`tablepage ${chatOpen ? "tablepage--chat-open" : ""}`}>
      <header className="tablepage__topbar">
        <h2 className="tablepage__title">Table: {tableId}</h2>

        <div className="tablepage__actions">
          <button className="tablepage__btn" onClick={() => setChatOpen((v) => !v)}>
            {chatOpen ? "Hide chat" : "Show chat"}
          </button>

          <button className="tablepage__btn" onClick={() => navigate("/")}>
            Leave table
          </button>
        </div>
      </header>

      <main className="tablepage__main">
        <section className="tablepage__board">
          {!connected && <div className="board__card">Disconnected…</div>}

          {connected && !tableState && (
            <div className="board__card">Loading table…</div>
          )}

          {tableState?.started
            ? <MahjongTable state={tableState} actions={actions} />
            : <div className="board__card">Waiting for players…</div>
          }
        </section>

        <aside className={`tablepage__chat ${chatOpen ? "" : "is-hidden"}`}>
          <Chat tableId={tableId} onClose={() => setChatOpen(false)} />
        </aside>

        {!chatOpen && (
          <button className="tablepage__chat-fab" onClick={() => setChatOpen(true)}>
            Chat
          </button>
        )}
      </main>
    </div>
  );
}
