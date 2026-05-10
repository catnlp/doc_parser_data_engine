export interface BBoxRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function polyToBBox(bbox: number[]): BBoxRect {
  return { x: bbox[0], y: bbox[1], width: bbox[2] - bbox[0], height: bbox[3] - bbox[1] };
}

export function bboxToPoly(x: number, y: number, width: number, height: number): number[] {
  return [x, y, x + width, y + height];
}

export function scalePoly(bbox: number[], factor: number): number[] {
  return bbox.map((v) => v * factor);
}

export function polyToSvgPoints(bbox: number[], scale: number): string {
  const [left, top, right, bottom] = [bbox[0] * scale, bbox[1] * scale, bbox[2] * scale, bbox[3] * scale];
  return `${left.toFixed(2)},${top.toFixed(2)} ${right.toFixed(2)},${top.toFixed(2)} ${right.toFixed(2)},${bottom.toFixed(2)} ${left.toFixed(2)},${bottom.toFixed(2)}`;
}
