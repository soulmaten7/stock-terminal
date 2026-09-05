<!-- 2026-06-03 -->
# STEP 137 — FSS 유사투자자문업자 인증 시스템 (V6 Phase 2-①)

## 🟢 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 새 파일 위주 기능 작업이라 Sonnet 으로 충분. 단 **STEP 0(페이지 파라미터 조사)** 에서 막히면 그 부분만 Opus 로 재시도.

호출법: Claude Code 터미널에 → `@docs/STEP_137_COMMAND.md 파일 내용대로 실행해줘`

---

## 🎯 목표

운종 V6 신뢰 축의 핵심 — **리딩방이 금융위(금감원)에 실제 신고된 업체인지 자동 검증**.

1. 금감원 파인(FINE) 유사투자자문업자 목록(약 1,738건)을 **매일 1회** 긁어 Supabase `fss_advisors` 테이블에 저장·갱신.
2. 리딩방 운영자가 **사업자번호 입력 → 자동 대조 → 인증 뱃지** 부착.
3. 리딩방 디렉토리·상세에 **"금감원 신고업체 ✓" 뱃지** 노출 (미인증은 "신고 미확인" 표시).

> **왜**: "여기 오면 안 속는다" 가 운종의 해자. 공적 데이터 기반 검증이라 운종이 법적 책임을 지지 않는 구조(②의 핵심).

---

## 📌 전제 상태 (반드시 확인)

- **이전 HEAD**: `be65ef3` (V6 Phase 1 완료 — 정체성 카피 + 추천/비추천 + KIS 캐시)
- 적용된 마이그레이션 최신: `020_dislike_votes.sql`
- **이번에 만들 마이그레이션**: `021_fss_advisors.sql` (Cowork 가 Supabase MCP 로 적용 — Claude Code 는 SQL 파일만 생성, 직접 apply ❌)
- `leading_rooms` 현재 컬럼: `id·platform·name·operator·description·external_url·pricing·category·is_certified·view_count·discussion_count·hidden·created_at·updated_at`
- 데이터 출처: `https://fine.fss.or.kr/fine/fncco/invsmCnsut/list.do?menuNo=900046`
  - 컬럼: 순번 · 사업자번호 · 상호 · 정보명칭 · 유효기간 · 대표자 · 소재지 · 전화번호 · 홈페이지 · E-Mail
  - 페이지네이션: `javascript:fnSearch(N)` (실제 파라미터는 STEP 0 에서 확인)

---

## 🔢 작업 순서

### STEP 0 — 파인 페이지네이션 파라미터 조사 (먼저!)

목록은 1페이지만 URL 로 바로 보이고, 2페이지부터는 `fnSearch(N)` JS 가 폼을 POST 한다. **실제 파라미터 이름을 먼저 확정**해야 174페이지를 순회할 수 있다.

터미널에서 직접 확인:
```bash
# 1) 1페이지 HTML 저장
curl -s 'https://fine.fss.or.kr/fine/fncco/invsmCnsut/list.do?menuNo=900046' -o /tmp/fss_p1.html

# 2) fnSearch 함수 정의·폼 필드 확인 (pageIndex / currentPageNo / page 중 무엇인지)
grep -nE 'function fnSearch|name="(pageIndex|currentPageNo|page|pageNo)"|\.action' /tmp/fss_p1.html

# 3) 후보 파라미터로 2페이지 시도 → 순번이 1페이지(1738~1730)와 다른지 확인
curl -s 'https://fine.fss.or.kr/fine/fncco/invsmCnsut/list.do?menuNo=900046&pageIndex=2' | grep -oE '<td[^>]*>[0-9]{3,4}</td>' | head -3
```
- 2페이지에서 순번이 바뀌면 → **GET 방식**. 그 파라미터 이름을 아래 코드의 `PAGE_PARAM` 상수에 넣는다.
- GET 으로 안 바뀌면 → **POST 방식**. `curl -d "pageIndex=2&menuNo=900046"` 로 재확인 후 `fetchPage` 를 POST 로 바꾼다.
- ⚠️ 확정 전에는 다음 STEP 으로 넘어가지 말 것. (이게 전체 임포트의 유일한 미지수)

