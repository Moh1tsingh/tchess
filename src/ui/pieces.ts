import type { Color as GameColor } from "../engine/game.js";

type ChessJsPiece = { type: "p" | "n" | "b" | "r" | "q" | "k"; color: "w" | "b" };

const WHITE_GLYPHS: Record<ChessJsPiece["type"], string> = {
  k: "♔",
  q: "♕",
  r: "♖",
  b: "♗",
  n: "♘",
  p: "♙",
};

export function pieceGlyph(piece: ChessJsPiece | null | undefined): string {
  if (!piece) return " ";
  return WHITE_GLYPHS[piece.type];
}

export function pieceColor(piece: ChessJsPiece | null | undefined): GameColor | null {
  return piece ? (piece.color as GameColor) : null;
}

export type { ChessJsPiece };
