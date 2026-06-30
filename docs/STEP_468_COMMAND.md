<!-- 2026-06-30 -->
# STEP 468 — 다른 탭들 광고 문의 확장 (유튜브 10개마다 + 피드 링크 + 'feed' 슬롯 신설)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_468_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
종목·상품 표(466/467)에 이어 **다른 리스트 탭에도 `광고 문의하기` 자리** 추가:
1. **유튜브 Top100** — 10개마다 광고 행.
2. **피드 링크 리스트**(뉴스·공시·리포트·거시·ETF·공모주 + 커뮤니티·거래소) — **맨 위 1개 + 10개마다**(짧은 리스트도 최소 1개 노출).
3. **새 광고 슬롯 `feed`(콘텐츠 피드)** 신설 — 문의 폼 옵션 + /advertise 안내 카드 + URL 화이트리스트.

## 전제
- 최신 main + 466·467. 5개 파일 수정. 전부 클라이언트/서버 컴포넌트 → HMR(라우트 추가 없음).
- 수정: `AdSlotRow.tsx` · `YoutubeRanking.tsx` · `ToolboxClient.tsx` · `AdInquiryForm.tsx` · `app/advertise/page.tsx`

---

## (1) `components/toolbox/AdSlotRow.tsx` — 슬롯 타입에 'feed' 추가 — 찾기:
```tsx
export default function AdSlotRow({ slot }: { slot: 'broker' | 'room' }) {
```
바꾸기:
```tsx
export default function AdSlotRow({ slot }: { slot: 'broker' | 'room' | 'feed' }) {
```

---

## (2) `components/toolbox/YoutubeRanking.tsx`

### (2a) 임포트 — 찾기:
```tsx
'use client';

import ListRow from './ListRow';
```
바꾸기:
```tsx
'use client';

import { Fragment } from 'react';
import ListRow from './ListRow';
import AdSlotRow from './AdSlotRow';
```

### (2b) 10개마다 광고 행 — 찾기:
```tsx
      <div>
        {channels.map((c) => (
          <ListRow
            key={c.rank}
            href={c.channel_url}
            rank={c.rank}
            iconUrl={c.thumbnail_url}
            iconRound
            title={c.title}
            meta={c.description ?? ''}
            stat={fmtSubs(c.subscriber_count)}
          />
        ))}
      </div>
```
바꾸기:
```tsx
      <div>
        {channels.map((c, i) => (
          <Fragment key={c.rank}>
            <ListRow
              href={c.channel_url}
              rank={c.rank}
              iconUrl={c.thumbnail_url}
              iconRound
              title={c.title}
              meta={c.description ?? ''}
              stat={fmtSubs(c.subscriber_count)}
            />
            {(i + 1) % 10 === 0 && i + 1 < channels.length ? <AdSlotRow slot="feed" /> : null}
          </Fragment>
        ))}
      </div>
```

---

## (3) `components/toolbox/ToolboxClient.tsx`

### (3a) 임포트 — 찾기:
```tsx
import { useState, useEffect } from 'react';
import LinkCard, { type LinkItem } from './LinkCard';
```
바꾸기:
```tsx
import { Fragment, useState, useEffect } from 'react';
import LinkCard, { type LinkItem } from './LinkCard';
import AdSlotRow from './AdSlotRow';
```

### (3b) 피드 탭 링크 리스트(사이드바형) — 맨 위+10개마다 — 찾기:
```tsx
              <div className={`min-w-0 flex-1 ${feedSub === 'links' ? '' : 'hidden'} lg:block`}>
                {catLinks.length > 0 ? (
                  catLinks.map((link) => (
                    <LinkCard
                      key={link.id}
                      link={link}
                      isLoggedIn={isLoggedIn}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  ))
                ) : (
                  <p className="py-10 text-center text-sm text-unjong-muted">큐레이션 링크 준비 중</p>
                )}
              </div>
```
바꾸기:
```tsx
              <div className={`min-w-0 flex-1 ${feedSub === 'links' ? '' : 'hidden'} lg:block`}>
                {catLinks.length > 0 ? (
                  <>
                    <AdSlotRow slot="feed" />
                    {catLinks.map((link, i) => (
                      <Fragment key={link.id}>
                        <LinkCard
                          link={link}
                          isLoggedIn={isLoggedIn}
                          onFavoriteToggle={handleFavoriteToggle}
                        />
                        {(i + 1) % 10 === 0 && i + 1 < catLinks.length ? <AdSlotRow slot="feed" /> : null}
                      </Fragment>
                    ))}
                  </>
                ) : (
                  <p className="py-10 text-center text-sm text-unjong-muted">큐레이션 링크 준비 중</p>
                )}
              </div>
```

