import "./ReactionTray.css";
import Tile from "./Tile";

/**
 * reactionOptions shape:
 * {
 *   tier: "win" | "pong_or_kong" | "chi" | ...,
 *   options: Array<{
 *     action: "pong" | "kong" | "chi" | "win",
 *     using?: TileObj[],
 *     take?: TileObj
 *   }>
 * }
 */
export default function ReactionTray({ reactionOptions, onPick, onPass }) {
  const tier = reactionOptions?.tier;
  const options = Array.isArray(reactionOptions?.options) ? reactionOptions.options : [];

  if (!tier || options.length === 0) return null;

  return (
    <div className="reaction-tray">
      <div className="reaction-tray__title">Reaction: {tier}</div>

      <div className="reaction-tray__buttons">
        {options.map((opt, i) => (
          <button
            key={`${opt?.action ?? "action"}-${i}`}
            className={`reaction-tray__btn reaction-tray__btn--${opt?.action ?? "action"}`}
            type="button"
            onClick={() => onPick?.(opt)}
          >
            <div className="reaction-tray__btn-title">{String(opt?.action ?? "ACTION").toUpperCase()}</div>

            <div className="reaction-tray__tiles">
              {opt?.take && <Tile tile={opt.take} disabled size="tiny" />}

              {opt?.take && opt?.using?.length ? (
                <span className="reaction-tray__arrow">+</span>
              ) : null}

              {(opt?.using ?? []).map((t) => (
                <Tile key={t?.uid ?? Math.random()} tile={t} disabled size="tiny" />
              ))}
            </div>
          </button>
        ))}

        <button
          className="reaction-tray__btn reaction-tray__btn--pass"
          type="button"
          onClick={() => onPass?.()}
        >
          PASS
        </button>
      </div>
    </div>
  );
}
