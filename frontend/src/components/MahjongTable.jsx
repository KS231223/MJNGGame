// src/components/MahjongTable.jsx
import "./MahjongTable.css";
import HiddenHand from "./HiddenHand";
import Tile from "./Tile";

function DiscardPile({ discards = [] }) {
  return (
    <div className="discard-pile">
      {discards.map((tile, i) => (
        <div key={i} className="discard-tile">
          <Tile tile={tile} disabled={true} size="small" />
        </div>
      ))}
    </div>
  );
}

function RevealedMelds({ melds = [] }) {
  if (!melds || melds.length === 0) return null;
  
  return (
    <div className="revealed-melds">
      {melds.map((meld, i) => (
        <div key={i} className="meld">
          {meld.tiles?.map((tile, j) => (
            <Tile key={j} tile={tile} disabled={true} size="small" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function MahjongTable({ state, actions }) {
  const { seats, yourHand = [], currentTurnSeat, yourSeat, revealedHand = [], discards = [] } = state || {};

  return (
    <div className="mj">
      <div className="mj__center">
        <div className="mj__status">
          Turn: Seat {currentTurnSeat ?? "?"}{" "}
          {currentTurnSeat === yourSeat ? "(you)" : ""}
        </div>
        <DiscardPile discards={discards} />
      </div>

      <div className="mj__seat mj__seat--top">
        <SeatView
          player={seats?.top}
          handNode={<HiddenHand count={seats?.top?.tileCount ?? 13} variant="back" />}
          discards={seats?.top?.discards}
        />
      </div>

      <div className="mj__seat mj__seat--left">
        <SeatView
          player={seats?.left}
          handNode={<HiddenHand count={seats?.left?.tileCount ?? 13} variant="side" />}
          discards={seats?.left?.discards}
        />
      </div>

      <div className="mj__seat mj__seat--right">
        <SeatView
          player={seats?.right}
          handNode={<HiddenHand count={seats?.right?.tileCount ?? 13} variant="side" />}
          discards={seats?.right?.discards}
        />
      </div>

      <div className="mj__seat mj__seat--bottom">
        <SeatView
          player={seats?.bottom}
          handNode={
            <div className="seat__hand-area">
              <RevealedMelds melds={revealedHand} />
              <div className="seat__hand">
                {yourHand.map((t) => (
                  <Tile
                    key={t.uid}
                    tile={t}
                    onClick={(tile) => actions?.discard?.(tile)} //ADD THE CLICKING LOGIC FROM THIS FUNC?
                    disabled={currentTurnSeat !== yourSeat}
                  />
                ))}
              </div>
            </div>
          }
          isYou
        />
      </div>
    </div>
  );
}

function SeatView({ player, discards = [], handNode = null, isYou }) {
  return (
    <div className="seat">
      <div className="seat__info">
        <div className="seat__name">{player?.name ?? "Empty"}</div>
        {player?.score !== undefined && (
          <div className="seat__score">{player.score}</div>
        )}
      </div>

      {!isYou && discards && discards.length > 0 && (
        <div className="seat__discards">
          {discards.slice(0, 6).map((t, i) => (
            <Tile key={i} tile={t} disabled={true} size="tiny" />
          ))}
        </div>
      )}

      {handNode}
    </div>
  );
}