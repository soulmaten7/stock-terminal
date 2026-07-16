<!-- 2026-07-15 -->
# STEP 735 — link_hub 사이트명 영어화 (`/en` 링크 카드 완전 영어 · site_name_en)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
(마이그 기록 + 이름 번역 스크립트 + 렌더 3줄. Sonnet. `/clear` 후.)

**목표:** 734에서 `description`은 영어화됐으나 **`site_name`에 한글이 ~130행** 남음(US/GB/VN 영어브랜드+한글꼬리 "Investing.com 배당캘린더"류 ~25 + KR 기관·언론 고유명 ~110). `site_name_en` 추가·번역·로케일 선택 → `/en` 링크 카드 완전 영어. ko 불변.

**전제:** 734(`971e237`) 이후. **`site_name_en` 컬럼은 Cowork이 이미 MCP로 라이브 적용함.** description_en 패턴과 동일.

---

## 파일 1 (신규·기록용) — `supabase/migrations/20260715_link_hub_site_name_en.sql`
> ⚠️ **이미 라이브 적용됨**(Cowork MCP). git 기록용·`IF NOT EXISTS` 안전.
```sql
-- link_hub 사이트명 영어화: 로케일별 en 컬럼. NULL이면 렌더에서 한글 site_name으로 폴백.
ALTER TABLE public.link_hub ADD COLUMN IF NOT EXISTS site_name_en text;
COMMENT ON COLUMN public.link_hub.site_name_en IS 'English site name (for /en locale). NULL falls back to Korean site_name at render. Only filled for rows whose site_name contains Korean.';
```

## 파일 2 (신규) — `scripts/translate_link_hub_names.ts` (1회·idempotent·유지)
> 734의 `translate_link_hub.ts`와 같은 뼈대이되 **이름 전용 프롬프트**(고유명사). 대상 = `site_name`에 한글 포함 & `site_name_en` NULL(~130행). 영어 site_name(Nasdaq 등)은 대상 아님(렌더가 폴백).
```ts
import { createAdminClient } from "../lib/supabase/admin";

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error("OPENAI_API_KEY 없음"); process.exit(1); }

const SYSTEM = `You translate the NAMES of Korean or mixed finance/investing websites into English, for an English-locale link directory. Return proper-noun style NAMES, not descriptions.
Rules:
- Well-known institutions/exchanges/agencies: use the OFFICIAL English name. Examples: 금융감독원→Financial Supervisory Service; 금융위원회→Financial Services Commission; 한국은행 ECOS→Bank of Korea ECOS; 한국거래소(KRX)→Korea Exchange (KRX); DART 전자공시시스템→DART Electronic Disclosure; 한국예탁결제원→Korea Securities Depository; 금융투자협회→KOFIA; 통계청 KOSIS→Statistics Korea KOSIS; 기획재정부→Ministry of Economy and Finance; 코스닥협회→KOSDAQ Association.
- "English brand + Korean descriptor": keep the brand, translate only the Korean tail. Examples: Investing.com 배당캘린더→Investing.com Dividend Calendar; Yahoo Finance ETF 스크리너→Yahoo Finance ETF Screener; U.S. Treasury 금리→U.S. Treasury Rates; FOMC 일정·점도표→FOMC Schedule & Dot Plot; EDGAR 전문검색→EDGAR Full-Text Search; U. Michigan 소비자심리→U. Michigan Consumer Sentiment; ADB 베트남→ADB Vietnam; World Bank 베트남→World Bank Vietnam.
- Korean brokerages "X증권 리서치": use the firm's standard English name + Research. Examples: 삼성증권→Samsung Securities; 미래에셋증권→Mirae Asset Securities; NH투자증권→NH Investment & Securities; 한국투자증권→Korea Investment & Securities; KB증권→KB Securities; 키움증권→Kiwoom Securities; 신한투자증권→Shinhan Securities; 하나증권→Hana Securities; 대신증권→Daishin Securities; 메리츠증권→Meritz Securities.
- Korean media/portals: the outlet's common English name or a clean romanization. Examples: 매일경제→Maeil Business; 한국경제→Korea Economic Daily; 서울경제→Seoul Economic Daily; 네이버 증권 뉴스→Naver Securities News; 네이버페이 증권→Naver Pay Securities; 다음 금융→Daum Finance; 연합뉴스 경제→Yonhap News Economy; 이데일리→Edaily; 머니투데이→Money Today.
- Exchanges' disclosure/listing pages (HOSE 공시, HNX 경매·IPO): translate naturally → Ho Chi Minh Exchange Disclosures, HNX Auctions & IPO.
- Concise, proper-noun style. No trailing period. If unsure, transliterate sensibly.
Return ONLY a JSON array of English names, same order and length as input.`;

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
  // site_name에 한글 포함 & 아직 미번역
  const { data, error } = await sb.from("link_hub").select("id, site_name").is("site_name_en", null);
  if (error) { console.error(error); process.exit(1); }
  const list = ((data ?? []) as { id: number; site_name: string }[]).filter((r) => /[가-힣]/.test(r.site_name || ""));
  console.log(`번역 대상(한글 site_name·site_name_en NULL): ${list.length}건`);
  const BATCH = 25;
  let done = 0;
  for (let i = 0; i < list.length; i += BATCH) {
    const chunk = list.slice(i, i + BATCH);
    let en: string[];
    try { en = await translateBatch(chunk.map((r) => r.site_name)); }
    catch (e) { console.error(`배치 ${i} 실패, 건너뜀:`, String(e)); continue; }
    for (let k = 0; k < chunk.length; k++) {
      const { error: ue } = await sb.from("link_hub").update({ site_name_en: en[k] }).eq("id", chunk[k].id);
      if (ue) console.error(`update id=${chunk[k].id} 실패`, ue); else done++;
    }
    console.log(`  ${Math.min(i + BATCH, list.length)}/${list.length}`);
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log(`완료: ${done}건 번역·업데이트.`);
}
main();
```

