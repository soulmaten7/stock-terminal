<!-- 2026-04-21 -->
# Step 11 — 사이드바 IA 개편 Phase 1 (정리 + Active State)

## 실행 명령어 (Sonnet)

```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

단일 컴포넌트(`VerticalNav.tsx`) 전면 교체 + 문서 4종 업데이트. 복잡 로직 없음 → Sonnet로 충분.

---

## 목표

### 기능 변경 (사이드바 14개 → 12개)

1. **제거**: `커뮤니티 채팅` (/chat) — 홈 위젯만 유지
2. **통합**: `수급 TOP` + `투자자 동향` → `수급` 1개로 합침 (페이지 통합은 Phase 2)
3. **리네임**: `분석` → `시장 지도` (Finviz 스타일 페이지는 Phase 3)
4. **라벨 간결화**: `상승/하락 TOP` → `상승/하락`
5. **순서 재배치**: 차트를 상위로 이동 (홈 > 관심종목 > 차트 순)

### UX 추가

6. **Active State 3중 표시** — 현재 페이지 아이콘에 시각적 강조
   - 왼쪽 컬러 바 (2px × 24px) — Bloomberg/VSCode 스타일
   - 배경 틴트 (`#0ABAB5` 10% 알파) — Linear 스타일
   - 아이콘 색상 변경 (`text-[#0ABAB5]`) — TradingView 스타일
   - 접근성: `aria-current="page"` 속성 추가

---

## 전제 상태

- 이전 커밋: 사이드바 아이콘 확대 commit (`w-14` nav / `w-12 h-12` 버튼 / `w-5 h-5` 아이콘)
- 수정 파일: `components/layout/VerticalNav.tsx` (1개만)
- 기존 페이지 경로는 건드리지 않음 (`/chat`, `/investor-flow`는 URL로 접근 가능한 상태 유지 — Phase 2에서 `/investor-flow`를 `/net-buy` 내 탭으로 흡수)

---

## 최종 사이드바 구성 (12개)

| # | 아이콘 | 라벨 | 경로 | 변경 |
|---|---|---|---|---|
| 1 | Home | 홈 | `/` | — |
| 2 | Star | 관심종목 | `/watchlist` | — |
| 3 | LineChart | 차트 | `/chart` | 순서 ↑ |
| 4 | TrendingUp | 상승/하락 | `/movers/price` | 라벨 간결화 |
| 5 | Flame | 거래량 급등 | `/movers/volume` | — |
| 6 | BarChart3 | 수급 | `/net-buy` | 투자자 동향 통합 |
| 7 | Newspaper | 뉴스 속보 | `/news` | — |
| 8 | FileText | DART 공시 | `/filings` | — |
| 9 | Calendar | 경제캘린더 | `/calendar` | — |
| 10 | Sun | 장전 브리핑 | `/briefing` | — |
| 11 | Globe | 글로벌 지수 | `/global` | — |
| 12 | PieChart | 시장 지도 | `/analytics` | 리네임 (`분석` → `시장 지도`) |

**제거된 아이콘 import**: `MessageCircle`, `Users` (더 이상 참조 없음)

---

## 변경 #1: `components/layout/VerticalNav.tsx` — 전체 교체

**파일 전체를 아래 내용으로 교체 (cat heredoc 사용):**

```bash
cat > components/layout/VerticalNav.tsx << 'EOF'
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Star,
  LineChart,
  TrendingUp,
  Flame,
  BarChart3,
  Newspaper,
  FileText,
  Calendar,
  Sun,
  Globe,
  PieChart,
} from 'lucide-react';

const ITEMS = [
  { icon: Home,       label: '홈',           href: '/' },
  { icon: Star,       label: '관심종목',      href: '/watchlist' },
  { icon: LineChart,  label: '차트',          href: '/chart' },
  { icon: TrendingUp, label: '상승/하락',     href: '/movers/price' },
  { icon: Flame,      label: '거래량 급등',   href: '/movers/volume' },
  { icon: BarChart3,  label: '수급',          href: '/net-buy' },
  { icon: Newspaper,  label: '뉴스 속보',     href: '/news' },
  { icon: FileText,   label: 'DART 공시',     href: '/filings' },
  { icon: Calendar,   label: '경제캘린더',    href: '/calendar' },
  { icon: Sun,        label: '장전 브리핑',   href: '/briefing' },
  { icon: Globe,      label: '글로벌 지수',   href: '/global' },
  { icon: PieChart,   label: '시장 지도',     href: '/analytics' },
];

export default function VerticalNav() {
  const pathname = usePathname();

  // 홈은 완전일치, 그 외는 prefix 일치 (상세 페이지 포함 활성화)
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="hidden md:flex flex-col items-center w-14 bg-white border-r border-[#E5E7EB] py-3 sticky top-0 h-screen shrink-0">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            title={item.label}
            aria-current={active ? 'page' : undefined}
            className={`group relative flex items-center justify-center w-12 h-12 mb-1 rounded-md transition-colors ${
              active ? 'bg-[#0ABAB5]/10' : 'hover:bg-gray-100'
            }`}
          >
            {/* Active state: 왼쪽 컬러 바 */}
            {active && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#0ABAB5] rounded-r"
              />
            )}

            {/* 아이콘: active 시 티파니블루 */}
            <Icon
              className={`w-5 h-5 transition-colors ${
                active
                  ? 'text-[#0ABAB5]'
                  : 'text-gray-600 group-hover:text-gray-900'
              }`}
            />

            {/* Hover tooltip */}
            <span className="absolute left-full ml-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
EOF
```