### (3c) 일반 링크 탭(커뮤니티·거래소 등) — 맨 위+10개마다 — 찾기:
```tsx
          <div className="flex gap-4">
            <div className="min-w-0 flex-1">
              {catLinks.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  isLoggedIn={isLoggedIn}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          </div>
```
바꾸기:
```tsx
          <div className="flex gap-4">
            <div className="min-w-0 flex-1">
              <AdSlotRow slot="feed" />
              {catLinks.map((link, i) => (
                <Fragment key={link.id}>
                  <LinkCard
                    link={link}
                    isLoggedIn={isLoggedIn}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                  {(i + 1) % 10 === 0 && i + 1 < catLinks.length ? <AdSlotRow slot="feed" /> : null}
                </Fragment>
              ))}
            </div>
          </div>
```

---

## (4) `components/advertise/AdInquiryForm.tsx` — 폼 옵션에 'feed' 추가 — 찾기:
```tsx
const SLOT_OPTIONS = [
  { value: 'broker', label: '증권사 슬롯 (종목·상품)' },
  { value: 'room', label: '리딩방 슬롯 (리딩방·검증)' },
  { value: 'other', label: '기타 · 일반 문의' },
];
```
바꾸기:
```tsx
const SLOT_OPTIONS = [
  { value: 'broker', label: '증권사 슬롯 (종목·상품)' },
  { value: 'room', label: '리딩방 슬롯 (리딩방·검증)' },
  { value: 'feed', label: '콘텐츠 피드 (뉴스·리포트·유튜브 등)' },
  { value: 'other', label: '기타 · 일반 문의' },
];
```

---

## (5) `app/advertise/page.tsx`

### (5a) 슬롯 안내 카드 + 종목표 문구 갱신 — 찾기:
```tsx
const SLOTS = [
  { key: "broker", title: "증권사 슬롯", where: "종목·상품 탭 · 증권사 리스트 상단/중간", desc: "주식 정보를 찾는 사용자에게 계좌개설·이벤트를 노출합니다." },
  { key: "room", title: "리딩방 슬롯", where: "리딩방·검증 탭 · 리스트 상단/중간", desc: "유사투자자문 신고 + 운영자 인증을 마친 곳만 상단 노출이 가능합니다." },
];
```
바꾸기:
```tsx
const SLOTS = [
  { key: "broker", title: "증권사 슬롯", where: "종목·상품 탭 · 종목 표/증권사 리스트 10행마다", desc: "주식 정보를 찾는 사용자에게 계좌개설·이벤트를 노출합니다." },
  { key: "room", title: "리딩방 슬롯", where: "리딩방·검증 탭 · 리스트 상단/중간", desc: "유사투자자문 신고 + 운영자 인증을 마친 곳만 상단 노출이 가능합니다." },
  { key: "feed", title: "콘텐츠 피드 슬롯", where: "뉴스·공시·리포트·유튜브 등 정보 리스트 상단/중간", desc: "정보를 탐색하는 사용자에게 브랜드·콘텐츠를 자연스럽게 노출합니다." },
];
```

### (5b) URL 슬롯 화이트리스트에 'feed' 추가 — 찾기:
```tsx
  const slot = ["broker", "room", "other"].includes(sp.slot ?? "") ? (sp.slot as string) : "other";
```
바꾸기:
```tsx
  const slot = ["broker", "room", "feed", "other"].includes(sp.slot ?? "") ? (sp.slot as string) : "other";
```

---

## 확인 (HMR — 새로고침)
- **유튜브 탭**(KR): 10위·20위·… 뒤에 `광고 문의하기 ›` 행. 누르면 `/advertise?slot=feed` → 드롭다운 '콘텐츠 피드'.
- **피드 탭**(뉴스·공시·리포트·거시경제·ETF·공모주): 링크모음 **맨 위에 1개** + (링크 10개 넘으면 10개마다) 광고 행. 데스크탑 좌측 링크 컬럼/모바일 '링크모음' 서브탭 양쪽.
- **커뮤니티·거래소** 등 일반 링크 탭도 동일(맨 위 1개+10개마다).
- **/advertise**: 슬롯 카드 3개(증권사·리딩방·콘텐츠 피드), 문의 폼 드롭다운에 '콘텐츠 피드' 옵션.
- 종목·상품 표(466/467)·증권사 사이드바·리딩방은 기존대로.
- 빌드 에러 없음.

## 빌드·커밋
- 보류. 466·467·468 묶어 커밋.
