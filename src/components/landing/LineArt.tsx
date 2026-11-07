/**
 * Line-art drawings in the SiHEDAF stroke style.
 *
 * On the landing page the scroll thread "draws" them: each drawing starts at
 * its top centre and ends at its bottom centre, so the thread flows in and out
 * through the connector strokes. Elsewhere (auth pages) they stand alone and
 * can drop the connectors. Strokes draw in order via `--i` / `--n` and the
 * inherited `--thread-progress` (0–1).
 */

type StrokeSpec = {
  d: string;
  /** Lead-in / lead-out line that joins the page thread. */
  connector?: boolean;
};

type DrawingProps = {
  className?: string;
  /** Keep the top/bottom connector strokes (default true). */
  connectors?: boolean;
};

function Drawing({
  className = "",
  connectors = true,
  strokes,
  viewBox = "0 0 240 240",
}: DrawingProps & { strokes: StrokeSpec[]; viewBox?: string }) {
  const visible = connectors
    ? strokes
    : strokes.filter((stroke) => !stroke.connector);

  return (
    <svg
      aria-hidden="true"
      className={`line-art text-primary-300 ${className}`}
      style={{ "--n": visible.length } as React.CSSProperties}
      viewBox={viewBox}
    >
      {visible.map((stroke, index) => (
        <path
          className="stroke"
          d={stroke.d}
          key={stroke.d}
          pathLength={1}
          style={{ "--i": index } as React.CSSProperties}
        />
      ))}
    </svg>
  );
}

const wearStrokes: StrokeSpec[] = [
  { d: "M120 0V22", connector: true },
  { d: "M120 22H98L102 70H138L142 22H120" },
  {
    d: "M98 70H142A20 20 0 0 1 162 90V150A20 20 0 0 1 142 170H98A20 20 0 0 1 78 150V90A20 20 0 0 1 98 70Z",
  },
  { d: "M162 104H168V130H162" },
  { d: "M90 122H104L110 108L118 138L126 112L131 124H150" },
  { d: "M138 170L142 218H98L102 170" },
  { d: "M120 218V240", connector: true },
];

export function WearDrawing(props: DrawingProps) {
  return <Drawing strokes={wearStrokes} {...props} />;
}

const recordStrokes: StrokeSpec[] = [
  { d: "M120 0V34", connector: true },
  { d: "M108 34H132" },
  { d: "M120 42A54 54 0 1 1 119.9 42" },
  {
    d: "M120 50V58M166 96H158M120 142V134M74 96H82M120 96V68M120 96L140 108",
  },
  {
    d: "M34 196H66L74 174L84 214L92 186L98 196H142L150 174L160 214L168 186L174 196H206",
  },
  { d: "M120 206V240", connector: true },
];

export function RecordDrawing(props: DrawingProps) {
  return <Drawing strokes={recordStrokes} {...props} />;
}

const analyseStrokes: StrokeSpec[] = [
  { d: "M120 0V52", connector: true },
  {
    d: "M86 52H154A14 14 0 0 1 168 66V134A14 14 0 0 1 154 148H86A14 14 0 0 1 72 134V66A14 14 0 0 1 86 52Z",
  },
  {
    d: "M96 52V40M144 52V40M96 148V160M144 148V160M72 78H60M72 122H60M168 78H180M168 122H180",
  },
  { d: "M84 100H98L104 86L112 118L118 92L124 104H156" },
  {
    d: "M120 148V176C120 196 72 190 64 218M120 176C120 196 168 190 176 218M120 176V240",
  },
];

export function AnalyseDrawing(props: DrawingProps) {
  return <Drawing strokes={analyseStrokes} {...props} />;
}

const notifyStrokes: StrokeSpec[] = [
  { d: "M120 0V16", connector: true },
  {
    d: "M94 16H146A22 22 0 0 1 168 38V202A22 22 0 0 1 146 224H94A22 22 0 0 1 72 202V38A22 22 0 0 1 94 16Z",
  },
  { d: "M110 30H130" },
  {
    d: "M92 58H148A8 8 0 0 1 156 66V100A8 8 0 0 1 148 108H92A8 8 0 0 1 84 100V66A8 8 0 0 1 92 58ZM96 76H136M96 92H120",
  },
  { d: "M108 210H132" },
  { d: "M120 224V240", connector: true },
];

export function NotifyDrawing(props: DrawingProps) {
  return <Drawing strokes={notifyStrokes} {...props} />;
}

const heartStrokes: StrokeSpec[] = [
  { d: "M150 0V62", connector: true },
  {
    d: "M150 62C150 62 138 28 100 28C62 28 40 58 40 94C40 152 110 198 150 238C190 198 260 152 260 94C260 58 238 28 200 28C162 28 150 62 150 62",
  },
  { d: "M62 130H110L122 102L136 166L148 116L156 132H238" },
];

export function HeartDrawing(props: DrawingProps) {
  return <Drawing strokes={heartStrokes} viewBox="0 0 300 240" {...props} />;
}

const lockStrokes: StrokeSpec[] = [
  { d: "M120 0V40", connector: true },
  { d: "M84 104V76A36 36 0 0 1 156 76V104" },
  {
    d: "M82 104H158A18 18 0 0 1 176 122V182A18 18 0 0 1 158 200H82A18 18 0 0 1 64 182V122A18 18 0 0 1 82 104Z",
  },
  { d: "M120 132A10 10 0 1 1 119.9 132M120 152V170" },
  { d: "M120 200V240", connector: true },
];

export function LockDrawing(props: DrawingProps) {
  return <Drawing strokes={lockStrokes} {...props} />;
}