### 변경 포인트 요약

| 항목 | Before | After |
|---|---|---|
| import icons | 14개 (MessageCircle, Users 포함) | 12개 |
| ITEMS 배열 | 14개 | 12개 |
| `usePathname` hook | 없음 | 추가 |
| `isActive()` 함수 | 없음 | 추가 (홈 완전일치 / 그 외 prefix) |
| Link `aria-current` | 없음 | 추가 (`active` 시 `"page"`) |
| Link 배경 | `hover:bg-gray-100`만 | active 시 `bg-[#0ABAB5]/10` |
| 왼쪽 컬러 바 | 없음 | `w-0.5 h-6 bg-[#0ABAB5]` (active 시만 렌더) |
| Icon 색상 | `text-gray-600` 고정 | active 시 `text-[#0ABAB5]` |

---

## 변경 #2: 빌드 검증

```bash
npm run build 2>&1 | tail -15
```

**예상 출력**: `✓ Compiled successfully` + route 리스트. 경고 허용 (breaking change 아님).

**실패 시 체크리스트**:
- `usePathname` import 누락? → `next/navigation`에서 가져왔는지 확인
- TypeScript 오류? → `isActive` 함수 반환 타입 명시 필요 시 `(href: string): boolean` 추가
- Tailwind 클래스 인식 안 됨? → `bg-[#0ABAB5]/10` 같은 arbitrary value는 Next.js 16 + Tailwind v3/v4 모두 지원 (문제 없음)

---

## 변경 #3: 로컬 시각 검증

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 후 체크리스트:

- [ ] 사이드바에 **정확히 12개** 아이콘 표시
- [ ] `커뮤니티 채팅`(말풍선 아이콘) **없음** 확인
- [ ] 순서 확인: 홈 → 관심종목 → **차트** → 상승/하락 → 거래량 급등 → 수급 → 뉴스 → DART → 경제캘린더 → 장전 브리핑 → 글로벌 지수 → 시장 지도
- [ ] 각 아이콘에 마우스 hover 시 툴팁 정상 표시
- [ ] `PieChart` 아이콘 hover 시 툴팁에 **"시장 지도"** 표시 (이전 `"분석"` 아님)
- [ ] 홈(`/`) 상태에서 Home 아이콘이 **티파니블루 + 왼쪽 바 + 배경 틴트**
- [ ] `/watchlist` 이동 → Star 아이콘으로 active 상태 이동
- [ ] `/movers/price` 이동 → TrendingUp 아이콘 active (다른 아이콘은 회색 복귀)
- [ ] 상세 페이지(`/chart/005930` 등) 접근 시에도 차트 아이콘 active 유지 확인

---

## 변경 #4: 문서 4종 헤더 날짜 업데이트

모든 문서의 **첫 줄**을 `<!-- 2026-04-21 -->` 또는 `# ... (2026-04-21)` 형식으로 오늘 날짜 갱신:

```bash
# 각 파일 첫 줄이 날짜 주석/헤더면 교체. 아니면 세션 시작 시 추가.
# 현재 상태를 확인하고 수동 편집 (sed보다 Edit 툴이 안전)
```

대상 파일:
1. `CLAUDE.md`
2. `docs/CHANGELOG.md`
3. `session-context.md`
4. `docs/NEXT_SESSION_START.md`

### CHANGELOG.md에 추가할 블록

```markdown
## Session #22 (계속)

### Step 11 — 사이드바 IA 개편 Phase 1

**변경 사항**:
- 사이드바 14개 → 12개 정리
  - 제거: 커뮤니티 채팅
  - 통합: 수급 TOP + 투자자 동향 → "수급"
  - 리네임: 분석 → 시장 지도
  - 라벨 간결화: 상승/하락 TOP → 상승/하락
  - 순서: 차트를 상위로 이동
- Active State 3중 표시 구현
  - 왼쪽 컬러 바 (티파니블루 `#0ABAB5`)
  - 배경 틴트 (10% 알파)
  - 아이콘 색상 변경
