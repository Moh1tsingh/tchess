import React, { useEffect, useMemo, useState } from "react";
import { Box, useInput, useStdout } from "ink";
import { Board } from "../ui/Board.js";
import { ClockPanel } from "../ui/Clocks.js";
import { Sidebar } from "../ui/Sidebar.js";
import { PromotionModal } from "../ui/PromotionModal.js";
import { Game, type PromotionPiece } from "../engine/game.js";
import { FILES, RANKS, sq } from "../ui/squares.js";
import type { GameFullEvent, GameStateEvent } from "../lichess/events.js";
import { computeInGameLayout } from "../ui/layout.js";
import { Text } from "ink";

export interface InGameProps {
  full: GameFullEvent;
  latest: GameStateEvent;
  anchor: number;
  myColor: "white" | "black";
  onMove: (uci: string) => Promise<void>;
  onResign: () => Promise<void>;
  onOfferDraw: () => Promise<void>;
  submitError: string | null;
}

function splitMoves(moves: string): string[] {
  const trimmed = moves.trim();
  return trimmed.length === 0 ? [] : trimmed.split(/\s+/);
}

function findKingSquare(board: ReturnType<Game["board"]>, color: "w" | "b"): string | null {
  for (let r = 0; r < 8; r++) {
    const row = board[r] ?? [];
    for (let f = 0; f < 8; f++) {
      const piece = row[f];
      if (piece && piece.type === "k" && piece.color === color) {
        return sq(f, 7 - r);
      }
    }
  }
  return null;
}

