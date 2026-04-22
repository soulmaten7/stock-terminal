# STEP 75 — Section 1 TODO 3개 보강: 배당수익률 + DART 재무상태·현금흐름 + US SEC 공시

**실행 명령어 (Sonnet 기본, 외부 API 신규 추가 시 🔴 Opus 권장):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** STEP 74 완료 (`015b257`) — Section 1 3컬럼·반응형·persist 완성. Section 1 블록 3개에 TODO 잔존.

**목표:**
STEP 72·73 보고에서 "없음/TODO" 로 남긴 3개 데이터 보강.
1. **배당수익률** (SnapshotHeader + OverviewTab 투자지표)
2. **DART 재무상태표 + 현금흐름표** (FinancialsTab)
3. **US SEC 공시** (DisclosuresTab)

**범위 원칙:**
- 기존 API 라우트 **확장 우선**, 신규 라우트 **최후**.
- 외부 API 무료 티어 한도 내에서 구현. 유료 API 사용 금지.
- 각 작업은 독립적 — 하나 실패해도 나머지 진행 가능. 실패 블록은 TODO 유지하고 계속.

---

## 작업 0 — 기존 API 전수 조사

```bash
# 1) 기존 API 라우트 위치와 구조
ls app/api/stocks/
ls app/api/kis/ 2>/dev/null

# 2) 각 라우트의 응답 필드 확인
grep -l "NextResponse" app/api/stocks/**/*.ts 2>/dev/null
grep -l "NextResponse" app/api/kis/**/*.ts 2>/dev/null

# 3) 배당수익률 관련 필드 검색
grep -rn "dividendYield\|divi_rate\|dividend\|배당" app/api/ lib/ --include="*.ts" 2>/dev/null | head -20

# 4) DART / SEC 관련 코드 검색
grep -rn "dart\|DART\|opendart\|SEC\|EDGAR\|sec.gov" app/api/ lib/ --include="*.ts" 2>/dev/null | head -20

# 5) .env.local 에 등록된 외부 API 키
grep -E "DART|SEC|KIS|EDGAR" .env.local 2>/dev/null | sed 's/=.*/=***/' | head -10
```

**보고 내용:**
- `app/api/stocks/`, `app/api/kis/` 내 라우트 목록과 각 주요 응답 필드
- 배당수익률을 이미 제공하는 라우트가 있는지 여부
- DART 연동 여부 (있으면 어떤 엔드포인트 사용 중인지)
- SEC EDGAR 연동 여부
- 사용 가능한 외부 API 키 (이름만, 값은 마스킹)

---

## 작업 1 — 배당수익률 연결

**우선순위 분기:**

### Case 1-A: 기존 `/api/kis/price` 응답에 이미 배당 필드가 있음
→ 프론트엔드에서 읽기만 추가. `SnapshotHeader`, `OverviewTab` 의 `--` 를 실제 값으로 치환.

### Case 1-B: KIS API 호출에 배당 필드가 누락됨
→ KIS Open API 시세 호출 시 `stck_dryy_divi_rate` 또는 `divi_yield_ratio` 필드를 응답 매핑에 추가. 기존 `/api/kis/price/route.ts` 수정.

참고 포맷:
```ts
// 기존 응답 예시에 추가
return NextResponse.json({
  ...existingFields,
  dividendYield: parseFloat(raw.stck_dryy_divi_rate ?? '0') || null,
});
```

### Case 1-C: KIS API 응답에도 배당이 없음
→ 이번 STEP 에서는 **TODO 유지**. 별도 외부 API(네이버 금융 크롤링 / FinancialModelingPrep 등)는 라이선스·합법성 검토 필요하므로 새 STEP 로 분리.

**표시 포맷:**
- `2.34%` 소수 둘째 자리
- `null` 또는 `0` → `—`
- `SnapshotHeader` dl 그리드의 `배당수익률` 자리 + `OverviewTab` 블록 1의 `배당수익률` 자리, 두 곳 동시 갱신

---

## 작업 2 — DART 재무상태표 + 현금흐름표

**조사 기준:**
- `/api/stocks/earnings` 가 이미 DART `fnlttSinglAcntAll.json` 을 호출하고 있는지 확인 (한 번 호출로 BS·IS·CF 전체 반환하는 엔드포인트)
- 이미 호출 중이면 응답에서 BS·CF 필드를 추가로 뽑아내는 매핑만 확장

### Case 2-A: 기존 earnings API가 `fnlttSinglAcntAll` 사용 중
→ `app/api/stocks/earnings/route.ts` 의 응답 매핑 확장:

```ts
// 기존: 손익만 반환
// 확장: 재무상태 + 현금흐름 추가
type EarningsResponse = {
  periods: string[];
  incomeStatement: { revenue: number[]; operatingIncome: number[]; netIncome: number[]; eps: number[] };
  balanceSheet:    { totalAssets: number[]; totalLiabilities: number[]; totalEquity: number[] };
  cashFlow:        { operating: number[]; investing: number[]; financing: number[] };
};
```

DART 계정과목 매핑 (참고):
- 자산총계: `ifrs-full_Assets` 또는 `account_nm="자산총계"`
- 부채총계: `ifrs-full_Liabilities` 또는 `account_nm="부채총계"`
- 자본총계: `ifrs-full_Equity` 또는 `account_nm="자본총계"`
- 영업활동 현금흐름: `account_nm="영업활동으로 인한 현금흐름"`
- 투자활동: `account_nm="투자활동으로 인한 현금흐름"`
- 재무활동: `account_nm="재무활동으로 인한 현금흐름"`

