// Minimal geometry helpers for client-side rendering of arrows
export type Point = { x: number; y: number };

export type Triangle = [Point, Point, Point];

export function shortestSideAndApex(tri: Triangle) {
  const edges: [number, [Point, Point], Point][] = [
    [distance(tri[0], tri[1]), [tri[0], tri[1]], tri[2]],
    [distance(tri[1], tri[2]), [tri[1], tri[2]], tri[0]],
    [distance(tri[2], tri[0]), [tri[2], tri[0]], tri[1]],
  ];
  edges.sort((a, b) => a[0] - b[0]);
  const [, [a, b], apex] = edges[0];
  return { baseMid: midpoint(a, b), apex };
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}




