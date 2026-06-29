<!-- 2026-06-28 -->
# STEP 459 — 인증 리딩방 "채널 단위" 디렉토리 + 게재 가격 모델 §3 잠금

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_459_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
1. **인증 리딩방 뷰 = 채널 단위.** 활성 `business_links` 1개 = 리스트 1행(독립). 같은 업체가 채널 N개면 N행(같은 등록업체명, 채널명만 다름). **교차연결·"다른 채널" 묶음 안 함.**
2. 채널 행 클릭 → 미리보기는 **그 채널의 링크**(channel_url)로 OG·바로가기. (업체 단위 뷰는 기존대로 홈페이지)
3. ROADMAP §3에 **게재 가격 모델**(무료 1채널 / 추가 ₩5만/월·채널 단위 / 결제 Phase 2) 잠금.

## 전제
- 최신 main(STEP 457, HEAD 2c9c590 이후). DB `business_links`에 id·platform·expires_at 존재(변경 없음).
- 파일 2개 + 문서 1개. **advisors 라우트 바뀜 → 클린 재시작.**

---

## (0) `docs/ROADMAP.md` — §3(광고·게재 정책) 끝에 아래 블록 추가
```md
### 게재(노출) 가격 모델 (2026-06-28 확정)
- 신고(사실)·인증(소유확인)은 **무료**. **게재(노출)만 유료.**
- **무료: 인증 업체당 채널 1개 게재** — 공급·커버리지 최대화 → 이용자 정보 풍부(플라이휠).
- **유료: 추가 채널 1개당 ₩5만/월** — 멀티채널 운영자 = 매출 업사이드.
- 단위 = **채널(연결 링크)**, 업체 아님. 금감원 신고는 업체 단위(1신고=1업체)지만 운영자는 보통 여러 채널(무료방→유료방 퍼널) 운영 → 게재는 채널 단위.
- 리스트 렌더 = **채널 1개 = 독립 행**(같은 등록업체명, 채널명만 다름). 교차연결·"이 업체의 다른 채널" 묶음 **안 함**(독립이 추가 결제 동기).
- 유료여도 '광고/스폰서' 라벨 + 신고·디스클레이머 유지 — **노출을 사는 것이지 안전 보증 아님**(§3 원칙 그대로).
- ⚠️ 실제 결제(PG·본인인증)는 **Phase 2**. 그 전엔 수동(인증→게재 신청→입금 확인→게재) 가능. **광고비 실수취 전 법률자문 1회 필수.**
```

---

