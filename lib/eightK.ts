// 8-K 중대 이벤트 → 렌즈 매핑 (EVENT_LAYER_SPEC 확정본 · 3회 검수 + 유료 벤치마크 검증).
// item 코드는 EDGAR 메타데이터(submissions.json의 items 필드)라 NLP 없이 '결정론적' 분류.
// 원칙: 사실만·예측 아님·⚠️(A)는 데이터 신선도/신뢰 경고 전용(방향 판정 아님).
// ⚠️ 메타데이터는 item 코드까지만 준다(사임/선임/보수 구분은 원문에). 그래서 라벨은 '과장 없이 일반적으로'.
//    서브내용 무관하게 그 렌즈에 확실히 영향 주는 이벤트만 flagLens=true(렌즈 카드 플래그). 애매한 건 리스트에만.
// 프레임워크 무관(next/server import 금지) → 라우트·스크립트 어디서든 호출.

export type EventClass = "A" | "B" | "general"; // A=근거 흔듦(⚠️) · B=새 맥락(📌) · general=일반 버킷
export type Severity = "info" | "watch" | "serious"; // 사실의 무게(방향 아님)

export type EightKDef = {
  item: string;      // "5.02"
  label: string;     // 쉬운 말(과장 없이 일반적으로 — 구체는 원문 요약 몫) · ko
  en: string;        // 같은 라벨의 영어(결정론 맵 · /api/events?lang=en에서 label 자리에 치환)
  klass: EventClass;
  lenses: string[];  // 연결 렌즈 key (momentum/lowvol/valuation/quality/assetgrowth/fscore) — general이면 []
  severity: Severity;
  flagLens: boolean; // 서브내용 무관하게 그 렌즈에 '확실히' 영향? false=리스트에만(원문 요약 후 판단)
};

// ⚠️ 우리 편집 큐레이션(검증된 모델 아님). SEC 신설 item 대응은 이 한 곳에서.
export const EIGHTK: Record<string, EightKDef> = {
  // ── flagLens=true: 서브내용 무관하게 그 렌즈 근거/존속에 확실히 영향 ──
  "2.02": { item: "2.02", label: "분기 실적 발표", en: "Quarterly earnings", klass: "A", lenses: ["fscore", "quality", "assetgrowth"], severity: "watch", flagLens: true },
  "4.02": { item: "4.02", label: "재무제표 재작성(신뢰 불가)", en: "Financials restated (not reliable)", klass: "A", lenses: ["fscore", "quality"], severity: "serious", flagLens: true },
  "4.01": { item: "4.01", label: "회계법인 교체", en: "Auditor change", klass: "A", lenses: ["fscore", "quality"], severity: "watch", flagLens: true },
  "2.01": { item: "2.01", label: "인수·매각 완료", en: "Acquisition or disposal completed", klass: "A", lenses: ["momentum", "valuation", "quality", "fscore", "assetgrowth", "lowvol"], severity: "watch", flagLens: true },
  "2.06": { item: "2.06", label: "자산 손상차손", en: "Asset impairment", klass: "A", lenses: ["quality"], severity: "watch", flagLens: true },
  "5.01": { item: "5.01", label: "경영권 변경(지배구조)", en: "Change of control", klass: "B", lenses: ["fscore", "quality"], severity: "watch", flagLens: true },
  "1.03": { item: "1.03", label: "파산·법정관리", en: "Bankruptcy or receivership", klass: "B", lenses: ["fscore", "lowvol"], severity: "serious", flagLens: true },
  "3.01": { item: "3.01", label: "상장폐지 경고", en: "Delisting notice", klass: "B", lenses: ["fscore", "lowvol"], severity: "serious", flagLens: true },
  // ── flagLens=false: 리스트엔 나오되(사실), 렌즈 플래그는 안 함 — 서브내용/규모가 원문에 있어 애매 ──
  "5.02": { item: "5.02", label: "임원·이사진 변동", en: "Executive or board change", klass: "B", lenses: ["fscore", "quality"], severity: "info", flagLens: false }, // 사임·선임·보수 등 포함 — 대부분 루틴, 원문 봐야
  "3.02": { item: "3.02", label: "미등록 주식 발행(희석 가능)", en: "Unregistered share sale (dilution possible)", klass: "B", lenses: ["valuation"], severity: "info", flagLens: false },
  "2.03": { item: "2.03", label: "대형 부채 발생", en: "Major debt taken on", klass: "B", lenses: ["lowvol", "fscore"], severity: "info", flagLens: false },
  "2.04": { item: "2.04", label: "부채 조기상환 트리거", en: "Debt acceleration triggered", klass: "B", lenses: ["lowvol", "fscore"], severity: "watch", flagLens: false },
  "1.01": { item: "1.01", label: "중요 계약 체결", en: "Material agreement signed", klass: "B", lenses: ["momentum"], severity: "info", flagLens: false },
  "1.02": { item: "1.02", label: "중요 계약 종료", en: "Material agreement terminated", klass: "B", lenses: ["momentum"], severity: "watch", flagLens: false },
  // ── general: 특정 렌즈에 안 붙음 ──
  "1.05": { item: "1.05", label: "중대 사이버 침해", en: "Material cybersecurity incident", klass: "general", lenses: [], severity: "watch", flagLens: false },
  "8.01": { item: "8.01", label: "기타 중대 사건", en: "Other material event", klass: "general", lenses: [], severity: "info", flagLens: false },
  "7.01": { item: "7.01", label: "Reg FD 공개", en: "Reg FD disclosure", klass: "general", lenses: [], severity: "info", flagLens: false },
};

