// src/pages/TablePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";
import Chat from "../components/chat";
import MahjongTable from "../components/MahjongTable";
import "./TablePage.css";

function mergeState(table_state, player_state) {
  const yourSeat = player_state?.seat;
  const currentTurnSeat = table_state?.turn_index;
  const isMyTurn = currentTurnSeat === yourSeat;

  const players = Array.isArray(table_state?.players)
    ? [...table_state.players]
    : [];
  players.sort((a, b) => (a.seat ?? 0) - (b.seat ?? 0));

  const myIndex = players.findIndex((p) => p.sid === player_state?.id);

  const merged = {
    ...table_state,
    currentTurnSeat,

    ...player_state,
    yourSid: player_state?.id,
    yourSeat,
    isMyTurn,

    yourHand: player_state?.tileHand ?? [],
    pointHand: player_state?.pointHand ?? [],
    revealedHand: player_state?.revealedHand ?? [],

    players,
  };

  if (myIndex !== -1 && players.length > 0) {
    const n = players.length;
    const rel = (offset) => players[(myIndex + offset + n) % n];
    merged.seats = {
      bottom: rel(0),
      right: rel(1),
      top: rel(2),
      left: rel(3),
    };
  }

  return merged;
}

export default function TablePage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(true);

  const [reactionOptions, setReactionOptions] = useState(null);

  const [tableState, setTableState] = useState(null);

  const [discarded, setDiscarded] = useState(false);
  const discardedRef = useRef(false);

  // draw-phase guard
  const [drewThisTurn, setDrewThisTurn] = useState(false);
  const drewRef = useRef(false);

  // detect turn changes
  const lastTurnSeatRef = useRef(null);

  // backend says what actions you can do now
  const [possibleActions, setPossibleActions] = useState([]);

  // inside TablePage component
  const applyMergedState = (merged) => {
    const currentTurnSeat = merged.currentTurnSeat;

    const turnChanged = lastTurnSeatRef.current !== currentTurnSeat;

    // reset per-turn stuff if seat changed
    if (turnChanged) {
      lastTurnSeatRef.current = currentTurnSeat;

      drewRef.current = false;
      setDrewThisTurn(false);

      discardedRef.current = false;
      setDiscarded(false);

      setPossibleActions([]);
      setReactionOptions(null);
    }

    // ONLY AUTO-DRAW WHEN TURN JUST CHANGED TO YOU
    if (turnChanged && merged.isMyTurn && !drewRef.current) {
      drewRef.current = true;
      setDrewThisTurn(true);

      discardedRef.current = false;
      setDiscarded(false);

      socket.emit("game-action", { tableId, type: "draw" });
    }

    setTableState((prev) => ({
      ...merged,
      centerDiscards:
        prev?.centerDiscards ?? { bottom: [], right: [], top: [], left: [] },
    }));
  };


  useEffect(() => {
    if (!tableId) return;

    socket.emit("join-table", { tableId });

    const onStart = ({ table_state, player_state }) => {
      const merged = mergeState(table_state, player_state);
      applyMergedState(merged);
    };

    const onUpdate = (payload) => {
      if (payload?.table_state && payload?.player_state) {
        const merged = mergeState(payload.table_state, payload.player_state);
        applyMergedState(merged);
      }
    };

    const onPossibleActions = (payload) => {
      const actions = Array.isArray(payload?.actions) ? payload.actions : [];
      const tile = payload?.tile ?? null;

      setPossibleActions(actions);

      // ✅ FIX 2A: if server says you can discard now (pong/chi flow), re-enable discarding
      if (actions.includes("discard")) {
        discardedRef.current = false;
        setDiscarded(false);
      }

      // optimistic add drawn tile into your hand
      if (tile) {
        setTableState((prev) => {
          if (!prev) return prev;
          const hand = Array.isArray(prev.yourHand) ? prev.yourHand : [];

          const uid =
            tile.uid ?? `${tile.type}-${tile.suit}-${tile.number}-${Math.random()}`;
          const already = hand.some((t) => (t?.uid ?? "") === uid);
          const nextHand = already ? hand : [...hand, { ...tile, uid }];

          return { ...prev, yourHand: nextHand };
        });
      }
    };

    const onDiscardTile = ({ tile, sid: discarderSid }) => {
      let iAmDiscarder = false;

      setTableState((prev) => {
        if (!prev) return prev;

        iAmDiscarder = discarderSid === prev.yourSid;

        const players = Array.isArray(prev.players) ? prev.players : [];
        const myIndex = players.findIndex((p) => p.sid === prev.yourSid);
        const discarderIndex = players.findIndex((p) => p.sid === discarderSid);

        const cd =
          prev.centerDiscards ?? { bottom: [], right: [], top: [], left: [] };

        // fallback: can't map seat -> put in bottom
        if (myIndex === -1 || discarderIndex === -1 || players.length === 0) {
          return {
            ...prev,
            centerDiscards: { ...cd, bottom: [...cd.bottom, tile] },
          };
        }

        const n = players.length;
        const offset = (discarderIndex - myIndex + n) % n;

        const key =
          offset === 0
            ? "bottom"
            : offset === 1
            ? "right"
            : offset === 2
            ? "top"
            : "left";

        return {
          ...prev,
          centerDiscards: { ...cd, [key]: [...cd[key], tile] },
        };
      });

      // side effects outside setState
      if (discarderSid && iAmDiscarder) {
        discardedRef.current = true;
        setDiscarded(true);

        setPossibleActions([]);
        setDrewThisTurn(false);
        drewRef.current = false;
      }
    };

    const onReactionOptions = (payload) => {
      const tier = payload?.tier ?? null;
      const options = Array.isArray(payload?.options) ? payload.options : [];

      if (!tier || options.length === 0) {
        setReactionOptions(null);
        return;
      }
      setReactionOptions({ tier, options });
    };

    socket.on("game-start", onStart);
    socket.on("table-update", onUpdate);
    socket.on("possible-actions", onPossibleActions);
    socket.on("discard-tile", onDiscardTile);
    socket.on("reaction-options", onReactionOptions);

    return () => {
      socket.off("game-start", onStart);
      socket.off("table-update", onUpdate);
      socket.off("possible-actions", onPossibleActions);
      socket.off("discard-tile", onDiscardTile);
      socket.off("reaction-options", onReactionOptions);
      socket.emit("leave-table", { tableId });
    };
  }, [tableId]); // applyMergedState is stable enough here; it only uses current hooks/refs

  // Gate emits (still let backend enforce real rules)
  const actions = useMemo(() => {
    const canAct = !!tableState?.isMyTurn;

    return {
      draw: () => {
        if (!canAct) return;
        if (drewRef.current) return;

        drewRef.current = true;
        setDrewThisTurn(true);
        socket.emit("game-action", { tableId, type: "draw" });
      },

      discard: (tile) => {
        if (!canAct) return;

        // ✅ FIX 2B: allow discard if server says discard is allowed (pong/chi), even if drewRef is false
        const canDiscardNow =
          drewRef.current || (possibleActions ?? []).includes("discard");

        if (!canDiscardNow) return;
        if (discardedRef.current) return;

        discardedRef.current = true;
        setDiscarded(true);

        socket.emit("game-action", { tableId, type: "discard", tile });

        // optimistic remove from hand
        setTableState((prev) => {
          if (!prev) return prev;
          const hand = Array.isArray(prev.yourHand) ? prev.yourHand : [];
          return {
            ...prev,
            yourHand: hand.filter(
              (t) => (t?.uid ?? "") !== (tile?.uid ?? ""),
            ),
          };
        });

        setPossibleActions([]);
      },

      call: (callType) => {
        if (!canAct) return;
        if (!drewRef.current) return; // keep your rule for now
        socket.emit("game-action", { tableId, type: "call", callType });
      },

      react: (opt) => {
        if (!opt) return;

        socket.emit("reaction-choice", {
          tableId,
          choice: {
            type: opt.action, // "pong"|"kong"|"chi"|"win"
            tiles_to_use: opt.using ?? [],
            last_discarded_tile: opt.take ?? null, // backend can ignore
          },
        });

        setReactionOptions(null);
      },

      passReaction: () => {
        socket.emit("reaction-choice", {
          tableId,
          choice: { type: "pass" },
        });

        setReactionOptions(null);
      },
    };
  }, [tableId, tableState?.isMyTurn, possibleActions, reactionOptions?.tier]);

  return (
    <div className={`tablepage ${chatOpen ? "tablepage--chat-open" : ""}`}>
      <header className="tablepage__topbar">
        <h2 className="tablepage__title">Table: {tableId}</h2>

        <div className="tablepage__actions">
          <button
            className="tablepage__btn"
            onClick={() => setChatOpen((v) => !v)}
          >
            {chatOpen ? "Hide chat" : "Show chat"}
          </button>

          <button className="tablepage__btn" onClick={() => navigate("/")}>
            Leave table
          </button>
        </div>
      </header>

      <main className="tablepage__main">
        <section className="tablepage__board">
          {!tableState && <div className="board__card">Loading table…</div>}

          {tableState?.started ? (
            <MahjongTable
              state={{
                ...tableState,
                drewThisTurn,
                possibleActions,
                discarded,
                reactionOptions,
              }}
              actions={actions}
            />
          ) : (
            <div className="board__card">Waiting for players…</div>
          )}
        </section>

        <aside className={`tablepage__chat ${chatOpen ? "" : "is-hidden"}`}>
          <Chat tableId={tableId} onClose={() => setChatOpen(false)} />
        </aside>

        {!chatOpen && (
          <button
            className="tablepage__chat-fab"
            onClick={() => setChatOpen(true)}
          >
            Chat
          </button>
        )}
      </main>
    </div>
  );
}