## (1) `app/api/advisors/route.ts` — 전체 교체
```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;
const VIEWS = ["fss", "verified", "interest"];

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const raw = (sp.get("q") ?? "").trim();
  const q = raw.replace(/[^\p{L}\p{N}\s-]/gu, "").slice(0, 50); // or-필터 인젝션 방지
  const view = VIEWS.includes(sp.get("view") ?? "") ? (sp.get("view") as string) : "fss";
  const dir = sp.get("dir") === "desc" ? "desc" : "asc";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);

  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ───────────────────────────────────────────────
  // 인증 리딩방 = 채널 단위. 활성 business_links 1개 = 1행(독립).
  // 같은 업체가 채널 N개면 N행(같은 등록업체명, 채널명만 다름). 교차연결 안 함.
  // ───────────────────────────────────────────────
  if (view === "verified") {
    const { data: vm } = await admin.from("business_members").select("biz_no").eq("status", "verified");
    const verifiedIds = Array.from(new Set((vm ?? []).map((m: { biz_no: string }) => m.biz_no)));
    if (!verifiedIds.length) return NextResponse.json({ results: [], total: 0, page, pageSize: PAGE_SIZE, view, dir, searching: !!q, loggedIn: !!user });

    const { data: links } = await admin
      .from("business_links")
      .select("id, biz_no, type, platform, url, label, is_paid, expires_at, status")
      .in("biz_no", verifiedIds).eq("status", "active");
    const now = Date.now();
    const chans = (links ?? []).filter((l: { expires_at: string | null }) => !l.expires_at || new Date(l.expires_at).getTime() > now);
    if (!chans.length) return NextResponse.json({ results: [], total: 0, page, pageSize: PAGE_SIZE, view, dir, searching: !!q, loggedIn: !!user });

    const factBizNos = Array.from(new Set(chans.map((c: { biz_no: string }) => c.biz_no)));
    const { data: facts } = await supabase
      .from("advisor_directory")
      .select("biz_no, company_name, info_name, representative, valid_from, valid_to, homepage, phone, address, report_count, favorite_count, platform, source, intro")
      .in("biz_no", factBizNos);
    const factMap: Record<string, Record<string, unknown>> = {};
    for (const f of (facts ?? []) as { biz_no: string }[]) factMap[f.biz_no] = f as Record<string, unknown>;

    type Chan = { id: string; biz_no: string; type: string; platform: string | null; url: string; label: string | null; is_paid: boolean };
    let rows = (chans as Chan[]).map((c) => ({
      ...(factMap[c.biz_no] ?? {}),
      biz_no: c.biz_no,
      channel_id: c.id,
      channel_label: c.label,
      channel_url: c.url,
      channel_type: c.type,
      channel_platform: c.platform,
      channel_is_paid: c.is_paid,
      verified_owner: true,
    } as Record<string, unknown>));

    if (q) {
      const qq = q.toLowerCase();
      rows = rows.filter((r) =>
        String(r.company_name ?? "").toLowerCase().includes(qq) ||
        String(r.representative ?? "").toLowerCase().includes(qq) ||
        String(r.channel_label ?? "").toLowerCase().includes(qq)
      );
    }
    rows.sort((a, b) => {
      const c = String(a.company_name ?? "").localeCompare(String(b.company_name ?? ""), "ko");
      if (c !== 0) return dir === "desc" ? -c : c;
      return String(a.channel_label ?? "").localeCompare(String(b.channel_label ?? ""), "ko");
    });

    const total = rows.length;
    const fromI = (page - 1) * PAGE_SIZE;
    let paged = rows.slice(fromI, fromI + PAGE_SIZE);

    if (user && paged.length) {
      const bizNos = paged.map((r) => r.biz_no as string);
      const { data: myLikes } = await supabase.from("room_likes").select("target_id").eq("user_id", user.id).in("target_id", bizNos);
      const likedSet = new Set((myLikes ?? []).map((l: { target_id: string }) => l.target_id));
      paged = paged.map((r) => ({ ...r, liked: likedSet.has(r.biz_no as string) }));
    } else {
      paged = paged.map((r) => ({ ...r, liked: false }));
    }
    return NextResponse.json({ results: paged, total, page, pageSize: PAGE_SIZE, view, dir, searching: !!q, loggedIn: !!user });
  }

  // ───────────────────────────────────────────────
  // 금감원 등록업체 / 관심도순 = 업체 단위(기존). 1업체 1행.
  // ───────────────────────────────────────────────
  let query = supabase
    .from("advisor_directory")
    .select("biz_no, company_name, info_name, representative, valid_from, valid_to, homepage, phone, address, like_count, report_count, favorite_count, platform, source, intro", { count: "exact" });

  if (q) {
    query = query.or(`company_name.ilike.%${q}%,representative.ilike.%${q}%,info_name.ilike.%${q}%`); // 검색=전체(리딩방명 포함)
  }
  if (view === "interest") {
    query = query.order("favorite_count", { ascending: dir === "asc" }).order("company_name", { ascending: true });
  } else {
    query = query.order("company_name", { ascending: dir !== "desc" });
  }
  const from = (page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Row = { biz_no: string; [k: string]: unknown };
  let rows = (data ?? []) as Row[];

  if (user && rows.length) {
    const ids = rows.map((r) => r.biz_no);
    const { data: myLikes } = await supabase.from("room_likes").select("target_id").eq("user_id", user.id).in("target_id", ids);
    const likedSet = new Set((myLikes ?? []).map((l: { target_id: string }) => l.target_id));
    rows = rows.map((r) => ({ ...r, liked: likedSet.has(r.biz_no) }));
  } else {
    rows = rows.map((r) => ({ ...r, liked: false }));
  }

  // 업체 제공 링크(공개 active) — 업체 단위 미리보기용
  if (rows.length) {
    const ids = rows.map((r) => r.biz_no);
    const { data: bizLinks } = await supabase
      .from("business_links").select("biz_no, type, url, label, is_paid").in("biz_no", ids).eq("status", "active");
    const linkMap: Record<string, { type: string; url: string; label: string | null; is_paid: boolean }[]> = {};
    for (const l of (bizLinks ?? []) as { biz_no: string; type: string; url: string; label: string | null; is_paid: boolean }[]) {
      (linkMap[l.biz_no] ??= []).push({ type: l.type, url: l.url, label: l.label, is_paid: l.is_paid });
    }
    rows = rows.map((r) => ({ ...r, biz_links: linkMap[r.biz_no] ?? [] }));
  }

  // 운영자 인증 플래그(채널명·뱃지 게이팅용)
  if (rows.length) {
    const ids = rows.map((r) => r.biz_no);
    const { data: vmembers } = await admin.from("business_members").select("biz_no").eq("status", "verified").in("biz_no", ids);
    const verifiedSet = new Set((vmembers ?? []).map((m: { biz_no: string }) => m.biz_no));
    rows = rows.map((r) => ({ ...r, verified_owner: verifiedSet.has(r.biz_no) }));
  }

  return NextResponse.json({ results: rows, total: count ?? 0, page, pageSize: PAGE_SIZE, view, dir, searching: !!q, loggedIn: !!user });
}
```

