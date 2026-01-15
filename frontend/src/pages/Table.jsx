import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";
import "./Table.css";

export default function Table() {
  const { tableId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!tableId) return;
    
    const onChat = (message) => setMessages((prev) => [...prev, message]);
    socket.on("chat-message", onChat);
    socket.emit("join-table", { tableId });

    return () => {
      socket.off("chat-message", onChat);
      socket.emit("leave-table", { tableId }); 
    };
  }, [tableId]);

  const send = () => {
    const msg = input.trim();
    if (!msg || !tableId) return;
    socket.emit("send-message", { tableId, message: msg });
    setInput("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") send();
  };

  return (
    <div className="room">
      <div className="room__header">
        <h2 className="room__title">Room: {tableId}</h2>
        <button className="room__leave" onClick={() => navigate("/")}>
          Leave
        </button>
      </div>

      <div className="room__composer">
        <input
          className="room__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type message"
        />
        <button className="room__send" onClick={send}>
          Send
        </button>
      </div>

      <ul className="room__messages">
        {messages.map((m, i) => (
          <li className="room__message" key={i}>
            <b className="room__sender">{m.sender ?? "anon"}:</b>{" "}
            <span>{m.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}