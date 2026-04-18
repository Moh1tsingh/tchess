import React, { useEffect, useRef, useState } from "react";
import { Box, Text, useApp, useStdout } from "ink";
import { DevBoard } from "./DevBoard.js";
import { InGame } from "./InGame.js";
import type { Screen } from "./state.js";
import { GameOverModal } from "../ui/GameOverModal.js";
import { SeekMenu } from "../ui/SeekMenu.js";
import { Seeking } from "../ui/Seeking.js";
import { TokenSetupFlow } from "../ui/TokenSetupFlow.js";
import {
  LichessError,
  createSeek,
  getAccount,
  offerDraw,
  resign,
  streamEvents,
  streamGame,
  submitMove,
} from "../lichess/client.js";
import { loadConfig, saveConfig } from "../lichess/config.js";
import { FINISHED_STATUSES, type GameFullEvent, type GameStateEvent, type GameStatus } from "../lichess/events.js";

interface Session {
  token: string;
  username: string;
}

interface ActiveGame {
  id: string;
  myColor: "white" | "black";
}

interface StartedGamePayload {
  id: string;
  color: "white" | "black";
}

const MIN_WIDTH = 46;
const MIN_HEIGHT = 14;

const STATUS_LABELS: Record<GameStatus, string> = {
  created: "Game created",
  started: "Game started",
  aborted: "Game aborted",
  mate: "Checkmate",
  resign: "Resignation",
  stalemate: "Stalemate",
  timeout: "Timeout",
  draw: "Draw",
  outoftime: "Flag fall",
  cheat: "Cheat detection",
  noStart: "No start",
  unknownFinish: "Finished",
  variantEnd: "Variant end",
};

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function isStartedGamePayload(value: unknown): value is StartedGamePayload {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { id?: unknown; color?: unknown };
  return (
    typeof candidate.id === "string" &&
    (candidate.color === "white" || candidate.color === "black")
  );
}

