// src/components/MahjongTable.jsx
import "./MahjongTable.css";

export default function MahjongTable({ state, actions }) {
  const { players = [], yourSeat, currentTurnSeat, discards = {}, yourHand = [] } = state;

  const bySeat = (seat) => players.find((p) => p.seat === seat);

  return (
    <div className="mj">
      <div className="mj__center">
        <div className="mj__status">
          Turn: Seat {currentTurnSeat} {currentTurnSeat === yourSeat ? "(you)" : ""}
        </div>
      </div>

      <div className="mj__seat mj__seat--top">
        <SeatView player={bySeat(2)} discards={discards[2]} />
      </div>

      <div className="mj__seat mj__seat--left">
        <SeatView player={bySeat(3)} discards={discards[3]} />
      </div>

      <div className="mj__seat mj__seat--right">
        <SeatView player={bySeat(1)} discards={discards[1]} />
      </div>

      <div className="mj__seat mj__seat--bottom">
        <SeatView
          player={bySeat(0)}
          discards={discards[0]}
          hand={yourSeat === 0 ? yourHand : null}
          onDiscard={actions.discard}
          isYou={yourSeat === 0}
        />
      </div>
    </div>
  );
}

function SeatView({ player, discards = [], hand = null, onDiscard, isYou }) {
  return (
    <div className="seat">
      <div className="seat__name">{player ? player.name : "Empty"}</div>

      <div className="seat__discards">
        {discards.map((t, i) => (
          <span className="tile" key={i}>{t}</span>
        ))}
      </div>

      {hand && (
        <div className="seat__hand">
          {hand.map((t, i) => (
            <button className="tile tile--btn" key={i} onClick={() => onDiscard?.(t)}>
              {t}
            </button>
          ))}
        </div>
      )}

      {!hand && isYou && <div className="seat__hand">(your hand hidden?)</div>}
    </div>
  );
}
