import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TIME_CONTROLS, type TimeControl } from "../lichess/events.js";

interface SeekMenuProps {
  onSeek: (tc: TimeControl, rated: boolean) => void;
  onQuit: () => void;
  username: string | null;
}

export function SeekMenu(props: SeekMenuProps): React.ReactElement {
  const [tcIdx, setTcIdx] = useState(0);
  const [rated, setRated] = useState(false);

  useInput((input, key) => {
    if (key.upArrow) setTcIdx((i) => (i + TIME_CONTROLS.length - 1) % TIME_CONTROLS.length);
    else if (key.downArrow) setTcIdx((i) => (i + 1) % TIME_CONTROLS.length);
    else if (input === "r" || key.leftArrow || key.rightArrow) setRated((v) => !v);
    else if (key.return) {
      const tc = TIME_CONTROLS[tcIdx];
      if (tc) props.onSeek(tc, rated);
    } else if (input === "q" || key.escape) props.onQuit();
  });

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={2} paddingY={1}>
      <Text bold>tchess — seek a game on Lichess</Text>
      {props.username && <Text dimColor>Signed in as {props.username}</Text>}
      <Box marginTop={1} flexDirection="column">
        <Text bold>Time control:</Text>
        {TIME_CONTROLS.map((tc, i) => (
          <Text key={tc.label} color={i === tcIdx ? "green" : undefined}>
            {i === tcIdx ? "▶ " : "  "}
            {tc.label}
          </Text>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text>
          Rated: <Text bold>{rated ? "yes" : "no"}</Text>{" "}
          <Text dimColor>(r to toggle)</Text>
        </Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text dimColor>Board API matchmaking supports rapid and classical seeks.</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text dimColor>↑/↓ pick time, Enter to seek, q to quit</Text>
      </Box>
    </Box>
  );
}
