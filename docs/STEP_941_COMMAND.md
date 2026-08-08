<!-- 2026-08-08 · Cowork 작성 · Claude Code 실행용 -->

# STEP 941 — Q0 구현 ③-3단계: **3번째 출처(야후) 취득 ＋ 조합별 정확도 실측**

> **범위**: 야후 `assetProfile`로 섹터 취득·적재 ＋ **세 출처 조합별 정확도 채점** ＋ 미분류 70건 재분류 가능성 실측.
> 🔴 **`resolveSector`의 합의 규칙은 이 STEP에서 바꾸지 않는다** — 조합을 어떻게 정할지는 **실측 결과를 보고 장은태가 판정**한다(942).
> 🔴 **화면(⑤)·섹터 컷(④)도 이 STEP에 없다.**

---

## 🔴 이 STEP이 생긴 이유 — 940이 목적의 절반만 달성했다

**미분류 70건 중 65건(93%)이 원래 미매핑 219 출신**이고, 그 안에 **Q0을 시작하게 만든 바로 그 종목들**이 있다.

```
ASML  BABA  SONY  TM(도요타)  BHP  UL  NGG  STLA  RACE  NIO
TCOM  PDD   RELX  TRI  GIB  EPD  ET  TRP  WES  HMC  BTI ...
```

커버리지는 78.6% → **93.1%**로 올랐으나, *"Health Care에 AZN이 없고 IT에 ASML이 없다"*는 **원래 문제가 남았다.** 이들은 **나스닥과 SEC SIC가 불일치**해 2-of-2 합의가 성립하지 않은 종목이다.

🔴 **동시에 3순위(consensus) 137건의 정확도는 사실상 미검증**이다 — 채점 표본이 **3건**뿐이고, 이는 구조적이다(정답지 SPDR은 S&P 500이라 외국기업과 원리적으로 겹치지 않는다).

**두 문제가 같은 해법을 가리킨다 — 2-of-2가 갈릴 때 깨줄 세 번째 출처.**

---

## ⓪-4 4×3 기록

### ③ 자체 데이터 확인 — 🔑 **여기서 답이 나왔다**

| # | 열어본 것 | 결과 |
|:--:|---|---|
| 1 | `ls app/api/yahoo/` | 야후 라우트 **11개** 이미 운영 중 |
| 2 | `app/api/etf-holdings/route.ts:87` | 🔑 **`yahoo-finance2`(`yf.quoteSummary`)가 이미 프로젝트에 있다** |
| 3 | `app/[locale]/stock/[symbol]/EtfLensClient.tsx:43` | ETF 화면이 **이미 야후 섹터 어휘**를 쓴다(`technology`·`consumer_cyclical`·`basic_materials`) — §7 ⓕ의 그 충돌 |
| 4 | `docs/probe_940_sector_resolve.json` | 미분류 70건 전건 목록 · 출처별 건수 |

### ① 3번 검색 ＋ ⓪-5-B (**실제 수행함**)

```
필요한 데이터 : 미국 상장 전 종목(ADR 포함)의 섹터 — 나스닥·SEC SIC와 독립인 3번째 출처, 무료
link_hub 후보 : analysis(Stock Analysis · GuruFocus · Macrotrends) · chart(Finviz · TradingView)
                research(Morningstar) · etf(iShares 글로벌 섹터 ETF)
실제 조회     : 🔴 Stock Analysis  — 스크리너 API 4개 형태 전부 404
                🔴 iShares         — holdings CSV가 HTML 반환(차단, 939에서도 동일)
                🟢 야후            — 자체 인벤토리에서 발견(라이브러리 기보유)
직접 웹검색   : 미실시 (자체 인벤토리에서 해결)
```

🔑 **⓪-5가 작동한 사례**: 밖에서 세 곳을 뒤졌으나 전부 막혔고, **안에 이미 있었다.**

### ② 3번 검증 — 야후 실측 (Cowork · 18종목 표본)

