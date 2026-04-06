// src/components/MahjongTable.jsx
import "./MahjongTable.css";
import HiddenHand from "./HiddenHand";
import Tile from "./Tile";
import ReactionTray from "./ReactionTray";
import { sortTiles } from "../utils/sortTiles";

function CenterDiscards({ piles }) {
  const p = piles ?? { bottom: [], right: [], top: [], left: [] };

  return (
    <div className="center-discards">
      <div className="center-discards__pile center-discards__pile--top">
        {p.top.slice(-6).map((t, i) => (
          <Tile key={i} tile={t} disabled size="tiny" />
        ))}
      </div>

      <div className="center-discards__pile center-discards__pile--left">
        {p.left.slice(-6).map((t, i) => (
          <Tile key={i} tile={t} disabled size="tiny" />
        ))}
      </div>

      <div className="center-discards__pile center-discards__pile--right">
        {p.right.slice(-6).map((t, i) => (
          <Tile key={i} tile={t} disabled size="tiny" />
        ))}
      </div>

      <div className="center-discards__pile center-discards__pile--bottom">
        {p.bottom.slice(-6).map((t, i) => (
          <Tile key={i} tile={t} disabled size="tiny" />
        ))}
      </div>
    </div>
  );
}

/**
 * Backend public state format:
 * player.revealed_hand is like: [ [tile,tile,tile], [tile,tile,tile,tile], ... ]
 * player.point_hand is like: [tile, tile, ...] OR maybe [ [tile,...], ... ]
 *
 * We'll support both: list of tiles OR list of groups.
 */
function PointHandView({ pointHand = [] }) {
  if (!pointHand || pointHand.length === 0) return null;

  const isGrouped = Array.isArray(pointHand[0]);

  return (
    <div className="point-hand">
      <div className="point-hand__label">Points</div>

      <div className="point-hand__tiles">
        {isGrouped
          ? pointHand.map((grp, gi) => (
              <div key={gi} className="point-hand__group">
                {(grp ?? []).map((t, i) => (
                  <Tile
                    key={t?.uid ?? `${gi}-${i}`}
                    tile={t}
                    disabled
                    size="tiny"
                  />
                ))}
              </div>
            ))
          : pointHand.map((t, i) => (
              <Tile key={t?.uid ?? i} tile={t} disabled size="tiny" />
            ))}
      </div>
    </div>
  );
}

function RevealedHandView({ revealed = [] }) {
  if (!revealed || revealed.length === 0) return null;

  return (
    <div className="revealed-public">
      <div className="revealed-public__label">Revealed</div>

      <div className="revealed-public__rows">
        {revealed.map((set, si) => (
          <div key={si} className="revealed-public__set">
            {(set ?? []).map((t, i) => (
              <Tile
                key={t?.uid ?? `${si}-${i}`}
                tile={t}
                disabled
                size="tiny"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// your local revealed melds (the one you already used)
function RevealedMelds({ melds = [] }) {
  if (!melds || melds.length === 0) return null;

  return (
    <div className="revealed-melds">
      {melds.map((meld, i) => (
        <div key={i} className="meld">
          {(meld ?? []).map((tile, j) => (
            <Tile key={tile?.uid ?? j} tile={tile} disabled size="small" />
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
    revealedHand = [], // your local revealed (from player_state)
    currentTurnSeat,
    centerDiscards,
    isMyTurn,
    reactionOptions,
    possibleActions,
    discarded,
  } = state || {};

  const canDiscard =
    !!isMyTurn &&
    !discarded &&
    (possibleActions ?? []).includes("discard");

  const sortedHand = [...yourHand].sort(sortTiles);

  return (
    <div className="mj">
      <ReactionTray
        reactionOptions={reactionOptions}
        onPick={(opt) => actions?.react?.(opt)}
        onPass={() => actions?.passReaction?.()}
      />

      <div className="mj__center">
        <div className="mj__status">
          Turn: Seat {currentTurnSeat ?? "?"} {isMyTurn ? "(you)" : ""}
        </div>
        <CenterDiscards piles={centerDiscards} />
      </div>

      <div className="mj__seat mj__seat--top">
        <SeatView
          player={seats?.top}
          handNode={<HiddenHand count={seats?.top?.tileCount ?? 13} variant="back" />}
        />
      </div>

      <div className="mj__seat mj__seat--left">
        <SeatView
          player={seats?.left}
          handNode={<HiddenHand count={seats?.left?.tileCount ?? 13} variant="side" />}
        />
      </div>

      <div className="mj__seat mj__seat--right">
        <SeatView
          player={seats?.right}
          handNode={<HiddenHand count={seats?.right?.tileCount ?? 13} variant="side" />}
        />
      </div>

      <div className="mj__seat mj__seat--bottom">
        <SeatView
          player={seats?.bottom}
          isYou
          handNode={
            <div className="seat__hand-area">
              {/* your local detailed melds */}
              <RevealedMelds melds={revealedHand} />

              <div className="seat__hand">
                {sortedHand.map((t) => (
                  <Tile
                    key={t.uid}
                    tile={t}
                    onClick={(tile) => actions?.discard?.(tile)}
                    disabled={!canDiscard}
                  />
                ))}
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}

function SeatView({ player, handNode = null, isYou }) {
  const publicRevealed = player?.revealed_hand ?? [];
  const publicPoints = player?.point_hand ?? [];

  return (
    <div className="seat">
      <div className="seat__info">
        <div className="seat__name">{player?.name ?? "Empty"}</div>
        {player?.money !== undefined && (
          <div className="seat__score">{player.money}</div>
        )}
      </div>

      {/* show public info for everyone, including you */}
      <div className="seat__public">
        <RevealedHandView revealed={publicRevealed} />
        <PointHandView pointHand={publicPoints} />
      </div>

      {handNode}
    </div>
  );
}
