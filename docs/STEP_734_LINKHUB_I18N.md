<!-- 2026-07-15 -->
# STEP 734 — link_hub 설명 영어화 (`/en` 한글 잔재 제거 · description_en)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
(마이그 기록 + 1회 번역 스크립트 + 렌더 3줄. Sonnet. `/clear` 후.)

**목표:** `/en`에서 정보 탭 왼쪽 사이트 목록 설명이 **한글**로 뜨는 것 수정. 원인 = `link_hub.description`가 한글 단일 컬럼(490행)이고 i18n 스코프에 없었음(컴포넌트 하드코딩 아님·데이터 누락). Tier 3 패턴대로 `description_en` 컬럼 + 1회 번역 + 로케일 선택.

**전제:** 733(/about) 이후. **`description_en` 컬럼은 Cowork이 이미 MCP로 라이브 적용함**(`ALTER TABLE link_hub ADD COLUMN description_en text`). 이 STEP은 (1) 기록용 마이그 파일 (2) 번역 스크립트 (3) 렌더.

---

## 파일 1 (신규·기록용) — `supabase/migrations/20260715_link_hub_description_en.sql`
> ⚠️ **이미 라이브 적용됨**(Cowork MCP). 이 파일은 git 기록용 — `IF NOT EXISTS`라 재적용 안전.
```sql
-- link_hub 설명 영어화: 로케일별 en 컬럼(Tier 3 *_en 패턴). NULL이면 렌더에서 한글로 폴백.
ALTER TABLE public.link_hub ADD COLUMN IF NOT EXISTS description_en text;
COMMENT ON COLUMN public.link_hub.description_en IS 'English translation of description (for /en locale). NULL falls back to Korean description at render.';
```

## 파일 2 (신규) — `scripts/translate_link_hub.ts` (1회 번역·idempotent NULL만·유지)
> 프로젝트 OpenAI 패턴(raw fetch·`gpt-4o-mini`·`OPENAI_API_KEY`) 동일. admin 클라(SERVICE_ROLE)로 update. 재실행 안전(NULL만 채움 → 나중 새 링크 추가돼도 재실행하면 채워짐).
```ts
import { createAdminClient } from "../lib/supabase/admin";

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error("OPENAI_API_KEY 없음 (.env.local 확인)"); process.exit(1); }

const SYSTEM = `You translate short Korean UI labels that describe finance/investing websites into concise English.
Rules:
- Keep it a terse LABEL (a few words), same meaning. No full sentences, no added marketing.
- Preserve parenthetical tags: (유료)->(paid), (무료)->(free), keep (SRO), (API) etc.
- Keep proper nouns / product & feature names as-is (e.g. Snowflake, ETF, API, MLP).
- Match the source's terse register. No trailing period.
Return ONLY a JSON array of English strings, same order and same length as the input array.`;

async function translateBatch(items: string[]): Promise<string[]> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: JSON.stringify(items) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const j: any = await res.json();
  const raw = (j?.choices?.[0]?.message?.content ?? "[]").replace(/^```json\s*|\s*```$/g, "").trim();
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr) || arr.length !== items.length) throw new Error(`길이 불일치 ${arr?.length} vs ${items.length}`);
  return arr.map((x) => String(x).trim());
}

async function main() {
  const sb = createAdminClient();
  const { data: rows, error } = await sb
    .from("link_hub")
    .select("id, description")
    .is("description_en", null)
    .not("description", "is", null);
  if (error) { console.error(error); process.exit(1); }
  const list = (rows ?? []) as { id: number; description: string }[];
  console.log(`번역 대상(description_en NULL): ${list.length}건`);
  const BATCH = 30;
  let done = 0;
  for (let i = 0; i < list.length; i += BATCH) {
    const chunk = list.slice(i, i + BATCH);
    let en: string[];
    try { en = await translateBatch(chunk.map((r) => r.description)); }
    catch (e) { console.error(`배치 ${i} 실패, 건너뜀:`, String(e)); continue; }
    for (let k = 0; k < chunk.length; k++) {
      const { error: ue } = await sb.from("link_hub").update({ description_en: en[k] }).eq("id", chunk[k].id);
      if (ue) console.error(`update id=${chunk[k].id} 실패`, ue); else done++;
    }
    console.log(`  ${Math.min(i + BATCH, list.length)}/${list.length}`);
    await new Promise((r) => setTimeout(r, 500));
  }
  const { count } = await sb.from("link_hub").select("*", { count: "exact", head: true }).is("description_en", null);
  console.log(`완료: ${done}건 번역·업데이트. 남은 NULL: ${count ?? "?"}`);
}
main();
```

