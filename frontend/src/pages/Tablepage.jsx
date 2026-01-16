// src/pages/TablePage.jsx
import { useEffect, useState, useMemo } from "react";
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
      const yourSeat = player_state?.seat;
      const currentTurnSeat = table_state?.turn_index; // turn_index == seat (1..4)
      const isMyTurn = currentTurnSeat === yourSeat;

      // Build ordered list (for relative seat mapping)
      const players = Array.isArray(table_state?.players) ? [...table_state.players] : [];
      players.sort((a, b) => (a.seat ?? 0) - (b.seat ?? 0));

      const myIndex = players.findIndex((p) => p.sid === player_state?.id);

      const merged = {
        ...table_state,
        // keep original too
        currentTurnSeat,

        // private player fields
        ...player_state,
        yourSid: player_state?.id,
        yourSeat,

        isMyTurn,

        // normalized for your UI
        yourHand: player_state?.tileHand ?? [],
        pointHand: player_state?.pointHand ?? [],
        revealedHand: player_state?.revealedHand ?? [],

        players,
      };

      if (myIndex !== -1 && players.length > 0) {
        const n = players.length;
        const rel = (offset) => players[(myIndex + offset + n) % n];

        merged.seats = {
          bottom: rel(0),
          right: rel(1),
          top: rel(2),
          left: rel(3),
        };
      }

      setTableState(merged);
    };

    const onUpdate = (patch) => {
      // backend may send partial updates; recompute isMyTurn safely
      setTableState((prev) => {
        const next = { ...(prev ?? {}), ...(patch ?? {}) };

        // keep turn mapping consistent (turn_index == seat)
        if ("turn_index" in (patch ?? {})) {
          next.currentTurnSeat = patch.turn_index;
        } else if (next.currentTurnSeat == null && next.turn_index != null) {
          next.currentTurnSeat = next.turn_index;
        }

        const yourSeat = next.yourSeat ?? next.seat; // yourSeat is what we set on start
        next.isMyTurn = next.currentTurnSeat === yourSeat;

        // if players list updated, keep seats mapping correct
        if (Array.isArray(next.players) && next.yourSid) {
          const players = [...next.players].sort((a, b) => (a.seat ?? 0) - (b.seat ?? 0));
          next.players = players;

          const myIndex = players.findIndex((p) => p.sid === next.yourSid);
          if (myIndex !== -1 && players.length > 0) {
            const n = players.length;
            const rel = (offset) => players[(myIndex + offset + n) % n];
            next.seats = {
              bottom: rel(0),
              right: rel(1),
              top: rel(2),
              left: rel(3),
            };
          }
        }

        return next;
      });
    };

    socket.on("game-start", onStart);
    socket.on("table-update", onUpdate);

    return () => {
      socket.off("game-start", onStart);
      socket.off("table-update", onUpdate);
      socket.emit("leave-table", { tableId });
    };
  }, [tableId]);

  // Gate emits on the frontend (backend should still enforce too)
  const actions = useMemo(() => {
    const canAct = !!tableState?.isMyTurn;

    return {
      draw: () => {
        if (!canAct) return;
        socket.emit("game-action", { tableId, type: "draw" });
      },
      discard: (tile) => {
        if (!canAct) return;
        socket.emit("game-action", { tableId, type: "discard", tile });
      },
      call: (callType) => {
        if (!canAct) return;
        socket.emit("game-action", { tableId, type: "call", callType });
      },
    };
  }, [tableId, tableState?.isMyTurn]);

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

          {connected && !tableState && <div className="board__card">Loading table…</div>}

          {tableState?.started ? (
            <MahjongTable state={tableState} actions={actions} />
          ) : (
            <div className="board__card">Waiting for players…</div>
          )}
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
