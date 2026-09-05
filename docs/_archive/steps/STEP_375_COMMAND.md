<!-- 2026-06-23 -->
# STEP 375 — [UX 디테일 5종] 미리보기 즐겨찾기·바로가기 라벨·유튜브 기준일·마이페이지 섹션·푸터 정리

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_375_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표 (사용자 직접 발견 디테일)
① 리딩방 미리보기 카드 우상단 즐겨찾기 ⭐(리스트와 동기화)
② 링크 행 우측 "바로가기 🔗" 항상 표시(발견성) — **ListRow 한 곳** = 증권사·뉴스·차트·유튜브 전부
③ 유튜브 랭킹 상단 "N월 N주차 기준 · 매주 자동 갱신"(week_label 이미 존재)
④ 마이페이지 즐겨찾기 링크를 **카테고리 섹션 헤더**로 묶기(즐겨찾기 있는 카테고리만)
⑤ 푸터 문의에서 '카카오톡: @트릴리언' 제거

전부 **컴포넌트만** 변경(API 무관) → 클린 재시작 불필요(빌드 + 새로고침).

---

## ① `components/toolbox/AdvisorDirectory.tsx` — 미리보기 즐겨찾기 ⭐

**찾기:**
```tsx
function PreviewBody({ a, onReport }: { a: Advisor; onReport: () => void }) {
```
**바꾸기:**
```tsx
function PreviewBody({ a, onReport, isFav, onToggleFav }: { a: Advisor; onReport: () => void; isFav: boolean; onToggleFav: () => void }) {
```