---

### STEP 1 — 마이그레이션 SQL 생성 (apply 는 Cowork)

`supabase/migrations/021_fss_advisors.sql` 신규 생성:

```sql
-- 021: FSS 유사투자자문업자 인증 (V6 Phase 2-①)
-- ⚠️ Cowork 가 Supabase MCP 로 적용. Claude Code 는 파일 생성만.

-- 1) 파인 원장 캐시 테이블
CREATE TABLE IF NOT EXISTS public.fss_advisors (
  biz_no        TEXT PRIMARY KEY,            -- 사업자번호 (자연키)
  company_name  TEXT NOT NULL,               -- 상호
  info_name     TEXT,                        -- 정보명칭
  representative TEXT,                        -- 대표자
  valid_from    DATE,
  valid_to      DATE,                         -- 유효기간 끝
  address       TEXT,
  phone         TEXT,
  homepage      TEXT,
  email         TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  source        TEXT NOT NULL DEFAULT 'fss_fine',
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw           JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fss_advisors_company ON public.fss_advisors (company_name);
CREATE INDEX IF NOT EXISTS idx_fss_advisors_homepage ON public.fss_advisors (homepage) WHERE homepage IS NOT NULL;

-- 2) leading_rooms 인증 컬럼 추가
ALTER TABLE public.leading_rooms
  ADD COLUMN IF NOT EXISTS biz_no           TEXT,
  ADD COLUMN IF NOT EXISTS cert_type        TEXT CHECK (cert_type IS NULL OR cert_type IN ('similar_advisory', 'advisory', 'securities')),
  ADD COLUMN IF NOT EXISTS cert_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fss_biz_no       TEXT REFERENCES public.fss_advisors(biz_no) ON DELETE SET NULL;

-- 3) RLS — fss_advisors 공개 읽기 (검증 표시용)
ALTER TABLE public.fss_advisors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fss_advisors public read" ON public.fss_advisors;
CREATE POLICY "fss_advisors public read" ON public.fss_advisors FOR SELECT USING (true);
-- 쓰기는 service_role(임포트 잡)만 — 별도 정책 없이 RLS 가 anon/auth 쓰기를 막음.
```

> 생성 후 Claude Code 는 **"021 생성 완료, Cowork 적용 대기"** 라고만 보고. apply 하지 말 것.

---

### STEP 2 — 임포트 코어 로직 `lib/fss.ts`

cheerio 설치(테이블 파싱 안정성):
```bash
npm install cheerio
```

`lib/fss.ts` 신규 생성:

```ts
import * as cheerio from "cheerio";
import { createAdminClient } from "@/lib/supabase/admin"; // 기존 헬퍼 재사용

const LIST_URL = "https://fine.fss.or.kr/fine/fncco/invsmCnsut/list.do";
const MENU_NO = "900046";
const PAGE_PARAM = "pageIndex"; // ⚠️ STEP 0 결과로 확정해서 교체
const FETCH_DELAY_MS = Number(process.env.FSS_FETCH_DELAY_MS ?? 400);
const UA = "UnjongBot/1.0 (+https://onetrillion.app; 금감원 파인 공개데이터 일1회 수집)";

export interface FssAdvisor {
  biz_no: string;
  company_name: string;
  info_name: string | null;
  representative: string | null;
  valid_from: string | null; // YYYY-MM-DD
  valid_to: string | null;
  address: string | null;
  phone: string | null;
  homepage: string | null;
  email: string | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clean = (s: string) => s.replace(/\s+/g, " ").trim() || "";

async function fetchPage(page: number): Promise<string> {
  const url = `${LIST_URL}?menuNo=${MENU_NO}&${PAGE_PARAM}=${page}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`FSS page ${page} HTTP ${res.status}`);
  return res.text();
}

