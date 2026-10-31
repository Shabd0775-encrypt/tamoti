# Tamoti

A calm tiling puzzle. Fill every open square of the board with the pieces you are given: no timer, no score, only a quiet board for as long as you like.

The site is painted like a Japanese ink-and-watercolour scroll: cherry blossom, misty mountains in alpine glow, a lake, and a long painting that unrolls as you scroll.

## Playing

- **Puzzle library:** 24 boards for each size from 5×5 to 10×10, from gentle to deep. Every one is checked to have a solution, and only a few.
- **Today's board:** one puzzle a day, the same for everyone.
- Drag pieces onto the board, or play with the keyboard. Pieces can overlap while you think, and turn freely.
- Progress and found solutions are kept in your browser.

## Running it

You need [Node.js](https://nodejs.org) 22 or newer.

```bash
npm install
npm run dev        # a local copy at http://localhost:5173
npm test           # the tests
npm run build      # the finished site, in dist/
npm run preview    # serve dist/ to check the build
```

## How the code is laid out

```
src/
  main.tsx, App.tsx     start-up, and choosing between the two screens
  screens/              Library (the home page) and Play
  components/
    painting/           the watercolour brushes every scene is painted with:
                        SVG filters, peaks and ridges, trees, petals, the seal
    hero/               the landing painting and its board preview
    library/            the scroll painting, how to play, the size picker
    play/               the board, the tray of pieces, the play screen's scenery
    pieces/             how pieces and little boards are drawn, on any screen
    site/               menu, footer, the brush button and dividers, icons
  game/                 the puzzle itself, with no drawing in it: boards,
                        solving, hints, difficulty, the daily pick, the library
  state/                game state, progress, sound, moving between screens
  hooks/                dragging pieces, and sections inking in as they scroll by
  styles/               tokens (colours, type, motion) and one sheet per area
scripts/                building the puzzle library
public/                 favicon and the sharing image
```

## The puzzle library

The boards in `src/game/library.json` are made ahead of time by `scripts/build-library.ts`. It drops blocked squares in tough places many times over, keeps the layouts the pieces can fill in only a few ways, and rates each one by how much guessing a person would need. Rebuild it with `npm run build:library` (it takes several minutes) only when the piece sets or the rules for a good puzzle change.

## Built with

React, TypeScript and Vite. Everything you see is drawn in SVG and CSS, and the sounds are made in the browser with the Web Audio API, so there are no image or sound files to load. Fonts are Shippori Mincho, Kaushan Script, Zen Kaku Gothic New and Cormorant Garamond, from Google Fonts.
