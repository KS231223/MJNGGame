import { tileBackSrc, tileSideSrc } from "../utils/tileAssets";
import "./HiddenHand.css";

export default function HiddenHand({ count, variant = "back" }) {
  const src = variant === "side" ? tileSideSrc() : tileBackSrc();

  return (
    <div className={`hand hand--${variant}`}>
      {Array.from({ length: count }).map((_, i) => (
        <img
          key={i}
          className="handtile"
          src={src}
          alt=""
          draggable={false}
          style={{ zIndex: i }}   // IMPORTANT: later tiles draw on top
        />
      ))}
    </div>
  );
}