// 헤더행을 읽어 컬럼 인덱스를 동적 매핑 (컬럼 순서 바뀌어도 안전)
function parsePage(html: string): { rows: FssAdvisor[]; totalPages: number } {
  const $ = cheerio.load(html);

  // 총 페이지 수: "[ 1/174 페이지 ]" 패턴
  const pageText = $("body").text();
  const m = pageText.match(/\[\s*\d+\s*\/\s*(\d+)\s*페이지/);
  const totalPages = m ? Number(m[1]) : 1;

  // 데이터 테이블 찾기: 헤더에 '사업자번호' 포함된 table
  let $table = $("table").filter((_, t) => $(t).text().includes("사업자번호")).first();
  const headers = $table.find("thead th, tr:first-child th").map((_, th) => clean($(th).text())).get();
  const idx = (name: string) => headers.findIndex((h) => h.includes(name));

  const cBiz = idx("사업자"), cName = idx("상호"), cInfo = idx("정보명칭"),
        cValid = idx("유효기간"), cRep = idx("대표자"), cAddr = idx("소재지"),
        cTel = idx("전화"), cHome = idx("홈페이지"), cMail = idx("E-Mail") >= 0 ? idx("E-Mail") : idx("Mail");

  const rows: FssAdvisor[] = [];
  $table.find("tbody tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 5) return;
    const cell = (i: number) => (i >= 0 ? clean($(tds[i]).text()) : "");
    const biz = cell(cBiz).replace(/[^0-9]/g, "");
    if (!biz) return;

    // 유효기간 "2026-05-18 ~ 2031-05-17"
    const valid = cell(cValid);
    const dates = valid.match(/(\d{4}-\d{2}-\d{2})/g) ?? [];

    // 홈페이지: a[href] 우선
    const homeHref = $(tds[cHome]).find("a").attr("href")?.trim() || cell(cHome);

    rows.push({
      biz_no: biz,
      company_name: cell(cName),
      info_name: cell(cInfo) || null,
      representative: cell(cRep) || null,
      valid_from: dates[0] ?? null,
      valid_to: dates[1] ?? null,
      address: cell(cAddr) || null,
      phone: cell(cTel) || null,
      homepage: homeHref && homeHref !== "#" ? homeHref : null,
      email: cell(cMail) || null,
    });
  });

  return { rows, totalPages };
}

export async function importFssAdvisors(): Promise<{ total: number; pages: number; revoked: number }> {
  const runStarted = new Date().toISOString();
  const sb = createAdminClient(); // RLS 우회 (쓰기) — 기존 lib/supabase/admin.ts

  const first = parsePage(await fetchPage(1));
  let all: FssAdvisor[] = [...first.rows];
  for (let p = 2; p <= first.totalPages; p++) {
    await sleep(FETCH_DELAY_MS);
    const { rows } = parsePage(await fetchPage(p));
    all = all.concat(rows);
  }

  // upsert (사업자번호 중복 제거)
  const dedup = new Map<string, FssAdvisor>();
  for (const r of all) dedup.set(r.biz_no, r);
  const payload = [...dedup.values()].map((r) => ({
    ...r, status: "active", source: "fss_fine",
    fetched_at: runStarted, updated_at: runStarted, raw: r,
  }));

  // 배치 upsert (500개씩)
  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await sb.from("fss_advisors").upsert(payload.slice(i, i + 500), { onConflict: "biz_no" });
    if (error) throw error;
  }

  // 이번 수집에 안 잡힌 기존 행 = 영업목록 이탈 → revoked 처리
  const { count } = await sb.from("fss_advisors")
    .update({ status: "revoked", updated_at: runStarted })
    .lt("fetched_at", runStarted).eq("status", "active").select("*", { count: "exact", head: true });

  return { total: payload.length, pages: first.totalPages, revoked: count ?? 0 };
}
```

---

### STEP 3 — 수동 실행 스크립트 `scripts/import-fss-advisors.ts`

```ts
import "dotenv/config";
import { importFssAdvisors } from "../lib/fss";

importFssAdvisors()
  .then((r) => { console.info(`[FSS] 완료 — ${r.total}건 / ${r.pages}페이지 / revoked ${r.revoked}`); process.exit(0); })
  .catch((e) => { console.error("[FSS] 실패:", e); process.exit(1); });
