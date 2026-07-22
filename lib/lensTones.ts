// 렌즈 상태(lens_scores) → 톤(pos/warn/flat) 변환 — 관심목록·종목보드가 공유하는 단일 정본(STEP 756).
// ⚠️ 이 로직을 다른 파일에 복붙하지 말 것 — 행 도트와 상세 렌즈 판정이 어긋나면 신뢰가 깨진다.
export type Tone = "pos" | "warn" | "flat";
export type LensScoreRow = Record<string, string | null | undefined>;

// 톤 도트 Tailwind 클래스(강점=민트·주의=앰버·보통=중립) — 단일 소스(STEP 776 §4). 전 사용처가 이 상수만 쓰고 파일별 재선언 금지.
export const TONE_DOT_CLASS: Record<Tone, string> = {
  pos: "bg-unjong-accent",
  warn: "bg-amber-400",
  flat: "bg-unjong-muted",
};

// 렌즈 키(lenses.ts stable key) → [pos상태, warn상태, mid상태] 3튜플 — 팩터별 state→tone 단일 정본.
const STATE_SPEC: Record<string, [string, string, string]> = {
  momentum: ["up", "down", "flat"],
  technical: ["up", "down", "flat"],
  valuation: ["cheap", "rich", "mid"],
  lowvol: ["calm", "jumpy", "mid"],
  quality: ["high", "low", "mid"],
  assetgrowth: ["conservative", "aggressive", "mid"],
  fscore: ["strong", "weak", "mid"],
};

// 렌즈 키 하나의 state→tone (na/null/미지원 키 → null). lens_state_changes diff 등 단건 비교 소비자용(STEP 764).
export function toneForKey(key: string, state: string | null | undefined): Tone | null {
  const spec = STATE_SPEC[key];
  if (!spec || !state) return null;
  const [pos, warn, mid] = spec;
  if (state === pos) return "pos";
  if (state === warn) return "warn";
  if (state === mid) return "flat";
  return null;
}

// state→tone 개별 목록(순서 보존) — 관심목록처럼 전체 리스트가 필요한 소비자용.
export function tonesFromStates(r: LensScoreRow): Tone[] {
  const out: Tone[] = [];
  for (const key of Object.keys(STATE_SPEC)) {
    const tone = toneForKey(key, r[`${key}_state`]);
    if (tone) out.push(tone);
  }
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
