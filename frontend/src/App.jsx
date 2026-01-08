import { useState } from "react";
import Table from "./Table";
import "./App.css";

function App() {
  const [tableInput, setTableInput] = useState("");
  const [activeTable, setActiveTable] = useState(null);

  const handleCreateOrJoin = () => {
    if (!tableInput.trim()) return;

    const tableId = "table-" + tableInput.trim();

    // Ask backend to create or join table
    socket.emit("create-or-join-table", tableId);

    // Set as active table to render Table component
    setActiveTable(tableId);

    // Clear input
    setTableInput("");
  };

  return (
    <div className="App" style={{ padding: "2rem" }}>
      <h1>Ephemeral Chat Test</h1>
      <div style={{ marginBottom: "1rem" }}>
        <input
          value={tableInput}
          onChange={(e) => setTableInput(e.target.value)}
          placeholder="Enter table name"
          style={{ marginRight: "0.5rem" }}
        />
        <button onClick={handleCreateOrJoin}>Create / Join Table</button>
      </div>

      {/* Render the table if active */}
      {activeTable && <Table tableId={activeTable} />}
    </div>
  );
}

export default App;
