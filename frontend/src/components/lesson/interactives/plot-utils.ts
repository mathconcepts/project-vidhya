export interface SliderSpec {
  name: string;
  min: number;
  max: number;
  default: number;
}

export function parseSliders(s: string | undefined): SliderSpec[] {
  if (!s) return [];
  return s
    .split(/[;\n]+/)
    .map((seg) => seg.trim())
    .filter(Boolean)
    .map((seg) => {
      const m = seg.match(/^([a-z])\s*:\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*(,\s*(-?\d+(\.\d+)?))?$/i);
      if (!m) return null;
      return {
        name: m[1],
        min: Number(m[2]),
        max: Number(m[4]),
        default: m[7] != null ? Number(m[7]) : (Number(m[2]) + Number(m[4])) / 2,
      };
    })
    .filter((x): x is SliderSpec => x != null);
}

export function parseRange(s: string | undefined, fallback: [number, number]): [number, number] {
  if (!s) return fallback;
  const m = s.match(/-?\d+(\.\d+)?/g);
  if (!m || m.length < 2) return fallback;
  return [Number(m[0]), Number(m[1])];
}
