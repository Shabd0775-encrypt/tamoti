// A few hand-drawn line icons, all with the same stroke, so they match.

const paths = {
  back: 'M15 5 8 12l7 7',
  next: 'M9 5l7 7-7 7',
  check: 'M5 12.5 10 17 19 7.5',
}

export function Icon({ name, size = 18 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}
