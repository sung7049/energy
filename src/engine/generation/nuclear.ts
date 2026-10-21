import type { Season, SimConfig } from '../types';
import type { Rng } from '../random';

/** 결정론 모드: 기대 가용률 = (1 − 계획정비율[계절]) × (1 − 고장정지율) */
export function expectedNuclearAvailability(season: Season, cfg: SimConfig['nuclear']): number {
  return (1 - cfg.plannedOutageBySeason[season]) * (1 - cfg.forcedOutageRate);
}

export interface NuclearOutageSample {
  availability: number;
  unitsOut: number;
  units: number;
}

/**
 * 확률 모드: 호기(unitSizeGW) 단위로 대표일마다 고장 여부를 시드 난수로 추출.
 * 대표일 1개가 계절 전체를 대표하므로, 고장 호기는 해당 계절 전체에서 이용 불가로 간주된다.
 */
export function sampleNuclearAvailability(
  capacityGW: number,
  season: Season,
  cfg: SimConfig['nuclear'],
  rng: Rng,
): NuclearOutageSample {
  if (capacityGW <= 0) return { availability: 0, unitsOut: 0, units: 0 };
  const units = Math.ceil(capacityGW / cfg.unitSizeGW - 1e-9);
  let outGW = 0;
  let unitsOut = 0;
  for (let i = 0; i < units; i++) {
    const size = Math.min(cfg.unitSizeGW, capacityGW - i * cfg.unitSizeGW);
    if (rng() < cfg.forcedOutageRate) {
      outGW += size;
      unitsOut++;
    }
  }
  const availability = (1 - cfg.plannedOutageBySeason[season]) * (1 - outGW / capacityGW);
  return { availability, unitsOut, units };
}

/** 원자력 가용 출력 (GW) */
export function nuclearAvailableGW(capacityGW: number, availability: number): number {
  return Math.max(0, capacityGW * availability);
}
