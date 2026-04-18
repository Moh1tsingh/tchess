import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";

interface SeekingProps {
  label: string;
  onCancel: () => void;
}

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function Seeking(props: SeekingProps): React.ReactElement {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 100);
    return () => clearInterval(id);
  }, []);

  useInput((input, key) => {
    if (input === "q" || key.escape) props.onCancel();
  });

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={2} paddingY={1}>
      <Text>
        <Text color="cyan">{FRAMES[frame]}</Text> Looking for a game: {props.label}
      </Text>
      <Text dimColor>q or Esc to cancel</Text>
    </Box>
  );
}
