import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";

interface ClockProps {
  label: string;
  /** Server-authoritative remaining time in ms. */
  ms: number;
  /** Whose turn is it to run this clock? */
  running: boolean;
  /** Anchor time stamp that resets local tick. Changes whenever `ms` is freshly set by the server. */
  anchor: number;
  active: boolean;
  width?: number;
  height?: number;
  compact?: boolean;
}

function formatClock(ms: number): string {
  const sign = ms < 0 ? "-" : "";
  const abs = Math.max(0, ms);
  const totalSec = Math.floor(abs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${sign}${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  if (abs < 10_000) {
    const deci = Math.floor((abs % 1000) / 100);
    return `${sign}${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${deci}`;
  }
  return `${sign}${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function Clock(props: ClockProps): React.ReactElement {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!props.running) return;
    const id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, [props.running, props.anchor]);

  const elapsed = props.running ? Date.now() - props.anchor : 0;
  const remaining = props.ms - elapsed;
  const low = remaining < 20_000;
  const crit = remaining < 10_000;

  return (
    <Box
      borderStyle={props.active ? "bold" : "round"}
      borderColor={crit ? "red" : low ? "yellow" : props.active ? "green" : "gray"}
      paddingX={props.compact ? 0 : 1}
      minWidth={12}
      width={props.width}
      height={props.height}
      flexDirection="column"
      overflow="hidden"
    >
      {props.compact ? (
        <Text wrap="truncate-end">
          <Text bold color={crit ? "red" : undefined}>
            {formatClock(remaining)}
          </Text>{" "}
          <Text dimColor>{props.label}</Text>
        </Text>
      ) : (
        <>
          <Text dimColor wrap="truncate-end">
            {props.label}
          </Text>
          <Text bold color={crit ? "red" : undefined}>
            {formatClock(remaining)}
          </Text>
        </>
      )}
    </Box>
  );
}

interface ClockPanelProps {
  whiteMs: number;
  blackMs: number;
  anchor: number;
  turn: "w" | "b";
  whiteName: string;
  blackName: string;
  player: "white" | "black";
  width: number;
  clockHeight: number;
  compact?: boolean;
}

export function ClockPanel(props: ClockPanelProps): React.ReactElement {
  if (props.player === "white") {
    return (
      <Clock
        label={props.whiteName}
        ms={props.whiteMs}
        anchor={props.anchor}
        running={props.turn === "w"}
        active={props.turn === "w"}
        width={props.width}
        height={props.clockHeight}
        compact={props.compact}
      />
    );
  }

  return (
    <Clock
      label={props.blackName}
      ms={props.blackMs}
      anchor={props.anchor}
      running={props.turn === "b"}
      active={props.turn === "b"}
      width={props.width}
      height={props.clockHeight}
      compact={props.compact}
    />
  );
}
