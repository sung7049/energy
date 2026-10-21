import type { Season } from '../types';

/**
 * 대표일 프로파일 — 교육용 가상 국가 "한빛국" 기준의 가상 데이터.
 * 실제 대한민국 계통 통계가 아닙니다.
 */

/** 계절별 대표일 가중치(일). 합계는 반드시 365 */
export const SEASON_WEIGHTS: Record<Season, number> = {
  spring: 92, // 3~5월
  summer: 92, // 6~8월
  autumn: 91, // 9~11월
  winter: 90, // 12~2월 (평년)
};

/** 24시간 상대 수요 형상 (index = 시각, 해당 시각부터 1시간 평균) */
export const DEMAND_SHAPE: Record<Season, number[]> = {
  spring: [
    0.8, 0.77, 0.75, 0.74, 0.75, 0.78, 0.85, 0.94, 1.02, 1.06, 1.06, 1.02, 0.97, 0.99, 1.01, 1.02,
    1.03, 1.05, 1.08, 1.07, 1.03, 0.97, 0.9, 0.84,
  ],
  summer: [
    0.86, 0.82, 0.8, 0.79, 0.79, 0.81, 0.86, 0.94, 1.03, 1.1, 1.15, 1.17, 1.13, 1.17, 1.2, 1.2,
    1.18, 1.14, 1.1, 1.07, 1.04, 1.0, 0.95, 0.9,
  ],
  autumn: [
    0.79, 0.76, 0.74, 0.73, 0.74, 0.77, 0.84, 0.93, 1.01, 1.05, 1.05, 1.01, 0.96, 0.98, 1.0, 1.01,
    1.03, 1.07, 1.09, 1.07, 1.02, 0.96, 0.89, 0.83,
  ],
  winter: [
    0.9, 0.87, 0.85, 0.84, 0.85, 0.88, 0.95, 1.05, 1.13, 1.16, 1.15, 1.12, 1.06, 1.08, 1.08, 1.07,
    1.08, 1.13, 1.16, 1.14, 1.1, 1.04, 0.98, 0.93,
  ],
};

/** 계절별 수요 수준 (냉난방 부하 반영) */
export const SEASON_DEMAND_LEVEL: Record<Season, number> = {
  spring: 0.9,
  summer: 1.06,
  autumn: 0.92,
  winter: 1.1,
};

/** 일출·일몰 시각 (h, 소수 허용) */
export const SUNRISE: Record<Season, number> = { spring: 6.0, summer: 5.5, autumn: 6.5, winter: 7.5 };
export const SUNSET: Record<Season, number> = { spring: 19.0, summer: 19.5, autumn: 18.0, winter: 17.5 };

/** 대표일 정오 최대 이용률: 평균적인 구름·온도 손실 포함 (가상값) */
export const SOLAR_PEAK_CF: Record<Season, number> = {
  spring: 0.55,
  summer: 0.48,
  autumn: 0.5,
  winter: 0.42,
};

/** 허브 높이 평균 풍속 (m/s) */
export const WIND_MEAN_SPEED: Record<Season, number> = {
  spring: 7.2,
  summer: 5.0,
  autumn: 6.6,
  winter: 8.0,
};

export const WIND_DIURNAL_AMPLITUDE: Record<Season, number> = {
  spring: 0.15,
  summer: 0.12,
  autumn: 0.12,
  winter: 0.1,
};
