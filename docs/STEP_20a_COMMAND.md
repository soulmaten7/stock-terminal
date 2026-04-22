# STEP 20a — 종목발굴 미니 위젯 신규 생성 + URL 파라미터 연동

**실행 명령어:**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** Step 19 완료 (1536px 단일 박스 통합 레이아웃)

---

## 📐 목표

홈 대시보드 Col 1에 들어갈 **종목발굴 미니 위젯**(`ScreenerMiniWidget`) 신규 생성.
사용자가 시장(KOSPI/KOSDAQ) + 키워드(종목명/코드) 입력 → 엔터/버튼 → `/screener?market=X&q=Y` URL로 이동.
`ScreenerClient`는 URL 파라미터를 읽어 **자동으로 필터 적용**.

```
[홈 Col 1]                         [→ /screener?market=KOSPI&q=삼성전자]
┌─────────────────────────┐
│ 마켓채팅 (45%)            │
├─────────────────────────┤
│ 🔍 종목발굴 (10%)         │   → 클릭 시 screener 페이지로 이동
│ [KOSPI][KOSDAQ] [🔍 입력]│     URL param으로 필터 자동 적용됨
├─────────────────────────┤
│ 관심종목 (45%)            │
└─────────────────────────┘
```

**핵심 원칙:**
- 위젯은 **헤더 바 없음** (콤팩트 툴바 스타일) — 높이 절약
- 검색 → URL 파라미터로 이동 (A안, 이전 세션에서 확정)
- 홈에서 검색 시 사용자는 **시총 필터 없이** 바로 종목 찾음 → 시총은 `/screener` 페이지 내부에서 추가 조정

---

## 🔧 파일별 변경 (2개 파일)

### 1. `components/widgets/ScreenerMiniWidget.tsx` — 신규 생성 ⭐

**Write (전체 파일 생성):**

```tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

type Market = 'KOSPI' | 'KOSDAQ';

export default function ScreenerMiniWidget() {
  const [market, setMarket] = useState<Market>('KOSPI');
  const [keyword, setKeyword] = useState('');
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ market });
    if (keyword.trim()) params.set('q', keyword.trim());
    router.push(`/screener?${params.toString()}`);
  };

  return (
    <div className="h-full bg-white border border-[#E5E7EB] p-3 flex flex-col justify-center">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* 시장 토글 */}
        <div className="flex gap-1 shrink-0">
          {(['KOSPI', 'KOSDAQ'] as Market[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMarket(m)}
              className={`px-2.5 py-1.5 text-xs font-bold border transition-colors ${
                market === m
                  ? 'bg-[#0ABAB5] text-white border-[#0ABAB5]'
                  : 'bg-white text-[#999999] border-[#E5E7EB] hover:border-[#0ABAB5]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* 구분선 */}
        <div className="w-px h-6 bg-[#E5E7EB] shrink-0" />

        {/* 키워드 검색 */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#999999] pointer-events-none" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="종목명/코드 검색 → 엔터"
            className="w-full pl-7 pr-2 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-xs focus:border-[#0ABAB5] focus:bg-white focus:outline-none"
          />
        </div>

        {/* 검색 버튼 */}
        <button
          type="submit"
          className="shrink-0 px-3 py-1.5 text-xs font-bold text-white bg-[#0ABAB5] hover:bg-[#089A95] border border-[#0ABAB5]"
        >
          발굴
        </button>
      </form>
    </div>
  );
}
```

**의도:**
- `'use client'` — useState + useRouter 사용
- `h-full` — 부모 grid row가 할당한 높이를 꽉 채움
- `flex flex-col justify-center` — 위젯 내부 세로 중앙 정렬 (높이 95px 전후 대응)
- 시장 토글은 **단일 선택** (KOSPI XOR KOSDAQ) — `/screener`는 다중이지만, 홈 미니는 빠른 탐색 목적
- 엔터 또는 발굴 버튼 → `router.push(/screener?market=X&q=Y)`
- keyword 비어있어도 시장만 들고 이동 가능 (시장별 전체 보기 진입)

---

### 2. `components/screener/ScreenerClient.tsx` — URL 파라미터 읽기 추가

**Edit 1 — import 추가 (3번 줄):**

```
old_string:
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { RotateCcw, Search } from 'lucide-react';

new_string:
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RotateCcw, Search } from 'lucide-react';
```

**Edit 2 — URL 파라미터 → 초기 필터 적용 (useEffect 추가, `setMounted` 바로 아래):**

```
old_string:
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

