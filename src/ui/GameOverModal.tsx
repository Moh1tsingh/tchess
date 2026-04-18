import React from "react";
import { Box, Text, useInput } from "ink";

interface GameOverModalProps {
  title: string;
  detail: string;
  onDismiss: () => void;
}

export function GameOverModal(props: GameOverModalProps): React.ReactElement {
  useInput(() => {
    props.onDismiss();
  });
  return (
    <Box borderStyle="double" borderColor="yellow" flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold color="yellow">
        {props.title}
      </Text>
      <Text>{props.detail}</Text>
      <Box marginTop={1}>
        <Text dimColor>Press any key to return to the menu…</Text>
      </Box>
    </Box>
  );
}
