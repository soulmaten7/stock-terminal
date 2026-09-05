<!-- 2026-06-20 -->
# STEP 313 — [디자인 통일] 카테고리 리스트 시각언어 일원화 (ListRow/SectionHeader)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_313_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 312(`87e4951`). 빌드 ✓.

---

## 🎯 목표 (왜)

지금 한국 탭이 **3개의 다른 디자인 언어**로 렌더됨 → 중구난방:
- 링크 10탭(뉴스·차트·재무 등) = 헤더 없는 맨몸 리스트(밑줄 행)
- 유튜브·증권사 = 자체 헤더 + 번호 + 알약버튼(둥근 호버)
- 증권사만 **카드 속 카드**(이중 테두리)

→ **공용 부품 2개로 일원화**:
1. `ListRow` — 모든 리스트 행 1종 (표형 밑줄, 아이콘 24px, 미니멀 호버 외부아이콘). 번호·스탯·즐겨찾기는 옵션 슬롯.
2. `SectionHeader` — 모든 탭 상단 제목+부제 1종.

**리딩방(AdvisorDirectory)은 특수 기능이라 이번엔 안 건드림.** `CategorySection`(고아 코드)은 삭제.

> 신규 2 · 교체 3 · 수정 1 · 삭제 1 = 7개 파일.

---

## 📄 파일 1 (신규) — `components/toolbox/ListRow.tsx`

> 아래 내용으로 **새 파일 생성**.

```tsx
'use client';

import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';

export type ListRowProps = {
  href: string;
  onClick?: () => void;       // 있으면 div(클릭추적), 없으면 a(새탭)
  rank?: number;              // 랭킹 탭만
  iconUrl?: string | null;    // 파비콘/썸네일
  iconRound?: boolean;        // 유튜브 썸네일=원형
  title: string;
  subtitle?: string;          // 제목 아래 작은 줄 (도메인/메모)
  meta?: string;              // flex-1 회색 설명 (링크 description)
  stat?: string;              // 우측 강조 (구독자/점유율)
  trailing?: ReactNode;       // 즐겨찾기 별 등
};

export default function ListRow({
  href, onClick, rank, iconUrl, iconRound, title, subtitle, meta, stat, trailing,
}: ListRowProps) {
  const hasMeta = meta !== undefined;
  const cls =
    'group flex cursor-pointer items-center gap-3 border-b border-unjong-border px-2 py-2.5 transition-colors last:border-b-0 hover:bg-unjong-background';

  const inner = (
    <>
      {rank !== undefined && (
        <span className={`w-6 shrink-0 text-center text-sm font-bold ${rank <= 3 ? 'text-unjong-accent' : 'text-unjong-muted'}`}>
          {rank}
        </span>
      )}
      {iconUrl !== undefined &&
        (iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconUrl}
            alt=""
            width={24}
            height={24}
            className={`h-6 w-6 shrink-0 ${iconRound ? 'rounded-full' : 'rounded'}`}
            onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
          />
        ) : (
          <span className={`h-6 w-6 shrink-0 ${iconRound ? 'rounded-full' : 'rounded'} bg-unjong-background`} />
        ))}
      <div className={`flex flex-col ${hasMeta ? 'w-44 shrink-0 sm:w-52' : 'min-w-0 flex-1'}`}>
        <span className="truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{title}</span>
        {subtitle ? <span className="truncate text-xs text-unjong-muted">{subtitle}</span> : null}
      </div>
      {hasMeta && (
        <p className="hidden min-w-0 flex-1 truncate text-sm text-unjong-muted sm:block">{meta}</p>
      )}
      {stat ? <span className="shrink-0 text-xs font-bold text-unjong-accent">{stat}</span> : null}
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
      <ExternalLink size={14} className="shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
    </>
  );

  if (onClick) {
    return (
      <div onClick={onClick} className={cls}>
        {inner}
      </div>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  );
}
```

---

## 📄 파일 2 (신규) — `components/toolbox/SectionHeader.tsx`

> 아래 내용으로 **새 파일 생성**.

```tsx
export default function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3 border-b border-unjong-border pb-2">
      <h2 className="text-lg font-bold text-unjong-primary">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-xs text-unjong-muted">{subtitle}</p> : null}
    </div>
  );
}
```

---

## 📄 파일 3 (교체) — `components/toolbox/LinkCard.tsx`

> 파일 **전체를 아래 내용으로 교체**. (public props 동일 — 내부만 ListRow 사용)

```tsx
'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import ListRow from './ListRow';

export type LinkItem = {
  id: number;
  site_name: string;
  site_url: string;
  description: string | null;
  logo_url: string | null;
  isFavorite?: boolean;
};

export default function LinkCard({
  link, isLoggedIn, onFavoriteToggle,
}: {
  link: LinkItem;
  isLoggedIn: boolean;
  onFavoriteToggle: (id: number, fav: boolean) => void;
}) {
  const [fav, setFav] = useState(link.isFavorite ?? false);
  const [favLoading, setFavLoading] = useState(false);

  const domain = (() => {
    try { return new URL(link.site_url).hostname.replace(/^www\./, ''); }
    catch { return link.site_url; }
  })();

  const handleClick = () => {
    fetch('/api/toolbox/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId: link.id }),
    }).catch(() => {});
    window.open(link.site_url, '_blank', 'noopener,noreferrer');
  };

  const handleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);
    const next = !fav;
    setFav(next);
    try {
      await fetch('/api/toolbox/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: link.id, favorite: next }),
      });
      onFavoriteToggle(link.id, next);
    } catch {
      setFav(!next);
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <ListRow
      href={link.site_url}
      onClick={handleClick}
      iconUrl={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      title={link.site_name}
      subtitle={domain}
      meta={link.description || ''}
      trailing={
        isLoggedIn ? (
          <button
            type="button"
            onClick={handleFav}
            aria-label={fav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            className={`transition-colors ${fav ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
          >
            <Star size={16} fill={fav ? 'currentColor' : 'none'} />
          </button>
        ) : undefined
      }
    />
  );
}
```

---

## 📄 파일 4 (교체) — `components/toolbox/YoutubeRanking.tsx`

> 파일 **전체를 아래 내용으로 교체**. (자체 헤더·행 → SectionHeader·ListRow)

```tsx
'use client';

