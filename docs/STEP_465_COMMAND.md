<!-- 2026-06-30 -->
# STEP 465 — 피드 탭 모바일 서브탭 [링크 | 모아보기] (모바일 직관성)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_465_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
데스크탑은 좌(링크)+우(피드) 2단인데 **모바일은 피드가 리스트 밑에 쌓여** 직관성이 떨어짐. → `FEED_TABS` 7개(뉴스·공시·거시·기업재무·리포트·ETF·공모주)에 **모바일 전용 서브탭 [링크 | 모아보기]** 추가(종목·상품 서브탭처럼). **데스크탑은 2단 그대로**(서브탭 숨김).

## 전제
- 최신 main + 464. `components/toolbox/ToolboxClient.tsx` 3곳 수정. 클라이언트 → HMR.

---

## (1) `FEED_SUB_LABEL` 추가 — 찾기:
```tsx
// 우측 피드가 붙는 탭 + 탭별 피드 컴포넌트
const FEED_TABS = ['news', 'disclosure', 'macro', 'analysis', 'research', 'etf', 'ipo'];
```
바꾸기:
```tsx
// 우측 피드가 붙는 탭 + 탭별 피드 컴포넌트
const FEED_TABS = ['news', 'disclosure', 'macro', 'analysis', 'research', 'etf', 'ipo'];
// 모바일 서브탭에서 '모아보기(피드)' 쪽 라벨 (링크 ↔ 피드 분리)
const FEED_SUB_LABEL: Record<string, string> = {
  news: '최신 뉴스', disclosure: '최신 공시', macro: '주요 지표',
  analysis: '실적·재무 뉴스', research: '목표주가 뉴스', etf: 'ETF 뉴스', ipo: '청약 일정',
};
```

## (2) `feedSub` 상태 + 탭 전환 시 리셋 — 찾기:
```tsx
  const [activeTab, setActiveTab] = useState(TAB_ORDER[0]);
```
바꾸기:
```tsx
  const [activeTab, setActiveTab] = useState(TAB_ORDER[0]);
  const [feedSub, setFeedSub] = useState<'links' | 'feed'>('links'); // 모바일 서브탭(링크/모아보기)
```
그리고 찾기:
```tsx
  useEffect(() => { localStorage.setItem('unjong_tab', activeTab); }, [activeTab]);
```
바꾸기:
```tsx
  useEffect(() => { localStorage.setItem('unjong_tab', activeTab); setFeedSub('links'); }, [activeTab]);
```

## (3) FEED_TABS 렌더 — 모바일 서브탭 + hidden 토글 — 찾기:
```tsx
        ) : FEED_TABS.includes(activeTab) && feedSupports(activeTab, country) ? (
          <div className="flex flex-col gap-5 lg:flex-row lg:gap-4">
            <div className="min-w-0 flex-1">
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
            <aside className="w-full shrink-0 lg:w-96">
              {feedFor(activeTab, country)}
            </aside>
          </div>
        ) : catLinks.length === 0 ? (
```
바꾸기:
```tsx
        ) : FEED_TABS.includes(activeTab) && feedSupports(activeTab, country) ? (
          <div>
            {/* 모바일 전용 서브탭 — 링크 ↔ 모아보기 (데스크탑은 2단이라 숨김) */}
            <div className="mb-3 flex gap-1 lg:hidden">
              <button type="button" onClick={() => setFeedSub('links')} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${feedSub === 'links' ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}>링크</button>
              <button type="button" onClick={() => setFeedSub('feed')} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${feedSub === 'feed' ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}>{FEED_SUB_LABEL[activeTab] ?? '모아보기'}</button>
            </div>
            <div className="flex flex-col gap-5 lg:flex-row lg:gap-4">
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
              <aside className={`w-full shrink-0 lg:w-96 ${feedSub === 'feed' ? '' : 'hidden'} lg:block`}>
                {feedFor(activeTab, country)}
              </aside>
            </div>
          </div>
        ) : catLinks.length === 0 ? (
```

---

## 확인 (HMR — 새로고침)
- **데스크탑**: 거시경제·리포트 등 피드 탭이 기존처럼 **좌 링크 + 우 피드 2단** 그대로(서브탭 안 보임).
- **모바일**(브라우저 좁히거나 폰): 피드 탭에 **서브탭 [링크 | 최신 뉴스/주요 지표/…]** 뜨고, 누르면 그 내용만 표시(피드가 리스트 밑에 안 쌓임). 탭 바꾸면 '링크'로 리셋.
- 종목·상품/유튜브/리딩방·검증 탭은 영향 없음.
- 빌드 에러 없음.

## 빌드·커밋
- 보류. 파이널라이즈 묶어 커밋.
