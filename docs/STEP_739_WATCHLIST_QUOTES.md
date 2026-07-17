# STEP 739 — 관심목록 배치 시세 라우트 (②a 1/3)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제:** HEAD `687da2d`(문서 동기화) 이후. ②a(관심목록 렌즈 개편) 1/3.
**대상:** `app/api/watchlist/quotes/route.ts` (신규 1파일). 기존 라우트·컴포넌트 **불변**.

## 목표
관심 종목들의 **가격·등락**을 국가별 선계산 스냅샷 테이블에서 **배치로 한 번에** 읽어 반환. (렌즈 요약은 STEP 740에서 클라 지연 로딩 — 이 라우트는 시세만.)

## 배경 (코드 지도)
- 관심목록 원본: `app/api/watchlist/route.ts` GET → 인증 후 `watchlist` 테이블에서 `{ symbol, name_ko, market, country }` 반환. **이 라우트의 인증 + Supabase 클라이언트 셋업 패턴을 그대로 복사**해서 신규 라우트에 쓴다.
- 가격은 국가별 매일 스냅샷(선계산, public-read RLS):

| country | 테이블 | 가격 | 등락 컬럼 |
|---|---|---|---|
| KR | `kr_stock_snapshot` | `price` | `change_percent` |
| US | `us_stock_perf` | `price` | `r1d` |
| JP | `jp_stock_perf` | `price` | `r1d` |
| CN | `cn_stock_perf` | `price` | `r1d` |
| VN | `vn_stock_perf` | `price` | `r1d` |
| GB | `gb_stock_perf` | `price` | `r1d` |

- 컬럼명이 확실치 않으면 **참조 라우트에서 재확인**: KR = `app/api/krx/ranking/route.ts`(`kr_stock_snapshot`·`change_percent`), US = `app/api/yahoo/us-list/route.ts`(`us_stock_perf`·`r1d`). 나머지 `{jp,cn,vn,gb}_stock_perf`는 us와 동일 스키마.

## 구현
신규 `app/api/watchlist/quotes/route.ts` (GET):
- `export const runtime = "nodejs"; export const dynamic = "force-dynamic";`
- 인증: `app/api/watchlist/route.ts` GET과 **동일한 방식**으로 user 세션 확인. 미인증이면 `NextResponse.json({ auth: false, watchlist: [] })`.
- `watchlist` 행 읽기: 동일 쿼리(`symbol, name_ko, market, country`, `display_order`→`created_at` 정렬).
- 행이 없으면 `{ auth: true, watchlist: [] }`.
- country별로 symbol 묶기 → country별 스냅샷 테이블에서 `.in('symbol', symbols)`로 `symbol, price, <등락컬럼>`만 select. (같은 Supabase 클라이언트로. public-read라 문제없음. country 값 대문자 KR/US/JP/CN/VN/GB 확인 후 매핑.)
- 병합해 원래 watchlist 순서 유지하며 반환:
  ```
  { auth: true, watchlist: [
    { symbol, name_ko, market, country, price, changePercent }
  ]}
  ```
  - `changePercent` = KR이면 `change_percent`, 그 외는 `r1d`. 스냅샷 매칭 없으면 `price: null, changePercent: null`(클라에서 "—" 처리).
  - 매칭은 `symbol` 기준(스냅샷 테이블이 symbol 키). 혹시 중복이면 market 일치 우선.

> ⚠️ 응답 스키마(`{ auth, watchlist:[{symbol,name_ko,market,country,price,changePercent}] }`)를 **정확히 이 형태로** — STEP 740이 이걸 그대로 소비한다.

## 마무리
```
npm run build
git add -A && git commit -m "feat(watchlist): 관심목록 배치 시세 라우트 /api/watchlist/quotes (국가별 스냅샷 .in 조회·가격+등락·렌즈는 별도)" && git push
```

## 검증 (배포 후 Cowork 실측)
- 로그인 상태에서 `/api/watchlist/quotes` 호출 → 관심종목 각 항목에 `price`·`changePercent` 채워짐.
- KR·US 등 섞인 관심목록이면 양쪽 다 값이 옴. 스냅샷 없는 종목은 price null(정상).