## 파일 3 — `app/[locale]/page.tsx` (렌더 로케일 선택 · 3곳)
1. `LinkRow` 타입(대략 line 30~36)에 추가:
```ts
  description_en: string | null;
```
2. `.select(...)`(대략 line 100)에 `description_en` 추가:
```ts
    .select("id, country, category, site_name, site_url, description, description_en, logo_url, display_order")
```
3. grouped push(대략 line 127) — description을 로케일 선택(en이면 description_en, 없으면 한글 폴백):
```ts
    (grouped[link.category] ??= []).push({
      ...link,
      description: locale === "en" ? (link.description_en ?? link.description) : link.description,
      isFavorite: favSet.has(link.id),
    });
```
> `locale`은 이미 이 컴포넌트 스코프에 있음(`homeJsonLd(locale, ...)`). ToolboxClient 등 하위는 `description`만 쓰므로 **클라 변경 0**. ko는 불변(폴백 아님·항상 한글).

## 실행 순서
1. 파일 1~3 반영.
2. **번역 스크립트 1회 실행**: `npx tsx scripts/translate_link_hub.ts` → 490건 번역·update. 로그로 "남은 NULL: 0" 확인.
3. tsc·빌드·vitest.

## ⚠️ 주의
- 스크립트는 **admin 클라(SERVICE_ROLE)** 로 DB update — `.env.local`에 `OPENAI_API_KEY`·`SUPABASE_SERVICE_ROLE_KEY` 있어야 함(기존 크론과 동일).
- **ko 무영향**: 렌더는 en일 때만 description_en 사용, ko는 항상 원래 한글. description_en이 NULL이어도 한글로 폴백(안전).
- 번역 품질: 샘플 몇 개 눈으로("글로벌 재무·밸류에이션"→"Global financials · valuation"류·"(유료)"→"(paid)"). 명백히 이상하면 해당 id만 재번역 or 수동 UPDATE.
- link_hub RLS/grants 변경 없음(추가 컬럼·같은 테이블·읽기 서버 service-role).

## 검증
1. `npx tsc --noEmit` → 0.
2. `NEXT_DIST_DIR=.next-verify npm run build` → 성공.
3. `npx vitest run` → 통과(스키마 무관·회귀 없음).
4. 스크립트 실행 후 DB 확인: `description_en` 490건 채워짐(NULL 0).
5. dev/라이브: `/en` 정보 탭(예 US IPO) 왼쪽 사이트 목록 설명이 **영어**("Official US IPO calendar"류)·`/`(ko) 여전히 한글. 로그인/즐겨찾기 무영향.

## 커밋
```bash
git add -A && git commit -m "i18n(734): link_hub 설명 영어화 — description_en 컬럼(마이그 기록)+1회 번역 스크립트(gpt-4o-mini·490건)+렌더 로케일 선택(ko 폴백·클라 무변경)·/en 한글 잔재 제거" && git push
```

## 다음
- 배포 후 Cowork 라이브 실측(/en 정보 탭 설명 영어·ko 한글).
- 세션 문서 동기화(733 /about·734 link_hub) — 두 작업 배포·검증 후 한 번에.
