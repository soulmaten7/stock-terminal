<!-- 2026-06-01 -->
# STEP 129 — 디자인 시스템 + CardContainer 토스 스타일 재설계 (기반)

🔴 **Opus 권장** (전역 디자인 토큰 + CardContainer 재설계 = 모든 페이지 자동 적용)

## 실행 명령어
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
```

## 전제 상태
- 이전 커밋: `b7b96b2` (STEP 128 MVP 2.0 1차)
- Pretendard 폰트·텍스트 크기 상향 완료 (STEP 127)
- 사용자 결정: **네이버 레이아웃 + 토스 카드 디자인 = 운종 고유 조합**

## 목표

| 영역 | 변경 |
|------|------|
| **색상 토큰** | unjong primary/accent + 토스 톤 차분한 회색 + 강한 등락 색 |
| **spacing** | gap-3 → gap-4·gap-5, p-3·p-4 → p-5 |
| **타이포** | heading 크기·굵기 위계 명확화 |
| **CardContainer** | rounded-xl + shadow-sm + p-5 + hover transition (토스 스타일) |
| **모든 카드** | CardContainer 사용처는 자동 새 디자인 적용 |

## 작업

### [1] `app/globals.css` — 색상·spacing 토큰 추가

```css
@theme {
  /* 기존 운종 색상 유지 + 토스 스타일 보조 */
  --color-toss-blue: #3182F6;
  --color-toss-red: #F04452;
  --color-toss-green: #1AC267;
  --color-toss-gray-50: #F9FAFB;
  --color-toss-gray-100: #F2F4F6;
  --color-toss-gray-700: #4E5968;
  --color-toss-gray-900: #191F28;
}

/* Tailwind 확장: shadow-soft (토스 부드러운 그림자) */
.shadow-soft {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06);
}
.shadow-soft-hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06);
}
```

### [2] `components/cards/CardContainer.tsx` — 토스 스타일 재설계

```tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type CardContainerProps = {
  id?: string;
  title: string;
  emoji?: string;
  subtitle?: string;
  hint?: string;
  detailHref?: string;
  children: ReactNode;
};

export function CardContainer({
  id, title, emoji, subtitle, hint, detailHref, children,
}: CardContainerProps) {
  return (
    <section
      id={id}
      className="
        flex flex-col bg-unjong-surface rounded-2xl border border-unjong-border
        shadow-soft hover:shadow-soft-hover transition-shadow duration-200
        overflow-hidden scroll-mt-32
      "
    >
      {/* 헤더 — 큰 폰트·여유 padding */}
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-unjong-border bg-unjong-background/30">
        <div className="flex items-center gap-2 min-w-0">
          {emoji && <span aria-hidden className="text-lg">{emoji}</span>}
          <div className="min-w-0">
            <h3 className="text-base font-bold text-unjong-primary truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-unjong-muted truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {detailHref && (
          <Link
            href={detailHref}
            className="flex items-center gap-0.5 text-xs text-unjong-muted hover:text-unjong-accent transition-colors flex-shrink-0 font-medium"
            aria-label={`${title} 상세`}
          >
            <span>더보기</span>
            <ArrowUpRight size={12} />
          </Link>
        )}
      </header>

      {/* 바디 — 큰 padding */}
      <div className="flex-1 overflow-y-auto p-5 min-h-0">{children}</div>

      {/* 힌트 */}
      {hint && (
        <footer className="border-t border-unjong-border px-5 py-2 bg-unjong-background/20">
          <span className="text-xs text-unjong-muted italic">{hint}</span>
        </footer>
      )}
    </section>
  );
}
```

### [3] 카드 그리드 gap 상향

다음 파일들의 `<KrCards>`·`<UsCards>` 안 grid 의 `gap-4` → `gap-5` (또는 그대로):
- `components/cards/KrCards.tsx`
- `components/cards/UsCards.tsx`
- `components/home-v5/HomeClientV5.tsx`

### [4] CardContainer 사용처 자동 적용 확인

```bash
grep -rln "from .*cards/CardContainer\|from \"./CardContainer\"" --include="*.tsx" . 2>/dev/null | grep -v node_modules | grep -v ".next"
```

(모든 카드 컴포넌트가 자동 새 디자인 받음)

### [5] 빌드 검증

```bash
npm run build 2>&1 | tail -15
```

### [6] 커밋 + 푸시

```bash
git add -A
git commit -m "feat(design): 디자인 시스템 + CardContainer 토스 스타일 (전면 리뉴얼 STEP 1/5)

- globals.css: 토스 색상 토큰 (blue/red/green/gray) + shadow-soft·shadow-soft-hover 유틸
- CardContainer 재설계: rounded-2xl + shadow-soft + p-5 + hover shadow 전환 (토스 스타일)
- 헤더: emoji 18px + title text-base font-bold + subtitle xs
- 카드 그리드 gap-4 → gap-5 (여유 spacing)
- 모든 카드 (Scalper·Longterm·Us·KrCards) 자동 새 디자인 적용

다음 STEP 130: 카드 9개 안 콘텐츠 토스 스타일 디테일 (큰 폰트·로고 placeholder·등락 색)"
git push
```

## 다음
STEP 130 (카드 안 콘텐츠 토스 스타일) 자동 진행.
