// src/utils/tileAssets.js

const pad2 = (n) => String(n).padStart(2, "0");

/**
 * tile is like: { type: "normal"|"special"|"power"|"point", suit: "...", number: 1.. }
 * Returns a browser URL for <img src="...">
 */
export function tileToSrc(tile) {
  if (!tile) return "";

  const { type, suit, number } = tile;

  // views (optional use)
  // if you ever send "view" tiles, handle here

  // NORMAL tiles: ball/stick/wan => folder is the suit, file is 01..09.svg
  if (type === "normal") {
    return new URL(`../assets/tiles/${suit}/${pad2(number)}.svg`, import.meta.url).href;
  }

  // WINDS: type "special", suit "wind", number 1..4 => tiles/wind/01..04.svg
  if (type === "special" && suit === "wind") {
    return new URL(`../assets/tiles/wind/${pad2(number)}.svg`, import.meta.url).href;
  }

// BIG tiles: type "power", suit "big", number 1..3 => tiles/big/01..03.svg
if (type === "power" && suit === "big") {
  return new URL(`../assets/tiles/big/${pad2(number)}.svg`, import.meta.url).href;
}

  // FLOWERS: type "point", suit "flower", number 1..4
  // Your files are "1-1.svg", "1-2.svg", ..., "4-2.svg" (two copies)
  // If backend doesn't care about copy, just pick "-1".
  if (type === "point" && suit === "flower") {
    return new URL(`../assets/tiles/flower/${number}-1.svg`, import.meta.url).href;
  }

  // ANIMALS: type "point", suit "animal", number 1..4 => tiles/animal/01..04.svg
  if (type === "point" && suit === "animal") {
    return new URL(`../assets/tiles/animal/${pad2(number)}.svg`, import.meta.url).href;
  }

  // fallback
  return new URL(`../assets/tiles/view/front.svg`, import.meta.url).href;
}

export function tileBackSrc() {
  return new URL(`../assets/tiles/view/back.svg`, import.meta.url).href;
}

export function tileSideSrc() {
  return new URL(`../assets/tiles/view/side.svg`, import.meta.url).href;
}

export function tileFrontSrc() {
  return new URL(`../assets/tiles/view/front.svg`, import.meta.url).href;
}
