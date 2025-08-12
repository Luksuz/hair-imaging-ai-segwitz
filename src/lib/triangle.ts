// A lightweight approximation for deriving an arrow direction
// from polygon points by computing a minimal-area triangle via convex hull + sampling.

export type Vec = { x: number; y: number };
export type Triangle = [Vec, Vec, Vec];

function area(a: Vec, b: Vec, c: Vec) {
  return Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) / 2;
}

export function computeApproxMinimalTriangle(points: Vec[]): Triangle | null {
  if (!points || points.length < 3) return null;
  // Compute a simple convex hull (Andrew's monotone chain)
  const hull = convexHull(points);
  if (!hull || hull.length < 3) return null;
  let best: { tri: Triangle; a: number } | null = null;
  for (let i = 0; i < hull.length; i++) {
    for (let j = i + 1; j < hull.length; j++) {
      for (let k = j + 1; k < hull.length; k++) {
        const tri: Triangle = [hull[i], hull[j], hull[k]];
        const a = area(tri[0], tri[1], tri[2]);
        if (!best || a < best.a) best = { tri, a };
      }
    }
  }
  return best?.tri ?? null;
}

export function shortestSideMidAndApex(tri: Triangle) {
  const d01 = dist(tri[0], tri[1]);
  const d12 = dist(tri[1], tri[2]);
  const d20 = dist(tri[2], tri[0]);
  const arr: [number, [Vec, Vec], Vec][] = [
    [d01, [tri[0], tri[1]], tri[2]],
    [d12, [tri[1], tri[2]], tri[0]],
    [d20, [tri[2], tri[0]], tri[1]],
  ];
  arr.sort((a, b) => a[0] - b[0]);
  const [, [a, b], apex] = arr[0];
  return { baseMid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, apex };
}

function dist(a: Vec, b: Vec) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function convexHull(points: Vec[]): Vec[] {
  const pts = Array.from(points).sort((p, q) => (p.x - q.x) || (p.y - q.y));
  const lower: Vec[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: Vec[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

function cross(o: Vec, a: Vec, b: Vec) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}