// items CSV("5.02,9.01") → 매핑에 있는 '중대' item 정의만(9.01 첨부 등 노이즈 제외).
export function materialItems(itemsCsv: string): EightKDef[] {
  return (itemsCsv || "")
    .split(",")
    .map((s) => s.trim())
    .map((code) => EIGHTK[code])
    .filter((d): d is EightKDef => !!d);
}

export type MaterialEvent = {
  date: string;        // filingDate (YYYY-MM-DD)
  items: string[];     // 원문 item 코드
  defs: EightKDef[];   // 우리 매핑(중대만)
  link: string;        // SEC 원문
};

const SEC_UA = process.env.SEC_USER_AGENT || "Trillion/1.0 (contact@onetrillion.app)"; // SEC는 User-Agent 필수(없으면 403)

// ticker → CIK(10자리 zero-pad). company_tickers.json 1일 인메모리 캐시. 비US(6자리·.T 등)는 없음 → null.
let tickerMap: Record<string, string> | null = null;
let tickerAt = 0;
async function tickerToCik(ticker: string): Promise<string | null> {
  const now = Date.now();
  if (!tickerMap || now - tickerAt > 24 * 3600 * 1000) {
    const r = await fetch("https://www.sec.gov/files/company_tickers.json", {
      headers: { "User-Agent": SEC_UA }, cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return tickerMap ? tickerMap[ticker.toUpperCase()] ?? null : null;
    const j = (await r.json()) as Record<string, { cik_str: number; ticker: string }>;
    const m: Record<string, string> = {};
    for (const k in j) if (j[k]?.ticker) m[j[k].ticker.toUpperCase()] = String(j[k].cik_str).padStart(10, "0");
    tickerMap = m; tickerAt = now;
  }
  return tickerMap[ticker.toUpperCase()] ?? null;
}

// 심볼의 최근 '중대' 8-K 이벤트(우리 매핑에 있는 item만). US 티커 전용 — 비US·미상장은 [].
export async function fetchMaterial8K(ticker: string, limit = 6): Promise<MaterialEvent[]> {
  const cik = await tickerToCik(ticker);
  if (!cik) return [];
  const r = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, {
    headers: { "User-Agent": SEC_UA }, cache: "no-store", signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) return [];
  const j = (await r.json()) as {
    filings?: { recent?: { form?: string[]; filingDate?: string[]; items?: string[]; accessionNumber?: string[]; primaryDocument?: string[] } };
  };
  const rec = j.filings?.recent;
  if (!rec?.form) return [];
  const cikNum = Number(cik);
  const out: MaterialEvent[] = [];
  for (let i = 0; i < rec.form.length && out.length < limit; i++) {
    if (rec.form[i] !== "8-K") continue;
    const defs = materialItems(rec.items?.[i] ?? "");
    if (!defs.length) continue; // 중대 item 없으면 스킵(노이즈 컷)
    const acc = (rec.accessionNumber?.[i] ?? "").replace(/-/g, "");
    const doc = rec.primaryDocument?.[i] ?? "";
    const link = acc
      ? `https://www.sec.gov/Archives/edgar/data/${cikNum}/${acc}/${doc}`
      : `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=8-K`;
    out.push({
      date: rec.filingDate?.[i] ?? "",
      items: (rec.items?.[i] ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      defs,
      link,
    });
  }
  return out;
}
