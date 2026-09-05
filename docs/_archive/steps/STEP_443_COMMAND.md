<!-- 2026-06-28 -->
# STEP 443 — [리딩방 디렉토리 B] OG 링크 프리뷰 (카톡식 미리보기 카드)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_443_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
미리보기 카드에서 **연결링크(바로가기)의 OG 미리보기**를 카톡처럼 보여준다.
- 미리보기 열 때 **lazy 1회 크롤 → `link_previews` 캐시 → 카드 렌더**(이미지·제목·설명).
- OG 없으면 카드 없이 **"연결링크 바로가기" 버튼만**(fallback).

> 캐시 테이블 `link_previews`는 **이미 생성됨(MCP)**. SSRF 가드: 우리 DB에 저장된 링크(homepage·업체제공)만 크롤.

## 전제
- 최신 main + STEP 442. 파일 2개: **신규 `app/api/link-preview/route.ts`** + `components/toolbox/AdvisorDirectory.tsx`.
- **새 API 라우트 → 클린 재시작 필요.**

---

## (1) `app/api/link-preview/route.ts` — 신규 생성
**아래 내용으로 새 파일 생성:**
```ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hostOf(u: string): string {
  try { return new URL(u).hostname; } catch { return ""; }
}
// 사설/내부 주소 차단(SSRF 보조)
function isBlockedHost(host: string): boolean {
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

export async function GET(req: NextRequest) {
  const url = (req.nextUrl.searchParams.get("url") ?? "").trim();
  if (!/^https?:\/\//i.test(url)) return NextResponse.json({ status: "error" }, { status: 400 });
  if (isBlockedHost(hostOf(url))) return NextResponse.json({ status: "error" }, { status: 400 });

  const admin = createAdminClient();

  // 캐시 먼저
  const { data: cached } = await admin.from("link_previews").select("*").eq("url", url).maybeSingle();
  if (cached) {
    return NextResponse.json({
      title: cached.og_title, image: cached.og_image, description: cached.og_description,
      siteName: cached.site_name, status: cached.status,
    });
  }

  // 우리가 저장한 링크만 크롤 허용 (SSRF 차단)
  const { data: k1 } = await admin.from("advisor_directory").select("biz_no").eq("homepage", url).limit(1);
  let known = (k1?.length ?? 0) > 0;
  if (!known) {
    const { data: k2 } = await admin.from("business_links").select("id").eq("url", url).limit(1);
    known = (k2?.length ?? 0) > 0;
  }
  if (!known) return NextResponse.json({ status: "error" }, { status: 400 });

  // lazy 크롤
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
      const html = (await res.text()).slice(0, 600000);
      title = metaOf(html, "og:title") || (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? null);
      if (title) title = decodeEntities(title).trim().slice(0, 200) || null;
      image = metaOf(html, "og:image");
      description = metaOf(html, "og:description") || metaOf(html, "description");
      if (description) description = description.slice(0, 300);
      siteName = metaOf(html, "og:site_name");
      if (image || title) status = "ok";
    } else {
      status = "error";
    }
  } catch {
    status = "error";
  }

  // og:image 상대경로 → 절대 보정
  if (image && !/^https?:\/\//i.test(image)) {
    try { image = new URL(image, url).href; } catch { image = null; }
  }

  await admin.from("link_previews").upsert({
    url, og_title: title, og_image: image, og_description: description, site_name: siteName,
    status, fetched_at: new Date().toISOString(),
  }, { onConflict: "url" });

  return NextResponse.json({ title, image, description, siteName, status });
}
```

---

## (2) `components/toolbox/AdvisorDirectory.tsx` — 3곳

### (2-a) hostOf 헬퍼 추가 (roomNameOf 아래)
**찾기:**
```tsx
function roomNameOf(a: Advisor): string {
  return (a.info_name && a.info_name.trim()) || a.company_name;
}
```
**바꾸기:**
```tsx
function roomNameOf(a: Advisor): string {
  return (a.info_name && a.info_name.trim()) || a.company_name;
}
function hostOf(u: string): string { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } }
```

### (2-b) PreviewBody에 OG fetch 훅 추가 (rows 선언 뒤, return 앞)
**찾기:**
```tsx
    : [
        ['운영 업체', a.company_name],
        ['소개', a.intro],
      ];
  return (
    <div>
```
**바꾸기:**
```tsx
    : [
        ['운영 업체', a.company_name],
        ['소개', a.intro],
      ];
  const [og, setOg] = useState<{ title: string | null; image: string | null; description: string | null; siteName: string | null; status: string } | null>(null);
  const [ogLoading, setOgLoading] = useState(false);
  useEffect(() => {
    setOg(null);
    if (!a.homepage) { setOgLoading(false); return; }
    let cancelled = false;
    setOgLoading(true);
    fetch(`/api/link-preview?url=${encodeURIComponent(a.homepage)}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setOg(d); })
      .catch(() => { if (!cancelled) setOg(null); })
      .finally(() => { if (!cancelled) setOgLoading(false); });
    return () => { cancelled = true; };
  }, [a.homepage]);
  return (
    <div>
```

### (2-c) 바로가기 블록 → OG 카드 + 연결링크 바로가기
**찾기:**
```tsx
      {a.homepage ? (
        <a href={a.homepage} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white">
          바로가기 <ExternalLink size={13} />
        </a>
      ) : null}
```
**바꾸기:**
```tsx
      {a.homepage ? (
        <div className="mt-3">
          {ogLoading ? (
            <div className="mb-2 h-24 animate-pulse rounded-lg bg-unjong-background" />
          ) : og && og.status === 'ok' && (og.image || og.title) ? (
            <a href={a.homepage} target="_blank" rel="noopener noreferrer nofollow" className="mb-2 block overflow-hidden rounded-lg border border-unjong-border transition-colors hover:border-unjong-accent">
              {og.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={og.image} alt="" className="h-28 w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              ) : null}
              <div className="p-2.5">
                <p className="line-clamp-1 text-xs font-semibold text-unjong-primary">{og.title || hostOf(a.homepage)}</p>
                {og.description ? <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-unjong-muted">{og.description}</p> : null}
                <p className="mt-1 truncate text-[10px] text-unjong-muted">{og.siteName || hostOf(a.homepage)}</p>
              </div>
            </a>
          ) : null}
          <a href={a.homepage} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center justify-center gap-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white">
            연결링크 바로가기 <ExternalLink size={13} />
          </a>
        </div>
      ) : null}
```

---

## 클린 재시작 (새 API 라우트)
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```

## 확인 (localhost)
- 리딩방·검증 → 업체 미리보기 열기:
  - 홈페이지에 OG가 있는 곳(유튜브 채널·일부 블로그·자체 사이트) → **이미지+제목+설명 카드**가 "연결링크 바로가기" 버튼 **위에** 뜸.
  - OG 없는 곳(텔레그램 비공개 초대링크 등) → 카드 없이 **버튼만**(fallback). 정상.
  - 처음 열 때 잠깐 스켈레톤 → 이후 같은 링크는 캐시라 즉시.
- 네트워크 탭에서 `/api/link-preview?url=...` 호출 확인.
- (참고) 첫 조회 시 `link_previews`에 행이 쌓임 — 다음부턴 캐시.

## 빌드·커밋
- 보류. 확인 후 **STEP 442+443 묶어 커밋** 예정. push·배포는 사용자 지시 시.
