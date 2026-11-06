type SparklineProps = {
  tone?: "blue" | "pink";
  data?: number[];
};

const placeholderPath =
  "M1 18h6l3-7 4 14 4-9 4 3h8l3-4 3 5h5l3-12 5 18 4-9 4 3h9l3-6 4 7 5-2 4-12 5 20 4-10 4 3h8l4-7 4 8 5-2 4-12 5 20 5-11 4 4h7l4-8 5 8 4-2 4-11 5 18 4-8 4 3h8";

export function Sparkline({ tone = "blue", data }: SparklineProps) {
  let d = placeholderPath;

  if (data && data.length > 1) {
    let maxVal = -Infinity;
    let minVal = Infinity;
    for (const value of data) {
      if (value > maxVal) maxVal = value;
      if (value < minVal) minVal = value;
    }
    const range = maxVal - minVal || 1;

    d = data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * 190;
        const y = 32 - ((value - minVal) / range) * 30;
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }

  return (
    <svg
      aria-label="Pratinjau sinyal PPG"
      className={`h-9 w-full min-w-[120px] max-w-[200px] ${
        tone === "pink" ? "text-af-500" : "text-primary-300"
      }`}
      fill="none"
      preserveAspectRatio="none"
      role="img"
      viewBox="0 0 190 34"
    >
      <path
        d={d}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
