import type { GenTech, SimConfig, ThermalTech } from '../types';
import { GEN_TECHS } from '../types';

/** 급전 판단용 한계비용 (원/MWh) = 변동비 + (탄소가격 반영 시) 탄소가격 × 배출계수 */
export function marginalCostWonPerMWh(config: SimConfig): Record<GenTech, number> {
  const out = {} as Record<GenTech, number>;
  for (const t of GEN_TECHS) {
    const e = config.economics.tech[t];
    const carbon = config.economics.carbonInDispatch
      ? config.economics.carbonPriceWonPerT * e.emissionFactorTPerMWh
      : 0;
    out[t] = e.variableCostWonPerMWh + carbon;
  }
  return out;
}

/** 석탄·LNG 급전 순위 (한계비용 오름차순) */
export function thermalMeritOrder(config: SimConfig): ThermalTech[] {
  const mc = marginalCostWonPerMWh(config);
  return (['coal', 'lng'] as ThermalTech[]).sort((a, b) => mc[a] - mc[b]);
}

/** 화력 가용 출력 (GW) */
export function thermalAvailableGW(capacityGW: number, tech: ThermalTech, config: SimConfig): number {
  return Math.max(0, capacityGW * config.thermal[tech].availability);
}
