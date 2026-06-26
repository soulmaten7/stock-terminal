<!-- 2026-06-25 -->
# STEP 404 — 남은 폴리시·버그 묶음

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_404_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (이번 STEP 포함 항목)
1. **뉴스 og:image 스크래핑 경량화** — `app/api/news/feed/route.ts`: 대표 이미지 스크래핑 대상 6→3개로 축소(느리고 깨지기 쉬운 외부 페이지 fetch 줄이기). 이미지 없을 때 fallback은 이미 안전(기본 `image: null` + `onError` 숨김)하므로 그대로 둠.
2. **admin 페이지네이션** — `app/admin/page.tsx` + `components/admin/AdminReports.tsx` + `components/admin/AdminSubmissions.tsx`: 신고·자가등록 목록이 `.limit(300)`로 조용히 잘리던 것을 `.limit(1000)`로 올리고, 클라이언트 페이지네이션(50개/페이지 + 이전/다음)을 추가해 300개 초과 데이터도 전부 확인 가능하게.

> ⚠️ 스킵 항목(3·4번 후보)은 이 문서 맨 아래 **"스킵/보류"** 섹션 참고 — 코드는 건드리지 않음.

## 전제
- 최신 main. **배포 X(배치)** — 로컬 빌드 + 로컬 커밋까지만. `git push`·vercel 금지.
- 변경 종류: 라우트 1(`app/api/news/feed/route.ts`) + 페이지 1(`app/admin/page.tsx`) + 컴포넌트 2(`components/admin/AdminReports.tsx`, `components/admin/AdminSubmissions.tsx`).
- 빌드: Next.js 16 / Turbopack(dev 포트 3333) / Tailwind v4. `unjong-*` 클래스·식별자는 그대로 유지.

---

## (1) `app/api/news/feed/route.ts` — og:image 스크래핑 6→3

대표 기사 후보로 og:image를 긁는 개수를 6→3으로 줄인다. 슬라이스·`Promise.all`·`ordered`(첫 이미지 보유 기사 대표 승격) 로직은 그대로 작동하고, 이미지 없으면 `image: null` → `NewsFeed`가 자동 숨김 처리하므로 깨진 이미지 없음.

찾기:
```ts
    const TOP = Math.min(6, parsed.length);
```
바꾸기:
```ts
    const TOP = Math.min(3, parsed.length); // og:image 스크래핑 대상 축소(6→3) — 느린 외부 fetch 줄이기, 없으면 image:null로 안전 fallback
```

---

## (2) admin 페이지네이션

### (2-A) `app/admin/page.tsx` — limit 300 → 1000 (2곳)

신고 쿼리 limit:

찾기:
```ts
  const { data: reportsData } = await admin.from('room_reports').select('*').order('created_at', { ascending: false }).limit(300);
```
바꾸기:
```ts
  const { data: reportsData } = await admin.from('room_reports').select('*').order('created_at', { ascending: false }).limit(1000);
```

자가등록 쿼리 limit:

찾기:
```ts
  const { data: subsData } = await admin.from('room_submissions').select('*').order('created_at', { ascending: false }).limit(300);
```
바꾸기:
```ts
  const { data: subsData } = await admin.from('room_submissions').select('*').order('created_at', { ascending: false }).limit(1000);
```

### (2-B) `components/admin/AdminReports.tsx` — 클라이언트 페이지네이션 추가

**① 페이지 상태 + 상수 추가**

찾기:
```tsx
export default function AdminReports({ initial }: { initial: Report[] }) {
  const [reports, setReports] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);
```
바꾸기:
```tsx
const ADMIN_PAGE_SIZE = 50;

export default function AdminReports({ initial }: { initial: Report[] }) {
  const [reports, setReports] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(reports.length / ADMIN_PAGE_SIZE));
  const pageReports = reports.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE);
```

**② 렌더링 대상을 페이지 슬라이스로 교체**

찾기:
```tsx
        <tbody>
          {reports.map((r) => (
```
바꾸기:
```tsx
        <tbody>
          {pageReports.map((r) => (
```

