<!-- 2026-06-28 -->
# STEP 446 — OG 전체 배치 크롤 + 채널명 OG 폴백

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_446_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
1. **OG 크롤 로직을 `lib/og.ts`로 추출** → 미리보기 라우트 + 배치가 공유.
2. **`/api/admin/crawl-previews`(dev 전용 배치)** 신규 → 전체 홈페이지 1회 크롤해 `link_previews` 채움.
3. **리스트 API가 `og_title` 조인 반환**.
4. **채널명 = `info_name` 있으면 그거 / 없으면 정리한 OG 제목 / 둘 다 없으면 "—"** (리스트 + 미리보기 공통).

## 전제
- 최신 main + STEP 445. `link_previews` 테이블 이미 있음. 새 라우트 → **재시작**.
- 파일 5개: 신규 `lib/og.ts`·`app/api/admin/crawl-previews/route.ts`, 수정 `app/api/link-preview/route.ts`(전체 교체)·`app/api/advisors/route.ts`·`components/toolbox/AdvisorDirectory.tsx`.

---

## (1) `lib/og.ts` — 신규 생성
```ts
export type OgResult = { title: string | null; image: string | null; description: string | null; siteName: string | null; status: string };

export function hostOf(u: string): string { try { return new URL(u).hostname; } catch { return ""; } }
export function isBlockedHost(host: string): boolean {
  if (!host) return true;
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".local")) return true;
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)) return true;
  return false;
}
function decodeEntities(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&#x27;/g, "'").replace(/&nbsp;/g, " ");
}
function metaOf(html: string, prop: string): string | null {
  const a = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, "i");
  const b = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, "i");
  const m = html.match(a) || html.match(b);
  return m ? decodeEntities(m[1]).trim() : null;
}

export async function fetchOg(url: string): Promise<OgResult> {
  if (isBlockedHost(hostOf(url))) return { title: null, image: null, description: null, siteName: null, status: "error" };
  let title: string | null = null, image: string | null = null, description: string | null = null, siteName: string | null = null, status = "empty";
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, {
      method: "GET", redirect: "follow", signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TrillionBot/1.0; +https://onetrillion.app)", "Accept": "text/html" },
    });
    clearTimeout(t);
    const ctype = res.headers.get("content-type") ?? "";
    if (res.ok && ctype.includes("text/html")) {
      const buf = await res.arrayBuffer();
      let charset = (ctype.match(/charset=["']?([\w-]+)/i)?.[1] ?? "").toLowerCase();
      if (!charset) {
        const head = new TextDecoder("latin1").decode(buf.slice(0, 4096));
        charset = (head.match(/charset=["']?([\w-]+)/i)?.[1] ?? "utf-8").toLowerCase();
      }
      const isKr = /euc-?kr|ks_c|cp949|949/.test(charset);
      let html: string;
      try { html = new TextDecoder(isKr ? "euc-kr" : "utf-8").decode(buf); }
      catch { html = new TextDecoder("utf-8").decode(buf); }
      html = html.slice(0, 600000);
      title = metaOf(html, "og:title") || (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? null);
      if (title) title = decodeEntities(title).trim().slice(0, 200) || null;
      image = metaOf(html, "og:image");
      description = metaOf(html, "og:description") || metaOf(html, "description");
      if (description) description = decodeEntities(description).slice(0, 300);
      siteName = metaOf(html, "og:site_name");
      if (title && title.includes("�")) title = null;
      if (description && description.includes("�")) description = null;
      if (siteName && siteName.includes("�")) siteName = null;
      if (image || title) status = "ok";
    } else { status = "error"; }
  } catch { status = "error"; }
  if (image && !/^https?:\/\//i.test(image)) { try { image = new URL(image, url).href; } catch { image = null; } }
  return { title, image, description, siteName, status };
}
```