## 파일 3 — `app/[locale]/page.tsx` (렌더 · site_name 로케일 선택 · 3곳)
1. `LinkRow` 타입에 추가:
```ts
  site_name_en: string | null;
```
2. `.select(...)`에 `site_name_en` 추가:
```ts
    .select("id, country, category, site_name, site_name_en, site_url, description, description_en, logo_url, display_order")
```
3. grouped push(734에서 description 로케일화한 그 push)에 site_name도 추가:
```ts
    (grouped[link.category] ??= []).push({
      ...link,
      site_name: locale === "en" ? (link.site_name_en ?? link.site_name) : link.site_name,
      description: locale === "en" ? (link.description_en ?? link.description) : link.description,
      isFavorite: favSet.has(link.id),
    });
```
> 하위(LinkCard 등)는 `site_name`만 쓰므로 **클라 변경 0**. ko는 항상 원래 한글. en_null이면 한글 폴백(영어 site_name 행은 site_name_en NULL이라 그대로 영어).

## 실행 순서
1. 파일 1~3 반영.
2. **번역 스크립트 1회 실행**: `npx tsx scripts/translate_link_hub_names.ts` → ~130건 번역·update.
3. tsc·빌드·vitest.

## ⚠️ 주의
- **ko 무영향**: en일 때만 site_name_en 사용.
- **품질 스팟체크**(Cowork 후속): 기관 공식 영문명(FSS·KRX·DART)·증권사(Samsung Securities Research)·영어브랜드꼬리(Investing.com Dividend Calendar) 몇 개 눈으로. 명백히 틀린 소수는 개별 UPDATE로 손보면 됨(고유명사라 완벽 자동은 어려움 — 대세만 맞으면 OK).
- 영어 site_name 행(Nasdaq 등)은 site_name_en NULL 유지·폴백(정상).

## 검증
1. `npx tsc --noEmit` → 0. 2. 빌드 성공. 3. vitest 통과.
2. 스크립트 실행 후: 한글 site_name 행의 site_name_en 채워짐.
3. 라이브/dev: `/en` 정보 탭에서 여러 시장(US·KR) 링크 카드 이름이 **영어**("Investing.com Dividend Calendar"·"Financial Supervisory Service"류)·`/`(ko) 한글. 즉 `/en` 링크 카드에 한글 0.

## 커밋
```bash
git add -A && git commit -m "i18n(735): link_hub 사이트명 영어화 — site_name_en 컬럼(마이그 기록)+이름 전용 번역 스크립트(~130건·기관 공식 영문명)+렌더 로케일 선택(ko 폴백)·/en 링크 카드 완전 영어" && git push
```

## 다음
- 배포 후 Cowork 라이브 실측(/en 링크 카드 site_name 영어·품질 스팟체크·이상치 개별 수정).
- **세션 문서 동기화**(730~735 일괄) — /about·link_hub 다 끝난 뒤.
