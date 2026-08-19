// 렌즈 표준 타입 — 데이터 번들·균일 인터페이스·메타. (설계: docs/LENS_ARCHITECTURE.md §1~3)
// 원칙: 모든 렌즈가 같은 StockData를 입력받고 같은 LensRead를 출력 → 레지스트리 플러그인·기법당 AI 교체점.
import type { Locale } from "../lensCopy";
import type { FRow } from "../fscore";
import type { CutMap } from "../lensCuts";

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
  cutoffs?: { lo: number; hi: number } | null; // 판정 컷(원값 기준 상태 분기 임계치) — 3단 계산 서사용(STEP 782). 미지원 렌즈는 undefined(응답에 안 실림, byte 불변).
  cutSource?: { market: string; n: number; asOf: string | null } | null; // 컷 출처(분포 유도 시장·표본·기준일·STEP 805 §6). 고정컷(RSI·F-Score)·pending은 없음.
  valueBasis?: "ttm" | "annual" | null; // 밸류 렌즈 전용 — PER을 무엇으로 냈는지(TTM/연간·STEP 809 §1). 화면 문구 분기용.
  adjUsed?: boolean | null; // 모멘텀 전용 — 배당조정 종가(총수익률)로 계산했는지, 결측이라 raw(가격수익률)로 폴백했는지. false면 note에 캐비어트 추가(STEP1083 §7-4#2 #9).
  // ── STEP 831 §10 깊이 표준(근거 상세 4축) ── 렌즈별 선택. 미지원/결측이면 undefined(지어내지 않음).
  decomposition?: LensDecomposition | null; // ① 구성요소 분해(원자료→최종값·항등식). compute()가 채움.
  timeSeries?: LensTimeSeries | null;        // ② 시계열 추이(연도별·불연속 표시). compute()가 채움.
  distribution?: LensDistribution | null;    // ③ 분포 내 위치(시장 분포 요약). /api/lens가 주입(compute()는 안 채움).
};

// ① 구성요소 분해 — parts.key = DETAIL_LABELS 키. source = 최종값 원자료 경로(direct=보고값 / computed=매출−원가).
export type LensDecomposition = {
  identityKey: string;                                                     // 항등식 설명 메시지 키(StockLens.<key>)
  source?: "direct" | "computed";
  parts: { key: string; value: number | null; unit: "money" | "pct" | "x" }[];
};
// ② 시계열 — 결측/불연속 연도는 missing:true로 표시(건너뛰지 않음·STEP 831 §10-②).
export type LensTimeSeries = {
  metricKey: string;
  unit: "pct" | "x" | "money";
  points: { year: number | null; value: number | null; missing?: boolean }[];
};
// ③ 분포 요약 — 시장 전체(lens_scores) 분위. p30/p70 = 판정 컷(lens_cuts) 동일 소스.
export type LensDistribution = {
  market: string; n: number; asOf: string | null;
  min: number; p30: number; median: number; p70: number; max: number;
};

// ── 표준 데이터 번들 ── 한 번 fetch → 모든 렌즈에 주입(docs/LENS_ARCHITECTURE.md §1).
export interface StockData {
  symbol: string;
  resolved: string;
  name: string;
  price: number | null;
  closes: number[];                     // raw 종가(기술·저변동 — '가격 지표'라 차트와 정합)
  adjCloses?: number[];                 // 배당 조정 종가(모멘텀·수익률 = 총수익률·STEP 801). 없으면 momentum이 closes로 폴백. closes와 길이·정렬 동일.
  adjUsed?: boolean;                    // 계열 전체가 유효 adjclose였는지(STEP 808 §9) — false면 adjCloses=raw(모멘텀 raw 일관). 정직 표기용.
  pe: number | null;                    // 밸류(E/P) — 야후 없으면 재무 폴백 반영(STEP696)
  peBasis?: "ttm" | "annual" | null;    // PER 산출 기준(야후 trailingPE=TTM / 재무 폴백=연간·STEP 809 §1) — 화면 문구 분기용
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
  // cuts = 분포 유도 판정 컷(lens_cuts·시장별). 없으면 분포 유도 렌즈는 state='pending'(기준 준비 중·STEP 805).
  compute(data: StockData, locale: Locale, cuts?: CutMap): LensRead | Promise<LensRead>;
}
