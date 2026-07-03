// 렌즈 겉면 카피 — 언어별 맵(원본 = docs/LENS_COPY.md). 이름=영문 앵커(코드 별도)·설명만 언어별.
// 원칙: 각 언어답게(직역 아님)·짧고 구체·번역 안전. 자동번역 X. 기본 ko, ?lang=en 지원. 다음: ja·zh 열 추가.

export type Locale = "ko" | "en";
type LensText = { name: string; what: string };
type FscoreText = { name: string; subtitle: string; what: string; na: string };

export const LENS_COPY: Record<Locale, {
  momentum: LensText; lowvol: LensText; valuation: LensText; technical: LensText; fscore: FscoreText;
}> = {
  ko: {
    momentum: { name: "모멘텀", what: "요즘 강하게 오른 종목이 계속 갈지 보는 방법 — 오르는 흐름이 이어지는 장에 잘 맞아요." },
    lowvol: { name: "저변동성", what: "덜 출렁이는 안정적인 종목인지 보는 방법 — 하락장에서 방어적으로 유용해요." },
    valuation: { name: "밸류(가치)", what: "버는 돈·가진 자산에 비해 주가가 싼지 보는 방법 — 길게 보는 투자에 잘 맞아요." },
    technical: { name: "기술", what: "차트로 지금 과열인지·흐름이 위인지 보는 방법 — 현재 상태를 빠르게 훑는 참고용이에요." },
    fscore: {
      name: "F-스코어", subtitle: "재무 건전성",
      what: "회사 재무가 튼튼한지 9가지로 점수 매기는 방법 — 부실한 회사를 거르는 용도예요(수익 예측은 아님).",
      na: "이 종목은 은행·보험이라 점수를 낼 수 없어요 — 그런 회사는 재무 구조가 보통 기업과 달라서요.",
    },
  },
  en: {
    momentum: { name: "Momentum", what: "Whether a stock that's been climbing keeps climbing — best when trends hold." },
    lowvol: { name: "Low Volatility", what: "How steady (rather than jumpy) a stock is — handy for playing defense in down markets." },
    valuation: { name: "Value", what: "Whether the price looks cheap next to a company's earnings and assets — suited to the long game." },
    technical: { name: "Technical", what: "Reads the chart for overheating and which way the trend leans — a quick gut-check, for reference only." },
    fscore: {
      name: "F-Score", subtitle: "financial health",
      what: "Scores a company's financial health across 9 checks — a filter to weed out weak balance sheets (not a return forecast).",
      na: "Can't be scored here — banks and insurers are built differently, so these checks don't apply.",
    },
  },
};

export function pickLocale(v: string | null | undefined): Locale {
  return v === "en" ? "en" : "ko";
}
