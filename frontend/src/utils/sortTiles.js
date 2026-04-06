// src/utils/sortTiles.js
const typeOrder = { normal: 0, special: 1, power: 2, point: 3 };
const suitOrder = { ball: 0, wan: 1, stick: 2, wind: 3, dragon: 4, flower: 5, animal: 6, big: 7 };

export function sortTiles(a, b) {
  const ta = typeOrder[a.type] ?? 99;
  const tb = typeOrder[b.type] ?? 99;
  if (ta !== tb) return ta - tb;

  const sa = suitOrder[a.suit] ?? 99;
  const sb = suitOrder[b.suit] ?? 99;
  if (sa !== sb) return sa - sb;

  return (a.number ?? 0) - (b.number ?? 0);
}
