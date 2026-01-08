import { useEffect, useState } from "react";

function Table({ tableId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!tableId) return;

    // Join the table
    socket.emit("join-table", tableId);

    // Listen for incoming messages for this table
    const handleMessage = (data) => setMessages((prev) => [...prev, data]);
    socket.on("receive-message", handleMessage);

    // Cleanup listener on unmount or table change
    return () => {
      socket.off("receive-message", handleMessage);
    };
  }, [tableId]);

  const sendMessage = () => {
    if (!input) return;

    // Send message to backend
    socket.emit("send-message", { tableId, message: input });
    setInput("");
  };

  return (
    <div style={{ border: "1px solid gray", padding: "1rem", marginTop: "1rem" }}>
      <h2>Table: {tableId}</h2>
      <div style={{ minHeight: "100px", border: "1px solid black", padding: "0.5rem", marginBottom: "0.5rem", overflowY: "auto" }}>
        {messages.map((m, i) => (
          <div key={i}>
            <b>{m.sender}:</b> {m.message}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message"
        style={{ width: "70%", marginRight: "0.5rem" }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Table;
