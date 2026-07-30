// 특성화(characterization) 테스트 — 리팩토링 전 6개 렌즈의 현재 출력을 고정해 "동작 불변"을 보증한다.
// 원칙: 여기 스냅샷/기대값은 리팩토링 전 실제 출력의 "지상 진실(ground truth)"이다.
//   리팩토링 후에도 동일해야 통과 → 통과 실패 = 동작이 바뀐 것(테스트가 아니라 코드를 고칠 것).
// 결정론 픽스처(seeded)로 가격계열을 만들어 재현 가능하게 한다.
import { describe, it, expect } from "vitest";
import { momentum, technical, valuation, lowVol, quality, assetGrowth } from "./lenses";
import { DETAIL_LABELS, LENS_COPY, LEVEL_LABELS } from "./lensCopy";
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

// STEP 805: compute가 분포 유도 컷을 주입받는다. 특성화는 '기존 상수와 동일한 컷'을 넣어
// 판정 매핑이 기존 상태를 재현하는지 고정(이중컷 통일로 momentum·lowvol '장기 라벨'만 의도적으로 바뀜).
const CUTS = {
  momentum: { lo: -10, hi: 10, n: 100, asOf: "2026-01-01" },
  lowvol: { lo: 20, hi: 40, n: 100, asOf: "2026-01-01" },
  valuation: { lo: 10, hi: 25, n: 100, asOf: "2026-01-01" },
  quality: { lo: 15, hi: 40, n: 100, asOf: "2026-01-01" },
  assetgrowth: { lo: 5, hi: 20, n: 100, asOf: "2026-01-01" },
};

const up = makeSeries(300, 100, 0.004, 0.01, 42); // 상승추세 · 완만한 변동
const down = makeSeries(300, 300, -0.004, 0.01, 7); // 하락추세
const jumpy = makeSeries(300, 100, 0.0, 0.05, 99); // 고변동

describe("momentumLens — 특성화", () => {
  it("상승계열(ko): 전체 LensRead 고정", async () => {
    expect(await momentum.compute(sd({ closes: up }), "ko", CUTS)).toMatchInlineSnapshot(`
      {
        "about": "오른 주식은 한동안 더 오르는 '관성'이 시장에 있다는 아이디어예요. 1993년 제가디시·티트만이 데이터로 처음 밝혔고, 좋은 소식에 사람들이 천천히 반응하는 심리 때문이라 봐요 — 그래서 최근 강한 주식을 따라가는 추세추종에 씁니다.",
        "cutSource": {
          "asOf": "2026-01-01",
          "market": "US",
          "n": 100,
        },
        "cutoffs": {
          "hi": 10,
          "lo": -10,
        },
        "detail": {
          "mom12_1": 210.84,
          "ret12m": 248.41,
          "ret1m": 13.08,
          "ret3m": 41.01,
          "ret6m": 87.31,
        },
        "grade": "검증",
        "gradeTier": "strong",
        "headline": "12-1 210.84%",
        "horizon": "mid",
        "key": "momentum",
        "long": "상위권",
        "name": "모멘텀",
        "nameEn": "Momentum (12-1)",
        "note": "12-1 모멘텀(현상=Jegadeesh-Titman 1993 · 계산 사양=Carhart(1997) UMD/FF 모멘텀 팩터): 오른 주식이 한동안 더 오르는 '추세 지속'은 학계에서 가장 널리 재현된 이상현상이에요. 우리 백테스트도 방향이 +이고, 초·중·후반 세 구간으로 나눠도 부호가 3/3 일관(시기 무관)이며, 팩터 회귀에서 우리 신호가 학계 모멘텀 팩터에 흡수돼요(βMom 큼 = '우리 모멘텀 = 학계 모멘텀'). 시장·규모·가치(FF3)를 넘는 알파도 +(대체로 유의). 단 세기(t·샤프)는 표본 구간에 따라 흔들려 특정 값으로 못박지 않고, 수익 '수준'은 생존편향·동일가중으로 부풀려져 실전 기대치가 아니에요(방향이 맞다는 뜻이지 수익 보장 아님). ⚠️ 12~18개월 뒤 부분 반전·급반등장 '모멘텀 크래시'가 알려진 실패 모드예요. 판정은 시장 분포 순위(상하위 30%)라 절대 방향이 아니에요(생존자 상위 1,000 사이 순위).",
        "outlook": "단기~중기 유리한 편 — 모멘텀 상위권 종목이 역사적으로 한동안 상대 우위였던 경향 (검증된 경향·보장은 아님).",
        "short": "강세",
        "spectrum": {
          "active": 2,
          "labels": [
            "하위권",
            "중간",
            "상위권",
          ],
        },
        "state": "up",
        "summary": "요즘 강하게 오른 종목이 계속 갈지 보는 방법 — 오르는 흐름이 이어지는 장에 잘 맞아요.",
        "value": 210.84,
        "verdict": {
          "phrase": "모멘텀 상위권",
          "plain": "12-1 모멘텀이 시장에서 상위권이에요. 이 기법은 상대적으로 앞선 종목을 눈여겨봐요 (절대 수치는 위 숫자 참고).",
          "tone": "pos",
        },
      }
    `);
  });
  it("하락계열(ko): 방향 필드 고정", async () => {
    const r = await momentum.compute(sd({ closes: down }), "ko", CUTS);
    expect({ key: r.key, grade: r.grade, long: r.long, state: r.state, value: r.value, headline: r.headline }).toMatchInlineSnapshot(`
      {
        "grade": "검증",
        "headline": "12-1 -65.06%",
        "key": "momentum",
        "long": "하위권",
        "state": "down",
        "value": -65.06,
      }
    `);
  });
  it("상승계열(en): 카피 경로 고정", async () => {
    const r = await momentum.compute(sd({ closes: up }), "en", CUTS);
    expect({ key: r.key, name: r.name, summary: r.summary, long: r.long, state: r.state }).toMatchInlineSnapshot(`
      {
        "key": "momentum",
        "long": "Top-tier",
        "name": "Momentum",
        "state": "up",
        "summary": "Whether a stock that's been climbing keeps climbing — best when trends hold.",
      }
    `);
  });
});

