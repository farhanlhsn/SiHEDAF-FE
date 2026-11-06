export type TextSize = "normal" | "besar" | "sangat-besar";

export const TEXT_SIZES: readonly TextSize[] = ["normal", "besar", "sangat-besar"];

export const TEXT_SIZE_LABEL: Record<TextSize, string> = {
  normal: "Normal",
  besar: "Besar",
  "sangat-besar": "Sangat besar",
};

export const TEXT_SIZE_STORAGE_KEY = "sihedaf:text-size";
export const TEXT_SIZE_EVENT = "sihedaf:text-size-change";

export function parseTextSize(value: unknown): TextSize {
  return TEXT_SIZES.find((size) => size === value) ?? "normal";
}

/**
 * Self-contained IIFE for the root layout <head>. Runs before first paint and
 * must never throw (localStorage can be blocked). Expects `document` and
 * `localStorage` in scope.
 */
export function textSizeScript(): string {
  return `(function(){try{var v=localStorage.getItem(${JSON.stringify(
    TEXT_SIZE_STORAGE_KEY,
  )});if(${JSON.stringify(
    TEXT_SIZES.filter((size) => size !== "normal"),
  )}.indexOf(v)!==-1){document.documentElement.dataset.textSize=v}}catch(e){}})()`;
}