## (2) `app/api/link-preview/route.ts` — 전체 교체 (lib/og 사용)
```ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchOg, hostOf, isBlockedHost } from "@/lib/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = (req.nextUrl.searchParams.get("url") ?? "").trim();
  if (!/^https?:\/\//i.test(url)) return NextResponse.json({ status: "error" }, { status: 400 });
  if (isBlockedHost(hostOf(url))) return NextResponse.json({ status: "error" }, { status: 400 });

  const admin = createAdminClient();

  // 캐시 먼저
  const { data: cached } = await admin.from("link_previews").select("*").eq("url", url).maybeSingle();
  if (cached) {
    return NextResponse.json({ title: cached.og_title, image: cached.og_image, description: cached.og_description, siteName: cached.site_name, status: cached.status });
  }

  // 우리가 저장한 링크만 크롤 허용 (SSRF 차단)
  const { data: k1 } = await admin.from("advisor_directory").select("biz_no").eq("homepage", url).limit(1);
  let known = (k1?.length ?? 0) > 0;
  if (!known) {
    const { data: k2 } = await admin.from("business_links").select("id").eq("url", url).limit(1);
    known = (k2?.length ?? 0) > 0;
  }
  if (!known) return NextResponse.json({ status: "error" }, { status: 400 });

  const og = await fetchOg(url);
  await admin.from("link_previews").upsert({
    url, og_title: og.title, og_image: og.image, og_description: og.description, site_name: og.siteName,
    status: og.status, fetched_at: new Date().toISOString(),
  }, { onConflict: "url" });

  return NextResponse.json({ title: og.title, image: og.image, description: og.description, siteName: og.siteName, status: og.status });
}
```

## (3) `app/api/admin/crawl-previews/route.ts` — 신규 (dev 전용 배치)
```ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchOg } from "@/lib/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "dev only" }, { status: 403 });
  const limit = Math.min(300, parseInt(req.nextUrl.searchParams.get("limit") ?? "120", 10) || 120);
  const admin = createAdminClient();

  const { data: advRows } = await admin.from("advisor_directory").select("homepage").not("homepage", "is", null).neq("homepage", "");
  const allUrls = Array.from(new Set((advRows ?? []).map((r) => r.homepage as string).filter(Boolean)));
  const { data: cachedRows } = await admin.from("link_previews").select("url");
  const cachedSet = new Set((cachedRows ?? []).map((c) => c.url as string));
  const todo = allUrls.filter((u) => !cachedSet.has(u)).slice(0, limit);

  let crawled = 0;
  const conc = 8;
  for (let i = 0; i < todo.length; i += conc) {
    const batch = todo.slice(i, i + conc);
    await Promise.all(batch.map(async (url) => {
      const og = await fetchOg(url);
      await admin.from("link_previews").upsert({
        url, og_title: og.title, og_image: og.image, og_description: og.description, site_name: og.siteName,
        status: og.status, fetched_at: new Date().toISOString(),
      }, { onConflict: "url" });
      crawled++;
    }));
  }
  const remaining = allUrls.filter((u) => !cachedSet.has(u)).length - crawled;
  return NextResponse.json({ total: allUrls.length, crawled, remaining: Math.max(0, remaining) });
}
```

## (4) `app/api/advisors/route.ts` — og_title 조인 추가
**찾기:**
```ts
    rows = rows.map((r) => ({ ...r, verified_owner: verifiedSet.has(r.biz_no) }));
  }

  return NextResponse.json({ results: rows, total: count ?? 0, page, pageSize: PAGE_SIZE, platform, sort, searching: !!q, loggedIn: !!user });
```
**바꾸기:**
```ts
    rows = rows.map((r) => ({ ...r, verified_owner: verifiedSet.has(r.biz_no) }));
  }

  // OG 제목(채널명 fallback) 붙이기 — link_previews는 서비스롤만 읽힘
  if (rows.length) {
    const admin2 = createAdminClient();
    const homes = Array.from(new Set(rows.map((r) => r.homepage).filter(Boolean))) as string[];
    const ogMap: Record<string, string> = {};
    if (homes.length) {
      const { data: ogs } = await admin2.from("link_previews").select("url, og_title, status").in("url", homes);
      for (const o of (ogs ?? []) as { url: string; og_title: string | null; status: string }[]) {
        if (o.status === "ok" && o.og_title) ogMap[o.url] = o.og_title;
      }
    }
    rows = rows.map((r) => ({ ...r, og_title: r.homepage ? (ogMap[r.homepage as string] ?? null) : null }));
  }

  return NextResponse.json({ results: rows, total: count ?? 0, page, pageSize: PAGE_SIZE, platform, sort, searching: !!q, loggedIn: !!user });
```

