<!-- 2026-06-30 -->
# STEP 469 — 헤더 '코인' 준비중 탭 추가 + 광고 슬롯 '맨 위' 제거(10개 이후만)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_469_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
1. **헤더에 '코인' 탭 추가(준비중)** — 로고 옆 자산군 탭이 '주식' 하나뿐 → '코인'을 **클릭 불가 + "준비중" 뱃지**로 추가(거대 금융 플랫폼 확장 자리 예약).
2. **광고 슬롯 '맨 위' 제거** — 리스트 1순위 위에 뜨던 `광고 문의하기`를 빼고, **10개 이후부터만** 표시. 리딩방·검증(`AdvisorDirectory`) + 증권사 사이드바(`BrokerRanking`) + 피드 링크(`ToolboxClient` 2곳) 통일. (종목·상품 표·유튜브는 이미 맨 위 없음 → 변경 없음.)

## 전제
- 최신 main + 468. 4개 파일 수정: `Header.tsx`·`AdvisorDirectory.tsx`·`BrokerRanking.tsx`·`ToolboxClient.tsx`. 클라이언트 → HMR.

---

## (1) `components/layout/Header.tsx` — '코인' 준비중 탭

### (1a) MENU에 코인 추가 — 찾기:
```tsx
const MENU = [
  { href: '/', label: '주식', match: (p: string) => p === '/' },
] as const;
```
바꾸기:
```tsx
const MENU = [
  { href: '/', label: '주식', ready: true, match: (p: string) => p === '/' },
  { href: '/coin', label: '코인', ready: false, match: (p: string) => p === '/coin' }, // 준비 중 — 추후 코인 시장
] as const;
```

### (1b) 준비중 탭은 클릭 불가 + 뱃지 — 찾기:
```tsx
          {MENU.map((m) => {
            const isActive = m.match(pathname);
            return (
              <Link
                key={m.label}
                href={m.href}
                onClick={() => { if (m.href === '/') resetHome(); }}
                aria-current={isActive ? 'page' : undefined}
                className={
                  isActive
                    ? 'px-3 py-2 text-sm font-bold text-white'
                    : 'px-3 py-2 text-sm font-medium text-white/55 transition-colors hover:text-white'
                }
              >
                {m.label}
              </Link>
            );
          })}
```
바꾸기:
```tsx
          {MENU.map((m) => {
            const isActive = m.match(pathname);
            // 준비 중 탭(코인 등): 클릭 불가 + '준비중' 뱃지
            if (!m.ready) {
              return (
                <span
                  key={m.label}
                  className="flex shrink-0 cursor-not-allowed items-center gap-1 px-3 py-2 text-sm font-medium text-white/30"
                  title="준비 중"
                >
                  {m.label}
                  <span className="text-[10px] font-normal text-white/30">준비중</span>
                </span>
              );
            }
            return (
              <Link
                key={m.label}
                href={m.href}
                onClick={() => { if (m.href === '/') resetHome(); }}
                aria-current={isActive ? 'page' : undefined}
                className={
                  isActive
                    ? 'px-3 py-2 text-sm font-bold text-white'
                    : 'px-3 py-2 text-sm font-medium text-white/55 transition-colors hover:text-white'
                }
              >
                {m.label}
              </Link>
            );
          })}
```

---

## (2) `components/toolbox/AdvisorDirectory.tsx` — 맨 위 광고 제거 — 찾기:
```tsx
                    {i % AD_EVERY === 0 ? <li><AdSlotRow slot="room" /></li> : null}
```
바꾸기:
```tsx
                    {i > 0 && i % AD_EVERY === 0 ? <li><AdSlotRow slot="room" /></li> : null}
```

---

## (3) `components/toolbox/BrokerRanking.tsx` — 맨 위 광고 제거 — 찾기:
```tsx
      <div>
        <AdSlotRow slot="broker" />
        {BROKERS.map((b, i) => (
```
바꾸기:
```tsx
      <div>
        {BROKERS.map((b, i) => (
```

---

## (4) `components/toolbox/ToolboxClient.tsx` — 피드 링크 리스트 맨 위 광고 제거 (2곳)

### (4a) 피드 탭(사이드바형) — 찾기:
```tsx
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
```
바꾸기:
```tsx
                {catLinks.length > 0 ? (
                  catLinks.map((link, i) => (
                    <Fragment key={link.id}>
                      <LinkCard
                        link={link}
                        isLoggedIn={isLoggedIn}
                        onFavoriteToggle={handleFavoriteToggle}
                      />
                      {(i + 1) % 10 === 0 && i + 1 < catLinks.length ? <AdSlotRow slot="feed" /> : null}
                    </Fragment>
                  ))
                ) : (
                  <p className="py-10 text-center text-sm text-unjong-muted">큐레이션 링크 준비 중</p>
                )}
```

### (4b) 일반 링크 탭(커뮤니티·거래소 등) — 찾기:
```tsx
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
```
바꾸기:
```tsx
            <div className="min-w-0 flex-1">
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
```

---

## 확인 (HMR — 새로고침)
- **헤더**: 로고 옆 `주식  코인(준비중)` — 코인은 흐리게·클릭 안 됨.
- **리딩방·검증**: 1순위 위 `광고 문의하기` **사라짐**. 10번째 행 다음부터 광고 등장.
- **증권사 사이드바**: 맨 위 광고 사라지고 10번째 다음부터.
- **피드 링크 탭(뉴스·공시·리포트·거시·ETF·공모주 + 커뮤니티·거래소)**: 맨 위 광고 사라짐. 링크 10개 넘으면 10개 다음부터 등장(10개 이하 탭은 광고 없음).
- 종목·상품 표·유튜브: 기존대로(맨 위 없음, 10개마다).
- 빌드 에러 없음.

## 빌드·커밋
- 보류. 확인 후 커밋·배포.
