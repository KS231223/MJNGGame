import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const join = () => {
    const id = input.trim();
    if (!id) {
      setError("Please enter a room ID.");
      return;
    }
    setError("");
    navigate(`/table/${encodeURIComponent(id)}`);
  };
  const create = () => {
    const id = crypto.randomUUID().slice(0, 6);
    navigate(`/table/${encodeURIComponent(id)}`);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") join();
  };

  return (
    <div className="home">
      <h1 className="home__title">Mahjong Chat</h1>

      <div className="home__row">
        <input
          className="home__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Table ID"
        />
        <button className="home__button" onClick={join}>
          Join
        </button>
        <button className="home__button" onClick={create}>
          Create
        </button>
      </div>

      {error && <div className="home__error">{error}</div>}
    </div>
  );
}
