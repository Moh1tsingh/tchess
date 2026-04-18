import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

interface TokenSetupFlowProps {
  onSubmit: (token: string) => void;
  error: string | null;
}

const TOKEN_URL =
  "https://lichess.org/account/oauth/token/create?scopes=board:play&description=tchess";

export function TokenSetupFlow(props: TokenSetupFlowProps): React.ReactElement {
  const [input, setInput] = useState("");

  useInput((ch, key) => {
    if (key.return) {
      const trimmed = input.trim();
      if (trimmed.length > 0) props.onSubmit(trimmed);
    } else if (key.backspace || key.delete) {
      setInput((s) => s.slice(0, -1));
    } else if (key.ctrl && ch === "u") {
      setInput("");
    } else if (ch && !key.escape && !key.tab) {
      // accept printable chars
      setInput((s) => s + ch);
    }
  });

  const masked = input.length === 0 ? "" : "•".repeat(Math.min(input.length, 40));

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={2} paddingY={1}>
      <Text bold>Welcome to tchess</Text>
      <Box marginTop={1} flexDirection="column">
        <Text>To play real games on Lichess you need a personal API token.</Text>
        <Box marginTop={1} flexDirection="column">
          <Text>1. Open this URL in your browser:</Text>
          <Text color="cyan">   {TOKEN_URL}</Text>
          <Text>
            2. Log in if needed, then click <Text bold>Create</Text>.
          </Text>
          <Text>3. Copy the token and paste it here. Press Enter.</Text>
        </Box>
      </Box>
      <Box marginTop={1}>
        <Text>Token: </Text>
        <Text color="yellow">{masked}</Text>
        <Text>
          <Text dimColor>{input.length > 0 ? "" : "_"}</Text>
        </Text>
      </Box>
      {props.error && (
        <Box marginTop={1}>
          <Text color="red">{props.error}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text dimColor>Ctrl-U to clear, Enter to submit</Text>
      </Box>
    </Box>
  );
}