## (5) `components/toolbox/AdvisorDirectory.tsx` — 4곳

### (5-a) Advisor 타입에 og_title
**찾기:**
```ts
  verified_owner?: boolean;
};
```
**바꾸기:**
```ts
  verified_owner?: boolean;
  og_title?: string | null;
};
```

### (5-b) channelOf 헬퍼 (hostOf 아래)
**찾기:**
```tsx
function hostOf(u: string): string { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } }
```
**바꾸기:**
```tsx
function hostOf(u: string): string { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } }
function cleanTitle(t: string): string { return t.split(/[-|:·—–]/)[0].trim().slice(0, 30); }
function channelOf(a: Advisor): string | null {
  if (a.info_name && a.info_name.trim() && a.info_name !== a.company_name) return a.info_name.trim();
  if (a.og_title && a.og_title.trim()) { const c = cleanTitle(a.og_title); if (c && c !== a.company_name) return c; }
  return null;
}
```

### (5-c) 리스트 채널명 컬럼 — channelOf 사용
**찾기:**
```tsx
                    <button type="button" onClick={() => setSelected(a)} className="min-w-0 truncate text-left text-xs text-unjong-muted">
                      {a.info_name && a.info_name.trim() && a.info_name !== a.company_name ? a.info_name : '—'}
                    </button>
```
**바꾸기:**
```tsx
                    <button type="button" onClick={() => setSelected(a)} className="min-w-0 truncate text-left text-xs text-unjong-muted">
                      {channelOf(a) ?? '—'}
                    </button>
```

### (5-d) 미리보기 리딩방명 줄 — channelOf 사용
**찾기:**
```tsx
      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        {isFss && a.info_name && a.info_name.trim() && a.info_name !== a.company_name ? (
          <span className="min-w-0 truncate text-unjong-muted">{a.info_name}</span>
        ) : <span />}
        <button type="button" onClick={onReport} className="flex shrink-0 items-center gap-1 text-unjong-muted hover:text-red-500">
          <Siren size={13} /> 신고 {a.report_count}
        </button>
      </div>
```
**바꾸기:**
```tsx
      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        {isFss && channelOf(a) ? (
          <span className="min-w-0 truncate text-unjong-muted">{channelOf(a)}</span>
        ) : <span />}
        <button type="button" onClick={onReport} className="flex shrink-0 items-center gap-1 text-unjong-muted hover:text-red-500">
          <Siren size={13} /> 신고 {a.report_count}
        </button>
      </div>
```

---

## 클린 재시작 (새 라우트)
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```

## 배치 크롤 실행 (한 번만 — 전체 홈페이지 OG 채우기)
재시작 후, 다음 루프를 돌려 `remaining`이 0 될 때까지 크롤:
```bash
while true; do
  R=$(curl -s "http://localhost:3333/api/admin/crawl-previews?limit=120")
  echo "$R"
  echo "$R" | grep -q '"remaining":0' && break
  sleep 1
done
```
(총 ~1,500개. 네이버·텔레그램·죽은 링크는 빠르게 empty/error 처리. 몇 분 걸림.)

## 확인 (localhost)
- 크롤 끝나면 리스트 **채널명 컬럼이 "—" 대신 채워짐** (예: (BDBC)투자연구소 → "슈퍼개미프로젝트"). info_name 있는 곳은 그대로 그 이름.
- 미리보기 리딩방명 줄도 같은 값.
- 네이버 카페 등 제목 안 깨지고 한글 정상(EUC-KR 처리됨).
- 빌드 에러 없음.

## 빌드·커밋
- 보류. 확인 후 STEP 444~446 묶어 커밋. push·배포는 사용자 지시 시.
- (참고) `crawl-previews`는 dev 전용(프로덕션 403)이라 배포돼도 안전.
