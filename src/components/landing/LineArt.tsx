/**
 * Line-art drawings that the page thread "draws" as it passes through them.
 * Each drawing starts at its top centre and ends at its bottom centre so the
 * thread appears to flow in and out. Strokes draw in order via `--i` / `--n`.
 */

type DrawingProps = {
  className?: string;
};

function Stroke({ d, index }: { d: string; index: number }) {
  return (
    <path
      className="stroke"
      d={d}
      pathLength={1}
      style={{ "--i": index } as React.CSSProperties}
    />
  );
}

function Drawing({
  children,
  className = "",
  strokes,
  viewBox = "0 0 240 240",
}: DrawingProps & {
  children: React.ReactNode;
  strokes: number;
  viewBox?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={`line-art text-primary-300 ${className}`}
      style={{ "--n": strokes } as React.CSSProperties}
      viewBox={viewBox}
    >
      {children}
    </svg>
  );
}

const wearStrokes = [
  "M120 0V22H98L102 70H138L142 22H120",
  "M98 70H142A20 20 0 0 1 162 90V150A20 20 0 0 1 142 170H98A20 20 0 0 1 78 150V90A20 20 0 0 1 98 70Z",
  "M162 104H168V130H162",
  "M90 122H104L110 108L118 138L126 112L131 124H150",
  "M138 170L142 218H98L102 170M120 218V240",
];

export function WearDrawing({ className }: DrawingProps) {
  return (
    <Drawing className={className} strokes={wearStrokes.length}>
      {wearStrokes.map((d, index) => (
        <Stroke d={d} index={index} key={d} />
      ))}
    </Drawing>
  );
}

const recordStrokes = [
  "M120 0V34M108 34H132",
  "M120 42A54 54 0 1 1 119.9 42",
  "M120 50V58M166 96H158M120 142V134M74 96H82M120 96V68M120 96L140 108",
  "M34 196H66L74 174L84 214L92 186L98 196H142L150 174L160 214L168 186L174 196H206",
  "M120 206V240",
];

export function RecordDrawing({ className }: DrawingProps) {
  return (
    <Drawing className={className} strokes={recordStrokes.length}>
      {recordStrokes.map((d, index) => (
        <Stroke d={d} index={index} key={d} />
      ))}
    </Drawing>
  );
}

const analyseStrokes = [
  "M120 0V52",
  "M86 52H154A14 14 0 0 1 168 66V134A14 14 0 0 1 154 148H86A14 14 0 0 1 72 134V66A14 14 0 0 1 86 52Z",
  "M96 52V40M144 52V40M96 148V160M144 148V160M72 78H60M72 122H60M168 78H180M168 122H180",
  "M84 100H98L104 86L112 118L118 92L124 104H156",
  "M120 148V176C120 196 72 190 64 218M120 176C120 196 168 190 176 218M120 176V240",
];

export function AnalyseDrawing({ className }: DrawingProps) {
  return (
    <Drawing className={className} strokes={analyseStrokes.length}>
      {analyseStrokes.map((d, index) => (
        <Stroke d={d} index={index} key={d} />
      ))}
    </Drawing>
  );
}

const notifyStrokes = [
  "M120 0V16",
  "M94 16H146A22 22 0 0 1 168 38V202A22 22 0 0 1 146 224H94A22 22 0 0 1 72 202V38A22 22 0 0 1 94 16Z",
  "M110 30H130",
  "M92 58H148A8 8 0 0 1 156 66V100A8 8 0 0 1 148 108H92A8 8 0 0 1 84 100V66A8 8 0 0 1 92 58ZM96 76H136M96 92H120",
  "M108 210H132M120 224V240",
];

export function NotifyDrawing({ className }: DrawingProps) {
  return (
    <Drawing className={className} strokes={notifyStrokes.length}>
      {notifyStrokes.map((d, index) => (
        <Stroke d={d} index={index} key={d} />
      ))}
    </Drawing>
  );
}

const heartStrokes = [
  "M150 0V62C150 62 138 28 100 28C62 28 40 58 40 94C40 152 110 198 150 238C190 198 260 152 260 94C260 58 238 28 200 28C162 28 150 62 150 62",
  "M62 130H110L122 102L136 166L148 116L156 132H238",
];

export function HeartDrawing({ className }: DrawingProps) {
  return (
    <Drawing
      className={className}
      strokes={heartStrokes.length}
      viewBox="0 0 300 240"
    >
      {heartStrokes.map((d, index) => (
        <Stroke d={d} index={index} key={d} />
      ))}
    </Drawing>
  );
}
