# tchess

Keyboard-driven TUI chess client for Lichess, built with Ink and `chess.js`.

`tchess` is a terminal-first client for seeking and playing real games on Lichess without leaving your shell.

## Features

- Board-first terminal layout that adapts to terminal resizing
- Lichess OAuth token setup with local config storage in `~/.tchess/config.json`
- Real-time board and clock sync from the Lichess Board API
- Keyboard navigation for piece selection and moves
- Promotion picker, resign, and draw offer actions

## Requirements

- Node.js `>=20`
- A Lichess API token with `board:play` scope

## Install

Published package name:

```bash
term-chess
```

Install globally:

```bash
npm install -g term-chess
```

Then run:

```bash
tchess
```

You can also run it without a global install:

```bash
npx term-chess
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

## Local Setup

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Run checks:

```bash
npm test
npm run typecheck
npm run build
```

## Contributing

If you want to contribute:

1. Fork the repo.
2. Create a branch for your change.
3. Run the local checks before opening a PR.
4. Include screenshots or terminal recordings for UI/layout changes.

For UI work, there is also a local dev board so you do not need to start a live Lichess match every time:

```bash
npm run dev:board
```

Dev board shortcuts:

- `Ctrl-R`: reset current preset
- `Ctrl-P`: switch preset
- `Ctrl-O`: flip orientation

## Notes

- The terminal font matters. Some fonts render filled Unicode black chess pieces poorly, so `tchess` uses a stable glyph rendering strategy tuned for terminal compatibility.
