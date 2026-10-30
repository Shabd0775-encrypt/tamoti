// The tree's branches and blossom, painted wet-in-wet: big irregular blots
// of pale pink laid down first, smaller and slightly deeper ones over them,
// a few touches of strong color last, and drips where the paint ran.
// What sits in front of what matters as much as the color:
//
//   pale haze → trunk and big limbs → body of the blossom → fine twigs
//   → a few deeper blots → spray, loose petals blowing away, drips

import { blob, Dabs, Limbs, type Dab, type Growth, type Mass } from './treeParts'

/** Choose a tone by chance, e.g. [['--sakura-300', 0.6], ['--sakura-500', 0.4]]. */
function pick(random: () => number, tones: [string, number][]) {
  let roll = random()
  for (const [tone, chance] of tones) if ((roll -= chance) < 0) return tone
  return tones[0][0]
}

/** Thin runs of pink falling from the bottom of a few masses, as wet paint does. */
function Drips({ masses, random }: { masses: Mass[]; random: () => number }) {
  const drips = masses.flatMap((m) =>
    Array.from({ length: Math.floor(random() * 2.4) }, () => ({
      x: m.x + (random() - 0.5) * m.r * 1.6,
      y: m.y + m.r * (0.1 + random() * 0.2),
      length: 20 + random() * 60,
    })),
  )
  return (
    <g strokeLinecap="round" opacity={0.38} style={{ stroke: 'var(--sakura-500)', fill: 'var(--sakura-500)' }}>
      {drips.map((d, i) => (
        <g key={i}>
          <path d={`M${d.x} ${d.y}v${d.length}`} strokeWidth={1.2} />
          <circle cx={d.x} cy={d.y + d.length} r={1.6} stroke="none" />
        </g>
      ))}
    </g>
  )
}

/** A fine spray of pigment around each mass, drifting right with the wind. */
function spray(masses: Mass[], random: () => number, perMass: number): Dab[] {
  return masses.flatMap((m) =>
    Array.from({ length: perMass }, () => {
      const angle = random() * Math.PI * 2
      const d = m.r * (0.9 + random() * 0.7)
      return {
        x: m.x + Math.cos(angle) * d * 1.3 + random() * m.r * 0.5,
        y: m.y + Math.sin(angle) * d * 0.5,
        r: 0.6 + random() * 1.4,
        tone: '--sakura-500',
        alpha: 0.6,
      }
    }),
  )
}

// One petal, 10 units long: a rounded teardrop with the notch sakura petals have at the tip.
const PETAL = 'M0 5.5C-6.2 2 -5 -4.8 -1.3 -5.2L0 -3.6L1.3 -5.2C5 -4.8 6.2 2 0 5.5Z'

/**
 * Loose petals blowing off the crown to the right, in a long thinning
 * trail: plenty close to the blossom, fewer and fewer further out.
 */
function blownPetals(masses: Mass[], random: () => number) {
  // Petals leave from the masses on the right-hand side of the crown.
  const right = [...masses].sort((a, b) => b.x - a.x).slice(0, 4)
  return right.flatMap((m) =>
    Array.from({ length: 6 }, () => {
      const travel = random() ** 1.6 // most stay near, a few go far
      return {
        x: m.x + m.r * 0.6 + travel * 340,
        y: m.y + (random() - 0.35) * m.r + travel * 160 * (random() - 0.2),
        size: 0.8 + random() * 0.6,
        turn: random() * 360,
        tone: pick(random, [['--sakura-300', 0.6], ['--sakura-100', 0.25], ['--sakura-500', 0.15]]), // prettier-ignore
        alpha: 0.85 - travel * 0.35,
      }
    }),
  )
}

export function Blossom({ limbs, masses, random }: Growth) {
  const thick = limbs.filter((l) => l.depth >= 2)
  const fine = limbs.filter((l) => l.depth < 2)

  type Blot = { d: string; tone: string; alpha: number }
  const blots = (count: number, scale: number, spread: number, tone: () => string, alpha: () => number) =>
    masses.flatMap((m) =>
      Array.from({ length: count }, (): Blot => {
        const angle = random() * Math.PI * 2
        const dist = Math.sqrt(random()) * m.r * spread
        const x = m.x + Math.cos(angle) * dist
        const y = m.y + Math.sin(angle) * dist * 0.75 - m.r * 0.12
        return { d: blob(x, y, m.r * scale * (0.7 + random() * 0.6), random), tone: tone(), alpha: alpha() }
      }),
    )
  const haze = blots(
    2,
    0.95,
    0.3,
    () => '--sakura-100',
    () => 0.8,
  )
  const body = blots(
    5,
    0.42,
    0.75,
    () => pick(random, [['--sakura-100', 0.5], ['--sakura-300', 0.5]]), // prettier-ignore
    () => 0.35 + random() * 0.25,
  )
  const deep = blots(
    3,
    0.18,
    0.85,
    () => '--sakura-500',
    () => 0.22 + random() * 0.2,
  )
  const accent = blots(
    1,
    0.08,
    0.8,
    () => '--sakura-700',
    () => 0.35,
  )
  const drawBlots = (list: Blot[]) =>
    list.map((b, i) => (
      <path key={i} d={b.d} opacity={b.alpha} style={{ fill: `var(${b.tone})`, mixBlendMode: 'multiply' }} />
    ))
  const petals = blownPetals(masses, random)

  return (
    <>
      <g filter="url(#bloom-wet)">{drawBlots(haze)}</g>
      <Limbs limbs={thick} />
      <g filter="url(#bloom-wet)">{drawBlots(body)}</g>
      <Limbs limbs={fine} opacity={0.85} />
      <g filter="url(#bloom)">
        {drawBlots(deep)}
        {drawBlots(accent)}
      </g>
      <Dabs dabs={spray(masses, random, 10)} blend={false} />
      <g>
        {petals.map((p, i) => (
          <path
            key={i}
            d={PETAL}
            transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.turn.toFixed(0)}) scale(${p.size.toFixed(2)})`}
            opacity={p.alpha}
            style={{ fill: `var(${p.tone})` }}
          />
        ))}
      </g>
      <Drips masses={masses} random={random} />
    </>
  )
}