```
실행:
```bash
npx tsx scripts/import-fss-advisors.ts
```
> `tsx` 없으면 `npm i -D tsx`. 최초 1회 실행해 `fss_advisors` 가 채워지는지 확인 (마이그레이션 021 Cowork 적용 후).

---

### STEP 4 — 매일 자동 실행 (Vercel Cron)

`app/api/cron/fss-advisors/route.ts` 신규:
```ts
import { NextResponse } from "next/server";
import { importFssAdvisors } from "@/lib/fss";

export const maxDuration = 300; // 174페이지 순회 여유
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const r = await importFssAdvisors();
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
```

`vercel.json` 에 cron 추가 (없으면 생성, 있으면 crons 배열에 병합):
```json
{
  "crons": [
    { "path": "/api/cron/fss-advisors", "schedule": "0 19 * * *" }
  ]
}
```
> `0 19 * * *` = UTC 19:00 = **KST 익일 04:00** (트래픽 적은 새벽). Vercel Cron 은 UTC 기준.

`.env.example` 에 추가:
```
# Cron (Vercel Cron 인증)
CRON_SECRET=
# FSS 파인 수집 (선택 — 기본 400ms)
FSS_FETCH_DELAY_MS=400
```
> ⚠️ **Vercel 배포(STEP 119)는 아직 보류** → cron 은 배포 후 활성. 그 전까지는 STEP 3 수동 실행으로 데이터 채움.

---

### STEP 5 — 검증·뱃지 표시

**(a) 검증 API** `app/api/rooms/[id]/verify/route.ts` 신규:
```ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { bizNo } = await req.json();
  const cleanBiz = String(bizNo ?? "").replace(/[^0-9]/g, "");
  if (cleanBiz.length < 10) return NextResponse.json({ ok: false, error: "사업자번호 형식 오류" }, { status: 400 });

  const sb = createAdminClient();

  const { data: adv } = await sb.from("fss_advisors").select("*").eq("biz_no", cleanBiz).maybeSingle();
  const today = new Date().toISOString().slice(0, 10);
  const valid = adv && adv.status === "active" && (!adv.valid_to || adv.valid_to >= today);

  if (!valid) return NextResponse.json({ ok: false, verified: false, reason: "금감원 신고목록에서 확인 안 됨" });

  await sb.from("leading_rooms").update({
    is_certified: true, biz_no: cleanBiz, fss_biz_no: cleanBiz,
    cert_type: "similar_advisory", cert_verified_at: new Date().toISOString(),
  }).eq("id", id);

  return NextResponse.json({ ok: true, verified: true, advisor: { company_name: adv.company_name, valid_to: adv.valid_to } });
}
```
> 현재 카카오 OAuth·admin 권한 미활성 → 이 API 는 일단 동작 가능하게 두되, 추후 STEP 에서 **운영자 본인/관리자만** 호출하도록 권한 게이팅 추가 (코드에 `// TODO(auth): 운영자/admin 게이팅` 주석 남길 것).

**(b) 뱃지 UI** — `components/platform/RoomsClient.tsx`(목록 카드) + `components/platform/RoomDetailClient.tsx`(상세)에 추가:
- `is_certified === true` → 뱃지: `금감원 신고업체 ✓` (운종 골드 `text-unjong-accent` 또는 토스 그린 `text-[#1AC267]` 배경 pill, `rounded-full text-xs font-semibold px-2 py-0.5`)
- `false` → 회색 pill `신고 미확인` (`text-unjong-muted`)
- 상세 페이지엔 검증일(`cert_verified_at`) + 출처 문구 노출: `출처: 금융감독원 파인 · 유사투자자문업자 신고현황`
- 상세 하단 **면책 고지** 고정 노출:
  `운종은 투자 권유·중개를 하지 않으며, 인증 뱃지는 금융감독원 신고 여부만 의미합니다. 신고 = 수익 보장 아님. 토론은 사용자 개인 의견입니다.`

