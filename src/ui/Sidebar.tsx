import React from "react";
import { Box, Text } from "ink";

interface SidebarProps {
  moveHistorySan: string[];
  status: string;
  helpLines: string[];
  width: number;
  height: number;
}

export function Sidebar(props: SidebarProps): React.ReactElement {
  const pairs: { num: number; white: string; black: string | null }[] = [];
  for (let i = 0; i < props.moveHistorySan.length; i += 2) {
    pairs.push({
      num: i / 2 + 1,
      white: props.moveHistorySan[i] ?? "",
      black: props.moveHistorySan[i + 1] ?? null,
    });
  }
  const helpHeight = Math.max(4, props.helpLines.length + 1);
  const reservedLines = 2 + helpHeight;
  const maxMoveLines = Math.max(1, props.height - reservedLines);
  const recent = pairs.slice(-maxMoveLines);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      paddingX={1}
      width={props.width}
      height={props.height}
      overflow="hidden"
      justifyContent="space-between"
    >
      <Box flexDirection="column" overflowY="hidden">
        <Text bold>Moves</Text>
        {recent.length === 0 ? (
          <Text dimColor>(no moves yet)</Text>
        ) : (
          recent.map((p) => (
            <Text key={p.num} wrap="truncate-end">
              {p.num}. {p.white} {p.black ?? ""}
            </Text>
          ))
        )}
      </Box>
      <Box flexDirection="column">
        <Text dimColor wrap="wrap">
          {props.status}
        </Text>
        {props.helpLines.map((line) => (
          <Text key={line} dimColor wrap="wrap">
            {line}
          </Text>
        ))}
      </Box>
    </Box>
  );
}
