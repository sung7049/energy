import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG, createInitialState, stepYear, applyPolicy } from '../src/engine';
import { selectCardForYear, GAME_CARDS } from '../src/game/cards';

describe('Reigns 카드 게임 메커니즘 검증', () => {
  it('모든 카드 정의가 필수 필드를 정상적으로 포함해야 한다', () => {
    expect(GAME_CARDS.length).toBeGreaterThan(15);
    for (const card of GAME_CARDS) {
      expect(card.id).toBeDefined();
      expect(card.title).toBeDefined();
      expect(card.department).toBeDefined();
      expect(card.avatar).toBeDefined();
      expect(card.description).toBeDefined();
      expect(card.leftChoice).toBeDefined();
      expect(card.rightChoice).toBeDefined();
      expect(card.leftChoice.text).toBeDefined();
      expect(card.rightChoice.text).toBeDefined();
      expect(card.leftChoice.indicators).toBeDefined();
      expect(card.rightChoice.indicators).toBeDefined();
    }
  });

  it('2026년부터 2050년까지 25년간 게임 루프가 물리 계산과 연동되어 정상 완주되어야 한다', () => {
    let state = createInitialState(DEFAULT_CONFIG, 42, 'deterministic');
    const usedCardIds = new Set<string>();

    let lastResult = undefined;

    for (let yr = 2026; yr <= 2050; yr++) {
      expect(state.year).toBe(yr);
      const card = selectCardForYear(yr, state, lastResult, usedCardIds);
      expect(card).toBeDefined();
      usedCardIds.add(card.id);

      // 왼쪽 선택지(주로 친환경/전환 정책) 선택 시뮬레이션
      const choice = card.leftChoice;
      if (choice.policyId) {
        state = applyPolicy(state, choice.policyId);
      }
      if (choice.budgetDeltaEok) {
        state.budget += choice.budgetDeltaEok;
      }
      if (choice.approvalDelta) {
        state.socialAcceptance = Math.max(0, Math.min(100, state.socialAcceptance + choice.approvalDelta));
      }

      const step = stepYear(state);
      lastResult = step.result;
      state = step.state;

      expect(lastResult.year).toBe(yr);
      expect(lastResult.generationTWh).toBeDefined();
      expect(lastResult.emissionsMt).toBeGreaterThanOrEqual(0);
    }

    expect(state.year).toBe(2051);
    expect(state.history.length).toBe(25);
    // 2026년 대비 온실가스가 감축되었는지 확인
    const startEmissions = state.history[0].emissionsMt;
    const finalEmissions = state.history[24].emissionsMt;
    expect(finalEmissions).toBeLessThan(startEmissions);
  });

  it('미공급 전력이 발생했을 때 긴급 비상 카드가 발동되어야 한다', () => {
    const state = createInitialState(DEFAULT_CONFIG, 42, 'deterministic');
    // 모의 결과: unservedGWh = 50
    const mockResult = {
      ...({} as any),
      unservedGWh: 50,
      emissionsMt: 100,
    };

    const card = selectCardForYear(2030, state, mockResult, new Set());
    expect(card.id).toBe('emergency_unserved_power');
  });

  it('예산이 심각하게 부족할 때 긴급 재정 카드가 발동되어야 한다', () => {
    const state = createInitialState(DEFAULT_CONFIG, 42, 'deterministic');
    state.budget = 2000; // 5000억 미만

    const card = selectCardForYear(2030, state, undefined, new Set());
    expect(card.id).toBe('emergency_fiscal_crisis');
  });
});