| 종목 | 야후 | 진짜 GICS | |
|---|---|---|:--:|
| ASML | Technology | Information Technology | ✅ |
| BABA·TM·STLA·RACE·NIO·TCOM | Consumer Cyclical | Consumer Discretionary | ✅ |
| UL | Consumer Defensive | Consumer Staples | ✅ |
| NGG | Utilities | Utilities | ✅ |
| BHP | Basic Materials | Materials | ✅ |
| **EPD** | Energy | Energy | ✅ (🔑 나스닥은 Utilities로 오답) |
| **GIB** | Technology | Information Technology | ✅ (🔑 나스닥·SIC **둘 다** 오답이던 자리) |
| TRI·RELX | Industrials | Industrials | ✅ |
| GOOG | Communication Services | Communication Services | ✅ |
| ARCC | Financial Services | Financials | ✅ |
| 🔴 **SONY** | Technology | **Consumer Discretionary** | ❌ |

**17 / 18.** 🔴 표본 18건이라 **정확도가 아니라 「가능성 확인」**이다 — 이 STEP이 전수로 잰다.

🔑 **야후 11분류는 GICS 11과 1:1 대응한다**(나스닥 12분류는 `Communication Services`가 없고 `Miscellaneous`가 있어 손실이 났다).

### ④ 3번 검수 (자기 공격)

1. 🔴 **야후 의존이 이미 구조적이다** — `us_market_cap`도 야후 계열이고 STEP 937의 `retryNoCapField:400`도 야후였다. 섹터는 정적 데이터라 위험이 낮지만, **또 하나의 야후 의존을 추가한다는 사실을 문서에 명시**할 것.
2. 🔴 **1,021회 호출이 필요하다** — 레이트리밋·부분 실패를 반드시 계측하고, 실패분을 `null`로 두되 **건수를 보고**할 것. 🔴 재시도를 무한정 돌리지 말 것.
3. 🔴 **야후가 이기는 규칙으로 바꾸고 싶어질 것이다.** 이 STEP은 **재료만 만든다.** 🔴 `resolveSector` 수정 금지.

---

## 실행 지시

### 1. 야후 → GICS 대응표 (11:1 대응 · 확정)

```
Technology             → Information Technology
Financial Services     → Financials
Consumer Cyclical      → Consumer Discretionary
Consumer Defensive     → Consumer Staples
Basic Materials        → Materials
Healthcare             → Health Care
Communication Services → Communication Services
Industrials            → Industrials
Energy                 → Energy
Utilities              → Utilities
Real Estate            → Real Estate

🔴 이 11개 밖의 값이 나오면 매핑하지 말고 원문 그대로 보존 + 건수·값을 보고할 것.
   (임의로 끼워 맞추지 말 것 — 940의 형제 오매칭이 그렇게 생겼다)
```

### 2. 테이블 신설 ＋ 취득·적재

```
us_sector_yahoo   as_of(date) · symbol · sector_raw(야후 원문) · sector(GICS 매핑값) · industry · country
                  PK (as_of, symbol) · as_of = 취득일
                  🔴 RLS는 us_sector_nasdaq과 동일 패턴

취득 대상 : lens_scores US 전 종목 (1,021)
라이브러리: 이미 있는 yahoo-finance2 사용 (새로 설치하지 말 것)
           🔴 v3 이상은 `new YahooFinance({suppressNotices:['yahooSurvey']})` 인스턴스 생성 필요
모듈     : assetProfile
🔴 동시성·간격은 기존 야후 라우트 관행을 따르고, 실패 건수·사유를 집계해 보고할 것
```

### 3. 실측 리포트 (`scripts/probe_941_third_source.ts` → `docs/probe_941_third_source.json`)

1. **취득 결과** — 성공/실패 건수 · 실패 사유 분해 · 🔴 **매핑표 밖 `sector_raw` 값과 건수**
2. 🔑 **야후 단독 정확도** — SPDR 정답지(503) 대비. **이게 이 STEP의 핵심 숫자다**
3. 🔑 **세 출처 조합별 정확도** — 같은 정답지로 전부 채점하고 **표를 낼 것**

