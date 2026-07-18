// 렌즈 상태(lens_scores) → 톤(pos/warn/flat) 변환 — 관심목록·종목보드가 공유하는 단일 정본(STEP 756).
// ⚠️ 이 로직을 다른 파일에 복붙하지 말 것 — 행 도트와 상세 렌즈 판정이 어긋나면 신뢰가 깨진다.
export type Tone = "pos" | "warn" | "flat";
export type LensScoreRow = Record<string, string | null | undefined>;

// state→tone 개별 목록(순서 보존) — 관심목록처럼 전체 리스트가 필요한 소비자용.
export function tonesFromStates(r: LensScoreRow): Tone[] {
  const out: Tone[] = [];
  const map = (s: string | null | undefined, pos: string, warn: string, mid: string) => {
    if (s === pos) out.push("pos");
    else if (s === warn) out.push("warn");
    else if (s === mid) out.push("flat");
    // 그 외(na/null) → 제외
  };
  map(r.momentum_state, "up", "down", "flat");
  map(r.technical_state, "up", "down", "flat");
  map(r.valuation_state, "cheap", "rich", "mid");
  map(r.lowvol_state, "calm", "jumpy", "mid");
  map(r.quality_state, "high", "low", "mid");
  map(r.assetgrowth_state, "conservative", "aggressive", "mid");
  map(r.fscore_state, "strong", "weak", "mid");
  return out;
}

// state→카운트 집계 — 보드 행 도트처럼 가벼운 {pos,warn,flat}만 필요한 소비자용.
// 집계할 렌즈가 하나도 없으면(전부 na/null) null — "선계산 밖" 표시(호출부가 '—' 처리).
export function tonesFor(r: LensScoreRow): { pos: number; warn: number; flat: number } | null {
  const tones = tonesFromStates(r);
  if (tones.length === 0) return null;
  return {
    pos: tones.filter((t) => t === "pos").length,
    warn: tones.filter((t) => t === "warn").length,
    flat: tones.filter((t) => t === "flat").length,
  };
}
