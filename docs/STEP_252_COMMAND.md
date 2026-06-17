<!-- 2026-06-15 -->
# STEP 252 — ETF 1주일 데이터 메움 (etf-performance r1w + HomeEtfRanking 매핑)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_252_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (버그 수정)
'1주일' 기간에서 **ETF만 '—'로 빔**(주식·리츠·미국은 정상). 원인: `etf-performance`가 r1w(1주일)를 안 줌 + `HomeEtfRanking`이 1주일을 매핑 안 함.
- 해결: `etf-performance`에 **r1w 추가**, `HomeEtfRanking`이 1주일=r1w 쓰게. → ETF 탭·/market 통합 모두 1주일 채워짐.

> (확인 완료: KIS 차트는 최신까지 정상이라 미리보기 캔들차트는 문제없음. "1주일 안나옴"은 ETF 기간 데이터 갭이었음.)

## 전제 상태
- 현재 HEAD: STEP 251 적용 후
- 변경 **2파일**:
  - `app/api/yahoo/etf-performance/route.ts` (r1w 1줄 추가)
  - `components/home-v6/HomeEtfRanking.tsx` (Row에 r1w + PERF_FIELD에 1w 매핑)
- `/market` 통합(`MarketDirectoryClient`)은 이미 1w=r1w 매핑 보유 → 데이터만 오면 자동 표시(변경 불필요)

---

## 작업 1/2 — `app/api/yahoo/etf-performance/route.ts` (r1w 추가)

**찾기:**
```ts
          changePercent: ret(closes, 1) ?? 0,
          r1m: ret(closes, 21),
```
**바꾸기:**
```ts
          changePercent: ret(closes, 1) ?? 0,
          r1w: ret(closes, 5),
          r1m: ret(closes, 21),
```
> 5영업일 = 1주일. 다른 perf API(kr/reit/us)와 동일.

---

## 작업 2/2 — `components/home-v6/HomeEtfRanking.tsx` (r1w 타입 + 매핑)

**① 찾기 (Row 타입 — r1w 추가):**
```tsx
  tradeAmount?: number;
  r1m?: number | null;
```
**바꾸기:**
```tsx
  tradeAmount?: number;
  r1w?: number | null;
  r1m?: number | null;
```

**② 찾기 (PERF_FIELD — 1w 매핑 추가):**
```tsx
const PERF_FIELD: Partial<Record<PeriodKey, "r1m" | "r3m" | "r6m" | "r1y">> = {
  "1m": "r1m",
  "3m": "r3m",
  "6m": "r6m",
  "1y": "r1y",
};
```
**바꾸기:**
```tsx
const PERF_FIELD: Partial<Record<PeriodKey, "r1w" | "r1m" | "r3m" | "r6m" | "r1y">> = {
  "1w": "r1w",
  "1m": "r1m",
  "3m": "r3m",
  "6m": "r6m",
  "1y": "r1y",
};
```
> 타입 유니온에 `"r1w"` 추가 + `"1w": "r1w"` 매핑. 이제 ETF 탭 1주일 = r1w로 정렬·표시. `rows`/`rowVal`은 PERF_FIELD를 그대로 참조해 자동 반영.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add app/api/yahoo/etf-performance/route.ts components/home-v6/HomeEtfRanking.tsx && git commit -m "fix(v7): ETF 1주일(r1w) 데이터 메움 — etf-performance + HomeEtfRanking 매핑 (STEP 252)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **ETF 탭 '1주일'** → '—' 대신 실제 수익률(정렬도)
- [ ] **/market 통합 '1주일'** → ETF가 빠지지 않고 주식·리츠와 함께 표시
- [ ] 다른 기간(1개월~1년)·주식·리츠 그대로
- ⚠️ 하드 새로고침(첫 로드 yahoo 재계산, 이후 30분 캐시).

## 주의·예상 이슈
- etf-performance 캐시(30분) 때문에 반영이 다음 캐시 만료 후일 수 있음 — 서버 재시작하면 즉시.
- **문서 TODO**(다음 갱신): STEP 248~252.

---
> STEP 252 = ETF 1주일(r1w) 메움. 전제 STEP 251.
> 남음: ETN·펀드 = 외부 소스(KRX ETN 구독 / KOFIA) 필요.