### Case 2-B: 기존 earnings API 가 다른 엔드포인트(`fnlttSinglAcnt` 등)를 쓰거나 손익만 받아옴
→ 엔드포인트를 `fnlttSinglAcntAll.json` 으로 바꾸거나, 별도 호출 추가. `.env.local` 의 `DART_API_KEY` 활용.

### Case 2-C: DART 연동이 아예 없음
→ TODO 유지. 별도 STEP 에서 DART API 키 세팅부터 진행.

**프론트엔드 갱신:**
`components/dashboard/tabs/FinancialsTab.tsx` 의 재무상태표·현금흐름표 섹션의 `'--'` placeholder 를 API 응답으로 치환. 금액 포매터 (`억`/`조`) 유틸 활용.

---

## 작업 3 — US SEC 공시

**조사 기준:**
- `/api/stocks/disclosures` 가 market 파라미터를 받아 KR=DART, US=SEC 분기하고 있는지 확인
- US 분기가 없으면 SEC EDGAR submissions 엔드포인트로 신규 추가

### Case 3-A: 이미 SEC 분기가 있지만 비활성화/스텁 상태
→ 스텁 제거하고 실제 SEC EDGAR 호출 연결.

### Case 3-B: SEC 분기 자체가 없음
→ `disclosures/route.ts` 에 `market === 'US'` 분기 추가. SEC EDGAR 공개 API 사용 (무료, 키 불필요):

```
GET https://data.sec.gov/submissions/CIK{10자리 0패딩}.json
```

**필수 요구사항 (SEC EDGAR 정책):**
- User-Agent 헤더 필수: `"StockTerminal research@stockterminal.local"` 형식
- Rate limit: 초당 10회 미만 — 과도한 호출 금지
- CIK 매핑: 티커 → CIK 변환 필요 (`company_tickers.json` 캐싱 권장)

**응답 매핑 (최근 50건 기준):**
```ts
type SecFiling = {
  formType: string;       // '10-K', '10-Q', '8-K' 등
  filedAt: string;        // ISO date
  accessionNumber: string;
  primaryDocument: string;
  url: string;            // https://www.sec.gov/Archives/edgar/data/{cik}/{accession-no-dashes}/{primaryDocument}
};
```

### Case 3-C: 이번 STEP 에서 SEC 구현이 부담스러움
→ TODO 유지 + DisclosuresTab 에 `selected.market === 'US'` 일 때 `"SEC 공시는 STEP 76 에서 연결 예정"` 안내.

**프론트엔드 갱신:**
`components/dashboard/tabs/DisclosuresTab.tsx` 에서 `market` 분기 이미 있음. 실데이터 리스트 렌더 추가.

---

## 작업 4 — 빌드 검증

```bash
npm run build
```

---

## 작업 5 — 문서 4개 갱신

- `CLAUDE.md` 날짜
- `docs/CHANGELOG.md` 상단:
  ```
  - feat(dashboard): Section 1 TODO 보강 — 배당/DART재무상태·현금흐름/SEC공시 (STEP 75)
  ```
- `session-context.md`: STEP 75 완료 블록에 각 작업 성공/실패 + 남은 TODO 명시
- `docs/NEXT_SESSION_START.md`: 다음 = STEP 76 — Section 2 시작 (DASHBOARD_SPEC_V3.md 참조)

---

## 작업 6 — Git commit & push

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(dashboard): Section 1 TODO 보강 (STEP 75)

- 배당수익률: Case <A/B/C> → <결과>
- DART 재무상태표 + 현금흐름표: Case <A/B/C> → <결과>
- US SEC 공시: Case <A/B/C> → <결과>
- FinancialsTab / DisclosuresTab / SnapshotHeader / OverviewTab 갱신

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)" && git push
```

---

## 완료 보고 양식

```
✅ STEP 75 완료

작업 1 (배당수익률): Case <A/B/C> — <설명>
작업 2 (DART 재무상태·현금흐름): Case <A/B/C> — <설명>
작업 3 (US SEC 공시): Case <A/B/C> — <설명>

남은 TODO (있으면):
- <항목> — 사유: <...>

- npm run build: 성공
- 4개 문서 갱신
- git commit: <hash>
- git push: success

다음 STEP 76: <Section 2 시작 or 남은 TODO 외부 API 신규 연동>
```

---

## 주의사항

- **KIS Open API 토큰 만료** — 작업 1에서 price 라우트 수정 시 기존 토큰 캐싱 로직 건드리지 말 것.
- **DART API Rate Limit** — 분당 호출 제한 있음. 동일 종목 재요청 캐싱 필수 (기존 코드에 캐싱 있으면 재활용).
- **SEC EDGAR User-Agent 필수** — 없으면 403 반환. fetch 옵션에 반드시 포함:
  ```ts
  fetch(url, { headers: { 'User-Agent': 'StockTerminal research@stockterminal.local' } })
  ```
- **CIK 매핑 테이블** — SEC 의 `company_tickers.json` 은 약 3MB. 라우트에서 매번 받지 말고 서버 메모리 캐싱 또는 `lib/sec-cik-map.ts` 빌드타임 JSON 로드.
- **외부 API 키 누락 시** — 해당 작업만 스킵 후 TODO 유지. 전체 빌드 실패하지 않도록 `try/catch` + 에러 응답 `{ items: [], error: 'API key missing' }`.
- **3개 작업 독립성** — 하나 실패 시 나머지 2개는 계속. 최종 git commit 에 성공한 것만 반영, 실패한 건 보고서에 명시.
