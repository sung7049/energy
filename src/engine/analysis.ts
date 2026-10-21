import type { YearResult } from './state';
import { SEASON_LABEL } from './types';

export interface AnalysisSummary {
  scarcityAnalysis: string[];
  curtailmentAnalysis: string[];
  essContribution: string[];
  emissionTrend: string[];
  capacityEffects: string[];
  limitations: string[];
}

/**
 * 실제 계산값(YearResult)을 근거로 교육적이고 과학적인 분석 설명 생성
 */
export function generateAnalysis(result: YearResult): AnalysisSummary {
  const { unservedGWh, unservedHours, curtailmentTWh, essChargeTWh, essDischargeTWh, days } = result;

  // 1. 전력 공급 부족 시간대 분석
  const scarcityAnalysis: string[] = [];
  if (unservedGWh > 1e-4) {
    scarcityAnalysis.push(
      `연간 총 ${unservedGWh.toFixed(1)} GWh(약 ${unservedHours.toFixed(0)}시간)의 전력 미공급이 발생했습니다.`,
    );

    // 계절/시간대별 부족 찾기
    const shortageBySeason: Record<string, number> = {};
    const shortageHours: { season: string; hour: number; amount: number }[] = [];

    days.forEach((day) => {
      day.hours.forEach((h) => {
        if (h.unservedGWh > 1e-4) {
          shortageBySeason[day.season] = (shortageBySeason[day.season] || 0) + h.unservedGWh * day.weightDays;
          shortageHours.push({ season: day.season, hour: h.hour, amount: h.unservedGWh });
        }
      });
    });

    const worstSeason = Object.entries(shortageBySeason).sort((a, b) => b[1] - a[1])[0];
    if (worstSeason) {
      // 실제 부족 발생 시간대(hours) 추출
      const hoursInWorst = Array.from(
        new Set(
          shortageHours
            .filter((x) => x.season === worstSeason[0])
            .map((x) => `${x.hour}시`),
        ),
      ).join(', ');

      scarcityAnalysis.push(
        `가장 큰 부족은 [${SEASON_LABEL[worstSeason[0] as keyof typeof SEASON_LABEL]}]에 발생(약 ${worstSeason[1].toFixed(1)} GWh)하였으며, 실제 부족 시간대는 [${hoursInWorst}]였습니다.`,
      );
      scarcityAnalysis.push(
        '발전 설비의 이용 가능한 총 가용 용량(정비·고장 및 기상 반영)이 해당 시간의 순수요를 감당하지 못하여 발생했습니다.',
      );
    }
  } else {
    scarcityAnalysis.push('모든 시간대에 전력이 100% 안정적으로 공급되었습니다 (미공급 전력 0 GWh).');
  }

  // 2. 출력제어(Curtailment) 원인 분석
  const curtailmentAnalysis: string[] = [];
  const totalCurt = curtailmentTWh.solar + curtailmentTWh.wind;
  if (totalCurt > 1e-4) {
    curtailmentAnalysis.push(
      `연간 재생에너지 출력제어량이 총 ${totalCurt.toFixed(2)} TWh(태양광 ${curtailmentTWh.solar.toFixed(2)} TWh, 풍력 ${curtailmentTWh.wind.toFixed(2)} TWh) 발생했습니다.`,
    );

    // 실제 발생 원인별 횟수 계산
    let essFullCount = 0;
    let essPowerCount = 0;
    let noEssCount = 0;
    let syncFloorActive = false;

    days.forEach((day) => {
      day.hours.forEach((h) => {
        if (h.curtailSolarGWh + h.curtailWindGWh > 1e-5) {
          if (h.essLimit === 'full') essFullCount++;
          else if (h.essLimit === 'power') essPowerCount++;
          else if (h.essLimit === 'noEss') noEssCount++;

          if (h.mustRunGW > 0) syncFloorActive = true;
        }
      });
    });

    if (noEssCount > 0) {
      curtailmentAnalysis.push(
        '잉여 전력을 저장할 ESS 설비가 없거나 부족하여 잉여 전력 전량이 즉시 출력제어되었습니다.',
      );
    }
    if (essFullCount > 0) {
      curtailmentAnalysis.push(
        `ESS 충전 상태(SOC)가 상한에 도달하여 추가 잉여 전력을 흡수하지 못한 시간대가 ${essFullCount}회 발생했습니다.`,
      );
    }
    if (essPowerCount > 0) {
      curtailmentAnalysis.push(
        `잉여 전력 발생 속도가 ESS 정격 충전 출력 한계(GW)를 초과하여 발생한 출력제어가 ${essPowerCount}회 발생했습니다.`,
      );
    }
    if (syncFloorActive) {
      curtailmentAnalysis.push(
        `계통 안정성을 위한 최소 동기발전 요구량(${(result.minSyncFraction * 100).toFixed(0)}%) 및 기저설비 최소운전 제약으로 인해 발전 감발 하한선이 형성되었습니다.`,
      );
    }
  } else {
    curtailmentAnalysis.push('출력제어가 발생하지 않고 생산된 청정에너지가 전량 계통 소비 또는 ESS로 흡수되었습니다.');
  }

  // 3. ESS 기여도 분석
  const essContribution: string[] = [];
  if (result.essGWh > 0) {
    const roundTripLoss = essChargeTWh - essDischargeTWh;
    essContribution.push(
      `ESS(용량 ${result.essGWh} GWh, 출력 ${result.essGW} GW)는 연간 ${essChargeTWh.toFixed(2)} TWh를 충전하고 ${essDischargeTWh.toFixed(2)} TWh를 방전했습니다 (왕복 손실 ${roundTripLoss.toFixed(2)} TWh, 효율 반영).`,
    );
    if (result.scarcityDischargeGWh > 1e-4) {
      essContribution.push(
        `전력 부족 위기 시간대에 총 ${(result.scarcityDischargeGWh / 1000).toFixed(2)} TWh를 방전하여 미공급 전력 발생을 직접 완화했습니다.`,
      );
    } else {
      essContribution.push(
        '저장된 전력은 화석연료 발전이 가동되는 피크 시간대에 방전되어 연료비 및 탄소 배출 절감에 기여했을 가능성이 높습니다.',
      );
    }
  } else {
    essContribution.push('설치된 ESS 설비가 없어 잉여 전력 저장 및 시간대 이동이 발생하지 않았습니다.');
  }

  // 4. 탄소 배출 변화
  const emissionTrend: string[] = [];
  emissionTrend.push(`연간 총 탄소 배출량은 ${result.emissionsMt.toFixed(2)} MtCO₂입니다.`);
  const coalGen = result.generationTWh.coal;
  const lngGen = result.generationTWh.lng;
  const totalGen = Object.values(result.generationTWh).reduce((a, b) => a + b, 0);
  const fossilFraction = totalGen > 0 ? ((coalGen + lngGen) / totalGen) * 100 : 0;
  emissionTrend.push(
    `전체 발전량 중 화석연료(석탄+LNG) 비중이 ${fossilFraction.toFixed(1)}%(석탄 ${(coalGen / totalGen * 100).toFixed(1)}%, LNG ${(lngGen / totalGen * 100).toFixed(1)}%)를 차지하고 있습니다.`,
  );

  // 5. 설비 추가 효과
  const capacityEffects: string[] = [];
  capacityEffects.push(
    `가동 설비 용량: 태양광 ${result.capacitiesGW.solar} GW, 풍력 ${result.capacitiesGW.wind} GW, 원자력 ${result.capacitiesGW.nuclear} GW, 석탄 ${result.capacitiesGW.coal} GW, LNG ${result.capacitiesGW.lng} GW.`,
  );
  if (result.underConstruction.length > 0) {
    capacityEffects.push(
      `현재 건설 중인 사업: ${result.underConstruction.map((p) => `${p.name}(${p.completionYear}년 완공 예정)`).join(', ')}. 완공 전까지는 전력 생산에 기여하지 않습니다.`,
    );
  }

  // 6. 모델 단순화 한계 안내
  const limitations: string[] = [
    '본 시뮬레이션은 4계절 대표일(각 24시간, 총 96시간)을 가중치(365일)로 확장한 모델입니다.',
    '연속 며칠간 이어지는 장주기 무풍/장마 기상 현상이나 계절 간 장기 저장(수소, 양수 등) 특성은 온전히 반영되지 않습니다.',
    '송전선로 국지적 혼잡(밀집 지역 계통 제약) 및 주파수·전압의 초·분 단위 동특성은 단순화된 계통 유연성 계수로 추상화되어 있습니다.',
  ];

  return {
    scarcityAnalysis,
    curtailmentAnalysis,
    essContribution,
    emissionTrend,
    capacityEffects,
    limitations,
  };
}
