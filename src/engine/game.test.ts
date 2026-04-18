import { describe, expect, it } from "vitest";
import { Game } from "./game.js";

describe("Game", () => {
  it("starts at the initial position", () => {
    const g = new Game();
    expect(g.turn).toBe("w");
    expect(g.isGameOver).toBe(false);
    expect(g.fen).toMatch(/^rnbqkbnr\/pppppppp/);
  });

  it("reports legal destinations from a square", () => {
    const g = new Game();
    const dests = g.legalDestinations("e2");
    expect(new Set(dests)).toEqual(new Set(["e3", "e4"]));
  });

  it("returns empty for a square with no piece or no moves", () => {
    const g = new Game();
    expect(g.legalDestinations("e4")).toEqual([]);
    expect(g.legalDestinations("a1")).toEqual([]);
  });

  it("applies a legal move by UCI", () => {
    const g = new Game();
    const move = g.applyMove("e2e4");
    expect(move?.san).toBe("e4");
    expect(g.turn).toBe("b");
  });

  it("rejects an illegal move without throwing", () => {
    const g = new Game();
    expect(g.applyMove("e2e5")).toBeNull();
    expect(g.turn).toBe("w");
  });

  it("detects a promotion candidate", () => {
    const g = new Game(
      "8/P7/8/8/8/8/8/4k2K w - - 0 1",
    );
    expect(g.isPromotion("a7", "a8")).toBe(true);
    expect(g.isPromotion("h1", "g1")).toBe(false);
  });

  it("applies a promotion move by UCI (e.g., a7a8q)", () => {
    const g = new Game("8/P7/8/8/8/8/8/4k2K w - - 0 1");
    const move = g.applyMove("a7a8q");
    expect(move?.san).toBe("a8=Q");
  });

  it("detects checkmate (fool's mate)", () => {
    const g = new Game();
    g.applyMove("f2f3");
    g.applyMove("e7e5");
    g.applyMove("g2g4");
    g.applyMove("d8h4");
    expect(g.isGameOver).toBe(true);
    expect(g.isCheckmate).toBe(true);
  });

  it("detects stalemate", () => {
    // Classic stalemate: black king on a8, white queen on c7, white king on c6, black to move
    const g = new Game("k7/2Q5/2K5/8/8/8/8/8 b - - 0 1");
    expect(g.isGameOver).toBe(true);
    expect(g.isStalemate).toBe(true);
    expect(g.isCheckmate).toBe(false);
  });

  it("loads from a FEN and reports correct turn", () => {
    const g = new Game(
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    );
    expect(g.turn).toBe("b");
  });

  it("tracks history as SAN", () => {
    const g = new Game();
    g.applyMove("e2e4");
    g.applyMove("e7e5");
    expect(g.historySan).toEqual(["e4", "e5"]);
  });

  it("syncMoves replays moves from UCI list (for server reconciliation)", () => {
    const g = new Game();
    g.syncMoves(["e2e4", "e7e5", "g1f3"]);
    expect(g.historySan).toEqual(["e4", "e5", "Nf3"]);
    expect(g.turn).toBe("b");
  });

  it("syncMoves preserves the initial FEN when replaying moves", () => {
    const g = new Game("8/P7/8/8/8/8/8/4k2K w - - 0 1");
    g.syncMoves(["a7a8q"]);
    expect(g.historySan).toEqual(["a8=Q"]);
    expect(g.fen).toMatch(/^Q7\/8\/8\/8\/8\/8\/8\/4k2K b/);
  });
});
