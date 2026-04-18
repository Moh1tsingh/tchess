export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export type File = (typeof FILES)[number];
export type Rank = (typeof RANKS)[number];
export type SquareId = `${File}${Rank}`;

export function sq(file: number, rank: number): SquareId {
  return `${FILES[file]}${RANKS[rank]}` as SquareId;
}

export function fileIndex(square: string): number {
  return FILES.indexOf(square[0] as File);
}

export function rankIndex(square: string): number {
  return RANKS.indexOf(square[1] as Rank);
}

export function isLightSquare(file: number, rank: number): boolean {
  return (file + rank) % 2 === 1;
}