---

## (2) `components/toolbox/AdvisorDirectory.tsx` — 4곳 수정

**2-A) Advisor 타입에 채널 필드 추가** — 찾기:
```tsx
  biz_links?: { type: string; url: string; label: string | null; is_paid: boolean }[];
  verified_owner?: boolean;
};
```
바꾸기:
```tsx
  biz_links?: { type: string; url: string; label: string | null; is_paid: boolean }[];
  verified_owner?: boolean;
  // 채널 단위 행(인증 리딩방 뷰) — 활성 business_link 1개 = 1행
  channel_id?: string;
  channel_label?: string | null;
  channel_url?: string | null;
  channel_platform?: string | null;
  channel_is_paid?: boolean;
};
```

**2-B) channelOf 교체 + rowKey 추가** — 찾기:
```tsx
// 채널명 = 운영자가 직접 '인증'한 곳만 노출. 미인증은 null → "—". (OG·추측 채널명은 쓰지 않음)
function channelOf(a: Advisor): string | null {
  if (!a.verified_owner) return null;
  const name = (a.info_name && a.info_name.trim()) || (a.biz_links && a.biz_links[0]?.label?.trim()) || a.company_name;
  return name || null;
}
```
바꾸기:
```tsx
// 채널명 = 인증한 곳만. 채널 단위 행이면 그 채널명, 업체 단위 행이면 첫 링크/리딩방명. 미인증 → null("—").
function channelOf(a: Advisor): string | null {
  if (a.channel_id) return (a.channel_label && a.channel_label.trim()) || a.company_name || null;
  if (!a.verified_owner) return null;
  const name = (a.info_name && a.info_name.trim()) || (a.biz_links && a.biz_links[0]?.label?.trim()) || a.company_name;
  return name || null;
}
// 행 키 — 채널 단위 행은 channel_id, 업체 단위 행은 biz_no
function rowKey(a: Advisor): string {
  return a.channel_id ?? a.biz_no;
}
```

**2-C) PreviewBody — 채널 링크(channel_url) 우선 + 업체 단위에서만 biz_links 목록**

(C1) 찾기:
```tsx
  const [og, setOg] = useState<{ title: string | null; image: string | null; description: string | null; siteName: string | null; status: string } | null>(null);
  const [ogLoading, setOgLoading] = useState(false);
  useEffect(() => {
    setOg(null);
    // 채널(홈페이지) 연결은 '인증'된 곳만 — 미인증은 OG 카드도 띄우지 않음
    if (!a.verified_owner || !a.homepage) { setOgLoading(false); return; }
    let cancelled = false;
    setOgLoading(true);
    fetch(`/api/link-preview?url=${encodeURIComponent(a.homepage)}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setOg(d); })
      .catch(() => { if (!cancelled) setOg(null); })
      .finally(() => { if (!cancelled) setOgLoading(false); });
    return () => { cancelled = true; };
  }, [a.homepage, a.verified_owner]);
