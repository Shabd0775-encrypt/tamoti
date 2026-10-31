/** Pieces take turns through the four color tones, in tray order. */
export const toneFor = (index: number) => (index % 4) + 1
