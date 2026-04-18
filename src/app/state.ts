import type { GameFullEvent, GameStateEvent, TimeControl } from "../lichess/events.js";

export type Screen =
  | { kind: "loading" }
  | { kind: "token-setup"; error: string | null }
  | { kind: "menu"; username: string | null; message: string | null }
  | { kind: "seeking"; tc: TimeControl; rated: boolean }
  | {
      kind: "in-game";
      gameId: string;
      myColor: "white" | "black";
      full: GameFullEvent;
      latest: GameStateEvent;
      anchor: number;
    }
  | { kind: "game-over"; title: string; detail: string };

export interface ConfirmState {
  kind: "resign" | "draw";
  message: string;
}
