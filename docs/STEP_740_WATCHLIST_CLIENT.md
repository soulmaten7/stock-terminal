# STEP 740 — WatchlistClient 재설계: "내 종목을 렌즈로 보는 목록" (②a 2/3)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제:** STEP 739 완료·배포(라우트 `/api/watchlist/quotes` 라이브). ②a 2/3.
**대상:** `components/favorites/WatchlistClient.tsx` (재설계) + `messages/ko.json`·`en.json`(Favorites 문구 소량 추가).

## 목표
지금 "로고+이름+티커"만 나열하던 관심목록을, **각 행에 현재가·등락 + 압축 렌즈 요약(강점/주의/보통 카운트 + 7점)**을 보여주는 목록으로. 반응형: 데스크톱=한 줄, 모바일=렌즈를 둘째 줄로.

## 데이터 흐름
1. **시세**: `/api/watchlist/quotes`(739) 호출 → `{ auth, watchlist:[{symbol,name_ko,market,country,price,changePercent}] }`. 이걸로 목록·가격 **즉시** 렌더.
2. **렌즈 요약(행별 지연)**: 렌더 후 각 행이 개별로 `/api/lens?symbol={symbol}&lang={locale}` 호출(보드 우측 패널 `LensPreview`가 쓰는 그 라우트). 응답:
   - `lenses`: 6개 렌즈 배열, 각 항목에 `verdict.tone` = `"pos" | "warn" | "flat"`(또는 null/na).
   - `fscore`: 별도 객체 `{ supported, score, max, ... }`.
   - **tone → 버킷**: `pos`=강점, `warn`=주의, `flat`=보통. verdict null/na는 제외.
   - **fscore → tone**: `!supported`면 제외. 아니면 `score>=7`→강점(pos), `score<=3`→주의(warn), 그 외→보통(flat). (lens_scores의 strong>=7/weak<=3 규약과 동일. 실제 fscore 필드가 다르면 grade로 대체.)
   - 즉 7개 렌즈(6 + fscore)의 tone 리스트를 만들어 **강점/주의/보통 카운트**와 **점 색**(강점=`text-unjong-accent`/민트, 주의=`text-amber-400`, 보통=`text-unjong-muted`)에 쓴다.
   - **동시성 제한**: 관심 종목이 많을 수 있으니 `/api/lens` 호출을 **한 번에 최대 4개**씩(간단 큐 or 4개씩 청크)만. 각 행은 로딩 중 스켈레톤("···" 또는 회색 점 7개), 완료 시 채움. 실패/na면 조용히 렌즈만 숨기고 가격은 유지.

## 렌더 (반응형)
각 행:
- 왼쪽: `StockLogo`(기존) + `name_ko ?? symbol`(굵게) + `symbol`(mono, muted).
- 가격: `price`(천단위, 통화기호는 기존 `formatPrice` 있으면 재사용·없으면 `toLocaleString`) + `changePercent`(부호+2자리, 색 = `changePercent>=0 ? 'text-unjong-up' : 'text-unjong-down'`). price null이면 "—".
- 렌즈 요약: 점 7개(각 tone 색) + `강점 X · 주의 Y · 보통 Z`(각 숫자 색). 
  - **데스크톱(sm+)**: 이름·가격과 **같은 줄** 오른쪽에.
  - **모바일(<sm)**: 이름·가격 아래 **둘째 줄**로 내려 안 터지게. (행을 `flex-col sm:flex-row` 또는 이름/가격 블록 + 렌즈 블록을 모바일에서 세로 스택.)
- 행 전체 클릭 → `/stock/{symbol}`(기존 유지). 우측 X = 관심 해제(기존 POST `/api/watchlist` `add:false` 유지).
- 문구: 로딩·미인증·빈 상태는 기존 것 유지(`t('loading')`·`t('loginForWatchlist')`·`t('emptyWatchlist')`). 렌즈 로딩 라벨이 필요하면 `Favorites.lensLoading`("렌즈 읽는 중…"/"Reading lenses…") 등 최소 키만 ko·en 추가(messages.test.ts 패리티 유지).

> 스타일은 기존 다크 토큰(`unjong-surface`·`unjong-border`·`unjong-primary`·`unjong-muted`·`unjong-accent`·`amber-400`·`unjong-up`/`down`) 그대로. 새 색 하드코딩 금지. 점은 지름 7px 원.

## 마무리
```
npm run build   # tsc + messages.test.ts(키 패리티) 통과
git add -A && git commit -m "feat(watchlist): 관심목록을 '렌즈로 보는 목록'으로 재설계 — 배치 시세 + 행별 지연 렌즈 요약(강점/주의/보통·점7)·반응형(모바일 2줄)·동시성4" && git push
```

## 검증 (배포 후 Cowork 실측)
- 로그인 + 관심종목 몇 개 담긴 상태로 `/favorites`(또는 `/ko`, `/en`) → 각 행에 가격·등락 즉시, 렌즈 요약이 잠깐 뒤 채워짐(강점/주의/보통 + 점7).
- 모바일 폭(≈390)에서 렌즈가 둘째 줄로 내려가 안 터지는지.
- 렌즈 na/실패 종목은 가격만 남고 렌즈는 조용히 빠지는지(깨짐 없음).
