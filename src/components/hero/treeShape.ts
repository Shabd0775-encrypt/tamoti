// The shape of the hero's cherry trees: the rock they stand on and where their limbs go.

import type { TreeShape } from '../painting/Tree'

/** Two cherry trees on one rock: a tall one, and a lower one spreading out to the right. */
export const treeShape: TreeShape = {
  seed: 12,
  hill: [
    [-20, 760],
    [80, 736],
    [190, 744],
    [300, 782],
    [420, 846],
    [560, 910],
    [700, 960],
    [860, 1000],
  ],
  trunks: [
    { base: [190, 750], angle: -82, length: 190, width: 30, spread: 32, depth: 5 },
    { base: [262, 774], angle: -42, length: 150, width: 22, spread: 30, depth: 4 },
  ],
  reach: 650,
  flatten: 1,
}