new_string:
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => { setMounted(true); }, []);

  // URL 파라미터 → 초기 필터 1회 적용 (mount 직후)
  useEffect(() => {
    if (!mounted) return;
    const urlMarket = searchParams.get('market');
    const urlQ = searchParams.get('q');
    if (!urlMarket && !urlQ) return;

    setFilters((prev) => {
      const next = { ...prev };
      if (urlMarket) {
        const markets = urlMarket.split(',').filter((m) => ['KOSPI', 'KOSDAQ'].includes(m));
        if (markets.length > 0) next.market = markets;
      }
      if (urlQ) next.keyword = urlQ;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

```

**의도:**
- `useSearchParams()` — Next.js 16 App Router 훅, 클라이언트에서 URL 파라미터 읽기
- `mounted` 이후 **1회만** 적용 → 이후 사용자가 직접 필터 조작 시 URL과 무관하게 동작
- `market` 파라미터 검증 (KOSPI/KOSDAQ만 허용) → 이상한 값 방어
- `q` 파라미터 있으면 그대로 keyword로 설정
- 기존 필터 useEffect (API 호출)가 `filters` 변경 감지 → 자동으로 결과 fetch

---

## 🔒 변경하지 않는 파일

- **`components/home/HomeClient.tsx`** — Step 20b에서 45:10:45 그리드로 재배치할 때 같이 추가 (지금은 파일 생성만)
- **`/screener` 페이지의 DEFAULT_FILTER** — 시총은 URL 전달 안 함 (사용자가 페이지에서 조정)
- **KIS OpenAPI 관련 로직** — 건드리지 않음

---

## 🚀 실행 순서

```bash
cd ~/Desktop/OTMarketing
git status
git log --oneline -3

# 1. components/widgets/ScreenerMiniWidget.tsx 신규 생성 (Write)
# 2. components/screener/ScreenerClient.tsx 2곳 수정 (Edit)

# 3. 빌드 확인
npm run build 2>&1 | tail -20

# 4. 개발 서버 재기동
pkill -f "next dev" || true
rm -rf .next node_modules/.cache
nohup npm run dev > /tmp/next-dev.log 2>&1 &
sleep 6
tail -n 20 /tmp/next-dev.log

# 5. 기능 테스트 (브라우저에서 수동)
#    → http://localhost:3000/screener?market=KOSPI&q=삼성
#    → 필터가 자동으로 KOSPI만 선택 + 키워드 "삼성" 입력되어야 함
#    → http://localhost:3000/screener (param 없이) → DEFAULT_FILTER 유지 확인

# 6. 커밋 + 푸시
git add components/widgets/ScreenerMiniWidget.tsx \
        components/screener/ScreenerClient.tsx

git commit -m "$(cat <<'EOF'
feat: add ScreenerMiniWidget + URL param filter sync

Add compact horizontal screener widget for home dashboard Col 1.
Users can pick market (KOSPI/KOSDAQ) + enter a keyword and submit
to navigate to /screener?market=X&q=Y with filters pre-applied.

Changes:
- components/widgets/ScreenerMiniWidget.tsx (new):
  - Horizontal toolbar layout (no widget header)
  - Market single-select toggle (KOSPI/KOSDAQ)
  - Keyword input with enter-to-submit
  - Router.push to /screener with URL params

- components/screener/ScreenerClient.tsx:
  - Import useSearchParams from next/navigation
  - Read market and q params on mount (once)
  - Validate market values (KOSPI/KOSDAQ only)
  - Apply URL params to filter state, triggering API fetch

Note: Widget is created but not yet wired into HomeClient grid —
that happens in Step 20b (45:10:45 Col 1 restructure).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push
```

---

## ✅ 검증 체크리스트

**파일 생성**
1. `components/widgets/ScreenerMiniWidget.tsx` 파일이 생성되었는가
2. 파일에 `'use client'` 지시문이 있는가
3. `useRouter` + `useState` import가 정상인가

**빌드**
4. `npm run build` 에러 없이 완료되는가
5. TypeScript 타입 에러 없는가 (`Market = 'KOSPI' | 'KOSDAQ'`)

**URL 파라미터 테스트**
6. `http://localhost:3000/screener?market=KOSPI&q=삼성` 접속
   → 필터가 KOSPI만 선택된 상태
   → 키워드 필드에 "삼성" 입력됨
   → 결과 테이블에 삼성전자 등 노출
7. `http://localhost:3000/screener?market=KOSDAQ` 접속
   → KOSDAQ만 선택, 키워드 빈 상태
8. `http://localhost:3000/screener?q=카카오` 접속
   → 시장은 DEFAULT(KOSPI+KOSDAQ) 유지, 키워드 "카카오"
9. `http://localhost:3000/screener` (param 없이)
   → 기존과 동일한 기본 필터

**기능 회귀**
10. 페이지 내부 필터 조작 시 여전히 300ms 디바운스로 API 호출
11. 초기화 버튼 → DEFAULT_FILTER로 복원
12. 프리셋 버튼 (대형주/중형주/소형주) 정상 작동

**위젯 단독 테스트 (선택 — Step 20b 전이라도 확인 가능)**
13. `http://localhost:3000/_test/screener-mini` 임시 페이지로 렌더해도 되고, 생략해도 됨

---

## ⚠️ 주의사항

- **홈 그리드에는 아직 추가하지 않음** — Step 20b에서 45:10:45 비율 재배치와 함께 넣을 예정
- **`useSearchParams`는 클라이언트 컴포넌트에서만** — ScreenerClient가 이미 `'use client'`라서 OK
- **Next.js 16 주의** — App Router 훅이므로 `next/navigation`에서 import (not `next/router`)

---

## 🗣️ 남은 작업 대기 목록

1. **Step 20b — 홈 대시보드 그리드 재배치**
   - Col 1 = D 비율 45:10:45 (마켓채팅 / ScreenerMiniWidget / 관심종목)
   - Col 2 = 차트 50% + (호가창|체결창 1:1) 50%
   - Col 3 = 뉴스속보 + DART공시
   - R4 = Page 2 전용 (상승/하락, 거래량, 실시간수급, 상승테마, 글로벌지수 1:1:1:1:1)
2. **Step 20c — Page 2 위젯 교체 + 1:1:1:1:1 비율**
3. **Phase 2-B** — 수급 통합 탭 (`/investor-flow` → `/net-buy`). P0
4. **Phase 2-C** — 경제캘린더 미니 위젯 홈 편입. P1
5. **Phase 2-D** — 발굴 ↔ 관심종목 연동 (공통 StockTable). P1
6. **`/toolbox` vs `/link-hub` 중복 정리**
7. **세션 종료 처리** — 4개 문서 헤더 날짜 업데이트

Step 20a 완료 후 Step 20b (그리드 재배치) 명령어 작성.