**③ 표 아래에 페이지네이션 컨트롤 추가** (return을 `<>...</>`로 감싸고 표 다음에 페이저 삽입)

찾기:
```tsx
  return (
    <div className="overflow-x-auto rounded-lg border border-unjong-border">
      <table className="w-full text-sm">
```
바꾸기:
```tsx
  return (
    <>
    <div className="overflow-x-auto rounded-lg border border-unjong-border">
      <table className="w-full text-sm">
```

찾기:
```tsx
        </tbody>
      </table>
    </div>
  );
}
```
바꾸기:
```tsx
        </tbody>
      </table>
    </div>
    {totalPages > 1 ? (
      <div className="mt-3 flex items-center justify-center gap-3 text-sm">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-md border border-unjong-border px-3 py-1 text-unjong-muted transition-colors hover:border-unjong-accent disabled:opacity-40">이전</button>
        <span className="text-xs text-unjong-muted">{page} / {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-md border border-unjong-border px-3 py-1 text-unjong-muted transition-colors hover:border-unjong-accent disabled:opacity-40">다음</button>
      </div>
    ) : null}
    </>
  );
}
```

### (2-C) `components/admin/AdminSubmissions.tsx` — 클라이언트 페이지네이션 추가

**① 페이지 상태 + 상수 추가**

찾기:
```tsx
export default function AdminSubmissions({ initial }: { initial: Submission[] }) {
  const [subs, setSubs] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);
```
바꾸기:
```tsx
const ADMIN_PAGE_SIZE = 50;

export default function AdminSubmissions({ initial }: { initial: Submission[] }) {
  const [subs, setSubs] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(subs.length / ADMIN_PAGE_SIZE));
  const pageSubs = subs.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE);
```

**② 렌더링 대상을 페이지 슬라이스로 교체**

찾기:
```tsx
        <tbody>
          {subs.map((s) => (
```
바꾸기:
```tsx
        <tbody>
          {pageSubs.map((s) => (
```

**③ 표 아래에 페이지네이션 컨트롤 추가** (return을 `<>...</>`로 감싸고 표 다음에 페이저 삽입)

찾기:
```tsx
  return (
    <div className="overflow-x-auto rounded-lg border border-unjong-border">
      <table className="w-full text-sm">
```
바꾸기:
```tsx
  return (
    <>
    <div className="overflow-x-auto rounded-lg border border-unjong-border">
      <table className="w-full text-sm">
```

찾기:
```tsx
        </tbody>
      </table>
    </div>
  );
}
```
바꾸기:
```tsx
        </tbody>
      </table>
    </div>
    {totalPages > 1 ? (
      <div className="mt-3 flex items-center justify-center gap-3 text-sm">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-md border border-unjong-border px-3 py-1 text-unjong-muted transition-colors hover:border-unjong-accent disabled:opacity-40">이전</button>
        <span className="text-xs text-unjong-muted">{page} / {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-md border border-unjong-border px-3 py-1 text-unjong-muted transition-colors hover:border-unjong-accent disabled:opacity-40">다음</button>
      </div>
    ) : null}
    </>
  );
}
```

---

## 빌드 + 로컬 커밋 (푸시·배포 X)
```bash
pkill -f "next dev" 2>/dev/null; npm run build
git add app/api/news/feed/route.ts app/admin/page.tsx components/admin/AdminReports.tsx components/admin/AdminSubmissions.tsx
git commit -m "fix(STEP 404): 남은 폴리시 — 뉴스 og:image 6→3, admin 페이지네이션(50/p, limit 1000)"
```

> ⚠️ `git push`·vercel 금지 — 배포는 배치(수동)로 별도 진행.

## 확인 체크리스트
- [ ] `npm run build` 타입·빌드 통과 (에러 0).
- [ ] **뉴스**: 뉴스/리포트/실적/ETF 탭 정상 로드. 대표 기사 이미지는 (있을 때만) 표시, 없으면 깨진 이미지 없이 텍스트만 — 평소와 동일, 로딩만 약간 빨라짐.
- [ ] **admin**: 관리자 계정으로 `/admin` 접속 → 신고·자가등록 표 정상. 항목 50개 초과 시 표 아래 "이전 / n / 총 / 다음" 페이저 노출, 50개 이하면 페이저 미노출(`totalPages > 1` 가드). 승인/기각/확인 버튼 동작은 기존과 동일.
- [ ] `console.log` 잔여 없음. `unjong-*` 클래스 유지.

