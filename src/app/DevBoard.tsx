import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { InGame } from "./InGame.js";
import { Game } from "../engine/game.js";
import type { GameFullEvent, GameStateEvent, GameStatus } from "../lichess/events.js";

interface DevPreset {
  name: string;
  myColor: "white" | "black";
  full: GameFullEvent;
  latest: GameStateEvent;
}

const TEN_MINUTES_MS = 10 * 60 * 1000;

const DEV_PRESETS: DevPreset[] = [
  {
    name: "Opening",
    myColor: "black",
    latest: {
      type: "gameState",
      moves: "e2e4 e7e5 f1c4 b8c6 d1f3",
      wtime: TEN_MINUTES_MS,
      btime: TEN_MINUTES_MS,
      winc: 0,
      binc: 0,
      status: "started",
    },
    full: {
      type: "gameFull",
      id: "dev-opening",
      rated: false,
      variant: { key: "standard", name: "Standard" },
      speed: "rapid",
      perf: { name: "Rapid" },
      clock: { initial: 600, increment: 0 },
      createdAt: Date.now(),
      white: { id: "dev-white", name: "Dev White", rating: 1500 },
      black: { id: "dev-black", name: "Dev Black", rating: 1500 },
      initialFen: "startpos",
      state: {
        type: "gameState",
        moves: "e2e4 e7e5 f1c4 b8c6 d1f3",
        wtime: TEN_MINUTES_MS,
        btime: TEN_MINUTES_MS,
        winc: 0,
        binc: 0,
        status: "started",
      },
    },
  },
  {
    name: "Middlegame",
    myColor: "white",
    latest: {
      type: "gameState",
      moves: "",
      wtime: 4 * 60 * 1000,
      btime: 5 * 60 * 1000,
      winc: 2000,
      binc: 2000,
      status: "started",
    },
    full: {
      type: "gameFull",
      id: "dev-middlegame",
      rated: false,
      variant: { key: "standard", name: "Standard" },
      speed: "rapid",
      perf: { name: "Rapid" },
      clock: { initial: 300, increment: 2 },
      createdAt: Date.now(),
      white: { id: "dev-white", name: "Dev White", rating: 1500 },
      black: { id: "dev-black", name: "Dev Black", rating: 1500 },
      initialFen: "r2q1rk1/ppp2ppp/2npbn2/4p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 8",
      state: {
        type: "gameState",
        moves: "",
        wtime: 4 * 60 * 1000,
        btime: 5 * 60 * 1000,
        winc: 2000,
        binc: 2000,
        status: "started",
      },
    },
  },
  {
    name: "Promotion",
    myColor: "white",
    latest: {
      type: "gameState",
      moves: "",
      wtime: 90_000,
      btime: 90_000,
      winc: 0,
      binc: 0,
      status: "started",
    },
    full: {
      type: "gameFull",
      id: "dev-promotion",
      rated: false,
      variant: { key: "standard", name: "Standard" },
      speed: "rapid",
      perf: { name: "Rapid" },
      clock: { initial: 90, increment: 0 },
      createdAt: Date.now(),
      white: { id: "dev-white", name: "Dev White", rating: 1500 },
      black: { id: "dev-black", name: "Dev Black", rating: 1500 },
      initialFen: "4k3/7P/8/8/8/8/8/4K3 w - - 0 1",
      state: {
        type: "gameState",
        moves: "",
        wtime: 90_000,
        btime: 90_000,
        winc: 0,
        binc: 0,
        status: "started",
      },
    },
  },
];

function cloneState(state: GameStateEvent): GameStateEvent {
  return { ...state };
}

function cloneFull(full: GameFullEvent, latest: GameStateEvent): GameFullEvent {
  return {
    ...full,
    variant: { ...full.variant },
    perf: { ...full.perf },
    clock: full.clock ? { ...full.clock } : undefined,
    white: { ...full.white },
    black: { ...full.black },
    state: cloneState(latest),
  };
}

