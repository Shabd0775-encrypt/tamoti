// The hanko: a small red seal, the way a painter signs a scroll.
// 桜 (sakura) means cherry blossom. It's carved "white on red", so the
// character is the paper showing through the ink.

export function Seal({ className = '' }: { className?: string }) {
  return (
    <svg className={`seal ${className}`} viewBox="0 0 64 64" role="img" aria-label="Seal: 桜, cherry blossom">
      <g filter="url(#stamp)">
        <path
          d="M6 7.5C14 5.5 50 5 57.5 6.5 59 15 59.5 49 57 57.5 48 59 15 59.5 6.5 57 5 48 5 16 6 7.5Z"
          style={{ fill: 'var(--seal-red)' }}
        />
        <text
          x="32"
          y="44.5"
          textAnchor="middle"
          fontSize="35"
          fontWeight="700"
          style={{ fill: 'var(--paper)', fontFamily: 'var(--font-japanese)' }}
        >
          桜
        </text>
      </g>
    </svg>
  )
}
