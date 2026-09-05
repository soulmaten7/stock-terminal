# STEP 867 — 유니버스 확정(조달 범위) + 차이 원장 기재 + push (문서 전용 · 코드 0)

**실행 명령어** (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

```
@docs/STEP_867_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `57b3c84`(STEP 866D) · **로컬 4커밋 ahead 미푸시** · tsc 0 · vitest 151/151 · `REVDCF_ENABLED` OFF · `revdcf_results` 604×3 · `us_market_cap` 5,886

**장은태 승인**: 2026-08-02. 866~866D 실측 + FTSE Russell 1차 문서 확보 후 **유니버스를 거래소 상장으로 확정**하되 **"컷"이 아니라 "조달 범위"로 기록**하기로 결정.

---

## 🔴 이 STEP의 성격 — 재는 게 아니라 적는 것

코드 0줄 · DB 0행 · 화면 0 · 플래그 OFF 유지. **문서 정본 갱신 + push**가 전부다.

| # | 금지 |
|---|---|
| 1 | `lib/**`·`app/**`·`scripts/**` 수정 · `data/us_symbols.json` 수정 |
| 2 | `revdcf_results`·`us_market_cap` 쓰기 |
| 3 | 플래그 변경 · 화면 변경 |
| 4 | 🔴 **거래소 조건을 "컷"·"필터"·"스크린"이라 쓰지 말 것** — **"조달 범위"**로만 |
| 5 | 🔴 **Russell의 최저 주가 $1 · 최저 시총 $30M · float 5%를 채택하지 말 것** — 인용은 하되 **미채택**으로 명시 |
| 6 | 🔴 **FALR ≥ 0.75을 되살리지 말 것** · **OTC 티어 기준(OTCQX만 등)을 쓰지 말 것** |

**🔴 4번이 이 STEP의 핵심이다.** FALR는 *"S&P 기준"*(지수 편입 기준)을 빌려와 **컷이라 부른 것**이 무너진 원인이었다. Russell 규칙도 **지수 편입 기준**이다. 같은 실수를 반복하지 않으려면 **우리가 하는 일의 이름을 정확히 붙여야 한다** — 우리는 종목을 판단에서 **배제**하는 게 아니라, 애초에 **데이터를 조달하는 범위**를 정하는 것이다.

**🔴 5번**: Russell 3기준이 우리 3,354에서 몇 개를 자르는지 **안 쟀다.** 안 재고 채택하면 FALR 3회차다.

---

## 1단계 — `docs/REVDCF_SPEC.md`

### (1) A-9에 **④ 확정 (2026-08-02 · 장은태)** 절 신설

기존 `③ 확정 사항` 다음에 아래를 넣는다. 🔴 **③의 4개 항목은 지우지 말 것**(이력 보존).

> **④ 🔴 유니버스 확정 — "조달 범위 = 거래소 상장" (2026-08-02 · 장은태 승인 · 866~866D 실측 후)**
>
> **확정**: 역DCF 모집단의 **조달 범위 = 미국 거래소 상장**(NYSE · NYSE American · NYSE Arca · Nasdaq · CBOE). OTC는 **조달하지 않는다.**
>
> 🔴 **이것은 "컷"이 아니다.** 종목을 판단에서 배제하는 규칙이 아니라, **데이터를 어디까지 받아올지**의 범위다. 판정 기준과 섞어 쓰지 않는다. (FALR가 지수 편입 기준을 빌려와 "컷"이라 부르다 무너진 전례 · §9)
>
> **근거 1 — 실측이 비용을 보여줬다** (866C·866D)
>
> | | 866B(OTC 제외 상태) | 866C(OTC 포함) |
> |---|---|---|
> | 산출 (a) | 364 | **372** (+8) |
> | 산출률 | 10.9% | **11.1%** |
> | GAP 중앙 | 8년 | **8년 불변** |
> | 판정불가 (b) | 1,688 | 1,813 (+125) |
> | micro 버킷 산출률 | 3.3% | **2.7%** (하락) |
>
> → OTC 486사를 넣어 **얻는 것은 종목 8개**이고, 분포는 움직이지 않으며, micro 구간 산출률은 **떨어진다.**
>
> **근거 2 — 이유를 서술한 1차 출처** (FTSE Russell, *Russell US Indexes Construction and Methodology*, 2026-07)
>
> > §5.6.1 *"Bulletin board, pink sheet or over the counter (OTC) traded securities are **not eligible** for inclusion, including securities for which prices are displayed on the FINRA ADF."*
> > §5.7.1 적격 거래소 = CBOE · NYSE · NYSE American · NYSE Arca · Nasdaq. 판단 기준 = *"closing mechanism, **availability of real-time prices**, regulatory requirements for each exchange segment, settlement, trading rules and recognition of the exchange by the governing regulatory body."*
>
> 🔑 ***"availability of real-time prices"* 가 우리 구조와 직결된다.** 우리는 `sharePrice = marketCap ÷ shares`로 역산하고, 야후의 OTC 시세는 **15분 지연**이다(야후 공식 거래소 목록). 가격 신뢰도가 곧 밸류에이션 신뢰도인 모델에서 이건 남의 문제가 아니다.
>
> 🔴 **단, Russell 규칙은 "지수 편입" 기준이다.** 우리는 이 규칙을 **채택**하는 게 아니라, **거래소 상장 여부를 조달 경계로 삼는 이유의 선례**로 인용한다. Russell의 **최저 주가 $1.00(§5.8.1) · 최저 시총 $30M(§5.9.1) · float 5%(§5.10.1)는 채택하지 않는다** — 우리 3,354에서 몇 개를 자르는지 **안 쟀기 때문이다.** 별도 항목으로 잰 뒤에 판단한다(§10).
>
> **근거 3 — 제품 구조** (A-5 두 유니버스 병존)
> `data/us_symbols.json`(6,766)이 7렌즈·보드·탐색을 전부 굴리고 **OTC는 0개**다(866C 실측). 역DCF에만 OTC를 넣으면 *"역DCF는 되는데 렌즈가 없고 보드에서 찾을 수도 없는 종목"*이 생긴다 — A-5 문제의 **반대 방향 재발**.
>
> **🔴 반대 입장 병기 (기각하지 않고 남긴다)**
> Damodaran은 **거래소를 묻지 않는다**: *"To reduce this sampling bias, I include **all publicly traded companies that have a market price that exceeds zero** in my sample, yielding a total sample size of 48,156."* 우리가 그의 업종·베타·세율 데이터를 쓰면서 유니버스 원칙은 따르지 않는다는 사실을 **기록으로 남긴다.**
> 🔴 **판단이 뒤집힐 조건**: Russell 규칙을 "지수 편입용이지 밸류에이션 유니버스용이 아니다"로 본다면 남는 근거는 Damodaran(포함)뿐이고 결론은 반대가 된다.
>
> **외부 4주체 (2026-08-02 라이브 확인)**
>
> | 주체 | OTC | 이유 서술 |
> |---|---|---|
> | **FTSE Russell** | **명시 제외**(§5.6.1) | ✅ 있음 — 종가 메커니즘·실시간 가격·규제·결제·거래규칙 |
> | New Constructs | 지수 사다리가 R3000에서 끝나므로 **결과적 제외** | **자체 서술 없음 — Russell 규칙에 얹혀 있다** |
> | Morningstar Quant | 거래소 무관 · 유동성 하한만(현지통화 5,000/일) | 모델 부정확·편향 완화 |
> | **Damodaran** | **포함** | 표본 편향 방지 |
>
> 🔴 **정정**: 앞서 *"NC는 OTC 제외 이유를 안 밝힌다"* 고 기록했으나(866B), NC는 R3000에 얹혀 있고 **그 이유는 Russell 문서에 있다.** 정확한 표현은 **"NC 자체 서술 없음"**이다.
>
> **미조달 비용 (공개 대상 · 근거 4의 §7 문안)**: OTC **486사** · 그중 시총 확보 가능 **453** · 계산 도달 **133** · GAP 산출 **8**.

### (2) A-2 제외 규칙 표에 행 추가 — 🔴 **"제외" 아니라 "조달 범위"로 구분**

표 아래에 별도 블록으로 넣는다(표 안에 섞지 말 것):

> **🔴 조달 범위 (제외 규칙과 다름)**
>
> | 항목 | 범위 | 판별 | 근거 |
> |---|---|---|---|
> | **상장 거래소** | NYSE · NYSE American · NYSE Arca · Nasdaq · CBOE | SEC `company_tickers_exchange.json`의 `exchange` (보조: `damodaran_industry.exchange`) | A-9 ④ |
>
> 🔴 **위 A-2 표는 "모델 전제가 성립하지 않는 회사"를 빼는 규칙**(금융사·REIT·SPAC·MLP·매출0)이다. **조달 범위는 그것과 성격이 다르다** — 모델은 성립하지만 **우리가 값을 받아오지 않는 영역**이다. 화면에는 **"미조달"로 표시하고 "해당 없음"으로 쓰지 않는다.**

### (3) 원전 대조표 — **추가물 2행 채우기** (§10 미결 36번 소진)

`sensitivity`·`distribution` 2행 옆에 아래 2행을 더한다.

| 항목 | 원전 정의 | 우리 구현 | 차이 | 차이의 영향 |
|---|---|---|---|---|
| `universe` | **없음 — 원전은 단일 종목 분석서**(튜토리얼 전 8편 `universe`·`liquidity`·`volume`·`screening`·`market cap` **0건** · 개봉 확인) | 미국 거래소 상장 · 10-K · 비금융 · 매출>0 · 비MLP → **N=2,857** | 🔴 **우리 추가물** | 원전은 종목 1개를 다룬다. 우리는 분포·백분위를 만들기 위해 모집단이 필요하다. **모집단이 바뀌면 백분위가 전부 바뀐다** |
| `liquidity` | **없음** | 🔴 **없음(미채택)** — FALR ≥ 0.75는 **구현된 적 없고 폐기**(A-4·A-9). Russell의 $1·$30M·float 5%도 **미채택** | 🔴 **우리 추가물이었다가 철회** | 유동성 기준을 **쓰지 않는다**는 사실 자체를 밝힌다 |

### (4) §7(D 산출·표현) — 🔴 **차이 원장 공개 문안** 준비 (노출은 플래그 OFF라 보류)

방법론 문구를 §7에 **문안으로만** 적어 둔다. 🔴 **화면 파일은 건드리지 말 것.**

> **방법론 — 이 모델이 보지 않는 것** (ko)
> 트릴리언의 역DCF는 **미국 거래소(NYSE·나스닥 등) 상장 종목**만 계산합니다. 장외(OTC) 종목 **486곳**은 계산 범위 밖입니다. 그중 값을 구할 수 있었던 곳은 **133곳**, 실제로 연수가 나온 곳은 **8곳**이었습니다.
> 빼는 이유는 **가격입니다.** 이 모델은 주가에서 시장의 기대를 역산하는데, 장외 시세는 실시간이 아니고 거래도 드물어 그 역산의 출발점을 믿기 어렵습니다.
> 🔴 **다른 입장도 있습니다.** 우리가 업종·세율 데이터를 쓰는 다모다란 교수는 표본 편향을 이유로 **장외를 포함해야 한다**고 봅니다. 우리는 그 입장을 알고도 다르게 정했고, 그래서 **얼마나 안 보는지를 숫자로 밝힙니다.**

🔴 **en 문안도 같이 작성**(i18n 패리티). 🔴 **"거래가 적어 신뢰도 낮음" 같은 판정 표현을 쓰지 말 것** — 우리는 재보지 않았다.

### (5) §9 결정 이력 · §10 미결 · §11 실측 원장

- **§9**: `유니버스 = 거래소 상장(조달 범위)` 행 추가 — 채택일 2026-08-02 · 근거 = A-9 ④ · 🔴 *"컷이 아님"* 명시
- **§10 미결**:
  - 36번(대조표 2행) → **소진**
  - 21번(SEC 전수 전환) → **소진**(866 완료 · N=3,354 · 거래소상장 2,857)
  - 18번(FALR) → **폐기 확정**(되살릴 근거 없음)
  - 5번(야후 volume 매핑) → **폐기**(FALR 폐기로 분자 불필요)
  - 🔴 **신규 추가**: *"Russell 3기준($1 · $30M · float 5%)이 우리 2,857에서 몇 개를 자르는지 미측정 — 재기 전에는 채택 금지"*
  - 🔴 **신규 추가**: *"OTC 티어(OTCQX/QB/PINK/OTCID) 라벨 신뢰도 미규명 — PINK 66.0% < OTCID 77.0% 역전(866D)이 야후 라벨 레거시 때문인지 확인 안 됨"*
- **§11 실측 원장**에 866~866D 수치 추가(날짜·출처 병기): 사다리 8,017→3,354 · 3분류 372/1,813/1,169 · 거래소 교차 2,857/486/11 · 티어별 공시형 결격 23.5%(거래소상장)→37.5%(OTCQX)→63.6%(OTCQB)→66.0%(PINK)→77.0%(OTCID) · OTC 시총 중앙 $6.8M

---

## 2단계 — `docs/LENS_COMPLETION_STANDARD.md` 역DCF **4) 컷·분포** 채우기

🔴 **✅로 올리지 말 것.** 근거만 채우고 **판정은 장은태**에게 남긴다. 아래를 적는다:

- **모집단**: 미국 거래소 상장 **N=2,857**(866~866D · 사다리 8,017→3,354→거래소상장 2,857)
- **표본 수**: 산출(a) 364 · 판정불가(b) 1,688 · 입력부족(c) 805
- **컷 유도 여부**: 🔴 **역DCF는 분포 유도 컷을 쓰지 않는다.** 판정은 엔진이 낸 `verdict`(years / over_cap / value_destroying / below_one)에서 직접 나온다. 7렌즈의 `lens_cuts` p30/p70과 **다른 구조**임을 명시
- **유동성 기준**: **없음**(FALR 폐기 · Russell 3기준 미채택)
- **분포 특성**: GAP 중앙 8년(p25/p75 4~15) · 시총 구간별 산출률 mega 44.2% → micro 3.3%(**(a)÷N 기준**) · 🔴 **버킷 분모 두 기준 병기 필수**(866B)
- 🔴 **남은 것**: 원전 관찰 대조가 604 기준(ICC 0.198)과 전수 기준(0.165)에서 다름 — **어느 쪽을 정본으로 볼지 미정**

## 3단계 — `docs/STATE.md` · `docs/CHANGELOG.md`

**STATE**(덮어쓰기 · 배너 쌓기 금지)에 반드시 들어갈 것:

- HEAD 갱신 · **push 완료로 상태 변경**
- 🟢 확립된 것에 **"유니버스 = 거래소 상장(조달 범위) 확정"** 행 추가 · **N=2,857**
- 🔴 열려 있는 것에서 **A층 재개방 → 종료**로 변경. 단 *"A-7의 616/604와 다르다 — 이번엔 모집단을 실측한 뒤의 종료"*를 명시
- DoD 4 = 🔶 유지(근거는 채웠고 **판정 대기**)
- 미측정 목록: Russell 3기준 미측정 · OTC 티어 라벨 신뢰도 · ICC 정본 선택 · skipped 89사 전수 규명

**CHANGELOG**: `## 2026-08-02 (13)` 블록을 **최상단에 추가**(기존 (12)~(1) 보존).

---

## 4단계 — 🔴 push

```bash
npx tsc --noEmit && npx vitest run
git diff --stat HEAD -- lib/ app/ scripts/ data/us_symbols.json     # 출력 없어야 함

git add docs/REVDCF_SPEC.md docs/LENS_COMPLETION_STANDARD.md \
        docs/STATE.md docs/CHANGELOG.md docs/STEP_867_COMMAND.md
git commit -m "STEP 867: fix universe as a sourcing boundary (exchange-listed), record the difference ledger

- universe sourcing boundary = US exchange listed (NYSE/NYSE American/NYSE Arca/Nasdaq/CBOE), N=2,857
- framed as sourcing scope, NOT a cut: it is where we fetch data, not a judgment filter
- grounds: measured cost (OTC adds 8 computed names, distribution unchanged, micro yield falls),
  FTSE Russell 5.6.1/5.7.1 as the only primary source that states a reason, and product structure (A-5)
- Russell price/mcap/float thresholds cited but NOT adopted (unmeasured against our 2,857)
- Damodaran's opposing position recorded verbatim, not dismissed
- correction: New Constructs has no OTC rule of its own; it inherits Russell's
- fill primary-source comparison table rows: universe, liquidity
- draft public methodology copy (ko/en) disclosing what we do not cover
- no code, no DB writes, flag unchanged"

git push
```

🔴 **push 전 반드시 확인**: `git log --oneline origin/main..HEAD` 로 올라갈 커밋이 **5개**(`f3eec0f`·`52db062`·`f547d72`·`57b3c84`·867)인지 보고, **그 외 커밋이 섞여 있으면 멈추고 보고**한다.
🔴 **push 후**: Vercel이 자동 배포되더라도 **프로덕션 코드 diff 0 · 플래그 OFF**이므로 화면은 무변화여야 한다. 배포 후 `/` 200 · 역DCF 라우트 **404 유지**를 확인해 보고한다.

## 5단계 — 멈춘다

**보고 형식**:

```
SPEC: A-9 ④ 신설 · A-2 조달범위 블록 · 대조표 추가물 2행 · §7 문안 ko/en · §9/§10/§11 갱신
LENS_COMPLETION_STANDARD: 역DCF 4) 컷·분포 근거 채움 (✅ 상향 안 함)
STATE/CHANGELOG: 갱신
push: 커밋 ?개 (f3eec0f·52db062·f547d72·57b3c84·867) · origin/main 반영 확인
배포 후: / 200 · 역DCF 라우트 404 유지 · 플래그 OFF
tsc 0 · vitest ?/? · lib/app/scripts/us_symbols.json diff 없음
```

DoD 4를 ✅로 올릴지, Russell 3기준을 잴지에 **의견을 쓰지 말 것.** 판정은 장은태가 한다.
