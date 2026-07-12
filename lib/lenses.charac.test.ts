// 특성화(characterization) 테스트 — 리팩토링 전 6개 렌즈의 현재 출력을 고정해 "동작 불변"을 보증한다.
// 원칙: 여기 스냅샷/기대값은 리팩토링 전 실제 출력의 "지상 진실(ground truth)"이다.
//   리팩토링 후에도 동일해야 통과 → 통과 실패 = 동작이 바뀐 것(테스트가 아니라 코드를 고칠 것).
// 결정론 픽스처(seeded)로 가격계열을 만들어 재현 가능하게 한다.
import { describe, it, expect } from "vitest";
import { momentum, technical, valuation, lowVol, quality, assetGrowth } from "./lenses";
import type { StockData } from "./lenses/types";
import type { FRow } from "./fscore";

// 최소 StockData 번들 — 각 렌즈가 필요한 필드만 채워 compute에 주입(나머지는 기본값).
function sd(partial: Partial<StockData>): StockData {
  return { symbol: "T", resolved: "T", name: "T", price: null, closes: [], pe: null, pb: null, financials: [], ...partial };
}
// 재무 최신행(퀄리티)·2년행(자산성장) 픽스처 헬퍼.
function fin(rows: FRow[]): FRow[] {
  return rows;
}

// 결정론적 가격계열 생성기 — seed 고정으로 매 실행 동일(Math.imul 32bit).
function makeSeries(n: number, start: number, drift: number, noiseAmp: number, seed: number): number[] {
  let s = seed >>> 0;
  const rand = () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return s / 0xffffffff;
  };
  const out: number[] = [];
  let p = start;
  for (let i = 0; i < n; i++) {
    const noise = (rand() - 0.5) * 2 * noiseAmp;
    p = p * (1 + drift + noise);
    if (p <= 0) p = 0.01;
    out.push(p);
  }
  return out;
}

const up = makeSeries(300, 100, 0.004, 0.01, 42); // 상승추세 · 완만한 변동
const down = makeSeries(300, 300, -0.004, 0.01, 7); // 하락추세
const jumpy = makeSeries(300, 100, 0.0, 0.05, 99); // 고변동

describe("momentumLens — 특성화", () => {
  it("상승계열(ko): 전체 LensRead 고정", async () => {
    expect(await momentum.compute(sd({ closes: up }), "ko")).toMatchInlineSnapshot(`
      {
        "about": "오른 주식은 한동안 더 오르는 '관성'이 시장에 있다는 아이디어예요. 1993년 제가디시·티트만이 데이터로 처음 밝혔고, 좋은 소식에 사람들이 천천히 반응하는 심리 때문이라 봐요 — 그래서 최근 강한 주식을 따라가는 추세추종에 씁니다.",
        "detail": {
          "12-1모멘텀%": 210.84,
          "12개월%": 248.41,
          "1개월%": 13.08,
          "3개월%": 41.01,
          "6개월%": 87.31,
        },
        "grade": "검증",
        "gradeTier": "strong",
        "headline": "12-1 210.84%",
        "horizon": "mid",
        "key": "momentum",
        "long": "강세",
        "name": "모멘텀",
        "nameEn": "Momentum (12-1)",
        "note": "12-1 모멘텀(Jegadeesh-Titman): 롱숏(고−저 3분위·150개월) 백테스트에서 방향성이 통계적으로 유의(t≈2.5·샤프 0.71·양(+)의 달 67%), 거래비용 차감·시장/규모/가치(FF3) 조정 후에도 유지 — '추세 지속' 방향은 견고. 단 수익 '수준'은 생존편향·동일가중으로 부풀려져 실전 기대치 아님(방향이 맞다는 뜻이지 수익 보장 아님). 주가 $5+ 투자가능 종목 한정 — 페니스탁 포함 시 역전. · 3중 교차검증(초·중·후반 3구간·STEP559): 3구간 모두 +방향(전체 t≈3.6), 성장주 강세기(fold2)만 약화되나 부호 유지 = 시기 무관 단단.",
        "outlook": "단기~중기 유리한 편 — 강한 추세는 역사적으로 한동안 이어지는 편이에요 (검증된 경향·보장은 아님).",
        "short": "강세",
        "spectrum": {
          "active": 2,
          "labels": [
            "약세",
            "중립",
            "강세",
          ],
        },
        "state": "up",
        "summary": "요즘 강하게 오른 종목이 계속 갈지 보는 방법 — 오르는 흐름이 이어지는 장에 잘 맞아요.",
        "value": 210.84,
        "verdict": {
          "phrase": "강한 상승 추세",
          "plain": "최근 꾸준히 오르고 있어요. 이 기법은 오르던 흐름이 한동안 더 이어진다고 봐요.",
          "tone": "pos",
        },
      }
    `);
  });
  it("하락계열(ko): 방향 필드 고정", async () => {
    const r = await momentum.compute(sd({ closes: down }), "ko");
    expect({ key: r.key, grade: r.grade, long: r.long, state: r.state, value: r.value, headline: r.headline }).toMatchInlineSnapshot(`
      {
        "grade": "검증",
        "headline": "12-1 -65.06%",
        "key": "momentum",
        "long": "약세",
        "state": "down",
        "value": -65.06,
      }
    `);
  });
  it("상승계열(en): 카피 경로 고정", async () => {
    const r = await momentum.compute(sd({ closes: up }), "en");
    expect({ key: r.key, name: r.name, summary: r.summary, long: r.long, state: r.state }).toMatchInlineSnapshot(`
      {
        "key": "momentum",
        "long": "강세",
        "name": "Momentum",
        "state": "up",
        "summary": "Whether a stock that's been climbing keeps climbing — best when trends hold.",
      }
    `);
  });
});

