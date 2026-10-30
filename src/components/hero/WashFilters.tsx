// The watercolor "brushes": SVG filters that any shape on the page can use with
// filter="url(#wash)". Defined once here, in an invisible <svg>.
//
// Each one starts from feTurbulence, which paints smooth random noise. Then:
//   feDisplacementMap pushes a shape's pixels around by that noise, so a clean
//     edge goes wobbly, like pigment bleeding into wet paper;
//   feComposite "in" keeps the shape only where the noise is strong, which
//     leaves gaps, like a dry brush or a worn seal.

export function WashFilters() {
  return (
    <svg className="wash-filters" aria-hidden="true" focusable="false">
      <defs>
        {/*
          Big washes: wobbly bleeding edges, a darker rim where pigment pools at
          the edge of a wet stroke, and a little granulation.
          The rim trick: compare the shape with a blurred copy of itself. Inside,
          they match; near the edge the blur is thinner, so 1.6×shape − 0.6×blur
          comes out a little stronger there, and nothing outside.
        */}
        <filter id="wash" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.018" numOctaves="4" seed="4" result="warp" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="warp"
            scale="34"
            xChannelSelector="R"
            yChannelSelector="G"
            result="bled"
          />
          <feGaussianBlur in="bled" stdDeviation="6" result="soft" />
          <feComposite in="bled" in2="soft" operator="arithmetic" k2="1.6" k3="-0.6" result="rimmed" />
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="9" result="grain" />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.6 1.3"
            result="grainMask"
          />
          <feComposite in="rimmed" in2="grainMask" operator="in" />
        </filter>

        {/* Ink that soaks outward and softens: for the dark pigment along ridgelines. */}
        <filter id="ink-bleed" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="3" seed="6" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="26" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="7" />
        </filter>

        {/* The light on the peak has no hard edge: it melts into the shadow side. */}
        <filter id="glow-wash" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="3" seed="15" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="30" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="5" />
        </filter>

        {/* Bristle streaks running along a stroke: for ink lines and the button. */}
        <filter id="dry-brush" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.06" numOctaves="2" seed="2" result="warp" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="warp"
            scale="5"
            xChannelSelector="R"
            yChannelSelector="G"
            result="wobbly"
          />
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.35" numOctaves="2" seed="5" result="bristles" />
          <feColorMatrix
            in="bristles"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 2.3"
            result="bristleMask"
          />
          <feComposite in="wobbly" in2="bristleMask" operator="in" />
        </filter>

        {/* Blossoms: round dabs pushed into irregular blots, with the same pooled rim as a wash. */}
        <filter id="bloom" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" result="warp" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="warp"
            scale="22"
            xChannelSelector="R"
            yChannelSelector="G"
            result="blots"
          />
          <feGaussianBlur in="blots" stdDeviation="2.5" result="soft" />
          <feComposite in="blots" in2="soft" operator="arithmetic" k2="1.7" k3="-0.7" />
        </filter>

        {/* Wet-in-wet blossom haze: big, soft, very irregular, the pigment pooling at its rim. */}
        <filter id="bloom-wet" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="4" seed="23" result="warp" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="warp"
            scale="56"
            xChannelSelector="R"
            yChannelSelector="G"
            result="blots"
          />
          <feGaussianBlur in="blots" stdDeviation="5" result="soft" />
          <feComposite in="blots" in2="soft" operator="arithmetic" k2="1.6" k3="-0.6" />
        </filter>

        {/* Splattered flecks: small, hard, jagged, the way pigment lands when the brush is flicked. */}
        <filter id="fleck" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves="2" seed="29" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        {/*
          Sponge texture: the shape's edge is pushed about, then it is punched
          full of small holes wherever a second noise is strong, the way paint
          dabbed with a sponge leaves paper showing through.
        */}
        <filter id="sponge-coarse" x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="3" seed="31" result="warp" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="warp"
            scale="46"
            xChannelSelector="R"
            yChannelSelector="G"
            result="shape"
          />
          <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="3" seed="33" result="pores" />
          <feColorMatrix
            in="pores"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3 0 0 0 2.1"
            result="poreMask"
          />
          <feComposite in="shape" in2="poreMask" operator="in" />
        </filter>
        <filter id="sponge-fine" x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="35" result="warp" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="warp"
            scale="30"
            xChannelSelector="R"
            yChannelSelector="G"
            result="shape"
          />
          <feTurbulence type="fractalNoise" baseFrequency="0.14" numOctaves="2" seed="37" result="pores" />
          <feColorMatrix
            in="pores"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3.4 0 0 0 2.2"
            result="poreMask"
          />
          <feComposite in="shape" in2="poreMask" operator="in" />
        </filter>

        {/* A soft cloud of color with no edge at all, for the misty tree. */}
        <filter id="mist-blur" x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="39" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="40" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="18" />
        </filter>

        {/* A branch in one loaded stroke: slightly wobbly, darker at the edges. */}
        <filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="12" result="warp" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="warp"
            scale="6"
            xChannelSelector="R"
            yChannelSelector="G"
            result="wobbly"
          />
          <feGaussianBlur in="wobbly" stdDeviation="1.5" result="soft" />
          <feComposite in="wobbly" in2="soft" operator="arithmetic" k2="1.5" k3="-0.5" />
        </filter>

        {/* Reflections in still water: stretched sideways and broken into horizontal bands. */}
        <filter id="ripple" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.003 0.09" numOctaves="2" seed="21" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="26" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="2 0.6" />
        </filter>

        {/* Small washes, like the board's paper and its blocked squares: a gentle wobble and a pooled rim. */}
        <filter id="tile-wash" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="17" result="warp" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="warp"
            scale="12"
            xChannelSelector="R"
            yChannelSelector="G"
            result="bled"
          />
          <feGaussianBlur in="bled" stdDeviation="4" result="soft" />
          <feComposite in="bled" in2="soft" operator="arithmetic" k2="1.5" k3="-0.5" />
        </filter>

        {/* A hand-pressed seal: ragged edges and specks where the ink didn't take. */}
        <filter id="stamp" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="3" result="warp" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="warp"
            scale="2.5"
            xChannelSelector="R"
            yChannelSelector="G"
            result="edge"
          />
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="1" seed="11" result="specks" />
          <feColorMatrix
            in="specks"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.6"
            result="speckMask"
          />
          <feComposite in="edge" in2="speckMask" operator="in" />
        </filter>
      </defs>
    </svg>
  )
}
