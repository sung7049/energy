# 《에너지 장관: 2050》 시뮬레이션 엔진 아키텍처 및 계산 모델 설명서

본 문서는 고등학교 통합과학 및 환경/에너지 정책 교육을 위한 《에너지 장관: 2050》의 독립 시뮬레이션 엔진 구조와 수리적 계산식을 상세히 기술합니다.

---

## 1. 개요 및 설계 원칙

1. **독립적 순수 TypeScript 엔진**: React UI 프레임워크와 완전히 분리되어 브라우저 또는 Node.js 환경에서 독립적으로 동작하며, 외부 API 호출 없이 오프라인에서 즉시 계산됩니다.
2. **엄격한 단위 규약 (Unit Consistency)**:
   - 전력(Power): $\text{GW}$
   - 시간 간격($\Delta t$): $1\text{ h}$
   - 시간별 에너지(Energy): $\text{GWh} = \text{GW} \times \text{h}$
   - 연간 에너지: $\text{TWh} = 1,000\text{ GWh}$
   - 온실가스 배출: $\text{tCO}_2/\text{MWh}$ 배출계수 $\rightarrow$ 연간 $\text{MtCO}_2$
   - 경제성: $\text{원}/\text{MWh}$ 변동비, $\text{억원}/\text{GW}$ 설치비
3. **결정론 및 확률 모드 분리**:
   - **결정론적 모드**: 동일 입력에 대해 100% 동일한 결과 보장.
   - **확률적 모드**: 시드(Seed) 기반 PRNG(mulberry32)를 통해 기상 충격(일사량 변동, 태풍/돌풍), 원자력 호기별 불시 고장 사건을 결정론적으로 시뮬레이션.

---

## 2. 시뮬레이션 구조 및 대표일 가중치

- **시간 범위**: 2026년 ~ 2050년 (총 25년)
- **1년 계산 구조**: 4계절 대표일 (봄, 여름, 가을, 겨울) $\times$ 24시간 = 총 96시간의 전력 수급 계산.
- **계절별 대표일 일수 가중치**:
  - 봄: 92일
  - 여름: 92일
  - 가을: 91일
  - 겨울: 90일
  - **총합**: $92 + 92 + 91 + 90 = 365\text{일}$

연간 총량은 각 대표일 24시간의 합에 계절 가중치($W_s$)를 곱하여 적분합니다:
$$E_{\text{annual}} = \sum_{s \in \{\text{spring, summer, autumn, winter}\}} \left( W_s \times \sum_{h=0}^{23} E_{s, h} \right)$$

---

## 3. 발전원별 계산 모델

### 3.1. 태양광 (Solar PV)
일출 시각($t_{\text{sr}}$)과 일몰 시각($t_{\text{ss}}$) 사이에서 사인(Sine) 반파장 곡선으로 일사량을 모델링하며, 야간 시간대 발전량은 절대적으로 0을 보장합니다:
$$CF_{\text{solar}}(s, h) = \begin{cases} 
0 & (h + 0.5 \le t_{\text{sr}} \text{ 또는 } h + 0.5 \ge t_{\text{ss}}) \\
CF_{\text{peak}}(s) \cdot \sin\left(\pi \frac{h + 0.5 - t_{\text{sr}}}{t_{\text{ss}} - t_{\text{sr}}}\right) \cdot \text{Clearness} & (\text{그 외 주간})
\end{cases}$$
$$P_{\text{solar, pot}} = \text{Capacity}_{\text{solar}} \times CF_{\text{solar}}(s, h) \times \text{Availability}$$

### 3.2. 풍력 (Wind)
시동 풍속($v_{\text{ci}}$), 정격 풍속($v_{\text{r}}$), 차단 풍속($v_{\text{co}}$)을 고려한 3차 멱함수 출력곡선(Power Curve) 모델을 적용합니다:
$$P_{\text{wind}}(v) = \begin{cases}
0 & (v < v_{\text{ci}} \text{ 또는 } v \ge v_{\text{co}}) \\
\frac{v^3 - v_{\text{ci}}^3}{v_{\text{r}}^3 - v_{\text{ci}}^3} & (v_{\text{ci}} \le v < v_{\text{r}}) \\
1.0 & (v_{\text{r}} \le v < v_{\text{co}})
\end{cases}$$
태풍 등으로 차단 풍속($25\text{ m/s}$)을 초과하면 터빈 보호를 위해 출력이 0으로 차단됩니다.