**찾기:**
```tsx
        <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-unjong-primary">{roomName}</h3>
      </div>
```
**바꾸기:**
```tsx
        <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-unjong-primary">{roomName}</h3>
        <button
          type="button"
          onClick={onToggleFav}
          aria-label={isFav ? '즐겨찾기 해제' : '즐겨찾기'}
          className={`shrink-0 transition-colors ${isFav ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
        >
          <Star size={18} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>
```

**찾기 (데스크탑 우측 미리보기 — 뒤에 `) : (`):**
```tsx
              <PreviewBody a={selected} onReport={() => openReport(selected)} />
            ) : (
```
**바꾸기:**
```tsx
              <PreviewBody a={selected} onReport={() => openReport(selected)} isFav={favs.has(selected.biz_no)} onToggleFav={() => toggleFav(selected)} />
            ) : (
```

**찾기 (모바일 하단 시트 — 뒤에 `</div>`):**
```tsx
            <PreviewBody a={selected} onReport={() => openReport(selected)} />
          </div>
```
**바꾸기:**
```tsx
            <PreviewBody a={selected} onReport={() => openReport(selected)} isFav={favs.has(selected.biz_no)} onToggleFav={() => toggleFav(selected)} />
          </div>
```

> `Star`·`favs`·`toggleFav` 모두 이미 파일에 존재(리스트 별과 동일 상태 → 자동 동기화).

---

## ② `components/toolbox/ListRow.tsx` — "바로가기 🔗" 항상 표시

**찾기:**
```tsx
      <ExternalLink size={14} className="shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
```
**바꾸기:**
```tsx
      <span className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[11px] text-unjong-muted group-hover:text-unjong-accent">
        바로가기 <ExternalLink size={12} />
      </span>
```

> 이 한 곳이 LinkCard(카테고리 링크)·BrokerRanking(증권사)·YoutubeRanking 전부에 적용됨.

---

## ③ `components/toolbox/YoutubeRanking.tsx` — 기준일 표시

**찾기:**
```tsx
  return (
    <section className="min-w-0">
      <div>
        {channels.map((c) => (
```
**바꾸기:**
```tsx
  const weekLabel = channels[0]?.week_label;
  return (
    <section className="min-w-0">
      {weekLabel ? (
        <p className="border-b border-unjong-border px-1 py-2.5 text-[11px] text-unjong-muted">{weekLabel} 기준 · 매주 자동 갱신</p>
      ) : null}
      <div>
        {channels.map((c) => (
```

> `week_label`은 "2026년 6월 4주차" 형식으로 이미 DB·page.tsx에서 내려옴(크론 youtube-refresh가 주간 갱신).

---

## ④ `app/mypage/page.tsx` — 즐겨찾기 링크 카테고리 섹션 헤더

**찾기:**
```tsx
type LinkFav = { id: number; name: string; url: string; category: string };
```
**바꾸기:**
```tsx
type LinkFav = { id: number; name: string; url: string; category: string };

const LINK_CAT_LABELS: Record<string, string> = {
  news: '뉴스', chart: '차트·시세', analysis: '기업·재무', disclosure: '공시·신용',
  research: '리포트', etf: 'ETF·펀드', ipo: '공모주·배당', macro: '거시경제',
  community: '커뮤니티', exchange: '거래소',
};
const LINK_CAT_ORDER = ['news', 'chart', 'analysis', 'disclosure', 'research', 'etf', 'ipo', 'macro', 'community', 'exchange'];
```

**찾기 (링크 즐겨찾기 단일 리스트):**
```tsx
              <ul className="overflow-hidden rounded-xl border border-unjong-border bg-unjong-surface">
                {linkFavs.map((l) => (
                  <li key={l.id} className="flex items-center gap-2 border-b border-unjong-border px-4 py-2.5 last:border-0">
                    <span className="min-w-0 flex-1 truncate text-sm text-unjong-primary">{l.name}</span>
                    <a href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="shrink-0 text-unjong-muted hover:text-unjong-accent"><ExternalLink size={14} /></a>
                  </li>
                ))}
              </ul>
```
**바꾸기 (카테고리별 섹션, 즐겨찾기 있는 카테고리만, 순서 보존):**
```tsx
              <div className="space-y-4">
                {Array.from(new Set(linkFavs.map((l) => l.category)))
                  .sort((a, b) => (LINK_CAT_ORDER.indexOf(a) + 1 || 99) - (LINK_CAT_ORDER.indexOf(b) + 1 || 99))
                  .map((cat) => (
                    <div key={cat}>
                      <h3 className="mb-1.5 text-xs font-semibold text-unjong-muted">{LINK_CAT_LABELS[cat] ?? cat}</h3>
                      <ul className="overflow-hidden rounded-xl border border-unjong-border bg-unjong-surface">
                        {linkFavs.filter((l) => l.category === cat).map((l) => (
                          <li key={l.id} className="flex items-center gap-2 border-b border-unjong-border px-4 py-2.5 last:border-0">
                            <span className="min-w-0 flex-1 truncate text-sm text-unjong-primary">{l.name}</span>
                            <a href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="shrink-0 text-unjong-muted hover:text-unjong-accent"><ExternalLink size={14} /></a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
```

> 상단 `링크 (N)` 카운트 헤더는 그대로 두고, 그 아래만 카테고리별로 묶음. 한 화면 전체보기(스크롤), 빈 카테고리 없음.

---

## ⑤ `components/layout/Footer.tsx` — 카카오톡 제거

**찾기:**
```tsx
              <li>카카오톡: @트릴리언</li>
              <li>이메일: <a href="mailto:contact@onetrillion.app" className="transition-colors hover:text-[#2DD4BF]">contact@onetrillion.app</a></li>
```
**바꾸기:**
```tsx
              <li>이메일: <a href="mailto:contact@onetrillion.app" className="transition-colors hover:text-[#2DD4BF]">contact@onetrillion.app</a></li>
```

---

## ✅ 빌드 검증 (필수)
```bash
cd ~/stock-terminal && npm run build
```
- ✅ 무에러 → 다음.
- ❌ 에러 → 메시지 출력 후 멈춤(커밋 금지).

## ✅ 런타임 검증 (컴포넌트만 → 새로고침이면 됨)
1. **리딩방·검증** 탭 → 항목 클릭 → 우측 미리보기 카드 **우상단 ⭐**, 누르면 채워지고 **리스트 별과 동기화**(로그아웃 시 로그인 유도).
2. 증권사·뉴스·차트·유튜브 등 링크 행 우측에 **"바로가기 🔗" 항상(회색)** 표시.
3. **유튜브** 탭 상단에 **"2026년 6월 N주차 기준 · 매주 자동 갱신"**.
4. **마이페이지 > 내 즐겨찾기** → 링크가 **카테고리별 섹션**으로(즐겨찾기 있는 것만, 헤더=뉴스/차트·시세/증권사…).
5. **푸터 문의** = 이메일만(카카오톡 줄 없음).

## 📦 커밋·푸시 (빌드 통과 시에만)
```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(ux): 미리보기 즐겨찾기·바로가기 라벨·유튜브 기준일·마이페이지 섹션·푸터 정리 (STEP 375)" && git push
```

---

> **한 줄 요약**: UX 디테일 5종(미리보기 ⭐·바로가기 라벨·유튜브 기준일·마이페이지 카테고리 섹션·카카오톡 제거). 전부 컴포넌트라 새로고침이면 적용. 빌드 통과 시 커밋.
