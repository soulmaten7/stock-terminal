# STEP 15 — Header nav 제거 + 사이드바 통합 + 리네이밍

**실행 명령어:**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** Step 14 완료 (commit `bd09df4` — Header + TickerBar sticky 해제)

---

## 📐 목표

1. **Header nav 제거** — 홈/스크리너/도구함 3개 링크 전부 제거. 헤더는 로고+검색+국가+알림+별+프로필만 남김.
2. **사이드바에 2개 추가** — "종목 발굴"(/screener) + "참고 사이트"(/toolbox).
3. **리네이밍**:
   - "종목 스크리너" / "스크리너" → **"종목 발굴"**
   - "투자자 도구함" / "도구함" → **"참고 사이트"**

**결정 배경:**
- 홈은 이미 사이드바에 존재 + 헤더 로고 클릭으로도 홈 이동 → 3중 중복이었음.
- 스크리너/도구함은 헤더에만 있어 사이드바 단일 내비 원칙 위배.
- "도구함" 이름은 기능(외부 사이트 북마크 큐레이션)과 불일치. `docs/COMMANDS_V3_W3_TOOLBOX.md`에도 "임시 네이밍, 완성 후 rename 예정" 명시됨.
- 참고: `/toolbox`와 `/link-hub`가 같은 `link_hub` DB 테이블 공유 중 (중복 페이지). 일단 `/toolbox`를 유지하고 `/link-hub` 정리는 별도 작업으로 남김.

---

## 📋 사이드바 새 배열 (12개 → 14개)

```
 1. 홈
 2. 종목 발굴        ← NEW (Filter 아이콘, /screener)
 3. 관심종목
 4. 차트
 5. 상승/하락
 6. 거래량 급등
 7. 수급
 8. 뉴스 속보
 9. DART 공시
10. 경제캘린더
11. 장전 브리핑
12. 글로벌 지수
13. 시장 지도
14. 참고 사이트      ← NEW (BookMarked 아이콘, /toolbox)
```

논리: **홈 → 발굴 → 관심 → 차트 → 시세/뉴스 → 매크로 → 글로벌 → 지도 → 외부 리소스**. 투자 워크플로우 순.

---

## 🔧 파일별 변경 (6개 파일)

### 1. `components/layout/Header.tsx` — nav 완전 제거

**변경점:**
- `usePathname` import 제거 (사용처 없어짐)
- `const pathname = usePathname();` 줄 제거
- `isActive` 함수 제거 (nav 전용이었음)
- `NAV_ITEMS` 배열 제거
- `<nav>` 요소 (Center Nav 블록) 전체 제거

**Edit 1 — import 정리** (5번 줄):
```
old_string:
import { usePathname, useRouter } from 'next/navigation';

new_string:
import { useRouter } from 'next/navigation';
```

**Edit 2 — NAV_ITEMS 상수 제거** (11~15번 줄):
```
old_string:
const NAV_ITEMS = [
  { href: '/', label: '홈' },
  { href: '/screener', label: '스크리너' },
  { href: '/toolbox', label: '도구함' },
];

const COUNTRIES:

new_string:
const COUNTRIES:
```

**Edit 3 — pathname + isActive 제거** (23번 줄 pathname + 66~69번 isActive):

pathname 제거:
```
old_string:
export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

new_string:
export default function Header() {
  const router = useRouter();
```

isActive 제거:
```
old_string:
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (

new_string:
  return (
```

**Edit 4 — Center Nav 블록 제거** (87~101번 줄):
```
old_string:
        {/* ── Center: Nav ── */}
        <nav className="flex items-center gap-10">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm tracking-wide transition-colors ${
                isActive(item.href)
                  ? 'text-[#0ABAB5] font-bold'
                  : 'text-black hover:text-[#0ABAB5]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* ── Right: Search | Country | Bell | Watchlist | Profile ── */}

new_string:
        {/* ── Right: Search | Country | Bell | Watchlist | Profile ── */}
```

**⚠️ Header 시각 레이아웃 체크:**
Header가 `flex items-center justify-between`이라 Logo + Nav + Right 3분할이었는데, Nav 제거하면 **Logo가 왼쪽, Right가 오른쪽**으로 2분할됨. 자연스럽게 처리됨.

---

### 2. `components/layout/VerticalNav.tsx` — 2개 아이템 추가

**Edit 1 — 아이콘 import 추가** (6~19번 줄):
```
old_string:
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

new_string:
import {
  Home,
  Filter,
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
  BookMarked,
} from 'lucide-react';
```

**Edit 2 — ITEMS 배열 교체** (21~34번 줄):
```
old_string:
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

new_string:
const ITEMS = [
  { icon: Home,       label: '홈',           href: '/' },
  { icon: Filter,     label: '종목 발굴',     href: '/screener' },
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
  { icon: BookMarked, label: '참고 사이트',   href: '/toolbox' },
];
```

---

### 3. `app/screener/page.tsx` — 메타데이터 제목

```
old_string:
export const metadata: Metadata = { title: '종목 스크리너 — StockTerminal' };

new_string:
export const metadata: Metadata = { title: '종목 발굴 — StockTerminal' };
```

---

### 4. `components/screener/ScreenerClient.tsx` — 페이지 내 h1 (2군데)

ScreenerClient 안에 "종목 스크리너" 텍스트가 h1에 2곳 등장 (로딩 상태 / 정상 상태). **`replace_all` 옵션 사용**:

