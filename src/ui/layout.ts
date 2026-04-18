export interface InGameLayout {
  mode: "side" | "stacked";
  boardSquareWidth: number;
  boardSquareHeight: number;
  boardWidth: number;
  boardHeight: number;
  sidebarWidth: number;
  sidebarHeight: number;
  clockWidth: number;
  clockHeight: number;
  showCoordinates: boolean;
  playable: boolean;
}

const FILE_LABEL_HEIGHT = 1;
const RANK_LABEL_WIDTH = 2;
const COLUMN_GAP = 2;
const ROW_GAP = 1;
const SIDE_CLOCK_HEIGHT = 4;
const STACKED_CLOCK_HEIGHT = 3;
const SQUARE_WIDTH_FACTOR = 2;
const MIN_RAIL_WIDTH = 22;
const MIN_CLOCK_WIDTH = 18;
const MIN_SIDEBAR_WIDTH = 24;
const MIN_MOVES_HEIGHT = 6;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function boardWidth(squareHeight: number, showCoordinates: boolean): number {
  return 8 * squareHeight * SQUARE_WIDTH_FACTOR + (showCoordinates ? RANK_LABEL_WIDTH : 0);
}

function boardHeight(squareHeight: number, showCoordinates: boolean): number {
  return 8 * squareHeight + (showCoordinates ? FILE_LABEL_HEIGHT : 0);
}

function computeSideCandidate(
  columns: number,
  rows: number,
  showCoordinates: boolean,
): InGameLayout | null {
  const availableBoardWidth = columns - MIN_RAIL_WIDTH - COLUMN_GAP;
  const maxByWidth = Math.floor(
    (availableBoardWidth - (showCoordinates ? RANK_LABEL_WIDTH : 0)) / (8 * SQUARE_WIDTH_FACTOR),
  );
  const maxByHeight = Math.floor(
    (rows - (showCoordinates ? FILE_LABEL_HEIGHT : 0)) / 8,
  );
  const squareHeight = Math.min(maxByWidth, maxByHeight);
  if (squareHeight < 1) return null;

  const width = boardWidth(squareHeight, showCoordinates);
  const sidebarWidth = columns - width - COLUMN_GAP;
  if (sidebarWidth < MIN_RAIL_WIDTH) return null;

  const sidebarHeight = rows - SIDE_CLOCK_HEIGHT * 2 - ROW_GAP * 2;
  if (sidebarHeight < MIN_MOVES_HEIGHT) return null;

  return {
    mode: "side",
    boardSquareWidth: squareHeight * SQUARE_WIDTH_FACTOR,
    boardSquareHeight: squareHeight,
    boardWidth: width,
    boardHeight: boardHeight(squareHeight, showCoordinates),
    sidebarWidth,
    sidebarHeight,
    clockWidth: sidebarWidth,
    clockHeight: SIDE_CLOCK_HEIGHT,
    showCoordinates,
    playable: true,
  };
}

function computeStackedCandidate(
  columns: number,
  rows: number,
  showCoordinates: boolean,
): InGameLayout | null {
  const minBottomHeight = STACKED_CLOCK_HEIGHT * 2 + ROW_GAP;
  const availableBoardHeight = rows - minBottomHeight - ROW_GAP;
  if (availableBoardHeight <= 0) return null;

  const maxByWidth = Math.floor(
    (columns - (showCoordinates ? RANK_LABEL_WIDTH : 0)) / (8 * SQUARE_WIDTH_FACTOR),
  );
  const maxByHeight = Math.floor(
    (availableBoardHeight - (showCoordinates ? FILE_LABEL_HEIGHT : 0)) / 8,
  );
  const squareHeight = Math.min(maxByWidth, maxByHeight);
  if (squareHeight < 1) return null;

  const width = boardWidth(squareHeight, showCoordinates);
  const height = boardHeight(squareHeight, showCoordinates);
  const sidebarHeight = rows - height - ROW_GAP;
  if (sidebarHeight < minBottomHeight) return null;

  const clockWidth = Math.max(
    MIN_CLOCK_WIDTH,
    Math.floor((columns - COLUMN_GAP) * 0.4),
  );
  const sidebarWidth = columns - clockWidth - COLUMN_GAP;
  if (sidebarWidth < MIN_SIDEBAR_WIDTH) return null;

  return {
    mode: "stacked",
    boardSquareWidth: squareHeight * SQUARE_WIDTH_FACTOR,
    boardSquareHeight: squareHeight,
    boardWidth: width,
    boardHeight: height,
    sidebarWidth,
    sidebarHeight,
    clockWidth,
    clockHeight: STACKED_CLOCK_HEIGHT,
    showCoordinates,
    playable: true,
  };
}

function chooseBest(candidates: Array<InGameLayout | null>): InGameLayout | null {
  return candidates
    .filter((value): value is InGameLayout => value !== null)
    .sort((a, b) => {
      if (b.boardSquareHeight !== a.boardSquareHeight) {
        return b.boardSquareHeight - a.boardSquareHeight;
      }
      if (a.showCoordinates !== b.showCoordinates) {
        return a.showCoordinates ? -1 : 1;
      }
      if (a.mode !== b.mode) {
        return a.mode === "stacked" ? -1 : 1;
      }
      return b.boardWidth - a.boardWidth;
    })[0] ?? null;
}

export function computeInGameLayout(columns: number, rows: number): InGameLayout {
  const side = chooseBest([
    computeSideCandidate(columns, rows, true),
    computeSideCandidate(columns, rows, false),
  ]);
  const stacked = chooseBest([
    computeStackedCandidate(columns, rows, true),
    computeStackedCandidate(columns, rows, false),
  ]);

  if (stacked && (!side || stacked.boardSquareHeight > side.boardSquareHeight)) {
    return stacked;
  }

  if (stacked && side && columns < 130 && stacked.boardSquareHeight >= side.boardSquareHeight) {
    return stacked;
  }

  if (side) return side;
  if (stacked) return stacked;

  return {
    mode: "side",
    boardSquareWidth: 0,
    boardSquareHeight: 0,
    boardWidth: 0,
    boardHeight: 0,
    sidebarWidth: 0,
    sidebarHeight: 0,
    clockWidth: 0,
    clockHeight: SIDE_CLOCK_HEIGHT,
    showCoordinates: false,
    playable: false,
  };
}
