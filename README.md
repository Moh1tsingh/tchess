# tchess

Keyboard-driven TUI chess client for Lichess, built with Ink and `chess.js`.

`tchess` is a terminal-first client for seeking and playing real games on Lichess without leaving your shell. It includes a local dev board mode so UI work can be tested without starting a live match every time.

## Features

- Board-first terminal layout that adapts to terminal resizing
- Lichess OAuth token setup with local config storage in `~/.tchess/config.json`
- Real-time board and clock sync from the Lichess Board API
- Keyboard navigation for piece selection and moves
- Promotion picker, resign, and draw offer actions
- Dev board mode for local UI iteration without a live game

## Requirements

- Node.js `>=20`
- A Lichess API token with `board:play` scope

## Install

After publish:

```bash
npm install -g tchess
```

Then run:

```bash
tchess
```

You can also run it without a global install:

```bash
npx tchess
```

## First Run

On first launch, `tchess` asks for a Lichess token and stores it at:

```text
~/.tchess/config.json
```

The file is written with `0600` permissions.

Create a token with:

- Scope: `board:play`
- Description: `tchess`

## Usage

```bash
tchess
```

Current live matchmaking support is limited to the time controls accepted by the Lichess Board API matchmaking flow.

## Controls

- `Arrow keys`: move cursor
- `Enter`: select piece / confirm move
- `Esc`: clear selection or cancel
- `r`: resign
- `d`: offer draw

Promotion mode:

- `Left/Right`: choose promotion piece
- `Enter`: confirm
- `Esc`: cancel

## Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Run the local dev board:

```bash
npm run dev:board
```

Dev board shortcuts:

- `Ctrl-R`: reset current preset
- `Ctrl-P`: switch preset
- `Ctrl-O`: flip orientation

Checks:

```bash
npm test
npm run typecheck
npm run build
```

## Publish

Before publishing:

```bash
npm run prepublishOnly
```

Dry-run the package contents:

```bash
npm pack
```

Publish:

```bash
npm publish
```

## Notes

- The terminal font matters. Some fonts render filled Unicode black chess pieces poorly, so `tchess` uses a stable glyph rendering strategy tuned for terminal compatibility.
- Terminal resizing is supported during a game; the board layout recalculates automatically.