describe("technicalLens — 특성화", () => {
  it("상승계열(ko): 전체 LensRead 고정", async () => {
    expect(await technical.compute(sd({ closes: up }), "ko")).toMatchInlineSnapshot(`
      {
        "about": "차트의 가격·패턴으로 '지금 과열인지, 추세가 위인지'를 보는 전통적 기술적 분석이에요. RSI는 1978년 와일더가 만든 과열·침체 지표, 이동평균선은 일정 기간의 평균 가격이에요 — 단기 흐름을 빠르게 훑는 참고 도구예요(단독 신호로는 약함).",
        "detail": {
          "200일선대비%": 61.18,
          "52주위치%": 100,
          "RSI(14)": 94.8,
        },
        "grade": "참고용",
        "gradeTier": "ref",
        "headline": "200일선 61.18%",
        "horizon": "short",
        "key": "technical",
        "long": "상승추세",
        "name": "기술",
        "nameEn": "Technical (RSI · MA)",
        "note": "기술 신뢰도 재검(월별 롱숏·153개월): RSI 침체매수(저RSI−고RSI)는 오히려 손실(연 −8.7%·CAPM 알파 t≈−2.0로 유의하게 음)이고 회전율 66%로 비용 최악 → 평균회귀 완전 기각(과열=모멘텀이 이김). 200일선 위−아래는 방향 +지만 통계 약함(t≈1.6)이고 모멘텀 팩터에 흡수 = 독립 신호 아님(모멘텀의 약한 사촌). → RSI·52주위치·이동평균은 '지금 상태' 표시일 뿐 매매신호 아님, 추세는 모멘텀 렌즈로. 참고용. · 3중 교차검증(STEP559): 200일선 추세 성분은 3구간 견고(t≈2.7)하나 FF3는 모멘텀을 통제하지 못함 — 이 견고함은 모멘텀과 겹치는 신호일 뿐(독립 아님). 이미 모멘텀으로 검증된 방향이라 여기선 참고용 유지.",
        "outlook": "단기 상태: 추세 위 — 참고용이에요 (모멘텀과 겹치는 신호).",
        "short": "과열",
        "spectrum": {
          "active": 2,
          "labels": [
            "추세 아래",
            "중립",
            "추세 위",
          ],
        },
        "state": "up",
        "summary": "차트로 지금 과열인지·흐름이 위인지 보는 방법 — 현재 상태를 빠르게 훑는 참고용이에요.",
        "value": 61.18,
        "verdict": {
          "phrase": "상승 추세",
          "plain": "지금 가격이 장기 평균선 위에 있어요. 단기 흐름을 빠르게 훑는 참고용이에요.",
          "tone": "pos",
        },
      }
    `);
  });
  it("하락계열(ko): 방향 필드 고정", async () => {
    const r = await technical.compute(sd({ closes: down }), "ko");
    expect({ key: r.key, grade: r.grade, short: r.short, long: r.long, state: r.state, value: r.value, headline: r.headline, detail: r.detail }).toMatchInlineSnapshot(`
      {
        "detail": {
          "200일선대비%": -37.21,
          "52주위치%": 0.36,
          "RSI(14)": 22.92,
        },
        "grade": "참고용",
        "headline": "200일선 -37.21%",
        "key": "technical",
        "long": "하락추세",
        "short": "침체",
        "state": "down",
        "value": -37.21,
      }
    `);
  });
});

