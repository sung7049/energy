/**
 * 시드 기반 의사난수 — 확률 사건(stochastic 모드)에서만 사용.
 * 결정론 모드는 난수를 전혀 사용하지 않음.
 */
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a 스타일 해시로 (시드, 연도 …) 조합에서 독립적인 하위 시드를 만든다 */
export function hashSeed(...parts: number[]): number {
  let h = 2166136261 >>> 0;
  for (const p of parts) {
    const v = Math.floor(p) >>> 0;
    for (let i = 0; i < 4; i++) {
      h ^= (v >>> (i * 8)) & 0xff;
      h = Math.imul(h, 16777619) >>> 0;
    }
  }
  return h >>> 0;
}

export function uniform(rng: Rng, range: [number, number]): number {
  return range[0] + (range[1] - range[0]) * rng();
}
