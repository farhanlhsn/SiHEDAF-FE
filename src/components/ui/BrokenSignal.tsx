type BrokenSignalProps = {
  className?: string;
};

/**
 * A small PPG line that drops out in the middle: the inline sibling of
 * SignalLost. Static, so it needs no reduced-motion handling.
 */
export function BrokenSignal({ className = "" }: BrokenSignalProps) {
  return (
    <svg
      aria-hidden="true"
      className={`h-8 w-24 ${className}`}
      fill="none"
      viewBox="0 0 96 32"
    >
      <path
        className="stroke-primary-300"
        d="M2 18H12L16 8L21 26L26 14L30 18H36"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
      <path
        className="stroke-primary-900/35"
        d="M43 18H53"
        strokeDasharray="1 6"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <path
        className="stroke-primary-300"
        d="M60 18H66L70 8L75 26L80 14L84 18H94"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}