```
바꾸기:
```tsx
  // 채널 단위 행이면 그 채널 링크, 업체 단위면 홈페이지를 미리보기 대상으로
  const linkUrl = a.channel_url || a.homepage;
  const [og, setOg] = useState<{ title: string | null; image: string | null; description: string | null; siteName: string | null; status: string } | null>(null);
  const [ogLoading, setOgLoading] = useState(false);
  useEffect(() => {
    setOg(null);
    if (!a.verified_owner || !linkUrl) { setOgLoading(false); return; }
    let cancelled = false;
    setOgLoading(true);
    fetch(`/api/link-preview?url=${encodeURIComponent(linkUrl)}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setOg(d); })
      .catch(() => { if (!cancelled) setOg(null); })
      .finally(() => { if (!cancelled) setOgLoading(false); });
    return () => { cancelled = true; };
  }, [linkUrl, a.verified_owner]);
```

(C2) 찾기:
```tsx
      {a.verified_owner && a.homepage ? (
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
바꾸기:
```tsx
      {a.verified_owner && linkUrl ? (
        <div className="mt-3">
          {ogLoading ? (
            <div className="mb-2 h-24 animate-pulse rounded-lg bg-unjong-background" />
          ) : og && og.status === 'ok' && (og.image || og.title) ? (
            <a href={linkUrl} target="_blank" rel="noopener noreferrer nofollow" className="mb-2 block overflow-hidden rounded-lg border border-unjong-border transition-colors hover:border-unjong-accent">
              {og.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={og.image} alt="" className="h-28 w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              ) : null}
              <div className="p-2.5">
                <p className="line-clamp-1 text-xs font-semibold text-unjong-primary">{og.title || hostOf(linkUrl)}</p>
                {og.description ? <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-unjong-muted">{og.description}</p> : null}
                <p className="mt-1 truncate text-[10px] text-unjong-muted">{og.siteName || hostOf(linkUrl)}</p>
              </div>
            </a>
          ) : null}
          <a href={linkUrl} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center justify-center gap-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white">
            연결링크 바로가기 <ExternalLink size={13} />
          </a>
        </div>
      ) : null}
```

(C3) 찾기:
```tsx
      {a.biz_links && a.biz_links.length > 0 ? (
        <div className="mt-3 border-t border-unjong-border pt-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-unjong-muted">
            업체 제공 <span className="rounded bg-unjong-background px-1 py-0.5 text-[10px] font-normal">업체가 직접 등록</span>
          </div>
```
바꾸기:
```tsx
      {!a.channel_id && a.biz_links && a.biz_links.length > 0 ? (
        <div className="mt-3 border-t border-unjong-border pt-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-unjong-muted">
            업체 제공 <span className="rounded bg-unjong-background px-1 py-0.5 text-[10px] font-normal">업체가 직접 등록</span>
          </div>
```

**2-D) 리스트 — key·isSel을 rowKey로** — 찾기:
```tsx
              {results.map((a, i) => {
                const n = (page - 1) * PAGE_SIZE + i + 1;
                const isSel = selected?.biz_no === a.biz_no;
                const ch = channelOf(a);
                return (
                  <Fragment key={a.biz_no}>
```
바꾸기:
```tsx
              {results.map((a, i) => {
                const n = (page - 1) * PAGE_SIZE + i + 1;
                const isSel = selected ? rowKey(selected) === rowKey(a) : false;
                const ch = channelOf(a);
                return (
                  <Fragment key={rowKey(a)}>
```

---

## 확인 (advisors 라우트 바뀜 → 클린 재시작)
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```
- 금감원 등록업체 / 관심도순 탭: 기존과 동일(업체 단위 1행). 빌드 에러 없음.
- 인증 리딩방 탭: 지금은 비어있음("아직 인증된 리딩방…") — **정상**(인증 0). 
- (Cowork이 빌드 확인 후 테스트 인증업체 + 채널 2개를 DB에 넣어 채널 2행 표시·미리보기·독립 선택 검증하고 정리함.)

## 빌드·커밋
- 보류. 확인 후 커밋.
