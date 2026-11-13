# Contributing to Tamoti

Thanks for wanting to help. Bug reports, ideas and pull requests are all welcome.

## Reporting a bug or suggesting an idea

Open an [issue](https://github.com/Shabd0775-encrypt/tamoti/issues). For a bug, say what you did, what you expected and what happened, plus your browser and device. A screenshot or the board's link (it looks like `?p=8-12`) helps a lot.

## Making a change

1. Fork the repository and create a branch from `main`.
2. Install and run it locally (Node.js 22 or newer):

   ```bash
   npm install
   npm run dev
   ```

3. Make your change. Keep the game logic in `src/game/` free of React and drawing code, and add or update tests there when you change how the puzzle behaves.
4. Before opening a pull request, check that everything passes:

   ```bash
   npm run lint
   npm test -- --run
   npm run build
   ```

5. Open a pull request that explains what changed and why. For visual changes, include a before and after screenshot.

## Keeping the game calm

Tamoti is meant to be a quiet break, not an attention trap. Changes should keep to its principles, set out in [PRODUCT.md](PRODUCT.md):

- No pressure: no visible timers, fail states, penalties or streak guilt.
- The game never refuses a move. Pieces can overlap and turn freely on the board.
- Colours come only from the tokens in `src/styles/tokens.css`.
- Motion must respect `prefers-reduced-motion`, and everything must stay playable with the keyboard.

## The puzzle library

`src/game/library.json` is generated. Don't edit it by hand: change `scripts/build-library.ts` or the piece sets in `src/game/generate.ts`, then run `npm run build:library`.
