import { describe, expect, it } from "vitest";
import { computeInGameLayout } from "./layout.js";

describe("computeInGameLayout", () => {
  it("prioritizes a large board on roomy terminals", () => {
    const layout = computeInGameLayout(120, 30);
    expect(layout.playable).toBe(true);
    expect(layout.mode).toBe("side");
    expect(layout.boardSquareHeight).toBeGreaterThanOrEqual(3);
    expect(layout.sidebarWidth).toBeGreaterThanOrEqual(22);
  });

  it("drops coordinates when that allows a larger board", () => {
    const layout = computeInGameLayout(56, 18);
    expect(layout.playable).toBe(true);
    expect(layout.showCoordinates).toBe(false);
  });

  it("switches to stacked mode on narrower terminals when board size is not worse", () => {
    const layout = computeInGameLayout(80, 36);
    expect(layout.playable).toBe(true);
    expect(layout.mode).toBe("stacked");
  });

  it("reports unplayable sizes when the layout cannot fit", () => {
    const layout = computeInGameLayout(30, 10);
    expect(layout.playable).toBe(false);
  });
});