describe("valuationLens — 특성화", () => {
  it("저PER(ko): 전체 LensRead 고정", async () => {
    expect(await valuation.compute(sd({ pe: 8, pb: 1.2 }), "ko")).toMatchInlineSnapshot(`
      {
        "about": "기업의 이익·순자산에 비해 주가가 싼 '가치주'를 사는 접근이에요. 벤저민 그레이엄의 가치투자에서 출발해, 파마·프렌치가 '싼 주식이 장기적으로 낫다'(가치 프리미엄)를 데이터로 정립했어요 — 시장이 인기 없는 주식을 과하게 싸게 판다는 생각이 바탕이에요.",
        "detail": {
          "PBR": 1.2,
          "PER": 8,
        },
        "grade": "약한 신호",
        "gradeTier": "partial",
        "headline": "PER 8",
        "horizon": "long",
        "key": "valuation",
        "long": "낮음",
        "name": "밸류(가치)",
        "nameEn": "Value (E/P · B/M)",
        "note": "밸류(가치)는 학계 정설 팩터(Fama-French HML) — 우리 백테스트도 이를 재현(βHML≈0.71). 단 우리 표본(2010~24) 월별 롱숏에선 통계적으로 약함(E/P t≈0.9·B/M t≈1.5, 유의 미달) — 최근 ~15년 가치주 부진(성장주 우위)과 일치. 방향은 +(연 +6~9%)·연1회 리밸런스라 비용 낮으나 '지금 시기 유효'라 단정 못 함. PER·PBR은 단일종목 절대값이라 같은 업종 내 상대비교로(섹터·성장성 무시 오독). 예측·보장 아님. · 3중 교차검증(코호트 3분할·STEP560): fold2(2016~20 성장주 강세기) 방향 역전 = 표본 약함 + 시기 의존(가치주 부진기엔 안 됨). βHML0.72로 학계 HML은 재확인.",
        "outlook": "장기 유리한 편 — 싼 주식은 역사적으로 장기 우위 (가치 프리미엄, 단 최근 표본선 약함).",
        "short": null,
        "spectrum": {
          "active": 0,
          "labels": [
            "싼 편",
            "보통",
            "비싼 편",
          ],
        },
        "state": "cheap",
        "summary": "버는 돈·가진 자산에 비해 주가가 싼지 보는 방법 — 길게 보는 투자에 잘 맞아요.",
        "value": 8,
        "verdict": {
          "phrase": "이익 대비 싼 편",
          "plain": "버는 돈에 비해 주가가 낮은 '가치주' 성격이에요. 길게 보는 투자에서 눈여겨보는 특징이에요.",
          "tone": "pos",
        },
      }
    `);
  });
  it("고PER(ko): rich 상태", async () => {
    const r = await valuation.compute(sd({ pe: 30, pb: 5 }), "ko");
    expect({ key: r.key, long: r.long, state: r.state, value: r.value, headline: r.headline }).toMatchInlineSnapshot(`
      {
        "headline": "PER 30",
        "key": "valuation",
        "long": "높음",
        "state": "rich",
        "value": 30,
      }
    `);
  });
  it("PER 없음(ko): na 상태", async () => {
    const r = await valuation.compute(sd({ pe: null, pb: null }), "ko");
    expect({ key: r.key, long: r.long, state: r.state, value: r.value, headline: r.headline, spectrum: r.spectrum }).toMatchInlineSnapshot(`
      {
        "headline": null,
        "key": "valuation",
        "long": null,
        "spectrum": null,
        "state": "na",
        "value": null,
      }
    `);
  });
});

