# STEP 781 — 관심목록 이름 영문 통일(776 누락분) + 오늘 화면 PC hover 별

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)

**전제 상태**: STEP 780 커밋 `a9f0858` 이후 HEAD · 트리 클린

**배경(07-22 · 장은태 승인)**: ① 776의 리스트 영문 통일이 관심 계열 3곳을 스코프에서 누락(Cowork 스코프 실수) — 같은 화면에 "로빈후드"(관심)와 "Robinhood Markets, Inc."(간밤 미국) 공존. ② 관심 등록이 상세에만 있어 오늘 화면에서 발견→등록 동선이 김 — PC는 hover 별(TradingView/Yahoo 정석), 모바일 오늘은 현행 유지(공간 없음·763 반응형 원칙·탐색 별이 이미 모바일 경로 제공).

---

## 수정

### 1) 관심목록 이름 영문 통일 (3곳 + 전수 검증)

- 아래 3곳이 `name_ko`를 직접 쓰는 것을 776의 공용 경로(`resolveDisplayName` context `'list'`)로 교체:
  1. `components/today/TodayClient.tsx` ~239행 (내 관심종목 · 렌즈 변화 행)
  2. `components/today/TodayClient.tsx` ~326행 (PC 우측 레일 내 관심목록)
  3. `components/favorites/WatchlistClient.tsx` ~152행 (`/favorites` 행)
- 필요한 필드(`name_en` 등)가 `/api/watchlist/quotes` 응답에 부족하면 응답 확장(클라 추가 호출 금지).
- **마감 검증**: `name_ko` 직접 표시 사용처 grep 전수 — 리스트류에 잔존 0 확인(상세·검색 별칭·StockLogo alt는 제외 대상 아님·현행 유지).
- KR 종목은 ko 화면 한글 그대로(변화 0) — 이번 건은 US(및 FK 오버라이드 보유) 종목의 리스트 표시만.

### 2) 오늘 화면 행 PC hover 별

- `ExploreClient.tsx`의 로컬 `WatchStar`(126행)를 공용 컴포넌트로 추출(`components/common/` — 탐색 동작 byte 동일 유지) 후 오늘 화면 행(간밤 미국·{시장} 상태가 바뀐 종목·내 관심종목 섹션)에 추가:
  - **PC 전용**: 모바일 미표시(`hidden` + sm/lg 노출 — 기존 오늘 화면 반응형 분기점에 맞춤). 평소 투명, **행 hover 시 표시**(`opacity-0 group-hover:opacity-100` + focus-visible 대응). 행 우측 가격 옆.
  - 관심 여부 초기값 = TodayClient가 이미 가진 `watchlistQuotes` 심볼셋 재사용(새 조회 금지). 비로그인 동작·토글 API는 탐색 WatchStar와 동일(재사용이므로 자동).
  - 관심 섹션 행의 별은 채워진 상태로 시작(해제 가능) — 탐색과 같은 의미론.
- 행 탭(상세 이동)과 별 클릭 이벤트 분리(stopPropagation — 탐색 기존 처리 재사용).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. 라이브: ko `/` 관심 섹션·우측 레일·`/favorites`에서 HOOD가 영문 표시(간밤 미국과 동일 이름) · KR 종목 한글 불변 · `/en` 불변 · PC에서 오늘 행 hover 시 별 표시→클릭 등록/해제(행 이동 안 됨) · 모바일 폭에서 별 미표시 · 탐색 별 동작 불변.
3. 커밋:
   ```bash
   git add app/ components/ lib/ messages/ docs/STEP_781_COMMAND.md
   git commit -m "STEP 781: watchlist name unification (776 gap), pc hover watch-star on today rows"
   git push
   ```

## 완료 보고 → Cowork에게: 라이브 확인 + grep 전수 결과 + 커밋 해시.
