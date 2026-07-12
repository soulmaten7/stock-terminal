// 렌즈 표준 타입 — 데이터 번들·균일 인터페이스·메타. (설계: docs/LENS_ARCHITECTURE.md §1~3)
// 원칙: 모든 렌즈가 같은 StockData를 입력받고 같은 LensRead를 출력 → 레지스트리 플러그인·기법당 AI 교체점.
import type { Locale } from "../lensCopy";
import type { FRow } from "../fscore";

// ── 렌즈 출력(균일) ── 이전 lib/lenses.ts에서 이전. 화면·배치·백테스트가 공유하는 표준 출력.
export type LensRead = {
  key: string;
  nameEn: string; // 영문 정식 명칭(앵커 — 세계 공통)
  name: string;   // 한글 짧은 명칭
  summary: string; // 한 줄 요약(언제/무엇에 쓰나)
  about: string; // 이 기법이란?(개념·유래·왜 쓰나 — 쉬운 설명)
  grade: string; // 신뢰도 배지 텍스트(카드 겉면 — 얼마나 믿을 만한가)
  gradeTier: "strong" | "partial" | "ref"; // 배지 색 계열
  horizon: "short" | "mid" | "long"; // 시간축(단기/중기/장기) — 스트립·그룹핑용
  short: string | null; // 단기 방향 라벨
  long: string | null;  // 장기 방향 라벨
  detail: Record<string, number | null>; // 근거 수치(투명 공개 — 카드에 그대로 노출)
  note?: string; // 상세 검증 근거·한계(접기)
  verdict?: { phrase: string; plain: string; tone: "pos" | "warn" | "flat" } | null; // 직관 판정
  spectrum?: { labels: [string, string, string]; active: number } | null; // 3구간 스펙트럼
  headline?: string | null;   // 판정 옆 핵심 숫자 한 개(12-1 +37% 등)
  outlook?: string | null;    // "이 기법 방향": 시간축+유리/불리+정직 꼬리표
  value?: number | null;      // 스크리닝용 언어중립 대표 숫자
  state?: string | null;      // 스크리닝용 언어중립 상태키
  percentile?: number | null; // 팩터 상대순위(0~100·높을수록 우호 방향). /api/lens가 주입. 없으면 null.
};

// ── 표준 데이터 번들 ── 한 번 fetch → 모든 렌즈에 주입(docs/LENS_ARCHITECTURE.md §1).
export interface StockData {
  symbol: string;
  resolved: string;
  name: string;
  price: number | null;
  closes: number[];                     // 가격계열(모멘텀·기술·저변동)
  pe: number | null;                    // 밸류(E/P) — 야후 없으면 재무 폴백 반영(STEP696)
  pb: number | null;                    // 밸류(B/M)
  financials: FRow[];                   // 연간 재무(오름차순) — 퀄리티·자산성장·F-Score
}

// ── 렌즈 메타 ── 레지스트리 단일 출처(백테스트 참조·percentile 방향).
export interface LensMeta {
  key: string;
  nameEn: string;
  grade: string;
  gradeTier: "strong" | "partial" | "ref";
  horizon: "short" | "mid" | "long";
  backtestRef?: string;                           // 이 등급을 낸 백테스트(엔진=검증 일치 문서화)
  percentile?: { dir: "high" | "low" } | null;    // 팩터 상대순위 지원·우호방향(미지원=null: 기술)
}

// ── 균일 인터페이스 ── compute가 Promise 허용 = 기법당 AI 교체점(docs/LENS_ARCHITECTURE.md §2).
export interface Lens {
  meta: LensMeta;
  compute(data: StockData, locale: Locale): LensRead | Promise<LensRead>;
}