function formatError(error: unknown): string {
  if (error instanceof LichessError) {
    if (
      error.status === 400 &&
      error.message.toLowerCase().includes("invalid time control")
    ) {
      return "Lichess Board API matchmaking only accepts rapid/classical time controls.";
    }
    if (error.status === 401) return "Lichess rejected the token. Check that it has board:play scope.";
    if (error.status === 429) return "Lichess rate-limited the request. Wait a moment and try again.";
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

function playerName(player: GameFullEvent["white"], fallback: string): string {
  return player.name ?? player.id ?? fallback;
}

function describeOutcome(
  full: GameFullEvent,
  latest: GameStateEvent,
  myColor: "white" | "black",
): { title: string; detail: string } {
  const white = playerName(full.white, "White");
  const black = playerName(full.black, "Black");
  const reason = STATUS_LABELS[latest.status];

  if (latest.winner) {
    return {
      title: latest.winner === myColor ? "You won" : "You lost",
      detail: `${white} vs ${black} · ${reason}.`,
    };
  }

  if (latest.status === "aborted") {
    return {
      title: "Game aborted",
      detail: `${white} vs ${black} · ${reason}.`,
    };
  }

  return {
    title: "Game drawn",
    detail: `${white} vs ${black} · ${reason}.`,
  };
}

export function App(): React.ReactElement {
  if (isDevBoardMode()) {
    return <DevBoard />;
  }

  return <LiveApp />;
}

function LiveApp(): React.ReactElement {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [session, setSession] = useState<Session | null>(null);
  const [screen, setScreen] = useState<Screen>({ kind: "loading" });
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const seekControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const config = await loadConfig();
        if (!config) {
          if (!cancelled) setScreen({ kind: "token-setup", error: null });
          return;
        }

        const account = await getAccount(config.token);
        if (!account) {
          if (!cancelled) {
            setSession(null);
            setScreen({
              kind: "token-setup",
              error: "Saved token was rejected. Paste a Lichess token with board:play scope.",
            });
          }
          return;
        }

        if (!cancelled) {
          setSession({ token: config.token, username: account.username });
          setScreen({
            kind: "menu",
            username: account.username,
            message: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setSession(null);
          setScreen({
            kind: "token-setup",
            error: `Could not load config: ${formatError(error)}`,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();

    void (async () => {
      try {
        for await (const event of streamEvents(session.token, controller.signal)) {
          if (event.type !== "gameStart" || !isStartedGamePayload(event.game)) continue;

          seekControllerRef.current?.abort();
          seekControllerRef.current = null;
          setSubmitError(null);
          setActiveGame({
            id: event.game.id,
            myColor: event.game.color,
          });
          setScreen({ kind: "loading" });
        }
      } catch (error) {
        if (isAbortError(error)) return;

        if (error instanceof LichessError && error.status === 401) {
          setSession(null);
          setActiveGame(null);
          setScreen({
            kind: "token-setup",
            error: "Lichess rejected the saved token. Paste a new one with board:play scope.",
          });
          return;
        }

        setScreen({
          kind: "menu",
          username: session.username,
          message: `Event stream error: ${formatError(error)}`,
        });
      }
    })();

    return () => controller.abort();
  }, [session]);

  useEffect(() => {
    if (!session || !activeGame) return;
    const controller = new AbortController();
    let fullEvent: GameFullEvent | null = null;

    void (async () => {
      try {
        for await (const event of streamGame(session.token, activeGame.id, controller.signal)) {
          if (event.type === "gameFull") {
            fullEvent = event;
            setSubmitError(null);
            setScreen({
              kind: "in-game",
              gameId: activeGame.id,
              myColor: activeGame.myColor,
              full: event,
              latest: event.state,
              anchor: Date.now(),
            });

            if (FINISHED_STATUSES.has(event.state.status)) {
              setActiveGame(null);
              setScreen({
                kind: "game-over",
                ...describeOutcome(event, event.state, activeGame.myColor),
              });
              return;
            }
            continue;
          }

          if (event.type !== "gameState" || fullEvent === null) continue;

          setScreen({
            kind: "in-game",
            gameId: activeGame.id,
            myColor: activeGame.myColor,
            full: fullEvent,
            latest: event,
            anchor: Date.now(),
          });

          if (FINISHED_STATUSES.has(event.status)) {
            setActiveGame(null);
            setScreen({
              kind: "game-over",
              ...describeOutcome(fullEvent, event, activeGame.myColor),
            });
            return;
          }
        }
      } catch (error) {
        if (isAbortError(error)) return;
        setActiveGame(null);
        setScreen({
          kind: "menu",
          username: session.username,
          message: `Game stream error: ${formatError(error)}`,
        });
      }
    })();

    return () => controller.abort();
  }, [activeGame, session]);

  const columns = stdout?.columns ?? 80;
  const rows = stdout?.rows ?? 24;

  if (columns < MIN_WIDTH || rows < MIN_HEIGHT) {
    return (
      <Box borderStyle="round" paddingX={2} paddingY={1} flexDirection="column">
        <Text bold>Terminal too small</Text>
        <Text>
          Resize to at least {MIN_WIDTH}x{MIN_HEIGHT}. Current size: {columns}x{rows}.
        </Text>
        <Text dimColor>Ctrl-C exits.</Text>
      </Box>
    );
  }

  return renderScreen({
    exit,
    screen,
    session,
    submitError,
    setScreen,
    setSession,
    setActiveGame,
    setSubmitError,
    seekControllerRef,
  });
}

function renderScreen(args: {
  exit: () => void;
  screen: Screen;
  session: Session | null;
  submitError: string | null;
  setScreen: React.Dispatch<React.SetStateAction<Screen>>;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  setActiveGame: React.Dispatch<React.SetStateAction<ActiveGame | null>>;
  setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
  seekControllerRef: React.MutableRefObject<AbortController | null>;
}): React.ReactElement {
  const {
    exit,
    screen,
    session,
    submitError,
    setScreen,
    setSession,
    setActiveGame,
    setSubmitError,
    seekControllerRef,
  } = args;

  if (screen.kind === "loading") {
    return (
      <Box borderStyle="round" paddingX={2} paddingY={1}>
        <Text>Loading tchess…</Text>
      </Box>
    );
  }

  if (screen.kind === "token-setup") {
    return (
      <TokenSetupFlow
        error={screen.error}
        onSubmit={(token) => {
          void (async () => {
            setScreen({ kind: "loading" });
            try {
              const account = await getAccount(token);
              if (!account) {
                setScreen({
                  kind: "token-setup",
                  error: "Lichess rejected that token. Check the value and board:play scope.",
                });
                return;
              }

              await saveConfig({ token });
              setSession({ token, username: account.username });
              setScreen({
                kind: "menu",
                username: account.username,
                message: "Token saved.",
              });
            } catch (error) {
              setScreen({
                kind: "token-setup",
                error: formatError(error),
              });
            }
          })();
        }}
      />
    );
  }

  if (screen.kind === "menu") {
    return (
      <Box flexDirection="column">
        <SeekMenu
          username={screen.username}
          onQuit={exit}
          onSeek={(tc, rated) => {
            if (!session) return;
            const controller = new AbortController();
            seekControllerRef.current = controller;
            setScreen({ kind: "seeking", tc, rated });
            void (async () => {
              try {
                await createSeek(
                  session.token,
                  {
                    time: tc.time,
                    increment: tc.increment,
                    rated,
                  },
                  controller.signal,
                );
              } catch (error) {
                if (isAbortError(error)) return;
                setScreen({
                  kind: "menu",
                  username: session.username,
                  message: formatError(error),
                });
              } finally {
                if (seekControllerRef.current === controller) {
                  seekControllerRef.current = null;
                }
              }
            })();
          }}
        />
        {screen.message && (
          <Box marginTop={1}>
            <Text color={screen.message.toLowerCase().includes("error") ? "red" : "yellow"}>
              {screen.message}
            </Text>
          </Box>
        )}
      </Box>
    );
  }

  if (screen.kind === "seeking") {
    return (
      <Seeking
        label={`${screen.tc.label} ${screen.rated ? "(rated)" : "(casual)"}`}
        onCancel={() => {
          seekControllerRef.current?.abort();
          seekControllerRef.current = null;
          setScreen({
            kind: "menu",
            username: session?.username ?? null,
            message: "Seek cancelled.",
          });
        }}
      />
    );
  }

  if (screen.kind === "in-game") {
    return (
      <InGame
        full={screen.full}
        latest={screen.latest}
        anchor={screen.anchor}
        myColor={screen.myColor}
        submitError={submitError}
        onMove={async (uci) => {
          if (!session) return;
          setSubmitError(null);
          try {
            await submitMove(session.token, screen.gameId, uci);
          } catch (error) {
            setSubmitError(formatError(error));
          }
        }}
        onResign={async () => {
          if (!session) return;
          setSubmitError(null);
          try {
            await resign(session.token, screen.gameId);
          } catch (error) {
            setSubmitError(formatError(error));
          }
        }}
        onOfferDraw={async () => {
          if (!session) return;
          setSubmitError(null);
          try {
            await offerDraw(session.token, screen.gameId, true);
          } catch (error) {
            setSubmitError(formatError(error));
          }
        }}
      />
    );
  }

  return (
    <GameOverModal
      title={screen.title}
      detail={screen.detail}
      onDismiss={() => {
        setActiveGame(null);
        setSubmitError(null);
        setScreen({
          kind: "menu",
          username: session?.username ?? null,
          message: null,
        });
      }}
    />
  );
}

function isDevBoardMode(): boolean {
  return process.argv.includes("--dev-board") || process.env.TCHESS_DEV_BOARD === "1";
}
