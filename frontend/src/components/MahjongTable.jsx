// src/components/MahjongTable.jsx
import "./MahjongTable.css";
import HiddenHand from "./HiddenHand";
import Tile from "./Tile";
import ReactionTray from "./ReactionTray";


function CenterDiscards({ piles }) {
  const p = piles ?? { bottom: [], right: [], top: [], left: [] };

  return (
    <div className="center-discards">
      <div className="center-discards__pile center-discards__pile--top">
        {p.top.slice(-6).map((t, i) => <Tile key={i} tile={t} disabled size="tiny" />)}
      </div>

      <div className="center-discards__pile center-discards__pile--left">
        {p.left.slice(-6).map((t, i) => <Tile key={i} tile={t} disabled size="tiny" />)}
      </div>

      <div className="center-discards__pile center-discards__pile--right">
        {p.right.slice(-6).map((t, i) => <Tile key={i} tile={t} disabled size="tiny" />)}
      </div>

      <div className="center-discards__pile center-discards__pile--bottom">
        {p.bottom.slice(-6).map((t, i) => <Tile key={i} tile={t} disabled size="tiny" />)}
      </div>
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
  const {
    seats,
    yourHand = [],
    revealedHand = [],
    discards = [],
    currentTurnSeat,
    yourSeat,
    centerDiscards,
    isMyTurn,
    discarded, 
    reactionOptions,
  } = state || {};

  return (
    <div className="mj">
      <ReactionTray
        reactionOptions={reactionOptions}
        onPick={(opt) => actions?.react?.(opt)}
        onPass={() => actions?.passReaction?.()}
      />
      <div className="mj__center">
        <div className="mj__status">
          Turn: Seat {currentTurnSeat ?? "?"}{" "}
          {isMyTurn  ? "(you)" : ""}
        </div>
        <CenterDiscards piles={centerDiscards} />
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
                    onClick={(tile) => actions?.discard?.(tile)}
                    disabled={!state?.isMyTurn || !state?.drewThisTurn || state?.discarded}
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