/** Brand mark: a shuttlecock whose cork band carries the volt accent. Colour follows currentColor. */
export function ShuttleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M9 4h14l-4.5 15h-5z" fill="currentColor" opacity="0.9" />
      <path d="M12.5 4 14 19M19.5 4 18 19" stroke="var(--color-canvas)" strokeWidth="1.2" />
      <rect x="12.5" y="19" width="7" height="2.5" rx="0.8" fill="#c8ff3d" />
      <path d="M12.5 21.5h7a3.5 3.5 0 0 1-7 0z" fill="currentColor" />
    </svg>
  )
}