describe("technicalLens — 특성화", () => {
  it("상승계열(ko): 전체 LensRead 고정", async () => {
    expect(await technical.compute(sd({ closes: up }), "ko", CUTS)).toMatchInlineSnapshot(`
      {
        "about": "차트의 가격·패턴으로 '지금 과열인지, 추세가 위인지'를 보는 전통적 기술적 분석이에요. RSI는 1978년 와일더가 만든 과열·침체 지표, 이동평균선은 일정 기간의 평균 가격이에요 — 단기 흐름을 빠르게 훑는 참고 도구예요(단독 신호로는 약함).",
        "cutoffs": {
          "hi": 70,
          "lo": 30,
        },
        "detail": {
          "ma200vs": 61.18,
          "pos52w": 100,
          "rsi14": 92.73,
        },
        "grade": "참고용",
        "gradeTier": "ref",
        "headline": "200일선 61.18%",
        "horizon": "short",
        "key": "technical",
        "long": "상승추세",
        "name": "기술",
        "nameEn": "Technical (RSI · MA)",
        "note": "기술 지표는 7개 렌즈 중 유일하게 학술 검증 팩터가 아니에요(참고용). 판정(위/아래)은 200일선 대비 기준이고, RSI·52주 위치는 함께 보여주되 판정엔 안 써요. · RSI(와일더 1978): 30/70 과열·침체는 와일더 본인의 경험칙이지 통계 검정 결과가 아니에요. 침체 매수(저RSI 롱)는 우리 재검(월별 롱숏)에서 수익 우위가 없었고(무의미) 회전율이 높아 비용만 커요 — 매매신호로 통하지 않아요. · 200일선 추세: 이동평균 추세 규칙은 추세추종·시계열 모멘텀 연구(Moskowitz 외 2012·Faber 2007)와 사촌지간이지만 그 근거는 지수·자산군 수준이고(개별 종목 아님), 고전적 검정(Brock 외 1992)도 데이터 스누핑을 보정하니 유의성이 사라졌어요(Sullivan-Timmermann-White 1999) — 그래서 '검증됐다'고 못 해요. 우리 재검에서도 200일선 추세는 방향은 +지만 사실상 (횡단면) 모멘텀과 겹치는 신호라 독립적이지 않아요. → RSI·52주위치·이동평균은 '지금 상태' 표시일 뿐 매매신호 아님, 추세 판단은 모멘텀 렌즈로. 개별 종목·거래비용·데이터 스누핑을 감안하면 단독 근거로 삼지 마세요.",
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
    const r = await technical.compute(sd({ closes: down }), "ko", CUTS);
    expect({ key: r.key, grade: r.grade, short: r.short, long: r.long, state: r.state, value: r.value, headline: r.headline, detail: r.detail }).toMatchInlineSnapshot(`
      {
        "detail": {
          "ma200vs": -37.21,
          "pos52w": 0.36,
          "rsi14": 20.38,
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
    expect(await valuation.compute(sd({ pe: 8, pb: 1.2 }), "ko", CUTS)).toMatchInlineSnapshot(`
      {
        "about": "기업의 이익·순자산에 비해 주가가 싼 '가치주'를 사는 접근이에요. 벤저민 그레이엄이 철학(안전마진)으로 씨를 뿌렸고, 데이터로 입증한 건 따로예요 — 이익 대비 싼 효과는 바수(1977), 순자산 대비 싼 효과는 로젠버그 외(1985)가 밝혔고 파마·프렌치가 이를 'HML' 가치 프리미엄으로 정식화했어요. 시장이 인기 없는 주식을 과하게 싸게 판다는 생각이 바탕이에요.",
        "cutSource": {
          "asOf": "2026-01-01",
          "market": "US",
          "n": 100,
        },
        "cutoffs": {
          "hi": 25,
          "lo": 10,
        },
        "detail": {
          "pbr": 1.2,
          "per": 8,
        },
        "grade": "약한 신호",
        "gradeTier": "partial",
        "headline": "PER 8",
        "horizon": "long",
        "key": "valuation",
        "long": "낮음",
        "name": "밸류(가치)",
        "nameEn": "Value (E/P · B/M)",
        "note": "밸류(가치): 이익 대비 싼 효과는 바수(1977·E/P), 순자산 대비 싼 효과는 로젠버그 외(1985)·파마-프렌치 HML(B/M)로 정식화된 학계 정설이에요. 우리 백테스트(연1회 형성·월별 롱숏·저비용)도 방향이 +이고, 우리 밸류 신호가 학계 HML 팩터에 실제로 대응해요(βHML 양(+)·큼 = '우리 밸류=학계 가치팩터'). 단 프리미엄의 세기·통계적 유의성은 표본 구간에 따라 흔들려(순자산 B/M이 이익 E/P보다 일관되게 강함) 특정 t값으로 못박지 않아요. ⚠️ 최근 ~15년 가치주 부진(성장주 우위)은 학계도 약화를 논쟁 중이라(파마-프렌치 2021: 후반기 프리미엄 하락, 단 변동성이 커 '소멸'이라 단정은 못 함) '지금 시기 유효'라 단정 불가. 화면 판정은 PER(E/P) 기준이고(KR=직전 연간=바수 방식 / US=최근 4분기 TTM), 적자(순이익≤0)는 바수·FF처럼 산출에서 제외해요. 유니버스가 '오늘 상위'(KR·US 모두 시총)라 생존편향이 있고, PER·PBR은 단일종목 절대값이라 같은 업종 안에서 상대비교로 봐야 오독이 없어요. 예측·보장 아님.",
        "outlook": "장기 유리한 편 — 싼 주식은 역사적으로 장기 우위 (가치 프리미엄, 단 최근 표본선 약함).",
        "short": null,
        "spectrum": {
          "active": 0,
          "labels": [
            "싼 편",
            "중간",
            "비싼 편",
          ],
        },
        "state": "cheap",
        "summary": "버는 돈·가진 자산에 비해 주가가 싼지 보는 방법 — 길게 보는 투자에 잘 맞아요.",
        "value": 8,
        "valueBasis": null,
        "verdict": {
          "phrase": "싼 편(시장 대비)",
          "plain": "이익 대비 주가가 시장에서 싼 편이에요. 길게 보는 가치 관점에서 눈여겨보는 특징이에요.",
          "tone": "pos",
        },
      }
    `);
  });
  it("고PER(ko): rich 상태", async () => {
    const r = await valuation.compute(sd({ pe: 30, pb: 5 }), "ko", CUTS);
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
    const r = await valuation.compute(sd({ pe: null, pb: null }), "ko", CUTS);
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
    expect(await lowVol.compute(sd({ closes: up }), "ko", CUTS)).toMatchInlineSnapshot(`
      {
        "about": "덜 흔들리는 안정적 주식이 크게 요동치는 주식보다 위험 대비 성과가 낫다는 발견이에요(저변동성 이례현상). '대박'을 노려 변동 큰 주식에 사람이 몰려 비싸지고, 지루한 우량주는 저평가되기 때문이라 설명해요 — 방어·위험 관리에 씁니다.",
        "cutSource": {
          "asOf": "2026-01-01",
          "market": "US",
          "n": 100,
        },
        "cutoffs": {
          "hi": 40,
          "lo": 20,
        },
        "detail": {
          "vol": 8.89,
        },
        "grade": "검증(방어)",
        "gradeTier": "strong",
        "headline": "연변동성 8.89%",
        "horizon": "long",
        "key": "lowvol",
        "long": "저변동",
        "name": "저변동성",
        "nameEn": "Low Volatility",
        "note": "저변동성(현상=Baker-Bradley-Wurgler 2011 · 우리 측정=1년 일별 실현변동성): 저변동군은 고변동군보다 실현 위험이 훨씬 낮고(방어) 시장베타가 음(−)이라 하락장에 강한 성격이에요. 회전율도 낮아 거래비용에 강건 → 위험관리·방어 렌즈로 유효. 단 '저변동이 수익도 더 높다'는 수익 우위는 우리 표본에서 통계적으로 약하고 불안정해요(표본 구간에 따라 유의성이 흔들리고 부호도 뒤집힘) — 위험 대비 방어가 핵심이지 수익 보장이 아니에요. · 3중 교차검증(STEP559): 단순 저−고 수익 롱숏은 구간마다 부호가 뒤집혀 '저변동이 수익도 더 높다'는 아님 재확인. 이 렌즈 근거는 raw 수익이 아니라 위험대비 방어예요. ⚠️ 우리 측정은 BBW 원문(5년 월별 총변동성·5분위)과 달리 1년 일별 변동성·3분위이고, 유니버스도 '오늘 상위 1,000'(KR·US 모두 시총)이라 생존편향이 있어요.",
        "outlook": "위험: 시장 대비 낮은 편(방어적) — 수익 방향이 아니라 '덜 흔들린다'는 관점이에요.",
        "short": null,
        "spectrum": {
          "active": 0,
          "labels": [
            "변동 낮음",
            "중간",
            "변동 높음",
          ],
        },
        "state": "calm",
        "summary": "덜 출렁이는 안정적인 종목인지 보는 방법 — 하락장에서 방어적으로 유용해요.",
        "value": 8.89,
        "verdict": {
          "phrase": "변동 낮은 편(시장 대비)",
          "plain": "가격 변동이 시장에서 적은 편이에요. 하락장에서 방어적으로 버티는 성격이에요 (수익 방향 아님).",
          "tone": "pos",
        },
      }
    `);
  });
  it("고변동계열(ko): jumpy 상태", async () => {
    const r = await lowVol.compute(sd({ closes: jumpy }), "ko", CUTS);
    expect({ key: r.key, long: r.long, state: r.state, value: r.value, headline: r.headline }).toMatchInlineSnapshot(`
      {
        "headline": "연변동성 44.75%",
        "key": "lowvol",
        "long": "고변동",
        "state": "jumpy",
        "value": 44.75,
      }
    `);
  });
});

describe("qualityLens — 특성화", () => {
  it("고GP/A(ko): 전체 LensRead 고정", async () => {
    // STEP 819 §5: 전기 자산(80)≠당해 자산(100) — GP/A는 당해 기말 100 기준 50%. 분모를 전기말로 되돌리면 62.5%가 되어 이 스냅샷이 깨진다(회귀 잠금).
    expect(await quality.compute(sd({ financials: fin([{ totalAssets: 80 }, { grossProfit: 50, totalAssets: 100 }]) }), "ko", CUTS)).toMatchInlineSnapshot(`
      {
        "about": "매출총이익을 자산으로 나눈 '총수익성'으로 회사의 질을 보는 방법이에요. 노비-마르크스가 2013년 '싼 것(가치)만큼 질 좋은 것도 중요하다'며 데이터로 밝혔어요 — 자산을 잘 굴려 꾸준히 돈 버는 회사가 장기적으로 낫다는 생각이 바탕이에요.",
        "cutSource": {
          "asOf": "2026-01-01",
          "market": "US",
          "n": 100,
        },
        "cutoffs": {
          "hi": 40,
          "lo": 15,
        },
        "decomposition": {
          "identityKey": "qualityIdentity",
          "parts": [
            {
              "key": "revenue",
              "unit": "money",
              "value": null,
            },
            {
              "key": "cogs",
              "unit": "money",
              "value": null,
            },
            {
              "key": "grossProfit",
              "unit": "money",
              "value": 50,
            },
            {
              "key": "totalAssets",
              "unit": "money",
              "value": 100,
            },
            {
              "key": "grossMargin",
              "unit": "pct",
              "value": null,
            },
            {
              "key": "assetTurnover",
              "unit": "x",
              "value": null,
            },
          ],
          "source": "direct",
        },
        "detail": {
          "gpa": 50,
        },
        "grade": "검증",
        "gradeTier": "strong",
        "headline": "GP/A 50%",
        "horizon": "long",
        "key": "quality",
        "long": "높음",
        "name": "퀄리티",
        "nameEn": "Quality (GP/A)",
        "note": "퀄리티(총수익성/Gross Profitability — Novy-Marx 2013): 매출총이익(매출−매출원가) ÷ 같은 해 총자산. 원문에서 고−저 집단 롱숏이 시장·규모·가치(FF3)를 넘는 유의한 알파(월 ~0.5%·t≈4.5)를 냈고, 밸류(B/M)와 음의 상관이라 '가치의 다른 얼굴'(밸류와 독립·상호보완)로 검증됐어요. 우리 백테스트도 방향 +·밸류와 독립(βHML 음)이나 세기는 표본 구간에 따라 흔들려 특정 t값으로 못박지 않아요(수익 '수준'은 생존편향·동일가중으로 과대·유니버스=오늘 상위 1,000·KR·US 시총). ⚠️ 후속 연구(Ball 외 2015 'Deflating Profitability')는 이 효과가 분모(총자산)로 나눈 데서 상당 부분 나온다(밸류 성분이 섞임)며 영업이익 기준을 제안했고 파마-프렌치도 5팩터에서 영업수익성으로 갔어요 — 분모 민감성이 한계예요. 원문은 단독보다 '수익성 좋은 가치주 매수'처럼 밸류와 결합할 때 가장 강했어요. 은행·보험 등 매출총이익 항목이 없는 금융사는 산출 제외(원문도 금융 제외)되나, 명시적 업종필터가 아니라 매출총이익 보고 여부에 따른 것이라 리츠 등 일부는 값이 나올 수 있어요. '퀄리티'는 넓은 말이라 여기선 총수익성 한 지표로 좁혀 쓴 거예요(QMJ의 수익성·성장·안전 중 수익성 축). 예측·보장 아님.",
        "outlook": "장기 유리한 편 — 알짜 우량주는 역사적으로 장기 우위 (검증된 경향).",
        "short": null,
        "spectrum": {
          "active": 2,
          "labels": [
            "하위권",
            "중간",
            "상위권",
          ],
        },
        "state": "high",
        "summary": "회사가 자산 대비 돈을 잘 버는 '알짜'인지 보는 방법 — 튼튼한 우량주를 고를 때 잘 맞아요.",
        "timeSeries": null,
        "value": 50,
        "verdict": {
          "phrase": "수익성 상위권",
          "plain": "자산 대비 수익성이 시장 상위권이에요. 질 좋은 우량주를 고를 때 눈여겨보는 특징이에요.",
          "tone": "pos",
        },
      }
    `);
  });
  it("저GP/A(ko): low 상태", async () => {
    const r = await quality.compute(sd({ financials: fin([{ totalAssets: 100 }, { grossProfit: 5, totalAssets: 100 }]) }), "ko", CUTS);
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
    const r = await quality.compute(sd({ financials: fin([{ totalAssets: 100 }]) }), "ko", CUTS);
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
    expect(await assetGrowth.compute(sd({ financials: fin([{ totalAssets: 100 }, { totalAssets: 130 }]) }), "ko", CUTS)).toMatchInlineSnapshot(`
      {
        "about": "회사가 설비 투자·인수 등으로 자산을 얼마나 공격적으로 늘리는지 보는 지표예요. 2008년 쿠퍼·굴렌·실이 '자산을 빠르게 불린 회사일수록 이후 수익은 오히려 약하다'를 데이터로 밝혔어요(과잉 투자·무리한 확장 경계). 파마·프렌치 5팩터 중 투자 팩터(CMA)이기도 해요 — 자본을 신중히 쓰는 회사를 선호하는 관점이에요.",
        "cutSource": {
          "asOf": "2026-01-01",
          "market": "US",
          "n": 100,
        },
        "cutoffs": {
          "hi": 20,
          "lo": 5,
        },
        "detail": {
          "ag": 30,
        },
        "grade": "약한 신호",
        "gradeTier": "partial",
        "headline": "자산성장 30%",
        "horizon": "long",
        "key": "assetgrowth",
        "long": "공격적",
        "name": "자산성장",
        "nameEn": "Asset Growth (CMA)",
        "note": "자산성장(투자 팩터 — Cooper-Gulen-Schill 2008 / 파마-프렌치 5팩터 CMA · 같은 계열): 총자산 전년比 증가율((당기−전기)/전기). 자산을 공격적으로 불린 회사가 이후 수익이 약한 편이라는 이상현상 — 학계 정설이고 대규모 재현연구(Hou-Xue-Zhang 2020: 447개 이상현상 중 3분의 2가 탈락한 와중에도 살아남은 축)에서 견고했어요. 밸류와 독립(βHML 낮음 = '자본 규율'이라는 별개 축). ⚠️ 단 원문의 큰 효과(저−고 연 ~20%)는 소형·초소형주·동일가중에 크게 기대요 — 재현연구도 대형주·시총가중에선 훨씬 작아진다고 봤어요. 우리 유니버스는 오늘 상위 1,000(KR·US 모두 시총)이라 효과가 가장 센 초소형주 구간을 충분히 안 담아, 우리 표본에선 방향만 +이고 통계적으론 약해요(효과가 가짜라서가 아니라 센 구간을 안 담아서). 해석은 논쟁 중(CGS=과잉투자·과잉기대 행동재무 / q이론=합리적 투자결정 — 방향은 합의, 이유는 갈림). 은행·보험은 CGS 원문은 제외했으나 우리는 총자산이 있어 값이 나와요(은행 자산성장=예금·대출 팽창이라 제조업 설비투자와 뜻 달라 해석 주의). 유니버스='오늘 상위'라 생존편향. 예측·보장 아님.",
        "outlook": "길게 보면 불리한 편 — 몸집을 공격적으로 키운 회사는 이후 성과가 약했어요 (다만 근거는 아직 약해요).",
        "short": null,
        "spectrum": {
          "active": 2,
          "labels": [
            "보수적",
            "중간",
            "공격적",
          ],
        },
        "state": "aggressive",
        "summary": "회사가 자산(몸집)을 얼마나 빠르게 불리는지 보는 방법 — 너무 공격적으로 키우면 이후 성과가 약한 편이에요.",
        "value": 30,
        "verdict": {
          "phrase": "확장 공격적(시장 대비)",
          "plain": "자산 확장이 시장에서 공격적인 편이에요. 역사적으로 급히 몸집을 키운 회사는 이후 성과가 약한 편이라 참고해서 볼 신호예요.",
          "tone": "warn",
        },
      }
    `);
  });
  it("보수적(ko): conservative 상태", async () => {
    const r = await assetGrowth.compute(sd({ financials: fin([{ totalAssets: 100 }, { totalAssets: 103 }]) }), "ko", CUTS);
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

// ── STEP717 i18n — detail 키는 언어중립(stable), 표시 라벨만 언어별. ──
// 이 블록의 의무: (1) KR 화면이 한 글자도 안 바뀜을 코드로 고정 (2) 라벨 누락으로 en 화면에 원시 키(rsi14)가 새지 않게.
describe("DETAIL_LABELS · headline — i18n 무회귀", () => {
  // ko 라벨 = STEP717 이전 lib/lenses.ts의 한국어 detail 키와 바이트 동일. 하나라도 손대면 KR 화면이 바뀐 것.
  it("ko 라벨 = 이전 한국어 detail 키(바이트 동일)", () => {
    expect(DETAIL_LABELS.ko).toEqual({
      mom12_1: "12-1모멘텀%", ret1m: "1개월%", ret3m: "3개월%", ret6m: "6개월%", ret12m: "12개월%",
      rsi14: "RSI(14)", ma200vs: "200일선대비%", pos52w: "52주위치%",
      per: "PER", pbr: "PBR",
      vol: "연변동성%",
      gpa: "GP/A%",
      ag: "자산성장%",
      // STEP 831 §10-①: 퀄리티 GP/A 구성요소 분해 라벨(신규·기존 detail 줄엔 안 뜨고 분해 섹션에서만 사용).
      revenue: "매출", cogs: "매출원가", grossProfit: "매출총이익", totalAssets: "총자산",
      grossMargin: "매출총이익률%", assetTurnover: "자산회전율×",
    });
  });

  // 라벨이 없으면 화면은 fallback으로 stable 키 원문을 그린다("rsi14: 94.8") → 엔진이 내는 키는 전부 양쪽 언어에 있어야.
  it("엔진이 내는 모든 detail 키가 ko·en 라벨을 갖는다", async () => {
    const reads = await Promise.all([
      momentum.compute(sd({ closes: up }), "ko", CUTS),
      technical.compute(sd({ closes: up }), "ko", CUTS),
      valuation.compute(sd({ pe: 8, pb: 1.2 }), "ko", CUTS),
      lowVol.compute(sd({ closes: up }), "ko", CUTS),
      quality.compute(sd({ financials: fin([{ totalAssets: 100 }, { grossProfit: 50, totalAssets: 100 }]) }), "ko", CUTS),
      assetGrowth.compute(sd({ financials: fin([{ totalAssets: 100 }, { totalAssets: 130 }]) }), "ko", CUTS),
    ]);
    const keys = reads.flatMap((r) => Object.keys(r.detail));
    expect(keys).toHaveLength(13);
    for (const k of keys) {
      expect(DETAIL_LABELS.ko, `ko 라벨 없음: ${k}`).toHaveProperty(k);
      expect(DETAIL_LABELS.en, `en 라벨 없음: ${k}`).toHaveProperty(k);
    }
  });

  it("en 라벨엔 한글 없음", () => {
    for (const [k, v] of Object.entries(DETAIL_LABELS.en)) {
      expect(v, `en 라벨에 한글: ${k}=${v}`).not.toMatch(/[가-힣]/);
    }
  });

  // headline 접두어(200일선·연변동성·자산성장)의 en 경로. 숫자는 ko 스냅샷과 동일 픽스처라 값이 같아야(로케일이 계산을 안 바꿈).
  it("en headline = 영어 접두어 + 동일 수치", async () => {
    const tech = await technical.compute(sd({ closes: up }), "en", CUTS);
    const lv = await lowVol.compute(sd({ closes: up }), "en", CUTS);
    const ag = await assetGrowth.compute(sd({ financials: fin([{ totalAssets: 100 }, { totalAssets: 130 }]) }), "en", CUTS);
    expect(tech.headline).toBe("vs MA200 61.18%");
    expect(lv.headline).toBe("Ann. vol 8.89%");
    expect(ag.headline).toBe("Asset growth 30%");
  });
});

// ── STEP718 i18n — note(자세히·검증 근거) + short/long 라벨의 이중언어. ──
// 이 블록의 의무: (1) en 렌즈 출력에 한국어가 한 글자도 안 샌다 (2) en note가 통계·레퍼런스를 원문 그대로 보존한다
//   (번역이 수치를 흘리면 "검증된 기법"이라는 근거 자체가 무너짐 — 문장은 번역해도 숫자는 못 바꾼다).
describe("note · short/long — i18n 무회귀", () => {
  // 전 렌즈 × 전 상태(상승/하락/고변동 · 저PER/고PER · 고GP/A/저GP/A · 공격/보수)를 en으로 돌려 한글 스캔.
  async function allEnReads() {
    return Promise.all([
      momentum.compute(sd({ closes: up }), "en", CUTS),
      momentum.compute(sd({ closes: down }), "en", CUTS),
      technical.compute(sd({ closes: up }), "en", CUTS),
      technical.compute(sd({ closes: down }), "en", CUTS),
      valuation.compute(sd({ pe: 8, pb: 1.2 }), "en", CUTS),
      valuation.compute(sd({ pe: 30, pb: 5 }), "en", CUTS),
      lowVol.compute(sd({ closes: up }), "en", CUTS),
      lowVol.compute(sd({ closes: jumpy }), "en", CUTS),
      quality.compute(sd({ financials: fin([{ totalAssets: 100 }, { grossProfit: 50, totalAssets: 100 }]) }), "en", CUTS),
      quality.compute(sd({ financials: fin([{ totalAssets: 100 }, { grossProfit: 5, totalAssets: 100 }]) }), "en", CUTS),
      assetGrowth.compute(sd({ financials: fin([{ totalAssets: 100 }, { totalAssets: 130 }]) }), "en", CUTS),
      assetGrowth.compute(sd({ financials: fin([{ totalAssets: 100 }, { totalAssets: 103 }]) }), "en", CUTS),
    ]);
  }

  it("en 렌즈 출력의 모든 표시 문자열에 한글 0", async () => {
    for (const r of await allEnReads()) {
      const shown = [
        r.name, r.summary, r.about, r.grade, r.note, r.short, r.long, r.headline, r.outlook,
        r.verdict?.phrase, r.verdict?.plain, ...(r.spectrum?.labels ?? []),
      ];
      for (const s of shown) {
        if (s == null) continue;
        expect(s, `en 출력에 한글 누출(${r.key}): ${s}`).not.toMatch(/[가-힣]/);
      }
    }
  });

  it("ko note = STEP718 이전 lib/lenses.ts 인라인 리터럴(전 렌즈 비어있지 않음)", async () => {
    // 문자열 자체는 위 ko 전체 스냅샷이 바이트로 고정 — 여기선 LENS_COPY 경로가 실제로 물렸는지(빈 note 회귀 방지).
    const reads = await Promise.all([
      momentum.compute(sd({ closes: up }), "ko", CUTS),
      technical.compute(sd({ closes: up }), "ko", CUTS),
      valuation.compute(sd({ pe: 8, pb: 1.2 }), "ko", CUTS),
      lowVol.compute(sd({ closes: up }), "ko", CUTS),
      quality.compute(sd({ financials: fin([{ totalAssets: 100 }, { grossProfit: 50, totalAssets: 100 }]) }), "ko", CUTS),
      assetGrowth.compute(sd({ financials: fin([{ totalAssets: 100 }, { totalAssets: 130 }]) }), "ko", CUTS),
    ]);
    for (const r of reads) {
      expect(r.note, `ko note 없음: ${r.key}`).toBeTruthy();
      expect(r.note!.length, `ko note 너무 짧음: ${r.key}`).toBeGreaterThan(100);
    }
  });

  // 🔒 번역은 문장만 바꾼다 — 통계량·레퍼런스는 ko·en 양쪽에 "그대로" 있어야 한다.
  it("en note가 통계·레퍼런스를 원문 그대로 보존", () => {
    const TOKENS: Record<string, string[]> = {
      momentum: ["Jegadeesh-Titman 1993", "Carhart", "FF3", "βMom"], // STEP821: 재현 안 되는 자체 백테스트 t값(2.5·0.71·67%·3.6·150개월) 삭제 → 원전/구조 안정 레퍼런스만(ko·en 공통)
      technical: ["Moskowitz", "1992", "1999", "2012"], // STEP817: 재현 안 되는 자체 백테스트 t값(−8.7%·t≈−2.0·t≈1.6·t≈2.7) 삭제 → 원전 레퍼런스만(Wilder·BLL·STW·Moskowitz, ko·en 공통)
      valuation: ["HML", "βHML", "E/P", "B/M", "2021"], // STEP814: 재현 안 되는 백테스트 t값(0.9·1.5·βHML0.71·+6~9%) 삭제 → 언어공통 안정 레퍼런스만 보존 검사(ko 바수/en Basu는 언어차라 제외)
      lowvol: ["Baker-Bradley-Wurgler 2011", "STEP559", "1,000"], // STEP813: 재현 안 되는 t값(1.6·3.1·2.6·18%·161) 삭제 → 안정 레퍼런스만 보존 검사
      quality: ["Novy-Marx", "FF3", "2015", "QMJ", "B/M"], // STEP815: 재현 안 되는 자체 백테스트 t값(2.9·0.78·2.5·3.2·2.75) 삭제 → 원문/후속연구 안정 레퍼런스만(ko·en 공통)
      assetgrowth: ["Cooper-Gulen-Schill", "CMA", "2008", "Hou-Xue-Zhang 2020"], // STEP816: 재현 안 되는 자체 백테스트 t값(+8%·βHML0.17·t≈1.6) 삭제 → 원문/재현연구 안정 레퍼런스만(ko·en 공통)
    };
    for (const [lens, tokens] of Object.entries(TOKENS)) {
      const ko = LENS_COPY.ko[lens as keyof typeof LENS_COPY.ko] as { note: string };
      const en = LENS_COPY.en[lens as keyof typeof LENS_COPY.en] as { note: string };
      for (const tk of tokens) {
        expect(ko.note, `ko note에 토큰 없음(${lens}): ${tk}`).toContain(tk);
        expect(en.note, `en note가 수치를 흘림(${lens}): ${tk}`).toContain(tk);
      }
    }
  });

  // short/long 표시 라벨 — ko는 기존 한국어 리터럴과 바이트 동일(KR 화면 무회귀), en은 한글 0.
  it("LEVEL_LABELS.ko = 기존 한국어 리터럴(바이트 동일)", () => {
    expect(LEVEL_LABELS.ko).toEqual({
      trend: { strong: "강세", neutral: "중립", weak: "약세" },
      momrank: { strong: "상위권", neutral: "중간", weak: "하위권" },
      rsi: { hot: "과열", cold: "침체", neutral: "중립" },
      ma: { up: "상승추세", down: "하락추세" },
      per: { cheap: "낮음", mid: "보통", rich: "높음" },
      vol: { low: "저변동", mid: "보통", high: "고변동" },
      gpa: { high: "높음", mid: "보통", low: "낮음" },
      growth: { aggressive: "공격적", mid: "보통", conservative: "보수적" },
    });
  });

  it("LEVEL_LABELS.en엔 한글 없음", () => {
    for (const [group, map] of Object.entries(LEVEL_LABELS.en)) {
      for (const [k, v] of Object.entries(map)) {
        expect(v, `en 라벨에 한글: ${group}.${k}=${v}`).not.toMatch(/[가-힣]/);
      }
    }
  });
});

// STEP 806 §2 — 컷 미주입(pending) 경로: 분포 렌즈는 state='pending'·verdict는 "기준 준비 중"·값은 유지.
// 이 경로가 없어 805의 pending 집계 누수 버그를 특성화가 못 잡았음.
describe("pending 경로 (컷 미주입) — STEP 806", () => {
  const upSeries = makeSeries(300, 100, 0.004, 0.01, 42);
  it("momentum: 컷 없으면 state=pending·verdict.tone=flat·value 유지", async () => {
    const r = await momentum.compute(sd({ closes: upSeries }), "ko"); // cuts 미주입
    expect(r.state).toBe("pending");
    expect(r.verdict?.phrase).toBe("기준 준비 중");
    expect(r.verdict?.tone).toBe("flat");
    expect(r.value).not.toBeNull(); // 값은 그대로 노출
    expect(r.cutoffs).toBeNull();
    expect(r.cutSource).toBeNull();
  });
  it("lowvol·valuation·quality·assetgrowth도 컷 없으면 pending", async () => {
    const lv = await lowVol.compute(sd({ closes: upSeries }), "ko");
    expect(lv.state).toBe("pending");
    const v = await valuation.compute(sd({ pe: 12, pb: 1 }), "ko");
    expect(v.state).toBe("pending");
    const q = await quality.compute(sd({ financials: fin([{ totalAssets: 100 }, { grossProfit: 50, totalAssets: 100 }]) }), "ko"); // STEP815: GP/A 분모=당해 기말 총자산(원전) → 최신행에 totalAssets 필요
    expect(q.state).toBe("pending");
    const ag = await assetGrowth.compute(sd({ financials: fin([{ totalAssets: 100 }, { totalAssets: 130 }]) }), "ko");
    expect(ag.state).toBe("pending");
  });
  it("technical(고정 표준값)은 컷 없어도 pending 아님", async () => {
    const t = await technical.compute(sd({ closes: upSeries }), "ko");
    expect(t.state).not.toBe("pending"); // RSI·MA는 분포 컷 미사용
  });
});
