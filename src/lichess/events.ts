export type Color = "white" | "black";

export interface Player {
  id?: string;
  name?: string;
  title?: string | null;
  rating?: number;
  provisional?: boolean;
  aiLevel?: number;
}

export interface GameStateEvent {
  type: "gameState";
  moves: string;
  wtime: number;
  btime: number;
  winc: number;
  binc: number;
  status: GameStatus;
  winner?: Color;
  wdraw?: boolean;
  bdraw?: boolean;
}

export interface GameFullEvent {
  type: "gameFull";
  id: string;
  rated: boolean;
  variant: { key: string; name: string };
  speed: string;
  perf: { name: string };
  clock?: { initial: number; increment: number };
  createdAt: number;
  white: Player;
  black: Player;
  initialFen: string;
  state: GameStateEvent;
}

export interface ChatLineEvent {
  type: "chatLine";
  username: string;
  text: string;
  room: "player" | "spectator";
}

export interface OpponentGoneEvent {
  type: "opponentGone";
  gone: boolean;
  claimWinInSeconds?: number;
}

export type GameStreamEvent =
  | GameFullEvent
  | GameStateEvent
  | ChatLineEvent
  | OpponentGoneEvent;

export type GameStatus =
  | "created"
  | "started"
  | "aborted"
  | "mate"
  | "resign"
  | "stalemate"
  | "timeout"
  | "draw"
  | "outoftime"
  | "cheat"
  | "noStart"
  | "unknownFinish"
  | "variantEnd";

export const FINISHED_STATUSES = new Set<GameStatus>([
  "aborted",
  "mate",
  "resign",
  "stalemate",
  "timeout",
  "draw",
  "outoftime",
  "cheat",
  "noStart",
  "unknownFinish",
  "variantEnd",
]);

export interface GameStartEvent {
  type: "gameStart";
  game: {
    id: string;
    fullId?: string;
    color: Color;
    fen: string;
    opponent?: { id?: string; username?: string; rating?: number };
    isMyTurn: boolean;
    lastMove?: string;
    perf?: string;
    rated?: boolean;
    secondsLeft?: number;
    source?: string;
    speed?: string;
    variant?: { key: string; name: string };
  };
}

export interface GameFinishEvent {
  type: "gameFinish";
  game: { id: string; winner?: Color; status?: GameStatus };
}

export interface ChallengeEvent {
  type: "challenge";
  challenge: { id: string };
}

export type AccountEvent =
  | GameStartEvent
  | GameFinishEvent
  | ChallengeEvent
  | { type: string; [k: string]: unknown };

export interface SeekParams {
  time: number;
  increment: number;
  rated: boolean;
  variant?: string;
  color?: "random" | "white" | "black";
  ratingRange?: string;
}

export interface TimeControl {
  label: string;
  time: number;
  increment: number;
}

export const TIME_CONTROLS: TimeControl[] = [
  { label: "Rapid 10+0", time: 10, increment: 0 },
  { label: "Rapid 15+10", time: 15, increment: 10 },
  { label: "Classical 30+0", time: 30, increment: 0 },
  { label: "Classical 45+15", time: 45, increment: 15 },
];
