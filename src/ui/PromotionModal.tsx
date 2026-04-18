import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { PromotionPiece } from "../engine/game.js";

interface PromotionModalProps {
  color: "w" | "b";
  onPick: (piece: PromotionPiece) => void;
  onCancel: () => void;
}

const CHOICES: { piece: PromotionPiece; label: string; white: string; black: string }[] = [
  { piece: "q", label: "Queen", white: "♕", black: "♛" },
  { piece: "r", label: "Rook", white: "♖", black: "♜" },
  { piece: "b", label: "Bishop", white: "♗", black: "♝" },
  { piece: "n", label: "Knight", white: "♘", black: "♞" },
];

export function PromotionModal(props: PromotionModalProps): React.ReactElement {
  const [idx, setIdx] = useState(0);

  useInput((input, key) => {
    if (key.leftArrow) setIdx((i) => (i + CHOICES.length - 1) % CHOICES.length);
    else if (key.rightArrow) setIdx((i) => (i + 1) % CHOICES.length);
    else if (key.return) {
      const choice = CHOICES[idx];
      if (choice) props.onPick(choice.piece);
    } else if (key.escape) props.onCancel();
    else {
      const letter = input.toLowerCase();
      const match = CHOICES.find((c) => c.piece === letter);
      if (match) props.onPick(match.piece);
    }
  });

  return (
    <Box borderStyle="double" flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold>Promote pawn to:</Text>
      <Box marginTop={1}>
        {CHOICES.map((c, i) => (
          <Box
            key={c.piece}
            borderStyle={i === idx ? "bold" : "round"}
            borderColor={i === idx ? "green" : "gray"}
            paddingX={1}
            marginRight={1}
          >
            <Text>
              {props.color === "w" ? c.white : c.black} {c.label}
            </Text>
          </Box>
        ))}
      </Box>
      <Text dimColor>← → to pick, Enter to confirm, q/r/b/n shortcut, Esc to cancel</Text>
    </Box>
  );
}
