# STEP 872 — driver 1 판정 근거 확정: 원본 저장 + 마지막 측정 1건 (코드 0줄)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_872_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `6d6930c`(STEP 871 · `main`·`revdcf-preview` 동일) · tsc 0 · test 153/153 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,886

**위치**: 차이 9행 **1행(driver 1)**의 ③판정 근거를 확정한다. 871이 ①②를 쟀고, 872는 **빠진 근거 두 개**를 메운다.

---

## 0. 성격 — 🔴 측정 + 원본 저장 + 문서. 코드 0줄

| # | 금지 |
|---|---|
| 1 | 🔴 `lib/**`·`app/**`·`components/**`·`messages/**` 수정 — **`drivers.ts`를 고치지 말 것** |
| 2 | `revdcf_results`·`us_market_cap` 쓰기 · `data/us_symbols.json` 수정 |
| 3 | 플래그 변경 · 화면 변경 |
| 4 | 🔴 **차이 9행의 2~9행을 손대지 말 것** |
| 5 | 🔴 **③판정 칸을 `채택`/`기각`으로 바꾸지 말 것** — 근거만 채우고 **`대기` 유지**. 승인은 장은태 |

---

## §0. 배경 — 871 이후 Cowork이 B·C축을 채운 결과

871은 ①결과 변화·②커버리지를 쟀지만, **"그래서 어느 쪽이 나은가"의 외부 근거(B 실무·C 반대 증거)가 비어 있었다.** 채운 결과 판단이 뒤집혔다.

**C — 반대 증거**: Chan · Karceski · Lakonishok, *The Level and Persistence of Growth Rates*, Journal of Finance 58(2), 2003 (NBER w8282)

> *"there is **a great deal of persistence in sales growth**"* — 단 이익 성장으로는 이어지지 않는다
> 애널리스트 장기 성장 추정치는 *"**over-optimistic and do poorly in predicting realized growth over longer horizons**"*

🔑 **driver 1은 매출 성장률이다**(이익이 아니다). 논문은 **매출 성장의 지속성은 인정**하고 **애널리스트 장기 전망의 과대·부정확은 부정적으로** 평가한다.

**우리 871 실측이 이와 정합한다**: 컨센서스 교체 시 p95 38.8% → **52.9%**, 30% 초과 종목 48 → **67**. 상단 꼬리가 두꺼워졌다 = 문헌이 말한 과대 편향의 모양. 판정 이동도 `over_cap→years 46` vs `years→over_cap 44`로 **대칭**이라 정보 개선이 아니라 분산 증가에 가깝다.

**B — 실무**: `REVDCF_SPEC.md` §5에 이미 기록돼 있다. New Constructs = **컨센서스 우선 → 과거 평균 수렴 → 51~100년차 3%**(장기 GDP). **단기만 컨센서스, 장기는 앵커.**
🔴 **우리는 이 방식을 쓸 수 없다.** 엔진이 `매출(t) = 매출(t−1) × (1+g)`의 **단일 g**(T8 `Inputs!C6`)이고, 페이드를 넣으면 원전 구조 이탈이다(🚫 창작 금지).

**구조적 문제**: 역DCF는 *시장이 건 기대* 와 *내 기대* 를 견주는 모델인데, **컨센서스는 시장 기대의 대리물**이다. "내 기대" 자리에 넣으면 양변이 수렴해 GAP이 "컨센서스 대 주가"가 된다 — 원전이 풀려던 문제와 다른 문제가 된다.

🔴 **위 넷은 Cowork의 판단 근거다. 이 STEP은 그것을 문서에 고정하고, 빠진 측정 하나를 메운다. 판정 자체는 장은태.**

---

## §1 — 규칙 ⓪: 근거 논문 원본 저장

우리가 이 판단의 C축 근거로 쓰는 문헌이 `data/sources/`에 없다. **인용만 있고 원본이 없는 상태**가 `EXTERNAL_UNIVERSE_QUOTES.md`에서 날조를 만든 그 자리다(866B).