> 타입: 리딩방 타입은 별도 `types/` 파일이 아니라 **`RoomDetailClient.tsx`·`RoomsClient.tsx` 인라인 인터페이스**에 정의돼 있다(예: `RoomDetailClient.tsx` 의 `is_certified: boolean`). 그 인라인 인터페이스에 `biz_no?·cert_type?·cert_verified_at?` 추가하고, **`.select(...)` 컬럼 목록에 `cert_verified_at, biz_no` 를 반드시 추가**할 것 (현재 select 는 `id, platform, name, operator, description, external_url, pricing, category, is_certified, discussion_count` 만 가져옴). `RoomDetailClient.tsx` 에 이미 `{room.is_certified && (...)}` 분기가 있으니 그 자리에 뱃지를 확장.

---

### STEP 6 — 빌드 검증 + 커밋

```bash
cd ~/stock-terminal && npm run build
```
- ✓ exit 0 확인. `console.log` 잔여 금지 (`console.info`/`console.error` 만 허용).
- 빌드 깨지면 커밋 ❌ → 수정 후 재빌드.

커밋·푸시 (빌드 성공 시에만):
```bash
cd ~/stock-terminal && git add lib/fss.ts scripts/import-fss-advisors.ts \
  app/api/cron/fss-advisors/route.ts "app/api/rooms/[id]/verify/route.ts" \
  components/platform/RoomsClient.tsx components/platform/RoomDetailClient.tsx \
  supabase/migrations/021_fss_advisors.sql vercel.json .env.example package.json package-lock.json \
  && git commit -m "feat(v6): FSS 유사투자자문업자 인증 시스템 — 파인 일1회 임포트 + 사업자번호 자동 검증 뱃지 (Phase 2-①)" \
  && git push
```

---

### STEP 7 — 문서 갱신 (세션 종료 체크리스트)

4개 필수 문서 헤더 날짜를 오늘(2026-06-03)로 + 변경 블록 추가:
- `CLAUDE.md` (첫 줄 날짜)
- `docs/CHANGELOG.md` (STEP 137 블록)
- `session-context.md` (STEP 137 완료 블록 + `Last GC`)
- `docs/NEXT_SESSION_START.md` (HEAD 해시·STEP 번호 갱신)
- `docs/NEXT_SESSION_PLAYBOOK.md` (HEAD·마이그레이션 021·다음 STEP 후보 갱신)
- `docs/SESSION_KICKOFF.md` (현재 커밋 갱신)

---

## ✅ 완료 기준 (DoD)

1. STEP 0 에서 페이지 파라미터 확정 → `PAGE_PARAM` 코드 반영.
2. `021_fss_advisors.sql` 생성 (Cowork 적용 대기 보고).
3. `npx tsx scripts/import-fss-advisors.ts` 1회 성공 → `fss_advisors` 약 1,700건 적재 (Cowork 가 021 적용 후 실행).
4. 리딩방 상세에서 사업자번호 입력 → 검증 API → `is_certified` 토글 + 뱃지 변경.
5. 면책 고지 노출.
6. `npm run build` ✓ exit 0 + push 완료.
7. 6개 문서 갱신.

## ⚠️ 주의

- 마이그레이션 apply 는 **Cowork(Supabase MCP)** — Claude Code 직접 ❌.
- `SUPABASE_SERVICE_ROLE_KEY` 는 서버(임포트/검증 API)에서만 사용 — 클라이언트 번들 유출 ❌.
- 파인 수집은 **하루 1회 · UA 표기 · 페이지당 딜레이** 유지 (저빈도 매너).
- 사업자번호 외 상호·홈페이지 매칭은 v1 범위 밖 (다음 STEP 의 "자동 후보 제안" 으로).
- `.env.local` 절대 commit ❌.

---

> **STEP 137 = V6 Phase 2-① (신뢰 축 핵심).** 완료 후 다음 후보: Phase 2-② 재무지표 파이프라인 / 상호·홈페이지 자동 매칭 후보 / Sponsored 분리 UI.