function loadPresetState(
  presetIndex: number,
  myColorOverride?: "white" | "black",
): {
  presetIndex: number;
  myColor: "white" | "black";
  full: GameFullEvent;
  latest: GameStateEvent;
  anchor: number;
  submitError: string | null;
} {
  const preset = DEV_PRESETS[presetIndex]!;
  const latest = cloneState(preset.latest);
  return {
    presetIndex,
    myColor: myColorOverride ?? preset.myColor,
    full: cloneFull(preset.full, latest),
    latest,
    anchor: Date.now(),
    submitError: null,
  };
}

function splitMoves(moves: string): string[] {
  const trimmed = moves.trim();
  return trimmed.length === 0 ? [] : trimmed.split(/\s+/);
}

function buildGame(initialFen: string, moves: string): Game {
  const game = new Game(initialFen === "startpos" ? undefined : initialFen);
  game.syncMoves(splitMoves(moves));
  return game;
}

function finishedStateFor(game: Game, mover: "w" | "b"): {
  status: GameStatus;
  winner?: "white" | "black";
} {
  if (game.isCheckmate) {
    return {
      status: "mate",
      winner: mover === "w" ? "white" : "black",
    };
  }
  if (game.isStalemate) return { status: "stalemate" };
  if (game.isDraw) return { status: "draw" };
  return { status: "started" };
}

export function DevBoard(): React.ReactElement {
  const [state, setState] = useState(() => loadPresetState(0));

  const reset = (presetIndex = state.presetIndex, myColor = state.myColor) => {
    setState(loadPresetState(presetIndex, myColor));
  };

  useInput((input, key) => {
    if (!key.ctrl) return;

    if (input === "r") {
      reset();
    } else if (input === "p") {
      reset((state.presetIndex + 1) % DEV_PRESETS.length);
    } else if (input === "o") {
      reset(state.presetIndex, state.myColor === "white" ? "black" : "white");
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text dimColor>
          Dev board: {DEV_PRESETS[state.presetIndex]!.name} | Ctrl-R reset | Ctrl-P preset | Ctrl-O flip
        </Text>
      </Box>
      <InGame
        full={state.full}
        latest={state.latest}
        anchor={state.anchor}
        myColor={state.myColor}
        submitError={state.submitError}
        onMove={async (uci) => {
          const game = buildGame(state.full.initialFen, state.latest.moves);
          const mover = game.turn;
          const applied = game.applyMove(uci);
          if (applied === null) {
            setState((current) => ({
              ...current,
              submitError: `Illegal move in dev board: ${uci}`,
            }));
            return;
          }

          const now = Date.now();
          const elapsed = Math.max(0, now - state.anchor);
          const incrementMs = (state.full.clock?.increment ?? 0) * 1000;
          const { status, winner } = finishedStateFor(game, mover);
          const nextMoves = state.latest.moves.trim().length > 0
            ? `${state.latest.moves} ${uci}`
            : uci;
          const nextLatest: GameStateEvent = {
            ...state.latest,
            moves: nextMoves,
            wtime:
              mover === "w"
                ? Math.max(0, state.latest.wtime - elapsed + incrementMs)
                : state.latest.wtime,
            btime:
              mover === "b"
                ? Math.max(0, state.latest.btime - elapsed + incrementMs)
                : state.latest.btime,
            status,
            winner,
          };

          setState((current) => ({
            ...current,
            latest: nextLatest,
            full: cloneFull(current.full, nextLatest),
            anchor: now,
            submitError: null,
          }));
        }}
        onResign={async () => {
          setState((current) => ({
            ...current,
            submitError: "Dev board: resign is disabled. Use Ctrl-R to reset.",
          }));
        }}
        onOfferDraw={async () => {
          setState((current) => ({
            ...current,
            submitError: "Dev board: draw is disabled. Use Ctrl-R to reset.",
          }));
        }}
      />
    </Box>
  );
}
