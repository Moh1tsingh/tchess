import React from "react";
import { Box, Text } from "ink";
import { pieceGlyph, type ChessJsPiece } from "./pieces.js";

interface SquareProps {
  piece: ChessJsPiece | null;
  friendly: boolean;
  width: number;
  height: number;
  light: boolean;
  cursor: boolean;
  selected: boolean;
  legalMove: boolean;
  lastMove: boolean;
  inCheck: boolean;
}

const LIGHT_BG = "#f0d9b5";
const DARK_BG = "#b58863";
const CURSOR_BG = "#7fa650";
const SELECTED_BG = "#b9ca43";
const LAST_MOVE_BG_LIGHT = "#cdd26a";
const LAST_MOVE_BG_DARK = "#aaa23a";
const CHECK_BG = "#cc3333";

function bgFor(props: SquareProps): string {
  if (props.inCheck) return CHECK_BG;
  if (props.cursor) return CURSOR_BG;
  if (props.selected) return SELECTED_BG;
  if (props.lastMove) return props.light ? LAST_MOVE_BG_LIGHT : LAST_MOVE_BG_DARK;
  return props.light ? LIGHT_BG : DARK_BG;
}

export function Square(props: SquareProps): React.ReactElement {
  const bg = bgFor(props);
  const hasPiece = props.piece !== null;
  const glyph = pieceGlyph(props.piece);
  const pieceFg = pieceFgFor(props.piece, props.light, props.friendly);
  let contentColor = pieceFg;
  let bold = hasPiece && props.friendly;
  const rowContents = new Map<number, string>();

  if (props.legalMove && !hasPiece) {
    contentColor = props.light ? "#3a2f1f" : "#fff4df";
    for (const marker of buildEmptyMoveMarker(props.width, props.height)) {
      rowContents.set(marker.row, marker.text);
    }
  } else if (props.legalMove && hasPiece) {
    const content = props.width >= 5 ? "╳" : "×";
    contentColor = "#111111";
    bold = true;
    rowContents.set(middleRowForHeight(props.height), centerText(content, props.width));
  } else {
    rowContents.set(middleRowForHeight(props.height), centerText(glyph, props.width));
  }

  const blankLine = " ".repeat(props.width);

  return (
    <Box
      flexDirection="column"
      width={props.width}
      height={props.height}
      flexShrink={0}
    >
      {Array.from({ length: props.height }, (_, row) => (
        <Text
          key={row}
          backgroundColor={bg}
          color={rowContents.has(row) ? contentColor : undefined}
          bold={rowContents.has(row) ? bold : undefined}
        >
          {rowContents.get(row) ?? blankLine}
        </Text>
      ))}
    </Box>
  );
}

function middleRowForHeight(height: number): number {
  return Math.floor((height - 1) / 2);
}

function centerText(text: string, width: number): string {
  const glyphCount = [...text].length;
  if (glyphCount >= width) return text;
  const left = Math.floor((width - glyphCount) / 2);
  const right = width - glyphCount - left;
  return `${" ".repeat(left)}${text}${" ".repeat(right)}`;
}

function pieceFgFor(
  piece: ChessJsPiece | null,
  light: boolean,
  friendly: boolean,
): string {
  if (!piece) return light ? "#000000" : "#ffffff";

  if (piece.color === "w") {
    if (friendly) {
      return light ? "#aeb8cb" : "#fffdf8";
    }
    return light ? "#8d98ad" : "#d7dce8";
  }

  return friendly
    ? "#120d09"
    : light
      ? "#5b4938"
      : "#3c2e24";
}

function buildEmptyMoveMarker(width: number, height: number): Array<{ row: number; text: string }> {
  const middle = middleRowForHeight(height);

  if (width >= 6 && height >= 5) {
    return [
      { row: middle - 1, text: centerText("╭─╮", width) },
      { row: middle, text: centerText("│·│", width) },
      { row: middle + 1, text: centerText("╰─╯", width) },
    ].filter((entry) => entry.row >= 0 && entry.row < height);
  }

  if (width >= 4 && height >= 3) {
    return [{ row: middle, text: centerText("◉", width) }];
  }

  return [{ row: middle, text: centerText("•", width) }];
}