import ListRow from './ListRow';
import SectionHeader from './SectionHeader';

export type YtChannel = {
  rank: number;
  title: string;
  thumbnail_url: string | null;
  subscriber_count: number;
  channel_url: string;
  week_label: string | null;
};

function fmtSubs(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 1000000 ? 0 : 1)}만`;
  return n.toLocaleString();
}

export default function YoutubeRanking({ channels }: { channels: YtChannel[] }) {
  if (!channels || channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="mb-2 text-2xl">📺</span>
        <p className="text-sm font-medium text-unjong-primary">유튜브 Top100 — 데이터 준비 중</p>
        <p className="mt-1 text-xs text-unjong-muted">곧 채워집니다</p>
      </div>
    );
  }
  const week = channels[0]?.week_label ?? '';
  return (
    <section className="min-w-0">
      <SectionHeader title="한국 주식 유튜브 Top 100" subtitle={`${week} · 구독자순 · 매주 갱신`} />
      <div>
        {channels.map((c) => (
          <ListRow
            key={c.rank}
            href={c.channel_url}
            rank={c.rank}
            iconUrl={c.thumbnail_url}
            iconRound
            title={c.title}
            stat={fmtSubs(c.subscriber_count)}
          />
        ))}
      </div>
    </section>
  );
}
```

---

## 📄 파일 5 (교체) — `components/toolbox/BrokerRanking.tsx`

> 파일 **전체를 아래 내용으로 교체**. **이중박스 제거**(rounded-2xl border p-4 → 맨 section) + SectionHeader·ListRow.

```tsx
'use client';

import ListRow from './ListRow';
import SectionHeader from './SectionHeader';
import { BROKERS } from '@/lib/brokers';

export default function BrokerRanking() {
  return (
    <section className="min-w-0">
      <SectionHeader title="증권사" subtitle="거래대금순 · 최근 분기 근사치" />
      <div>
        {BROKERS.map((b) => (
          <ListRow
            key={b.rank}
            href={b.url}
            rank={b.rank}
            iconUrl={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=64`}
            title={b.name}
            subtitle={b.note ?? undefined}
            stat={b.share != null ? `${b.share}%` : undefined}
          />
        ))}
      </div>
    </section>
  );
}
```

---

## 📄 파일 6 (수정) — `components/toolbox/ToolboxClient.tsx`

### 수정 6-1 — import 추가

**찾기:**
```tsx
import AdvisorDirectory from './AdvisorDirectory';
```
**바꾸기:**
```tsx
import AdvisorDirectory from './AdvisorDirectory';
import SectionHeader from './SectionHeader';
```

### 수정 6-2 — 링크탭에 헤더 추가 + space-y-1 제거(밑줄 표형이라 간격 불필요)

**찾기:**
```tsx
        ) : catLinks.length === 0 ? (
          <Placeholder emoji="🗂️" title={`${cat?.label ?? ''} · ${countryLabel} 링크 준비 중`} />
        ) : (
          <div className="space-y-1">
            {catLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                isLoggedIn={isLoggedIn}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
        )}
```
**바꾸기:**
```tsx
        ) : catLinks.length === 0 ? (
          <Placeholder emoji="🗂️" title={`${cat?.label ?? ''} · ${countryLabel} 링크 준비 중`} />
        ) : (
          <section className="min-w-0">
            <SectionHeader title={cat?.label ?? ''} subtitle={`${catLinks.length}곳 · 운종 큐레이션`} />
            <div>
              {catLinks.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  isLoggedIn={isLoggedIn}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          </section>
        )}
```

---

## 🗑️ 파일 7 (삭제) — `components/toolbox/CategorySection.tsx`

> 고아 코드(어디서도 import 안 됨, 옛 민트색 raw 헥스). 삭제.

```bash
rm components/toolbox/CategorySection.tsx
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러 (CategorySection 삭제해도 import 0이라 안전).

개발 서버(`npm run dev`, 포트 3333) → 홈 한국 탭 순회:
1. **뉴스·차트·재무 등 링크탭** — 이제 상단에 "**뉴스 · N곳 · 운종 큐레이션**" 헤더 생김. 행은 밑줄 표형, 호버 시 우측 흐린 ↗ 아이콘.
2. **유튜브** — 헤더 동일 양식, 번호+원형 썸네일+구독자수, 같은 행 스타일.
3. **증권사** — **이중 테두리 사라짐**(맨 리스트), 번호+파비콘+점유율, 같은 행 스타일.
4. **세 종류 행 높이·아이콘(24px)·호버가 전부 동일**해 보이면 성공.
5. **리딩방** — 그대로(특수 뷰, 변화 없음).

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "refactor(ui): 카테고리 리스트 시각언어 통일 — ListRow/SectionHeader 공용화, 증권사 이중박스 제거, CategorySection 삭제 (STEP 313)" && git push
```

---

> **한 줄 요약**: 링크탭·유튜브·증권사를 공용 ListRow(표형 밑줄·미니멀 호버)+SectionHeader로 통일, 증권사 이중박스 제거, 고아 CategorySection 삭제. 리딩방은 유지.