### 3.3. 원자력 (Nuclear)
- 설비용량과 가용률(계획예방정비 및 불시정지 반영)을 바탕으로 기저 부하를 공급합니다.
- 기술적 최소 가동률($\text{minLoadFraction} = 70\%$)의 경직성을 가집니다.
- 신규 호기 건설 기간(7년) 동안 발전량은 정확히 0이며, 완공 연도에 계통에 편입됩니다.

### 3.4. 화석연료 발전 (석탄 & LNG)
- **급전 순위 (Merit Order)**: 연료 변동비와 탄소배출 비용을 반영한 단기 한계비용(SRMC) 순으로 발전 우선순위를 결정합니다.
- **운전 제약**: 석탄은 시간당 램프 제약($40\%/\text{h}$)과 높은 배출계수($0.82\text{ tCO}_2/\text{MWh}$)를 가지며, LNG는 빠른 기동·추종 능력($100\%/\text{h}$)과 상대적으로 낮은 배출계수($0.37\text{ tCO}_2/\text{MWh}$)를 가집니다.

---

## 4. ESS(에너지저장장치) 및 에너지 보존 법칙

ESS는 에너지를 직접 생산하지 못하며 시간적 이동만 수행합니다.

### 4.1. 충전 상태(SOC) 상태 방정식
$$SOC(t + \Delta t) = SOC(t) + \eta_{\text{charge}} \cdot E_{\text{charge}}(t) - \frac{E_{\text{discharge}}(t)}{\eta_{\text{discharge}}}$$
- 제약 조건:
  - $SOC_{\text{min}} \le SOC(t) \le SOC_{\text{max}}$
  - $E_{\text{charge}}(t) \le P_{\text{ess, max}} \cdot \Delta t$
  - $E_{\text{discharge}}(t) \le P_{\text{ess, max}} \cdot \Delta t$
  - $E_{\text{charge}}(t) \cdot E_{\text{discharge}}(t) = 0$ (동시 충·방전 금지)

### 4.2. 순환 경계 조건 (Cyclic Boundary Condition)
대표일 시뮬레이션에서는 하루의 시작 $SOC(0)$과 종료 $SOC(24)$가 일치하도록 반복 고정점 풀이(Fixed-point iteration)를 수행합니다. 이를 통해 과거 저장분을 임의로 꺼내 쓰는 "공짜 에너지(Free Energy)" 오류를 물리적으로 차단합니다:
$$|SOC(24) - SOC(0)| \le \epsilon \quad (\epsilon = 10^{-6}\text{ GWh})$$

---

## 5. 시간별 전력 수급 및 에너지 수지

매 시간마다 아래의 급전 우선순위에 따라 수급 균형을 맞춥니다:
1. 시간별 전력 수요 $D(h)$ 확정
2. 재생에너지(태양광·풍력) 잠재량 계산
3. 원자력 최소출력 및 계통 관성 유지를 위한 최소 동기발전량 의무 운전 확보
4. 잔여수요(Net Demand) 계산:
   - **공급 과잉 시**: ① ESS 충전 $\rightarrow$ ② 재생에너지 출력제어(Curtailment) $\rightarrow$ ③ 기저발전 강제 감발 기록
   - **공급 부족 시**: ① 원자력 정격 증발 $\rightarrow$ ② ESS 방전 $\rightarrow$ ③ 화력발전 Merit Order 급전 $\rightarrow$ ④ 수요반응(DR) $\rightarrow$ ⑤ 미공급 전력량(USE) 기록

**에너지 수지 보존 방정식 (매 시간 성립)**:
$$\sum_{i} P_{\text{gen}, i} + E_{\text{discharge}} + E_{\text{unserved}} = (D - E_{\text{dr}}) + E_{\text{charge}}$$

---

## 6. 정책 시뮬레이션 및 인과관계

정책은 임의 점수가 아니라 설비용량, 계통 파라미터, 수요 곡선의 물리적 상태 변수를 변경합니다:
- **태양광 증가** $\rightarrow$ 낮 시간 발전 증가 $\rightarrow$ 봄/가을 낮 시간 잉여 전력 발생 $\rightarrow$ 출력제어 증가
- **태양광 + ESS 조합** $\rightarrow$ 잉여 전력을 ESS가 흡수 $\rightarrow$ 출력제어 감소 및 야간 방전을 통한 LNG 발전 대체
- **석탄 조기 폐쇄** $\rightarrow$ 직접 탄소 배출량 급감, 단 대체 발전원(재생E/원전/LNG) 부족 시 피크 시간 미공급 전력 발생
- **전력망 유연성 향상** $\rightarrow$ 의무 동기발전 비율 완화 $\rightarrow$ 재생에너지 수용성 확대 및 출력제어 감소
