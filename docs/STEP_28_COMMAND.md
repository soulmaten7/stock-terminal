# STEP 28 — Phase 2-B: /investor-flow 를 /net-buy 내 탭으로 흡수

**실행 명령어:**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** 세션 #23 완료 (레이아웃 오버플로우 해결). 사이드바 "수급" 링크는 `/net-buy`로 단일화됨 (세션 #22 Step 11에서 정리). `/investor-flow`는 현재 고아 페이지 상태.

---

## 🎯 목표

`/net-buy` 페이지를 2-탭 구조로 재구성:
- **탭 1 (`?tab=top`, 기본)**: 종목별 수급 TOP 20 — 기존 `/net-buy` 내용
- **탭 2 (`?tab=flow`)**: 투자자별 매매동향 시계열 — 기존 `/investor-flow` 내용

`/investor-flow` 경로는 301 redirect 처리 (기존 북마크/SNS 링크 호환).

---

## 📐 설계 요약

| 항목 | 선택 | 근거 |
|---|---|---|
| 탭 상태 관리 | **URL `?tab=` 파라미터** | 공유 가능, 브라우저 히스토리 지원, server component 유지 가능 |
| 탭 컴포넌트 구조 | 상단 공통 헤더 + 탭바 + 조건부 내용 | 간결, 단일 page.tsx에 담김 |
| 스텁 데이터 | 기존 더미 그대로 이식 | 실 API 연동은 별도 스텝 (Phase 2-B 범위 아님) |
| `/investor-flow` 처리 | server component + `redirect('/net-buy?tab=flow')` | Next.js 내장, next.config 설정 불필요 |
| `WidgetDetailStub` 컴포넌트 | **유지** — 다른 위젯 상세 페이지에서 계속 재사용 | 삭제하면 회귀 위험 |

---

## 🔧 파일 변경 (2개 파일)

### 1. `app/net-buy/page.tsx` — 전면 재작성

**Write (기존 파일 덮어쓰기):**

```tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// ─── 탭 1: 종목별 TOP 20 ───────────────────────────────────
const TOP_COLS = ['순위', '종목명', '외국인 순매수(억)', '기관 순매수(억)', '현재가', '등락률'];
const TOP_NAMES = ['SK하이닉스','삼성전자','LG전자','POSCO홀딩스','KB금융','삼성바이오로직스','현대차','기아','LG에너지솔루션','셀트리온',
                   'NAVER','카카오','SK이노베이션','삼성SDI','SK텔레콤','하이브','에코프로비엠','한화오션','두산에너빌리티','LS ELECTRIC'];
const TOP_ROWS = Array.from({ length: 20 }, (_, i) => ({
  순위: i + 1,
  종목명: TOP_NAMES[i],
  '외국인 순매수(억)': `+${Math.floor(Math.random() * 3000 + 100).toLocaleString('ko-KR')}`,
  '기관 순매수(억)': `${Math.random() > 0.5 ? '+' : '-'}${Math.floor(Math.random() * 2000 + 50).toLocaleString('ko-KR')}`,
  현재가: `${(Math.random() * 200000 + 5000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원`,
  등락률: `${(Math.random() * 6 - 1).toFixed(2)}%`,
}));

// ─── 탭 2: 투자자별 매매동향 시계열 ──────────────────────
const FLOW_COLS = ['날짜', '투자자', '코스피 순매수(억)', '코스닥 순매수(억)', '코스피 거래대금(억)', '코스닥 거래대금(억)'];
const FLOW_INVESTORS = ['외국인', '기관', '개인', '기타법인'];
const FLOW_ROWS = Array.from({ length: 20 }, (_, i) => {
  const inv = FLOW_INVESTORS[i % 4];
  const day = `2026-04-${String(20 - Math.floor(i / 4)).padStart(2, '0')}`;
  const sign = inv === '개인' ? '-' : '+';
  return {
    날짜: day,
    투자자: inv,
    '코스피 순매수(억)': `${sign}${Math.floor(Math.random() * 5000 + 100).toLocaleString('ko-KR')}`,
    '코스닥 순매수(억)': `${Math.random() > 0.5 ? '+' : '-'}${Math.floor(Math.random() * 2000 + 50).toLocaleString('ko-KR')}`,
    '코스피 거래대금(억)': `${Math.floor(Math.random() * 20000 + 5000).toLocaleString('ko-KR')}`,
    '코스닥 거래대금(억)': `${Math.floor(Math.random() * 8000 + 1000).toLocaleString('ko-KR')}`,
  };
});

// ─── 페이지 컴포넌트 ──────────────────────────────────────
export default async function NetBuyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab: 'top' | 'flow' = tab === 'flow' ? 'flow' : 'top';

  return (
    <div className="w-full px-6 py-6">
      {/* 공통 헤더 */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-4">
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <h1 className="text-2xl font-bold text-black mb-1">수급</h1>
        <p className="text-sm text-[#666]">
          외국인·기관 순매수 상위 종목과 시장 전체 투자자별 매매동향을 확인합니다.
        </p>
      </div>

      {/* 탭바 */}
      <div className="flex items-center border-b border-[#E5E7EB] mb-6" role="tablist">
        <Link
          href="/net-buy?tab=top"
          role="tab"
          aria-selected={activeTab === 'top'}
          className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors ${
            activeTab === 'top'
              ? 'border-[#0ABAB5] text-[#0ABAB5]'
              : 'border-transparent text-[#666] hover:text-black'
          }`}
        >
          종목별 TOP
        </Link>
        <Link
          href="/net-buy?tab=flow"
          role="tab"
          aria-selected={activeTab === 'flow'}
          className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors ${
            activeTab === 'flow'
              ? 'border-[#0ABAB5] text-[#0ABAB5]'
              : 'border-transparent text-[#666] hover:text-black'
          }`}
        >
          시장 동향
        </Link>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'top' ? (
        <TableCard
          title="실시간 수급 TOP"
          description="외국인·기관 순매수 상위 종목. KIS API FHPTJ04400000 기반."
          columns={TOP_COLS}
          rows={TOP_ROWS}
        />
      ) : (
        <TableCard
          title="투자자별 매매동향"
          description="외국인·기관·개인·기타법인 코스피/코스닥 매매동향. KIS API 기반."
          columns={FLOW_COLS}
          rows={FLOW_ROWS}
        />
      )}
    </div>
  );
}

// ─── 인라인 테이블 카드 컴포넌트 ──────────────────────
interface Row { [key: string]: string | number }

function TableCard({
  title,
  description,
  columns,
  rows,
}: {
  title: string;
  description: string;
  columns: string[];
  rows: Row[];
}) {
  return (
    <div>
      <p className="text-sm text-[#666] mb-3">{description}</p>
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between">
          <span className="text-sm font-bold text-black">{title}</span>
          <span className="text-[10px] font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-2 py-0.5 rounded">
            실데이터 연결 예정
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#F0F0F0] bg-[#F8F9FA]">
                {columns.map((col) => (
                  <th key={col} className="px-4 py-2.5 text-left font-bold text-[#666]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-[#F0F0F0] hover:bg-[#F8F9FA]">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2 text-[#333]">
                      {String(row[col] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

### 2. `app/investor-flow/page.tsx` — redirect만 남기기 (전면 축소)

**Write (기존 파일 덮어쓰기):**

```tsx
import { redirect } from 'next/navigation';

export default function InvestorFlowRedirect() {
  redirect('/net-buy?tab=flow');
}
```

---

## 🎯 설계 포인트

### searchParams 비동기 처리 (Next.js 16 breaking change)
- `searchParams` 는 **Promise**로 전달됨 — `await` 필수
- `export default async function NetBuyPage(...)` 로 선언해야 함
- 이전 Next.js에선 직접 객체였지만 16에서는 async 강제

### redirect() 동작
- `next/navigation`의 `redirect()` = 307 (Temporary Redirect) 기본
- 영구 이동 원하면 `redirect('/net-buy?tab=flow', RedirectType.replace)` 또는 `permanentRedirect()`
- **307로 충분** — 검색 엔진이 크롤하기 전 단계. 추후 프로덕션 배포 시 `permanentRedirect()` 전환 고려

### 탭 UX 고려
- 탭 전환은 **URL 변경 + 서버 재렌더링** (client-side state 없음)
- Next.js Link가 soft navigation으로 깜빡임 없이 전환
- 새로고침해도 탭 상태 유지 (URL 기반)
- 탭 URL 직접 북마크 가능

### 기존 자원 유지
- `components/common/WidgetDetailStub.tsx` — **삭제 금지**. 다른 위젯 상세 페이지들이 여전히 사용 (단일 테이블 페이지용)
- `components/layout/VerticalNav.tsx` — 이미 `/net-buy` 단일화 완료 (세션 #22 Step 11)

---

## 🚀 실행 순서

```bash
cd ~/Desktop/OTMarketing
git status
git log --oneline -3

# 1. app/net-buy/page.tsx Write (전면 재작성)
# 2. app/investor-flow/page.tsx Write (redirect 1줄로 축소)

# 3. 빌드 확인 (타입 에러 + Next.js 16 searchParams Promise 검증)
npm run build 2>&1 | tail -15

# 4. 개발 서버 재기동
pkill -f "next dev" || true
rm -rf .next node_modules/.cache
nohup npm run dev > /tmp/next-dev.log 2>&1 &
sleep 8
tail -n 15 /tmp/next-dev.log

# 5. 커밋 + 푸시
git add app/net-buy/page.tsx app/investor-flow/page.tsx

git commit -m "$(cat <<'EOF'
feat: unify /investor-flow into /net-buy as a tab (Phase 2-B)

Previously /net-buy and /investor-flow were two separate pages
with overlapping scope — both covered "supply/demand data" but
one from a stock-TOP angle and the other from a market-flow
angle. After the sidebar IA overhaul in session #22 (Step 11),
only /net-buy remained in the nav, leaving /investor-flow an
orphan reachable only via old bookmarks or direct URL.

Consolidate into a single /net-buy page with a 2-tab layout:
- ?tab=top (default): stock-level net-buy TOP 20
- ?tab=flow: market-wide investor flow timeseries

Tab state lives entirely in the URL via Next.js 16 searchParams
(async Promise — the new-since-15 convention), so the page stays
a server component with no client-side state. Tab links are
standard next/link anchors — soft navigation preserves scroll
and avoids flicker.

/investor-flow becomes a single-line server redirect to
/net-buy?tab=flow, preserving old bookmarks and social links.

Stub data is carried over verbatim from both old pages. The
"실데이터 연결 예정" badge on each TableCard flags these for
the upcoming KIS API wiring step (out of scope here).

WidgetDetailStub is kept untouched — other widget detail pages
(volume-top, movers-top, etc.) still consume it for their
single-table layouts. The tab-capable page defines its own
inline TableCard component instead of extending the stub.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push
```

---

## ✅ 기능 검증 체크리스트

**URL & 탭 전환**
1. `/net-buy` → 기본 탭 = "종목별 TOP" (활성 스타일 `border-[#0ABAB5] text-[#0ABAB5]`)
2. `/net-buy?tab=top` → 같은 화면
3. `/net-buy?tab=flow` → "시장 동향" 탭으로 전환, 투자자별 테이블 렌더
4. `/net-buy?tab=invalid` → top으로 fallback (`tab === 'flow'` 외엔 모두 top)
5. 탭 버튼 클릭 시 URL 업데이트 + 내용 전환, 새로고침해도 유지

**Redirect**
6. `/investor-flow` 접속 → `/net-buy?tab=flow`로 자동 이동
7. 브라우저 뒤로가기 시 `/investor-flow` 히스토리에 남음 (307이라)

**레이아웃**
8. 공통 헤더 "수급" + 설명문 + 홈으로 링크 정상 렌더
9. 탭바 밑줄 스타일 정상 (활성 탭만 턴콰이즈)
10. 두 테이블 모두 20행 스텁 데이터 렌더
11. "실데이터 연결 예정" 뱃지 우상단 표시

**회귀 없음**
12. 사이드바 "수급" 메뉴 = `/net-buy` (세션 #22 Step 11 IA 유지)
13. 다른 페이지 (/volume-top, /movers-top 등) `WidgetDetailStub` 정상 렌더
14. `npm run build` 에러 없음 (특히 Next.js 16 searchParams Promise 타입)

---

## 💡 추후 작업 (Phase 2-B 다음 단계)

**실데이터 연결** — 이번 스텝에선 스코프 밖. 다음 스텝에서:
- 탭 1 (종목별 TOP): KIS `/uapi/domestic-stock/v1/quotations/foreign-institution-total` (FHPTJ04400000)
- 탭 2 (시장 동향): KIS 투자자별 매매동향 API (기존 `/api/kis/investor`가 있을 수 있음 — 확인 필요)

**permanentRedirect 전환** — 프로덕션 배포 전에 307 → 308로 변경

---

## 🗣️ 남은 대기 목록

1. **Phase 2-B (실데이터)**: 두 탭에 KIS API 연결 (별도 스텝)
2. **Phase 2-C**: 경제캘린더 홈 미니 위젯 (P1)
3. **Phase 2-D**: 발굴 ↔ 관심종목 연동 (P1)
