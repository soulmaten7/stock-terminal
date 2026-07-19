# STEP 759 — 🐞 KR 보드 검색 커버리지 픽스 (1000행 캡·100개 하드캡 제거)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet — 라우트 3개)
**⚠️ STEP 758(이메일 가입)이 진행 중이면 완료 후 실행** (같은 트리·순차)

**전제 상태**: STEP 758 커밋 이후 HEAD · 트리 클린

**버그(사용자 리포트·07-18 실측)**: KR 보드 검색이 로드된 목록 안에서만 필터링되는데 서빙이 잘려 있음 —
- `krx/ranking`: 클라가 `limit=2600` 요청 → **PostgREST 1,000행 캡이 조용히 절단** → 1,000개 반환(실측). 하위 ~1,772종목 검색 불가.
- `krx/etf-performance`·`etn-performance`: 스냅샷 쿼리 `.limit(100)` 하드캡 → ETF 1,147 중 100·ETN 386 중 100만. (TIGER 229개 중 33개만 검색됨·실측.)
- DB(`kr_stock_snapshot` 2,772·`kr_etp_snapshot` etf 1,147/etn 386)는 전부 신선 — 서빙 층만 문제.

---

## 수정 1 — `app/api/krx/ranking/route.ts` (1000 캡 우회)

- 스냅샷 SELECT를 `.range(from, from+999)` 루프(정렬 유지: 기존 sort 파라미터 순서대로)로 바꿔 **요청 limit(≤전 유니버스)만큼 실제로** 반환. 요청 limit이 1000 이하면 기존 동작 그대로(불필요한 다중 페이지 금지).
- 렌즈 톤 조인은 757의 1,000개 청크가 이미 처리 — 반환 심볼 전체에 적용되는지만 확인.
- 응답 무게: 2,772행 ≈ 수백 KB(gzip) — 기존 설계 의도(클라 전체 로드·클라 필터)와 일치라 허용. 다른 필드·정렬·캐시 불변.

## 수정 2 — `app/api/krx/etf-performance/route.ts` · 수정 3 — `etn-performance/route.ts`

- 스냅샷 쿼리 `.limit(100)` → `.range()` 루프로 **전량**(etf 1,147은 2페이지·etn 386은 1페이지).
- ETN 라이브 폴백의 `.slice(0, 100)`도 제거(전량). ETF 라이브 폴백도 동일 캡 있으면 제거.
- 정렬(trade_amount desc) 유지 — 보드 기본 화면은 지금과 동일하게 상위부터, 검색만 전체를 뒤지게 됨.

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. 로컬(클린 재시작 — API 라우트 변경):
   - `curl -s "localhost:3333/api/krx/ranking?market=all&sort=amount&limit=2600" | jq '.stocks | length'` → **2600+**(캡 돌파)
   - `curl -s "localhost:3333/api/krx/etf-performance" | jq '.items | length'` → **1147** · TIGER 포함 개수 `jq '[.items[]|select(.name|contains("TIGER"))]|length'` → **229**
   - `curl -s "localhost:3333/api/krx/etn-performance" | jq '.items | length'` → **386**
   - 브라우저: 주식 서브탭에서 소형주(거래대금 하위) 이름 검색 → 검색됨 / ETF 서브탭 "TIGER" 검색 → 다수 · 페이지네이션·정렬 정상 · 보드 초기 로딩 체감 저하 없나(≤1~2초 유지) 확인
3. 커밋·푸시:
   ```bash
   git add app/api/krx/
   git commit -m "STEP 759: fix KR board search coverage - remove silent 1000-row cap and 100-item hard caps (full universe searchable)"
   git push
   ```

## 완료 보고 → Cowork에게
- 3개 카운트(2600+/1147/386) · TIGER 229 · 로딩 체감 · 커밋 해시. (US 등 타국 보드는 전량 반환 확인돼 있음 — KR만.)
