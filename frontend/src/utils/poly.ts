export interface BBoxRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function polyToBBox(poly: number[]): BBoxRect {
  const coords: [number, number][] = [];
  for (let i = 0; i < poly.length; i += 2) {
    coords.push([poly[i], poly[i + 1]]);
  }
  const xs = coords.map(([x]) => x);
  const ys = coords.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function bboxToPoly(x: number, y: number, width: number, height: number): number[] {
  return [x, y, x + width, y, x + width, y + height, x, y + height];
}

export function scalePoly(poly: number[], factor: number): number[] {
  return poly.map((v) => v * factor);
}

export function polyToSvgPoints(poly: number[], scale: number): string {
  return scalePoly(poly, scale)
    .map((v) => v.toFixed(2))
    .reduce((acc, val, i) => {
      if (i % 2 === 0) {
        return acc + `${val},`;
      }
      return acc + `${val} `;
    }, '')
    .trim();
}
