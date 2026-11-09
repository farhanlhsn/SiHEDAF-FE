type StatusMarkProps = {
  size?: "small" | "medium" | "large";
  /** Visual: "af" also draws AFL (both are alert kinds). */
  status: "af" | "normal";
  /** Accessible name; pass RESULT_COPY[kind].label so AFL is announced as AFL. */
  label?: string;
};

const sizes = {
  large: "h-[86px] w-[86px]",
  medium: "h-11 w-11",
  small: "h-9 w-9",
};

export function StatusMark({ size = "medium", status, label }: StatusMarkProps) {
  const isNormal = status === "normal";

  return (
    <span
      aria-label={label ?? (isNormal ? "Normal Rhythm" : "Terdeteksi AF")}
      className={`${sizes[size]} relative inline-grid shrink-0 place-items-center rounded-full ${
        isNormal ? "bg-primary-50 text-primary-300" : "bg-af-50 text-af-500"
      }`}
      role="img"
    >
      {size === "large" ? (
        <span
          className={`absolute inset-[-12px] rounded-full border-2 border-dashed ${
            isNormal ? "border-primary-200" : "border-af-500/40"
          }`}
        />
      ) : null}
      <svg
        aria-hidden="true"
        className={size === "large" ? "h-12 w-12" : "h-5 w-5"}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 21c-1.1-1-7.8-5.5-9.5-9.2C.7 7.9 3.1 4.2 7.1 4.2c2 0 3.8 1 4.9 2.5a6 6 0 0 1 4.9-2.5c4 0 6.4 3.7 4.6 7.6C19.8 15.5 13.1 20 12 21Z" />
      </svg>
      <svg
        aria-hidden="true"
        className={`absolute ${size === "large" ? "h-8 w-8" : "h-3.5 w-3.5"} text-white`}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
        viewBox="0 0 24 24"
      >
        <path d="M4.5 12h3l1.8-3.4 3.2 7 2.2-5 1.3 1.4h3.5" />
      </svg>
    </span>
  );
}
