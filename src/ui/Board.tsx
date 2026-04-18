import React from "react";
import { Box, Text } from "ink";
import { Square } from "./Square.js";
import { FILES, RANKS, isLightSquare, sq } from "./squares.js";
import type { ChessJsPiece } from "./pieces.js";

interface BoardProps {
  board: (ChessJsPiece | null)[][]; // chess.js board(): row[0] = rank 8, row[7] = rank 1
  orientation: "white" | "black";
  cellWidth: number;
  cellHeight: number;
  showCoordinates: boolean;
  cursor: string; // e.g. "e4"
  selected: string | null;
  legalDestinations: string[];
  lastMove: { from: string; to: string } | null;
  kingInCheck: string | null;
}

export function Board(props: BoardProps): React.ReactElement {
  const flipped = props.orientation === "black";
  const friendlyColor = props.orientation === "white" ? "w" : "b";
  const boardWidth = props.cellWidth * 8 + (props.showCoordinates ? 2 : 0);
  // chess.js board() returns 8 rows where row 0 = rank 8.
  // We want rows rendered top-to-bottom as the player sees them.
  const displayRanks = flipped ? [...RANKS] : [...RANKS].reverse();
  const displayFiles = flipped ? [...FILES].reverse() : [...FILES];

  return (
    <Box flexDirection="column" width={boardWidth} alignItems="flex-start">
      {displayRanks.map((rank) => {
        const rankIdx = RANKS.indexOf(rank);
        const boardRow = props.board[7 - rankIdx] ?? [];
        return (
          <Box key={rank} flexDirection="row" height={props.cellHeight}>
            {props.showCoordinates && (
              <Box width={2} height={props.cellHeight} justifyContent="center">
                <Text dimColor>{rank} </Text>
              </Box>
            )}
            {displayFiles.map((file) => {
              const fileIdx = FILES.indexOf(file);
              const square = sq(fileIdx, rankIdx);
              const piece = boardRow[fileIdx] ?? null;
              const isLast =
                props.lastMove !== null &&
                (props.lastMove.from === square || props.lastMove.to === square);
              return (
                <Square
                  key={file}
                  piece={piece}
                  friendly={piece?.color === friendlyColor}
                  width={props.cellWidth}
                  height={props.cellHeight}
                  light={isLightSquare(fileIdx, rankIdx)}
                  cursor={props.cursor === square}
                  selected={props.selected === square}
                  legalMove={props.legalDestinations.includes(square)}
                  lastMove={isLast}
                  inCheck={props.kingInCheck === square}
                />
              );
            })}
          </Box>
        );
      })}
      {props.showCoordinates && (
        <Box flexDirection="row">
          <Box width={2} />
          {displayFiles.map((file) => (
            <Box key={file} width={props.cellWidth} justifyContent="center">
              <Text dimColor>{file}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
