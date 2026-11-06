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
 * must never throw (localStorage can be blocked). It also follows a size
 * chosen in another tab (`storage` event), on every page. Expects `window`,
 * `document` and `localStorage` in scope.
 */
export function textSizeScript(): string {
  const key = JSON.stringify(TEXT_SIZE_STORAGE_KEY);
  const larger = JSON.stringify(TEXT_SIZES.filter((size) => size !== "normal"));

  return `(function(){var k=${key},s=${larger},d=document.documentElement;try{var v=localStorage.getItem(k);if(s.indexOf(v)!==-1){d.dataset.textSize=v}}catch(e){}try{window.addEventListener("storage",function(e){if(e.key!==null&&e.key!==k)return;if(s.indexOf(e.newValue)!==-1){d.dataset.textSize=e.newValue}else{delete d.dataset.textSize}})}catch(e){}})()`;
}
