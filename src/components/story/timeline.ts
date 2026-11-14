// Every animation in the grind story is a pure function of scroll progress (0–1),
// so scrubbing backwards replays it exactly. Tune chapter timings here.

export const CHAPTERS = {
  intro: [0, 0.12],
  spices: [0.12, 0.32],
  grind: [0.32, 0.55],
  powder: [0.55, 0.75],
  reveal: [0.75, 0.9],
  finale: [0.9, 1],
} as const;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Local 0–1 progress of `p` within [start, end]. */
export const seg = (p: number, start: number, end: number) => clamp01((p - start) / (end - start));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInQuad = (t: number) => t * t;
export const easeOutBack = (t: number) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export type Vec3 = [number, number, number];
export type Keyframe<T> = { at: number; value: T };

/** Eased interpolation between keyframes sorted by `at`. */
export function sampleVec3(frames: Keyframe<Vec3>[], p: number, out: Vec3 = [0, 0, 0]): Vec3 {
  if (p <= frames[0].at) return copy(frames[0].value, out);
  for (let i = 1; i < frames.length; i++) {
    const prev = frames[i - 1];
    const next = frames[i];
    if (p <= next.at) {
      const t = easeInOutCubic(seg(p, prev.at, next.at));
      out[0] = lerp(prev.value[0], next.value[0], t);
      out[1] = lerp(prev.value[1], next.value[1], t);
      out[2] = lerp(prev.value[2], next.value[2], t);
      return out;
    }
  }
  return copy(frames[frames.length - 1].value, out);
}

function copy(v: Vec3, out: Vec3): Vec3 {
  out[0] = v[0];
  out[1] = v[1];
  out[2] = v[2];
  return out;
}

/** Deterministic PRNG so spice layouts are identical on every visit. */
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Mortar geometry shared by the scene objects ────────────────────────────
export const BOWL = {
  rimRadius: 1.12,
  rimHeight: 1.0,
  floorHeight: 0.3,
};

/** Height of the bowl's inner surface at radius r (0 = centre). */
export function innerY(r: number): number {
  const t = Math.min(1, r / BOWL.rimRadius);
  return BOWL.floorHeight + (BOWL.rimHeight - BOWL.floorHeight) * Math.pow(t, 2.1);
}

/** Pestle grinding orbit: tip position inside the bowl at progress p. */
export function grindPhase(p: number): number {
  // Fast circles while grinding, slowing as the powder forms.
  const a = seg(p, CHAPTERS.grind[0] + 0.03, CHAPTERS.powder[1] - 0.02);
  return easeOutCubic(a) * Math.PI * 2 * 4.5;
}