describe("lowVolLens — 특성화", () => {
  it("완만계열(ko): 전체 LensRead 고정", async () => {
    expect(await lowVol.compute(sd({ closes: up }), "ko")).toMatchInlineSnapshot(`
      {
        "about": "덜 흔들리는 안정적 주식이 크게 요동치는 주식보다 위험 대비 성과가 낫다는 발견이에요(저변동성 이례현상). '대박'을 노려 변동 큰 주식에 사람이 몰려 비싸지고, 지루한 우량주는 저평가되기 때문이라 설명해요 — 방어·위험 관리에 씁니다.",
        "detail": {
          "연변동성%": 8.89,
        },
        "grade": "검증(방어)",
        "gradeTier": "strong",
        "headline": "연변동성 8.89%",
        "horizon": "long",
        "key": "lowvol",
        "long": "저변동",
        "name": "저변동성",
        "nameEn": "Low Volatility (BAB)",
        "note": "저변동성(BAB): 백테스트(투자가능 $5+·161개월)에서 저변동군 위험이 고변동군의 ~18%로 극적으로 낮고(방어), 위험조정 알파 유의(CAPM t≈3.1·FF3 t≈2.6, 시장베타 음(−)=방어적). 회전율 낮아 거래비용에도 강함 → 위험관리·방어 렌즈로 유효. 단 '저변동이 수익도 더 높다'는 단순 수익차는 통계적으로 약함(롱숏 t≈1.6), 수준도 편향 과대 → 수익 우위 단정 아님, 위험대비가 핵심. 보장 아님. · 3중 교차검증(STEP559): 단순 저−고 수익 롱숏은 3구간서 음수·부호 뒤집힘 = '저변동이 수익도 더 높다'는 아님 재확인. 이 렌즈 근거는 raw 수익이 아니라 위험대비 방어(BAB 알파·낮은 위험)임.",
        "outlook": "위험: 낮은 편(방어적) — 수익 방향이 아니라 '덜 흔들린다'는 관점이에요.",
        "short": null,
        "spectrum": {
          "active": 0,
          "labels": [
            "안정적",
            "보통",
            "출렁임",
          ],
        },
        "state": "calm",
        "summary": "덜 출렁이는 안정적인 종목인지 보는 방법 — 하락장에서 방어적으로 유용해요.",
        "value": 8.89,
        "verdict": {
          "phrase": "낮은 변동성",
          "plain": "가격이 크게 출렁이지 않는 편이에요. 하락장에서 방어적으로 버티기 좋은 성격이에요.",
          "tone": "pos",
        },
      }
    `);
  });
  it("고변동계열(ko): jumpy 상태", async () => {
    const r = await lowVol.compute(sd({ closes: jumpy }), "ko");
    expect({ key: r.key, long: r.long, state: r.state, value: r.value, headline: r.headline }).toMatchInlineSnapshot(`
      {
        "headline": "연변동성 44.75%",
        "key": "lowvol",
        "long": "보통",
        "state": "jumpy",
        "value": 44.75,
      }
    `);
  });
});

describe("qualityLens — 특성화", () => {
  it("고GP/A(ko): 전체 LensRead 고정", async () => {
    expect(await quality.compute(sd({ financials: fin([{ totalAssets: 100, grossProfit: 50 }]) }), "ko")).toMatchInlineSnapshot(`
      {
        "about": "매출총이익을 자산으로 나눈 '총수익성'으로 회사의 질을 보는 방법이에요. 노비-마르크스가 2013년 '싼 것(가치)만큼 질 좋은 것도 중요하다'며 데이터로 밝혔어요 — 자산을 잘 굴려 꾸준히 돈 버는 회사가 장기적으로 낫다는 생각이 바탕이에요.",
        "detail": {
          "GP/A%": 50,
        },
        "grade": "검증",
        "gradeTier": "strong",
        "headline": "GP/A 50%",
        "horizon": "long",
        "key": "quality",
        "long": "높음",
        "name": "퀄리티",
        "nameEn": "Quality (GP/A)",
        "note": "퀄리티(Gross Profitability, Novy-Marx): 매출총이익/총자산. 백테스트(투자가능 $5+·13코호트) 고−저 롱숏 t≈2.9·샤프 0.78·FF3 알파 t≈2.5(시장/규모/가치 넘는 독립 프리미엄)·회전율 낮아 비용 강건 → 검증. 단 수익 '수준'은 생존편향·동일가중으로 과대(방향·유의만 신뢰). ROE는 별도 검증서 유의 미달(대형주 편중)이라 제외. 은행은 매출총이익 구조상 미적용. · 3중 교차검증(코호트 3분할·STEP560): 3/3 구간 +방향·전체 t≈3.2·FF3 알파 t≈2.75(βHML−0.22 독립) = 검증 재확인, 7렌즈 중 가장 단단.",
        "outlook": "장기 유리한 편 — 알짜 우량주는 역사적으로 장기 우위 (검증된 경향).",
        "short": null,
        "spectrum": {
          "active": 2,
          "labels": [
            "낮음",
            "보통",
            "알짜",
          ],
        },
        "state": "high",
        "summary": "회사가 자산 대비 돈을 잘 버는 '알짜'인지 보는 방법 — 튼튼한 우량주를 고를 때 잘 맞아요.",
        "value": 50,
        "verdict": {
          "phrase": "높은 수익성",
          "plain": "자산 대비 이익을 꾸준히 잘 내는 회사예요. 질 좋은 우량주를 고를 때 눈여겨보는 특징이에요.",
          "tone": "pos",
        },
      }
    `);
  });
  it("저GP/A(ko): low 상태", async () => {
    const r = await quality.compute(sd({ financials: fin([{ totalAssets: 100, grossProfit: 5 }]) }), "ko");
    expect({ key: r.key, long: r.long, state: r.state, value: r.value, headline: r.headline }).toMatchInlineSnapshot(`
      {
        "headline": "GP/A 5%",
        "key": "quality",
        "long": "낮음",
        "state": "low",
        "value": 5,
      }
    `);
  });
  it("매출총이익 없음(ko): na 상태(은행)", async () => {
    const r = await quality.compute(sd({ financials: fin([{ totalAssets: 100 }]) }), "ko");
    expect({ key: r.key, long: r.long, state: r.state, value: r.value, headline: r.headline }).toMatchInlineSnapshot(`
      {
        "headline": null,
        "key": "quality",
        "long": null,
        "state": "na",
        "value": null,
      }
    `);
  });
});

