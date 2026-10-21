/**
 * ESS(에너지저장장치) 모델 — 에너지를 생산하지 않고 시간 이동만 한다.
 *
 *   SOC(t+1) = SOC(t) + η_c · E_charge(t) − E_discharge(t) / η_d
 *
 * E_charge: 계통에서 받아들인 에너지 (GWh, 계통 측)
 * E_discharge: 계통으로 내보낸 에너지 (GWh, 계통 측)
 * 제약: SOC_min ≤ SOC ≤ SOC_max, E_charge ≤ P_max·dt, E_discharge ≤ P_max·dt, 동시 충방전 금지
 */

export interface EssParams {
  energyCapacityGWh: number;
  powerGW: number;
  etaCharge: number;
  etaDischarge: number;
  minSocFraction: number;
}

const EPS = 1e-9;

export function socBounds(p: EssParams): { min: number; max: number } {
  const max = Math.max(0, p.energyCapacityGWh);
  return { min: max * p.minSocFraction, max };
}

/** 현재 SOC에서 받아들일 수 있는 최대 충전 에너지 (계통 측 GWh) */
export function maxChargeInputGWh(p: EssParams, soc: number, dtHours: number): number {
  const { max } = socBounds(p);
  if (max <= 0 || p.powerGW <= 0) return 0;
  return Math.max(0, Math.min(p.powerGW * dtHours, (max - soc) / p.etaCharge));
}

/**
 * 현재 SOC에서 내보낼 수 있는 최대 방전 에너지 (계통 측 GWh).
 * floor: 방전 하한 SOC (예약분). 기본값은 SOC_min.
 */
export function maxDischargeOutputGWh(
  p: EssParams,
  soc: number,
  dtHours: number,
  floor?: number,
): number {
  const { min, max } = socBounds(p);
  if (max <= 0 || p.powerGW <= 0) return 0;
  const f = Math.min(max, Math.max(min, floor ?? min));
  return Math.max(0, Math.min(p.powerGW * dtHours, (soc - f) * p.etaDischarge));
}

/** 한 시간 간격의 SOC 갱신. 제약 위반 시 예외. */
export function stepSoc(
  p: EssParams,
  soc: number,
  chargeInGWh: number,
  dischargeOutGWh: number,
  dtHours: number,
): number {
  if (chargeInGWh < -EPS || dischargeOutGWh < -EPS) throw new Error('ESS: negative flow');
  if (chargeInGWh > EPS && dischargeOutGWh > EPS) throw new Error('ESS: simultaneous charge/discharge');
  const lim = p.powerGW * dtHours + 1e-7;
  if (chargeInGWh > lim || dischargeOutGWh > lim) throw new Error('ESS: power limit exceeded');
  const { min, max } = socBounds(p);
  let next = soc + chargeInGWh * p.etaCharge - dischargeOutGWh / p.etaDischarge;
  if (next > max + 1e-7 || next < min - 1e-7) {
    throw new Error(`ESS: SOC out of bounds (${next} not in [${min}, ${max}])`);
  }
  next = Math.min(max, Math.max(min, next));
  return next;
}
