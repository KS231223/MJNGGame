// src/components/Chat.jsx
import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import "./Chat.css";

export default function Chat({ tableId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    const onChat = (message) => setMessages((prev) => [...prev, message]);
    socket.on("chat-message", onChat);
    return () => socket.off("chat-message", onChat);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const msg = input.trim();
    if (!msg || !tableId) return;
    socket.emit("send-message", { tableId, message: msg });
    setInput("");
  };

  return (
    <aside className="chat">
      <div className="chat__header">
        <div className="chat__title">Chat</div>
        <button className="chat__close" onClick={onClose}>✕</button>
      </div>

      <ul className="chat__messages">
        {messages.map((m, i) => (
          <li className="chat__message" key={i}>
            <span className="chat__sender">{m.sender ?? "anon"}:</span>
            <span className="chat__text">{m.message}</span>
          </li>
        ))}
        <div ref={bottomRef} />
      </ul>

      <div className="chat__composer">
        <input
          className="chat__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type message"
        />
        <button className="chat__send" onClick={send}>Send</button>
      </div>
    </aside>
  );
}