| 조합 | 무엇 |
|---|---|
| 나스닥 단독 | |
| SEC SIC 단독 | |
| 야후 단독 | |
| 나스닥 ∩ SIC (현행 3순위) | 합의 시 정확도 · **합의 실패 건수** |
| **2-of-3 다수결** | 정확도 · **결정 불가(3개 전부 갈림) 건수** |
| 3-of-3 만장일치 | 정확도 · 커버리지 |

4. 🔑 **미분류 70건 재분류 시뮬레이션** — 위 각 조합을 적용하면 **70건 중 몇 건이 붙는가**. 🔴 **붙는 종목 목록과 그때의 섹터를 전건 출력**(장은태가 눈으로 검산할 재료)
5. **섹터별 종목 수** — 각 조합에서 하위 섹터가 몇 개까지 올라오는지(④단계 입력)
6. 🔴 **세 출처가 모두 갈리는 종목 전건 목록** — 각 출처가 뭐라고 했는지 나란히

**Cowork 사전 관측(대조용 · 🔴 맞추려 하지 말 것)**

- 야후 단독 표본 정확도 **17/18** (SONY만 오답) — 전수로는 달라질 것
- 나스닥·SIC 불일치 **56건**(219 기준 실측) 중 상당수가 미분류 70건과 겹침
- 🔴 STEP 939·940에서 **Cowork의 사전 추정이 두 번 다 빗나갔다**(490/488→494/492 · 형제 ~10→35→5). **실측이 이긴다.**

### 4. 문서

- `docs/CHANGELOG.md` **(98) STEP 941** — 조합별 정확도 표를 **수치 그대로** 등재
- `docs/STATE.md` ▶다음 0번 ③단계 상태 갱신 · **942 판정 대기 항목 명시**
- `lib/revdcf/registry.ts` — 야후 `assetProfile` 좌표 ＋ 테이블명 등재 · 🔴 **"야후 의존 추가" 명시**
- `data/sources/README.md` — 야후 절 추가(API라 파일 원본 없음 → **좌표만**)
- `docs/STEP_LEDGER.md` 등재

🔴 **`CLAUDE.md` · `docs/USER_QUESTIONS_2026-08-08.md` · `docs/LENS_COMPLETION_STANDARD.md`는 고치지 않는다.**

---

## 🔴 금지 (전부 불변)

- **`lib/sector.ts` — 수정 금지.** 합의 규칙 변경은 942
- 화면·UI 코드 — 손대지 않는다
- 기존 테이블 수정·삭제 금지 (신규 1개만)
- `revdcf_results` · `us_market_cap` · `lens_scores` · `lens_cuts` — **쓰기 금지**
- `REVDCF_ENABLED` · `data/us_symbols.json` · `.github/workflows/**` · `vercel.json` — 불변
- 크론 수동 실행 — **금지**(특히 `email-brief`)
- `probe_*` 기존 파일 — 불변
- KR 관련(`ACTIVE_MARKETS` · KR 크론 3개 · `messages/ko.json` · `messages.test.ts` 패리티) — **끄지 않는다**
- 🔴 **API 키·비밀번호를 어떤 필드에도 입력하지 않는다**

## 성공 기준

1. `us_sector_yahoo` 적재 · **취득 성공률 보고**(실패분은 `null`로 두고 건수 명시)
2. 🔑 **조합별 정확도 표 산출** — 6개 조합 전부
3. 🔑 **미분류 70건 재분류 시뮬레이션** — 조합별 회수 건수 ＋ **전건 목록**
4. `npm test` · `npx tsc --noEmit` 통과 · **`lib/sector.ts` diff 0**
5. 금지 경로 diff 0

## 🔴 막히면

**추측해서 진행하지 말고 멈추고 보고할 것.** 특히 ① 야후 취득 성공률 90% 미만 ② 매핑표 밖 값이 다수 ③ 야후 단독 정확도가 나스닥·SIC보다 낮음 — 이 셋은 **반드시 멈추고 보고**한다(③은 실패가 아니라 **중요한 발견**이다).
