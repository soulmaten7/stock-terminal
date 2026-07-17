# STEP 744 — 보드 상단 자동 미리보기 · KR 파일럿 (④B-KR)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제:** STEP 743(④A) 완료. ④ 2/3. **KR(MarketBoard)만** — 나머지 5개 보드는 STEP 745에서 미러.
**대상:** `components/toolbox/LensPreview.tsx`(예시 라벨 prop) + **신규** `components/toolbox/BoardTopLensCard.tsx`(모바일 카드) + `components/toolbox/MarketBoard.tsx`(배선) + `messages`(소량).

## 목표
보드에 들어오면 **맨 위 종목(거래 상위)의 렌즈 미리보기가 자동으로** 보이게. 데스크톱=우측 패널 기본값, 모바일=리스트 위 **인라인 카드**(팝업/시트 아님). **"추천" 아닌 "거래 상위 예시" 중립 프레이밍.**

## 배경 (코드 지도)
- `MarketBoard.tsx`: `selectedStock`(120줄)·`useSheetSync`가 URL로 복원(127줄)·`sorted` 메모(정렬된 전체·약 236~262줄)·데스크톱 aside `<LensPreview stock={selectedStock} market="KR" />`(573줄)·모바일 탭시트(578~627줄·**그대로 유지**).
- `LensPreview`: `stock` prop이 null이면 빈 안내("종목을 선택하면…"). 톤 색: pos=accent·warn=amber-400·flat=muted.
- 렌즈 톤·점 렌더는 `components/favorites/WatchlistClient.tsx` `LensSummary`(29~62줄)+톤 추출(99~108줄) 패턴 재사용.

## 수정 1 — LensPreview 예시 라벨 (데스크톱 rail)
`LensPreview.tsx` props에 `example?: boolean` 추가. `stock`이 있고 `example`가 true면, 미리보기 **최상단에 작은 중립 라벨** 한 줄:
```tsx
{example && stock ? <p className="mb-2 text-[11px] text-unjong-muted">{t('exampleLabel')}</p> : null}
```
- i18n `LensPreview.exampleLabel` — ko `"거래 상위 예시"` / en `"Top by volume · example"`. (빈 안내·나머지 불변.)

## 수정 2 — 신규 `components/toolbox/BoardTopLensCard.tsx` (모바일 인라인 카드)
`'use client'`. props `{ stock: { symbol: string; name: string; price?: number|null; changePercent?: number|null } | null; market: string }`.
- `stock`이 null이면 `return null`.
- `useLocale()` + `stock.symbol` 바뀌면 `/api/lens?symbol=…&lang=locale` fetch → 톤 배열(WatchlistClient 99~108줄과 동일: `lenses[].verdict.tone` + `fscore` score≥7/≤3).
- 렌더: `Link`(→ `/stock/{symbol}`) 안에 **압축 카드** —
  - 위: 작은 라벨 `t('topExample')`(Board 네임스페이스).
  - 로고(`StockLogo` size 22) + 이름 + `symbol`(mono) + 가격(`price?.toLocaleString()`·통화기호는 MarketBoard의 방식 재사용 가능) + 등락(`changePercent`·색 = `>=0?up:down`).
  - 렌즈: 점 7개(톤 색·`TONE_DOT` = pos `bg-unjong-accent`·warn `bg-amber-400`·flat `bg-unjong-muted`) + `강점/주의/보통` 카운트(기존 `Favorites.lensSummary` 재사용) + `t('viewLens')`(→ 화살표). 로딩 중엔 회색 점7 스켈레톤.
  - 스타일: `rounded-2xl border border-unjong-border bg-unjong-surface p-3`, 다크 토큰만.
- i18n(Board 네임스페이스) 2키: `topExample` ko `"거래 상위 예시"` / en `"Top by volume · example"`, `viewLens` ko `"렌즈로 보기"` / en `"View lenses"`. 카운트·로딩은 `Favorites.lensSummary`/`lensLoading` 재사용(`useTranslations('Favorites')`).

## 수정 3 — MarketBoard 배선
### 3-a. 데스크톱 aside 기본값(573줄)
기존:
```tsx
          <LensPreview stock={selectedStock} market="KR" />
```
교체:
```tsx
          <LensPreview stock={selectedStock ?? sorted[0] ?? null} market="KR" example={!selectedStock} />
```
→ 미선택 시 `sorted[0]`(현재 정렬 맨 위) 자동 표시 + "거래 상위 예시" 라벨. 종목 클릭하면 그 종목(라벨 없음). 세부탭/정렬 바뀌면 `sorted[0]` 따라 갱신.

### 3-b. 모바일 인라인 카드 (리스트 위, lg:hidden)
`<div className="flex gap-4">`(346줄) **바로 위**에, 로딩 아닐 때만:
```tsx
      {!loading && sorted.length > 0 ? (
        <div className="mb-3 lg:hidden">
          <BoardTopLensCard stock={sorted[0] ?? null} market="KR" />
        </div>
      ) : null}
```
→ 모바일에서 리스트 위에 맨 위 종목 카드 1장(항상 보임·스크롤로 지나감·탭→종목 페이지). 기존 탭시트(578~627줄)는 **그대로**(다른 종목 탭할 때 계속 동작). 데스크톱은 `lg:hidden`이라 안 보임(우측 패널 사용).

> ⚠️ `useSheetSync` URL 복원과 안 싸우게 — 데스크톱은 `selectedStock ?? sorted[0]`로 **상태를 바꾸지 않고 표시만** 폴백(setSelectedStock 호출 X). 모바일 카드도 `sorted[0]`를 **읽기만**. 선택 상태 로직 불변.

## 마무리
```
npm run build   # tsc + messages.test.ts(패리티)
git add -A && git commit -m "feat(board·KR): 상단 자동 렌즈 미리보기 — 데스크톱 우측 패널 기본값 sorted[0]+거래상위예시 라벨 + 모바일 리스트 위 인라인 카드(BoardTopLensCard)·팝업 아님" && git push
```

## 검증 (배포 후 Cowork)
- `/`(KR 보드) 데스크톱: 클릭 전에도 우측 패널에 **거래 상위 종목**(SK하이닉스 등) 렌즈가 "거래 상위 예시" 라벨과 함께 뜸. 세부탭(ETF 등) 바꾸면 그 탭 맨 위로 갱신. 종목 클릭 시 그 종목(라벨 없음).
- 모바일 폭: 리스트 위에 인라인 카드 1장(맨 위 종목·점7+카운트·탭→종목 페이지)·팝업 아님·기존 여백 안 해침.
- `/en`도 영어 라벨.
