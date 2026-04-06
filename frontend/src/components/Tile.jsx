// src/components/Tile.jsx
import { tileToSrc, tileFrontSrc } from "../utils/tileAssets";
import "./Tile.css";

export default function Tile({ tile, onClick, disabled, size = "normal" }) {
  const faceSrc = tileToSrc(tile);
  const frameSrc = tileFrontSrc();

  const sizeClass =
    size === "tiny" ? "tile-tiny" :
    size === "small" ? "tile-small" :
    size === "large" ? "tile-large" : "";

  return (
    <button
      type="button"
      className={`tilebtn ${sizeClass} ${disabled ? "disabled" : ""}`}
      onClick={() => !disabled && onClick?.(tile)}
      disabled={disabled}
      title={tile?.uid ?? ""}
    >
      <span className="tilewrap">
        <img className="tileimg tileimg--frame" src={frameSrc} alt="" draggable={false} />
        <img className="tileimg tileimg--face" src={faceSrc} alt={tile?.uid ?? "tile"} draggable={false} />
      </span>
    </button>
  );
}