---

## 스킵/보류 (이번 STEP 미포함 — 근거)

### (3) '리포트/차트' 탭 라벨-콘텐츠 불일치 → **스킵 (명확한 불일치 못 찾음)**
라벨 출처를 추적한 결과, 보고된 "라벨 ↔ 콘텐츠 불일치"의 **객관적 근거를 확인하지 못함**:
- 라벨 정의: `app/page.tsx`의 `CATEGORY_LABELS` (link_hub 카테고리 탭) + `ToolboxClient.tsx`의 `SPECIAL_LABELS`(market/youtube/room 전용).
- 우측 피드 매핑: `ToolboxClient.tsx`의 `FEED_TABS = ['news','disclosure','macro','analysis','research','etf','ipo']` + `feedFor()`.
- 대조 결과(라벨 ↔ 피드 title/query):
  - `research` 라벨 "리포트" ↔ `<NewsFeed query="증권사 리포트 목표주가" title="리포트·목표주가 뉴스" />` → **일치**
  - `analysis` 라벨 "기업·재무" ↔ `<NewsFeed query="실적 영업이익 잠정" title="실적·재무 뉴스" />` → **일치**
  - `etf` 라벨 "ETF·펀드" ↔ `<NewsFeed query="ETF 상장 순자산총액" title="ETF·펀드 뉴스" />` → **일치**
  - `news`/`disclosure`/`macro`/`ipo` → 각각 NewsFeed(기본)/DartFeed/MacroFeed/OfferingsFeed로 라벨과 일관.
  - `chart`(라벨 "차트·시세") → `FEED_TABS`에 없음 → 우측 피드 없이 큐레이션 링크 카드만 표시. 링크 카테고리이므로 라벨과 콘텐츠 일관(피드 누락 아님, 의도된 동작).
- 결론: 지시문대로 "불일치가 주관적/불명확하면 추측하지 말고 스킵". 안전한 relabel·매핑 교정 대상이 **명확하지 않아** 이번엔 건드리지 않음. 실제 불일치 사례(구체 탭명 + 잘못 뜨는 피드)가 재현되면 그 정보로 핀포인트 수정 STEP 별도 발행 권장.

### (4) advisors 검색+플랫폼 동시 필터 → **스킵 (UI 리워크 리스크, 1회 보류 이력)**
- API(`app/api/advisors/route.ts`)는 `if (q) {...} else if (platform !== "all") {...}` 구조라 검색 시 플랫폼 필터가 무시됨. **1줄 수정**(`else if`→`if`)으로 SQL 레벨 결합은 가능.
- 그러나 UI(`components/toolbox/AdvisorDirectory.tsx`)가 **의도적으로 양자택일**:
  - 플랫폼 클릭 시 `onClick={() => { setQ(''); setPlatform(p); }}` — 검색어를 비움(line 262).
  - 플랫폼 활성 하이라이트가 `platform === p && !searching`로 게이팅(line 264) — 검색 중엔 플랫폼 강조 안 됨.
  - 검색 placeholder가 "리딩방명·업체명·대표자 **전체** 검색"(line 249) — '전체 검색' = 플랫폼 무관이 현재 UX 약속.
- 동시 필터를 켜려면 (a) 플랫폼 클릭 시 `setQ('')` 제거, (b) `!searching` 게이트 제거, (c) placeholder 문구·안내 변경, (d) 결과 카운트/빈상태 카피 재정렬까지 필요 → **non-trivial UI 리워크**이며 기존 either/or UX를 회귀시킬 위험.
- 이 항목은 동일 이유로 **이미 한 번 보류**된 건. API 1줄만 바꾸면 UI 약속과 어긋나 혼란을 키우므로, UI 재설계를 별도 STEP으로 명세한 뒤 API+UI를 한 번에 처리하는 것이 안전. 이번엔 **스킵**.
