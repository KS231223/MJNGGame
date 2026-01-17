// src/pages/TablePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";
import Chat from "../components/chat";
import MahjongTable from "../components/MahjongTable";
import "./TablePage.css";

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

  // use this to detect turn changes
  const lastTurnSeatRef = useRef(null);

  // store whatever backend returns after draw
  const [possibleActions, setPossibleActions] = useState([]);

  useEffect(() => {
    if (!tableId) return;

    socket.emit("join-table", { tableId });

    const onStart = ({ table_state, player_state }) => {
      const yourSeat = player_state?.seat;
      const currentTurnSeat = table_state?.turn_index; // seat number 1..4
      const isMyTurn = currentTurnSeat === yourSeat;

      const players = Array.isArray(table_state?.players) ? [...table_state.players] : [];
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

        centerDiscards: { bottom: [], right: [], top: [], left: [] },

        players,
      };

      if (myIndex !== -1 && players.length > 0) {
        const n = players.length;
        const rel = (offset) => players[(myIndex + offset + n) % n];
        merged.seats = { bottom: rel(0), right: rel(1), top: rel(2), left: rel(3) };
      }

      // reset draw guard when a new turn begins (including at start)
      if (lastTurnSeatRef.current !== currentTurnSeat) {
        lastTurnSeatRef.current = currentTurnSeat;
        drewRef.current = false;
        setDrewThisTurn(false);
        setPossibleActions([]);
        discardedRef.current = false;
        setDiscarded(false);
      }

      // AUTO-DRAW: only if it's your turn and you haven't drawn yet
      if (isMyTurn && !drewRef.current) {
        drewRef.current = true;
        setDrewThisTurn(true);
        socket.emit("game-action", { tableId, type: "draw" });
        discardedRef.current = false;
        setDiscarded(false);

      }

      setTableState(merged);
    };

    const onUpdate = (patch) => {
      setTableState((prev) => {
        const next = { ...(prev ?? {}), ...(patch ?? {}) };

        // normalize turn seat
        if ("turn_index" in (patch ?? {})) {
          next.currentTurnSeat = patch.turn_index;
        } else if (next.currentTurnSeat == null && next.turn_index != null) {
          next.currentTurnSeat = next.turn_index;
        }

        const yourSeat = next.yourSeat ?? next.seat;
        next.isMyTurn = next.currentTurnSeat === yourSeat;

        // if turn changed, reset draw guard + possible actions
        if (lastTurnSeatRef.current !== next.currentTurnSeat) {
          lastTurnSeatRef.current = next.currentTurnSeat;
          drewRef.current = false;
          setDrewThisTurn(false);
          setPossibleActions([]);
          discardedRef.current = false;
          setDiscarded(false);

        }

        // AUTO-DRAW: only once per turn, only when it's your turn
        if (next.isMyTurn && !drewRef.current) {
          drewRef.current = true;
          setDrewThisTurn(true);
          discardedRef.current = false;
          setDiscarded(false);
          socket.emit("game-action", { tableId, type: "draw" });
        }

        // keep seats mapping if players updated
        if (Array.isArray(next.players) && next.yourSid) {
          const players = [...next.players].sort((a, b) => (a.seat ?? 0) - (b.seat ?? 0));
          next.players = players;

          const myIndex = players.findIndex((p) => p.sid === next.yourSid);
          if (myIndex !== -1 && players.length > 0) {
            const n = players.length;
            const rel = (offset) => players[(myIndex + offset + n) % n];
            next.seats = { bottom: rel(0), right: rel(1), top: rel(2), left: rel(3) };
          }
        }
        return next;
      });
    };

    const onPossibleActions = (payload) => {
      const actions = Array.isArray(payload?.actions) ? payload.actions : [];
      const tile = payload?.tile ?? null;

      setPossibleActions(actions);

      // add drawn tile into yourHand immediately (frontend optimistic)
      if (tile) {
        setTableState((prev) => {
          if (!prev) return prev;
          const hand = Array.isArray(prev.yourHand) ? prev.yourHand : [];

          // avoid duplicates if you ever receive twice
          const uid = tile.uid ?? `${tile.type}-${tile.suit}-${tile.number}-${Math.random()}`;
          const already = hand.some((t) => (t?.uid ?? "") === uid);
          const nextHand = already ? hand : [...hand, { ...tile, uid }];

          return { ...prev, yourHand: nextHand };
        });
      }

      // this is basically "you are now in discard/call phase"
      // (we keep drewThisTurn=true; it was set when we emitted draw)
    };

    const onDiscardTile = ({ tile, sid: discarderSid }) => {
      setTableState((prev) => {
        if (!prev) return prev;
        if (discarderSid && discarderSid === tableState?.yourSid) {
          discardedRef.current = true;
          setDiscarded(true);
        }
        
        const players = Array.isArray(prev.players) ? prev.players : [];
        const mySid = prev.yourSid;


        const myIndex = players.findIndex((p) => p.sid === mySid);
        const discarderIndex = players.findIndex((p) => p.sid === discarderSid);

        // fallback: if we can't map, just dump to center bottom
        if (myIndex === -1 || discarderIndex === -1 || players.length === 0) {
          const cd = prev.centerDiscards ?? { bottom: [], right: [], top: [], left: [] };
          return {
            ...prev,
            centerDiscards: { ...cd, bottom: [...cd.bottom, tile] },
          };
        }

        const n = players.length;
        // relative offset from me (clockwise): 0=me(bottom), 1=right, 2=top, 3=left
        const offset = (discarderIndex - myIndex + n) % n;

        const key =
          offset === 0 ? "bottom" :
          offset === 1 ? "right" :
          offset === 2 ? "top" :
          "left";

        const cd = prev.centerDiscards ?? { bottom: [], right: [], top: [], left: [] };

        return {
          ...prev,
          centerDiscards: {
            ...cd,
            [key]: [...cd[key], tile],
          },
        };
      });

      // only clear YOUR draw/possible-actions if YOU discarded
      if (discarderSid && discarderSid === tableState?.yourSid) {
        setPossibleActions([]);
        setDrewThisTurn(false);
        drewRef.current = false;
      }
    };
    const onReactionOptions = (payload) => {
      // payload: { tier, options }
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
  }, [tableId]);

  // Gate emits (still let backend enforce real rules)
  const actions = useMemo(() => {
    const canAct = !!tableState?.isMyTurn;

    return {
      // manual draw button (optional): only if it's your turn and you haven't drawn yet
      draw: () => {
        if (!canAct) return;
        if (drewRef.current) return;
        drewRef.current = true;
        setDrewThisTurn(true);
        socket.emit("game-action", { tableId, type: "draw" });
      },

      discard: (tile) => {
        const canAct = !!tableState?.isMyTurn;
        if (!canAct) return;
        if (!drewRef.current) return;
        if (discardedRef.current) return;

        discardedRef.current = true;
        setDiscarded(true);

        socket.emit("game-action", { tableId, type: "discard", tile });

        setTableState((prev) => {
          if (!prev) return prev;
          const hand = Array.isArray(prev.yourHand) ? prev.yourHand : [];
          return { ...prev, yourHand: hand.filter((t) => (t?.uid ?? "") !== (tile?.uid ?? "")) };
        });

        setPossibleActions([]);
      },
      
      call: (callType) => {
        if (!canAct) return;
        if (!drewRef.current) return;
        socket.emit("game-action", { tableId, type: "call", callType });
      },
      react: (opt) => {
        if (!opt) return;

        socket.emit("reaction-choice", {
          tableId,
          choice: {
            type: opt.action,                 // "pong"|"kong"|"chi"|"win"
            tiles_to_use: opt.using ?? [],    // list of tiles from hand
            // backend should ignore this and use pending["tile"] as truth, but ok to send:
            last_discarded_tile: opt.take ?? null,
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
  },  [tableId, tableState?.isMyTurn, reactionOptions?.tier]);

  return (
    <div className={`tablepage ${chatOpen ? "tablepage--chat-open" : ""}`}>
      <header className="tablepage__topbar">
        <h2 className="tablepage__title">Table: {tableId}</h2>

        <div className="tablepage__actions">
          <button className="tablepage__btn" onClick={() => setChatOpen((v) => !v)}>
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
          <button className="tablepage__chat-fab" onClick={() => setChatOpen(true)}>
            Chat
          </button>
        )}
      </main>
    </div>
  );
}