export function InGame(props: InGameProps): React.ReactElement {
  const { stdout } = useStdout();
  const myTurnColor: "w" | "b" = props.myColor === "white" ? "w" : "b";

  const game = useMemo(() => {
    const g = new Game(
      props.full.initialFen === "startpos" ? undefined : props.full.initialFen,
    );
    g.syncMoves(splitMoves(props.latest.moves));
    return g;
  }, [props.full.initialFen, props.latest.moves]);

  const [cursor, setCursor] = useState<string>(
    props.myColor === "white" ? "e2" : "e7",
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [promotionFrom, setPromotionFrom] = useState<{ from: string; to: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset selection when it's no longer our turn (server move received).
  useEffect(() => {
    setSelected(null);
    setPromotionFrom(null);
  }, [props.latest.moves]);

  const orientation = props.myColor;
  const flipped = orientation === "black";

  const moveCursor = (dFile: number, dRank: number) => {
    const fi = FILES.indexOf(cursor[0] as (typeof FILES)[number]);
    const ri = RANKS.indexOf(cursor[1] as (typeof RANKS)[number]);
    const df = flipped ? -dFile : dFile;
    const dr = flipped ? -dRank : dRank;
    const nf = Math.max(0, Math.min(7, fi + df));
    const nr = Math.max(0, Math.min(7, ri + dr));
    setCursor(sq(nf, nr));
  };

  const myTurn = game.turn === myTurnColor && !game.isGameOver;
  const legalDestinations = selected ? game.legalDestinations(selected) : [];

  const attemptMove = async (from: string, to: string, promotion?: PromotionPiece) => {
    if (!myTurn) return;
    const isPromo = game.isPromotion(from, to);
    if (isPromo && !promotion) {
      setPromotionFrom({ from, to });
      return;
    }
    const uci = `${from}${to}${promotion ?? ""}`;
    setSubmitting(true);
    try {
      await props.onMove(uci);
    } finally {
      setSubmitting(false);
    }
  };

  useInput((input, key) => {
    if (promotionFrom !== null) return; // modal handles input

    if (key.leftArrow) moveCursor(-1, 0);
    else if (key.rightArrow) moveCursor(1, 0);
    else if (key.upArrow) moveCursor(0, 1);
    else if (key.downArrow) moveCursor(0, -1);
    else if (key.escape) setSelected(null);
    else if (input === "r") {
      void props.onResign();
    } else if (input === "d") {
      void props.onOfferDraw();
    } else if (key.return) {
      if (!myTurn) return;
      if (selected === null) {
        // Select piece only if it belongs to us.
        const board = game.board();
        const fi = FILES.indexOf(cursor[0] as (typeof FILES)[number]);
        const ri = RANKS.indexOf(cursor[1] as (typeof RANKS)[number]);
        const piece = (board[7 - ri] ?? [])[fi];
        if (piece && piece.color === myTurnColor) {
          setSelected(cursor);
        }
      } else if (selected === cursor) {
        setSelected(null);
      } else if (legalDestinations.includes(cursor)) {
        void attemptMove(selected, cursor);
      } else {
        // Maybe selecting a new piece
        const board = game.board();
        const fi = FILES.indexOf(cursor[0] as (typeof FILES)[number]);
        const ri = RANKS.indexOf(cursor[1] as (typeof RANKS)[number]);
        const piece = (board[7 - ri] ?? [])[fi];
        if (piece && piece.color === myTurnColor) {
          setSelected(cursor);
        }
      }
    }
  });

  const moves = splitMoves(props.latest.moves);
  const lastMove = moves.length > 0
    ? (() => {
        const uci = moves[moves.length - 1]!;
        return { from: uci.slice(0, 2), to: uci.slice(2, 4) };
      })()
    : null;

  const kingInCheck = game.isCheck ? findKingSquare(game.board(), game.turn) : null;

  const status = (() => {
    if (submitting) return "Submitting move…";
    if (props.submitError) return `Error: ${props.submitError}`;
    if (game.isCheckmate) return "Checkmate.";
    if (game.isStalemate) return "Stalemate.";
    if (game.isDraw) return "Draw.";
    if (game.isCheck) return "Check!";
    return myTurn ? "Your move." : "Waiting for opponent…";
  })();

  const helpLines = promotionFrom
    ? ["Pick piece: <- ->", "Enter: confirm", "Esc: cancel"]
    : selected
      ? ["Arrows: target", "Enter: move", "Esc: cancel", "r: resign  d: draw"]
      : ["Arrows: move", "Enter: select", "Esc: clear", "r: resign  d: draw"];

  const whiteName = formatPlayerLabel(props.full.white, "White");
  const blackName = formatPlayerLabel(props.full.black, "Black");
  const columns = stdout?.columns ?? 80;
  const rows = stdout?.rows ?? 24;
  const layout = computeInGameLayout(columns, rows);
  const longestName = Math.max(whiteName.length, blackName.length);
  const stackedClockWidth = layout.mode === "stacked"
    ? Math.min(
        columns - 2 - 24,
        Math.max(layout.clockWidth, longestName + 9),
      )
    : layout.clockWidth;
  const stackedSidebarWidth = layout.mode === "stacked"
    ? columns - 2 - stackedClockWidth
    : layout.sidebarWidth;

  if (!layout.playable) {
    return (
      <Box borderStyle="round" paddingX={2} paddingY={1} flexDirection="column">
        <Text bold>Terminal too small for the game view</Text>
        <Text>
          Resize the terminal to at least 46 columns and 14 rows for the board-first layout.
        </Text>
        <Text dimColor>
          Coordinates auto-hide first, but this terminal is still too small to keep the board usable.
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" alignItems="flex-start">
      {layout.mode === "side" ? (
        <Box flexDirection="row" alignItems="flex-start">
          <Box flexDirection="column" marginRight={2}>
            <Box flexDirection="column">
              <Board
                board={game.board()}
                orientation={orientation}
                cellWidth={layout.boardSquareWidth}
                cellHeight={layout.boardSquareHeight}
                showCoordinates={layout.showCoordinates}
                cursor={cursor}
                selected={selected}
                legalDestinations={legalDestinations}
                lastMove={lastMove}
                kingInCheck={kingInCheck}
              />
            </Box>
          </Box>
          <Box flexDirection="column" width={layout.sidebarWidth}>
            <Sidebar
              moveHistorySan={game.historySan}
              status={status}
              helpLines={helpLines}
              width={layout.sidebarWidth}
              height={layout.sidebarHeight}
            />
            <Box marginTop={1}>
              <ClockPanel
                whiteMs={props.latest.wtime}
                blackMs={props.latest.btime}
                anchor={props.anchor}
                turn={game.turn}
                whiteName={whiteName}
                blackName={blackName}
                player={orientation === "white" ? "black" : "white"}
                width={layout.clockWidth}
                clockHeight={layout.clockHeight}
              />
            </Box>
            <Box marginTop={1}>
              <ClockPanel
                whiteMs={props.latest.wtime}
                blackMs={props.latest.btime}
                anchor={props.anchor}
                turn={game.turn}
                whiteName={whiteName}
                blackName={blackName}
                player={orientation}
                width={layout.clockWidth}
                clockHeight={layout.clockHeight}
              />
            </Box>
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column" alignItems="flex-start">
          <Board
            board={game.board()}
            orientation={orientation}
            cellWidth={layout.boardSquareWidth}
            cellHeight={layout.boardSquareHeight}
            showCoordinates={layout.showCoordinates}
            cursor={cursor}
            selected={selected}
            legalDestinations={legalDestinations}
            lastMove={lastMove}
            kingInCheck={kingInCheck}
          />
          <Box flexDirection="row" alignItems="flex-start" marginTop={1}>
            <Box marginRight={2}>
              <Sidebar
                moveHistorySan={game.historySan}
                status={status}
                helpLines={helpLines}
                width={stackedSidebarWidth}
                height={layout.sidebarHeight}
              />
            </Box>
            <Box flexDirection="column" width={stackedClockWidth}>
              <ClockPanel
                whiteMs={props.latest.wtime}
                blackMs={props.latest.btime}
                anchor={props.anchor}
                turn={game.turn}
                whiteName={whiteName}
                blackName={blackName}
                player={orientation === "white" ? "black" : "white"}
                width={stackedClockWidth}
                clockHeight={layout.clockHeight}
                compact
              />
              <Box marginTop={1}>
                <ClockPanel
                  whiteMs={props.latest.wtime}
                  blackMs={props.latest.btime}
                  anchor={props.anchor}
                  turn={game.turn}
                  whiteName={whiteName}
                  blackName={blackName}
                  player={orientation}
                  width={stackedClockWidth}
                  clockHeight={layout.clockHeight}
                  compact
                />
              </Box>
            </Box>
          </Box>
        </Box>
      )}
      {promotionFrom && (
        <Box marginTop={1}>
          <PromotionModal
            color={myTurnColor}
            onPick={(p) => {
              const { from, to } = promotionFrom;
              setPromotionFrom(null);
              void attemptMove(from, to, p);
            }}
            onCancel={() => setPromotionFrom(null)}
          />
        </Box>
      )}
    </Box>
  );
}

function formatPlayerLabel(
  player: GameFullEvent["white"] | GameFullEvent["black"],
  fallback: string,
): string {
  const name = player.name ?? player.id ?? fallback;
  return typeof player.rating === "number" ? `${name} (${player.rating})` : name;
}
