import { Chess, type Move, type Square } from "chess.js";

export type Color = "w" | "b";
export type PromotionPiece = "q" | "r" | "b" | "n";

export class Game {
  private chess: Chess;
  private readonly initialFen?: string;

  constructor(fen?: string) {
    this.initialFen = fen;
    this.chess = new Chess(fen);
  }

  get fen(): string {
    return this.chess.fen();
  }

  get turn(): Color {
    return this.chess.turn() as Color;
  }

  get isCheck(): boolean {
    return this.chess.inCheck();
  }

  get isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  get isStalemate(): boolean {
    return this.chess.isStalemate();
  }

  get isDraw(): boolean {
    return this.chess.isDraw();
  }

  get isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  get historySan(): string[] {
    return this.chess.history();
  }

  board() {
    return this.chess.board();
  }

  legalDestinations(from: string): string[] {
    const moves = this.chess.moves({
      square: from as Square,
      verbose: true,
    }) as Move[];
    return Array.from(new Set(moves.map((m) => m.to)));
  }

  isPromotion(from: string, to: string): boolean {
    const moves = this.chess.moves({
      square: from as Square,
      verbose: true,
    }) as Move[];
    return moves.some((m) => m.to === to && m.promotion !== undefined);
  }

  applyMove(uci: string): Move | null {
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length >= 5 ? (uci[4] as PromotionPiece) : undefined;
    try {
      return this.chess.move({ from, to, ...(promotion ? { promotion } : {}) });
    } catch {
      return null;
    }
  }

  syncMoves(uciList: string[]): void {
    this.chess = new Chess(this.initialFen);
    for (const uci of uciList) {
      if (this.applyMove(uci) === null) {
        throw new Error(`Cannot replay UCI move: ${uci}`);
      }
    }
  }
}