- 접근성: `aria-current="page"` 속성 추가

**변경 파일**: `components/layout/VerticalNav.tsx` (단일 파일)

**Phase 2 예정 작업** (다음 세션):
- 마켓채팅 참여자 팝업 구현
- `/investor-flow` 페이지 내용을 `/net-buy` 내 탭으로 흡수
- 경제캘린더 홈 미니 위젯 추가

**Phase 3 예정 작업**:
- 시장 지도(Finviz 스타일 히트맵) 전면 재구현
- 글로벌 지수 페이지 V2 (스파크라인 + 상관계수 + VKOSPI)
```

### session-context.md에 추가할 블록

```markdown
### Session #22 Step 11 완료 (2026-04-21)
- 사이드바 IA 개편 Phase 1 완료
- 14개 → 12개로 정리 (커뮤니티 채팅 제거, 수급 통합, 시장 지도 리네임)
- Active State 3중 표시 (왼쪽 바 + 배경 틴트 + 아이콘 색상)
- Phase 2, 3 로드맵 결정됨 (아래 TODO 참조)

### TODO (Phase 2 - 다음 세션)
- [ ] 마켓채팅 참여자 팝업 구현 (참여자 수 클릭 → 모달)
- [ ] `/investor-flow` 페이지 내용을 `/net-buy` 내 탭으로 흡수
- [ ] 경제캘린더 홈 미니 위젯 (오늘+내일 주요 이벤트)

### TODO (Phase 3 - 주요 작업)
- [ ] 시장 지도 전면 재구현 (Finviz 스타일 섹터 Treemap)
- [ ] 글로벌 지수 V2 확장 (스파크라인, 상관계수, VKOSPI, 위험자산/안전자산 그룹)
```

### NEXT_SESSION_START.md 업데이트 포인트

```markdown
## 현재 상태 (2026-04-21 기준)

사이드바 IA 개편 Phase 1 완료. Phase 2 작업 대기 중.

## 다음 세션 P0

1. **마켓채팅 참여자 팝업** — 참여자 수 클릭 → 참여자 리스트 + 확대 채팅 모달
2. **투자자 동향 페이지 흡수** — `/investor-flow`의 시계열 데이터를 `/net-buy`의 두 번째 탭으로 이동

## 다음 세션 P1

- 경제캘린더 홈 미니 위젯 (오늘+내일 주요 이벤트 3~5건)
- 마켓-시간 재검증 (volume-rank spike, movers dir=down 정렬)
```

---

## 변경 #5: Git 커밋

```bash
git add components/layout/VerticalNav.tsx CLAUDE.md docs/CHANGELOG.md session-context.md docs/NEXT_SESSION_START.md docs/STEP_11_COMMAND.md

git commit -m "$(cat <<'EOF'
Step 11: 사이드바 IA 개편 Phase 1 (정리 + Active State)

Changes:
- 사이드바 14개 → 12개 정리
  - 제거: 커뮤니티 채팅 (홈 위젯만 유지)
  - 통합: 수급 TOP + 투자자 동향 → "수급" 단일 항목
  - 리네임: 분석 → 시장 지도
  - 라벨 간결화: 상승/하락 TOP → 상승/하락
  - 순서: 차트를 관심종목 다음으로 이동
- Active State 3중 표시 구현
  - 왼쪽 컬러 바 (티파니블루 #0ABAB5)
  - 배경 틴트 (bg-[#0ABAB5]/10)
  - 아이콘 색상 변경 (text-[#0ABAB5])
- 접근성 강화: aria-current="page" 추가
- usePathname 훅 기반 (Next.js 16 App Router)

Files:
- components/layout/VerticalNav.tsx (전체 교체)
- docs/STEP_11_COMMAND.md (신규 — 작업 기록)
- CLAUDE.md, docs/CHANGELOG.md, session-context.md, docs/NEXT_SESSION_START.md (날짜 + 변경 블록)

Next: Phase 2 (마켓채팅 팝업 + 투자자동향 탭 흡수 + 경제캘린더 미니 위젯)
EOF
)"
```

---

## 변경 #6: Git Push

```bash
git push
```

---

## 실행 후 사용자에게 보고할 내용

1. 빌드 성공 여부
2. 커밋 해시 (git log -1 --format=%H)
3. push 성공 여부
4. 로컬 dev 서버 스크린샷 요청 (사이드바 12개 + active 상태 확인용)

---

## 롤백 절차 (혹시 필요 시)

```bash
git reset --hard HEAD~1  # 위 커밋 직전으로 되돌림
```

변경 파일이 단일 컴포넌트라 롤백 영향 범위 작음.