describe("assetGrowthLens — 특성화", () => {
  it("공격적 성장(ko): 전체 LensRead 고정", async () => {
    expect(await assetGrowth.compute(sd({ financials: fin([{ totalAssets: 100 }, { totalAssets: 130 }]) }), "ko")).toMatchInlineSnapshot(`
      {
        "about": "회사가 설비 투자·인수 등으로 자산을 얼마나 공격적으로 늘리는지 보는 지표예요. 2008년 쿠퍼·굴렌·실이 '자산을 빠르게 불린 회사일수록 이후 수익은 오히려 약하다'를 데이터로 밝혔어요(과잉 투자·무리한 확장 경계). 파마·프렌치 5팩터 중 투자 팩터(CMA)이기도 해요 — 자본을 신중히 쓰는 회사를 선호하는 관점이에요.",
        "detail": {
          "자산성장%": 30,
        },
        "grade": "약한 신호",
        "gradeTier": "partial",
        "headline": "자산성장 30%",
        "horizon": "long",
        "key": "assetgrowth",
        "long": "공격적",
        "name": "자산성장",
        "nameEn": "Asset Growth (CMA)",
        "note": "자산성장(Asset Growth·투자팩터 — Cooper-Gulen-Schill 2008 / Fama-French 5팩터 CMA): 총자산 전년比 증가율. 백테스트(투자가능 $5+·13코호트) 저−고(보수−공격) 롱숏 방향은 +(연 ~+8%)이고 시장·규모·가치(FF3)와 독립적(βHML≈0.17 — 밸류의 재포장이 아닌 별개의 '자본 규율' 축)이나, 우리 표본선 통계적으로 유의 미달(t≈1.6). → '자산을 공격적으로 키운 회사가 이후 수익이 약한 편'이라는 방향은 학계 정설(과잉투자 경계)이나 우리 데이터론 확신 못 함(표본 약함). 자본 규율의 참고 축으로 보세요. 예측·보장 아님. 은행 등은 자산 성격이 달라 해석 주의. · 3중 교차검증(코호트 3분할·STEP560): 3구간 방향 3/3 일관(단 각 구간 t<2) — 표본약함이나 방향은 시기 무관 일관(밸류보다 견고).",
        "outlook": "길게 보면 불리한 편 — 몸집을 공격적으로 키운 회사는 이후 성과가 약했어요 (다만 근거는 아직 약해요).",
        "short": null,
        "spectrum": {
          "active": 2,
          "labels": [
            "보수적",
            "보통",
            "공격적",
          ],
        },
        "state": "aggressive",
        "summary": "회사가 자산(몸집)을 얼마나 빠르게 불리는지 보는 방법 — 너무 공격적으로 키우면 이후 성과가 약한 편이에요.",
        "value": 30,
        "verdict": {
          "phrase": "공격적 확장",
          "plain": "자산을 빠르게 불리는 회사예요. 역사적으로 이렇게 급히 몸집을 키운 회사는 이후 성과가 약한 편이라, 참고해서 볼 신호예요.",
          "tone": "warn",
        },
      }
    `);
  });
  it("보수적(ko): conservative 상태", async () => {
    const r = await assetGrowth.compute(sd({ financials: fin([{ totalAssets: 100 }, { totalAssets: 103 }]) }), "ko");
    expect({ key: r.key, long: r.long, state: r.state, value: r.value, headline: r.headline }).toMatchInlineSnapshot(`
      {
        "headline": "자산성장 3%",
        "key": "assetgrowth",
        "long": "보수적",
        "state": "conservative",
        "value": 3,
      }
    `);
  });
});
