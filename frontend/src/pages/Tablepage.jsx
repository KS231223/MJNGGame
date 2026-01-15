// src/pages/TablePage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";
import Chat from "../components/chat";
import "./TablePage.css";

export default function TablePage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(true);

  useEffect(() => {
    if (!tableId) return;
    socket.emit("join-table", { tableId });
    return () => socket.emit("leave-table", { tableId });
  }, [tableId]);

  return (
    <div className={`tablepage ${chatOpen ? "tablepage--chat-open" : ""}`}>
      <header className="tablepage__topbar">
        <h2 className="tablepage__title">Table: {tableId}</h2>

        <div className="tablepage__actions">
          <button className="tablepage__btn" onClick={() => setChatOpen(v => !v)}>
            {chatOpen ? "Hide chat" : "Show chat"}
          </button>

          <button className="tablepage__btn" onClick={() => navigate("/")}>
            Leave table
          </button>
        </div>
      </header>

      <main className="tablepage__main">
        <section className="tablepage__board">
          <div className="board__card">Mahjong table UI goes here</div>
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
