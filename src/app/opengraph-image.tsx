import { ImageResponse } from "next/og";

import { buildSvgPath, rhythmWindow } from "@/components/landing/PulseWaveform";

export const alt =
  "SiHEDAF — deteksi dini risiko stroke dengan wearable PPG dan AI";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const normal = rhythmWindow({
  rhythm: "normal",
  seed: 21,
  beats: 5,
  samples: 240,
});
const irregular = rhythmWindow({
  rhythm: "af",
  seed: 8,
  beats: 6,
  samples: 240,
});
const normalPath = buildSvgPath(
  normal.points.map((point) => point.value * 0.9),
  640,
  120,
);
const irregularPath = buildSvgPath(
  irregular.points.map((point) => point.value * 0.9),
  560,
  120,
);

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#f5f3ee",
        color: "#002758",
        padding: "64px 72px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <svg height="52" viewBox="0 0 64 64" width="52">
          <rect fill="#002758" height="64" rx="16" width="64" />
          <path
            d="M32 51C26.5 45.6 12 37.4 12 25.4 12 18.6 16.9 14 22.9 14c4.2 0 7.3 2.4 9.1 5.8C33.8 16.4 36.9 14 41.1 14 47.1 14 52 18.6 52 25.4 52 37.4 37.5 45.6 32 51Z"
            fill="none"
            stroke="#ffffff"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <path
            d="M10 32h11l3.5-7 5 13 4.5-9.5 3 3.5H54"
            fill="none"
            stroke="#6aa8ff"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
        </svg>
        <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: -1 }}>
          SiHEDAF
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <span
          style={{
            fontSize: 76,
            lineHeight: 1,
            fontWeight: 700,
            letterSpacing: -3,
            display: "flex",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <span>Jantungmu bisa berdetak</span>
          <span style={{ color: "#ff4572" }}>kacau</span>
          <span>tanpa terasa.</span>
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          margin: "0 -72px",
          padding: "0 0 36px",
          borderTop: "2px solid rgba(0, 39, 88, 0.1)",
        }}
      >
        <svg height="150" viewBox="0 -15 1200 150" width="1200">
          <path
            d={normalPath}
            fill="none"
            stroke="#006efb"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <g transform="translate(640 0)">
            <path
              d={irregularPath}
              fill="none"
              stroke="#ff4572"
              strokeLinejoin="round"
              strokeWidth="4"
            />
          </g>
        </svg>
      </div>
    </div>,
    size,
  );
}