```bash
UA="Trillion Research admin@onetrillion.app"
mkdir -p data/sources/academic
curl -sL -A "$UA" -o data/sources/academic/chan_karceski_lakonishok_2003_growth_persistence.pdf \
  "https://www.nber.org/system/files/working_papers/w8282/w8282.pdf"
ls -la data/sources/academic/
```

받은 뒤 **반드시 검증**해 콘솔에 출력한다:
- 파일 크기 · 본문에서 `persistence in sales growth` · `over-optimistic` 문자열이 실제로 있는지
- 🔴 **없으면 인용을 쓰지 말고 그 사실을 보고**한다(추측 금지)

`data/sources/README.md`에 등재: 저자·연도·발행처(NBER working paper w8282 / JF 2003)·**이 논문을 무엇에 쓰는지**(driver 1 판정의 C축 근거).

🔴 **함께 확인**: `data/sources/academic/`에 이미 있는 파일이 무엇인지 `ls`로 출력. 이미 있으면 중복 저장하지 말 것.

---

## §2 — 마지막 측정: 둘째 안이 성립하는가

**신규 파일**: `scripts/probe_872_range_check.ts` (측정 전용)

871이 `scenarioLowHighFeasible: 513`을 냈으나, 이건 *"low/high 값을 얻을 수 있다"*는 뜻이지 *"현행 기준값이 그 범위 안에 들어간다"*가 아니다. **둘째 안(기준=과거 CAGR 유지 + 범위=야후 low/high 도입)의 성패를 가르는 유일한 숫자가 이것이다.**

871의 야후 응답을 **재사용**한다(캐시가 있으면 재조회 금지 · 없으면 515종목만 재조회).

```json
docs/probe_872_range.json
{
  "n": 515,
  "hasLowHigh": ?,
  "baseInsideRange": ?,          // 과거 CAGR ∈ [low성장률, high성장률]
  "baseBelowLow": ?,
  "baseAboveHigh": ?,
  "pctInside": ?,
  "bySignFlip": { "flipped": ?, "flippedInside": ? },   // 871의 부호반전 55사가 특히 어떤지
  "medianRangeWidthPct": ?,       // (high−low) 성장률 폭 중앙
  "note": "야후 low/high는 애널리스트 분산(+1y)이고 원전의 low 시나리오는 서사적 가정이다 — 같은 물건이 아님을 전제로 한 측정."
}
```

🔴 **`baseInsideRange` 비율이 낮으면 둘째 안은 성립하지 않는다**(기준값이 자기 범위 밖에 표시된다). **그 사실만 적고 채택 여부는 쓰지 말 것.**

---

## §3 — 진행표 1행 + 차이 원장

### 3-1. `docs/LENS_COMPLETION_STANDARD.md` 차이 9행 진행표 **1행만**

| 칸 | 채울 것 |
|---|---|
| ①결과 변화 | 871: 성장률 p50 9.48%→8.96% · **p95 38.8%→52.9%** · GAP 중앙 11→9 · **판정 이동 197/515(38.3%)·대칭** · 부호반전 55 |
| ②커버리지 손실 | 871: 야후 +1y **515/515(100%)** · **+5y 0** · 8-K 금액추출 156/515(30.3%) · Value Line·Morningstar = 유료·미측정 |
| ③판정 | 🔴 **`대기` 유지** — 단 아래 근거를 각주로 단다 |

**③ 각주로 달 내용**(판정이 아니라 근거):
> 🔴 **Cowork 권고 = 교체하지 않음**(2026-08-02 · 승인 대기).
> 근거: ⓐ CKL 2003 — 매출 성장은 지속성 있음 / 애널리스트 장기 성장 전망은 과대·부정확 ⓑ 871 실측이 그 편향과 정합(p95 상승·대칭 이동) ⓒ 야후는 **+1y까지만**이라 원전의 "지속 가능한 단일 성장률" 지평과 불일치 ⓓ NC의 컨센서스+페이드는 **단일 g 엔진에서 불가**(원전 이탈) ⓔ 컨센서스를 "내 기대"에 넣으면 시장 기대와 수렴해 모델의 비교 구조가 약해짐.
> 🔴 **이 권고는 현행 추정기를 승인하지 않는다** — `drivers.ts:163`은 5년 중 **끝점 2개만** 쓴다. CKL이 지지한 것은 "매출 성장의 지속성"이지 "끝점 CAGR"이 아니다. **별도 항목(§3-3)으로 남긴다.**

