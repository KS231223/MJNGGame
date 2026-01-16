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

    const onStart = (state) => setTableState(state);
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