```
old_string:
종목 스크리너

new_string:
종목 발굴
```
→ `replace_all: true`

---

### 5. `app/toolbox/page.tsx` — 메타데이터 제목

```
old_string:
export const metadata = { title: '투자자 도구함 — Stock Terminal' };

new_string:
export const metadata = { title: '참고 사이트 — Stock Terminal' };
```

---

### 6. `components/toolbox/ToolboxClient.tsx` — 페이지 내 h1

```
old_string:
<h1 className="text-2xl font-bold text-black">투자자 도구함</h1>

new_string:
<h1 className="text-2xl font-bold text-black">참고 사이트</h1>
```

**⚠️ 서브타이틀 보존:** 71번 줄 h1 바로 아래 72~77번 줄의 서브타이틀 `<p>외부 서비스 큐레이션 · ... 카테고리 · ...개 링크</p>`는 그대로 둠 (기능 설명으로 여전히 유효).

---

## 🚀 실행 순서

```bash
cd ~/Desktop/OTMarketing
git status
git log --oneline -3

# 1. 위 6개 파일 Edit 툴로 순차 수정

# 2. TypeScript + 빌드 확인
npm run build 2>&1 | tail -20

# 3. 에러 없으면 개발 서버 재기동
pkill -f "next dev" || true
rm -rf .next node_modules/.cache
nohup npm run dev > /tmp/next-dev.log 2>&1 &
sleep 6
tail -n 20 /tmp/next-dev.log

# 4. 커밋 + 푸시
git add components/layout/Header.tsx components/layout/VerticalNav.tsx \
        app/screener/page.tsx app/toolbox/page.tsx \
        components/screener/ScreenerClient.tsx \
        components/toolbox/ToolboxClient.tsx

git commit -m "$(cat <<'EOF'
refactor: unify navigation to sidebar + rename screener/toolbox

Header cleanup:
- Remove 홈/스크리너/도구함 nav items (duplicated with sidebar)
- Remove unused usePathname import + isActive function
- Header now: logo + search + country + bell + star + profile only

Sidebar expansion (12 → 14):
- Add 종목 발굴 (Filter icon, /screener) at position 2
- Add 참고 사이트 (BookMarked icon, /toolbox) at position 14
- Workflow order: 홈 → 발굴 → 관심 → 차트 → 시세 → 매크로 → 글로벌 → 지도 → 외부

Rename (user-facing terminology):
- "종목 스크리너" / "스크리너" → "종목 발굴"
  (능동적 표현, Finviz/Koyfin "discovery engine" 철학 반영)
- "투자자 도구함" / "도구함" → "참고 사이트"
  (실제 기능: 외부 사이트 북마크 큐레이션, 기존 임시명 확정)

Note: /toolbox and /link-hub share the same link_hub table.
Cleanup of /link-hub duplicate is deferred to a future step.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push
```

---

## ✅ 시각 검증 체크리스트

브라우저에서 `http://localhost:3000` 새로고침 후:

**헤더**
1. 헤더 가운데에 있던 "홈 / 스크리너 / 도구함" 3개 텍스트 링크가 **사라졌는가**
2. 로고 "STOCK TERMINAL" 클릭 시 여전히 홈 이동하는가
3. 오른쪽 검색/국가/벨/별/프로필 아이콘 모두 정상인가

**사이드바**
4. 사이드바 아이템 **14개**인가 (기존 12 + 2 추가)
5. 홈 바로 아래에 **Filter 아이콘** → hover 시 "종목 발굴" 툴팁 뜨는가
6. 맨 아래 **BookMarked 아이콘** → hover 시 "참고 사이트" 툴팁 뜨는가
7. "종목 발굴" 클릭 시 `/screener` 페이지로 이동하는가
8. "참고 사이트" 클릭 시 `/toolbox` 페이지로 이동하는가

**페이지 제목**
9. `/screener` 페이지 h1 텍스트 → **"종목 발굴"**
10. 브라우저 탭 제목 → **"종목 발굴 — StockTerminal"**
11. `/toolbox` 페이지 h1 텍스트 → **"참고 사이트"**
12. 브라우저 탭 제목 → **"참고 사이트 — Stock Terminal"**

**Active 상태**
13. `/screener` 페이지에 있을 때 사이드바 "종목 발굴"에 티파니블루 바 + 배경 활성 표시되는가
14. `/toolbox` 페이지에 있을 때 사이드바 "참고 사이트"에 동일한 활성 표시되는가

---

## 🗂️ 다음 단계 대기 목록 (사용자 결정 필요)

1. **`/toolbox` vs `/link-hub` 중복 정리** — 둘이 같은 DB 테이블 사용. 하나로 통합 필요.
   - 옵션 A: `/toolbox` 유지, `/link-hub` 삭제
   - 옵션 B: `/link-hub` 유지(더 기능 많음), 사이드바 href를 `/link-hub`로 변경
2. **대시보드 폭/밀도** — 사용자가 제기한 "Koyfin 대비 너무 와이드" 문제. 결정 보류.
3. **Phase 2-B (수급 통합 탭)** — `/investor-flow` → `/net-buy` 탭으로 흡수. P0 대기.
4. **Phase 2-C (경제캘린더 미니 위젯)** — 홈 대시보드 편입. P1 대기.