### 3-2. `docs/REVDCF_SPEC.md` 차이 원장 — driver 1 행 보강

원전이 요구하는 것(앞을 보는 기대)과 우리가 하는 것(과거 매출 CAGR)의 차이를 **그대로 적고**, 위 ⓐ~ⓔ를 근거로 병기한다.
🔴 **"원전이 틀렸다"고 쓰지 말 것.** 원전은 사람이 판단을 넣는 모델이고 우리는 자동이라 그 자리를 채울 재료가 다르다 — **그 사실만** 적는다.
🔴 §11 실측 원장에 871·872 수치를 날짜·출처와 함께 추가.

### 3-3. `docs/REVDCF_SPEC.md` §10 미결 — 신규 2건

- 🔴 **현행 매출성장 추정기가 끝점 2개(`drivers.ts:163`)** — 5년 중 중간 3년 미사용. 한 해 이상치가 전체를 흔든다. **CKL은 지속성을 지지했지 이 추정기를 지지하지 않았다.** 대안(회귀기울기·중앙값 성장·이상치 제거) 미측정
- 🔴 **원전의 "범위"를 우리가 어떻게 만들 것인가** — 야후 low/high는 **애널리스트 분산**이고 원전의 low 시나리오는 **서사적 가정**이라 같은 물건이 아니다. §2 측정 결과에 따라 재검토

### 3-4. `docs/STATE.md`

"▶ 다음"의 1번(차이 9행 판정) 아래에 **driver 1 = 근거 확정·승인 대기**를 한 줄로. 🔴 **2행(driver 3)으로 넘어가라고 쓰지 말 것.**

---

## §4 — 검증

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/us_symbols.json   # 🔴 출력 없어야 함
```

```sql
select as_of, count(*) from revdcf_results group by as_of order by as_of desc;  -- 604 ×3
select count(*) from us_market_cap;                                             -- 5,886
```

🔴 `data/sources/academic/`는 신규 파일이 생기므로 위 diff 대상에서 제외된다(정상).

```bash
git add scripts/probe_872_range_check.ts docs/probe_872_range.json \
        data/sources/academic/ data/sources/README.md \
        docs/LENS_COMPLETION_STANDARD.md docs/REVDCF_SPEC.md \
        docs/STATE.md docs/CHANGELOG.md docs/STEP_872_COMMAND.md
git commit -m "STEP 872: record the evidence for driver 1 and test whether a range-only option is even coherent

- save Chan/Karceski/Lakonishok (2003) as a primary source before citing it; sales growth
  persists, analysts' long-horizon growth forecasts are over-optimistic and inaccurate
- our own 871 numbers match that bias: p95 rose 38.8 to 52.9 percent and verdict migration
  was symmetric, which reads as added variance rather than added information
- measure whether the current base growth actually falls inside Yahoo's low/high band; a
  range-only option is incoherent if the base sits outside its own range
- fill row 1 of the divergence table and attach the reasoning; the verdict stays pending
- log two open items: the endpoint-only CAGR estimator, and what a scenario range should be
- measurement and documents only; no engine change, flag unchanged"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§1 원본: CKL PDF 저장 ? bytes · 문자열 검증 ? · academic/ 기존 파일 ?
§2 범위: hasLowHigh ? · baseInsideRange ? (?%) · below ? / above ? · 부호반전 55 중 inside ?
        · 범위폭 중앙 ?
§3 진행표 1행 채움 · ③ = 대기 유지 확인 · 차이 원장 · §10 미결 2건 · STATE 1줄
무변경: revdcf_results 604×3 · us_market_cap 5,886 · lib/app/components/messages diff 없음
tsc 0 · test ?/? · push ?
🔴 못 한 것 · 미측정
```

🔴 **채택 여부를 쓰지 말 것. driver 3 착수를 제안하지 말 것.** 판정은 장은태가 한다.
