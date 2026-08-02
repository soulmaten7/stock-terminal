# STEP 873 — 차이 9행 **1행(driver 1) 판정 확정** + 인용 규율 교훈 (문서 전용 · 코드 0줄)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_873_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `db5d452`(STEP 872 · `main`·`revdcf-preview` 동일) · tsc 0 · test 153/153 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,886

**장은태 승인**: 2026-08-02 — driver 1 **교체하지 않음** 승인. 871·872 근거 확정 후.

---

## 0. 성격 — 🔴 문서 전용

| # | 금지 |
|---|---|
| 1 | 🔴 `lib/**`·`app/**`·`components/**`·`messages/**`·`scripts/**`·`data/us_symbols.json` **diff 0** |
| 2 | `revdcf_results`·`us_market_cap` 쓰기 · 플래그 변경 · 화면 변경 |
| 3 | 🔴 **차이 9행의 2~9행을 손대지 말 것** · **driver 3 착수 제안 금지** |
| 4 | 🔴 **`drivers.ts`를 "승인됐으니 좋은 코드"로 서술하지 말 것** — §2-3 참조 |

---

## §1 — 차이 9행 진행표 1행: ③판정 확정

`docs/LENS_COMPLETION_STANDARD.md` 진행표 **1행의 ③칸**을 `🔴 대기` → 아래로 바꾼다.

> **✅ 현행 유지(원전 미채택) — 2026-08-02 장은태 승인**

그리고 기존 각주(ⓐ~ⓔ)를 **아래 확정 문안으로 교체**한다:

> **결정**: driver 1을 원전 절차(가이던스·Value Line·컨센서스)로 **교체하지 않는다.** 현행 SEC 매출 5년 CAGR을 유지한다.
>
> 🔴 **이것은 원전 명세를 지키지 못한다는 사실을 인정하는 결정이다.** 원전 튜토리얼 02의 해당 절은 *"How Do I **Project Future** Sales Growth Rates?"* 이고 제시된 소스가 전부 전망치다. 우리는 과거를 쓴다.
>
> **그럼에도 유지하는 근거**
> 1. **지평 불일치** — 야후 애널리스트 매출 추정은 **+1y까지만**(871: `hasPlus5yField` **0건**). 원전 `T8 Inputs!C6`은 예측 기간 전체에 적용되는 **단일 지속 성장률**이라, 1년치를 넣는 것은 다른 종류의 불일치이지 해소가 아니다.
> 2. **문헌** — Chan·Karceski·Lakonishok 2003(원본 `data/sources/academic/…`): **매출 성장은 지속성이 있고**(5년 지속 실측 6.3% vs 기대 3.1% ≈ 2배), **애널리스트 장기 성장 전망은 과대·예측력 낮음**. 반면 지속성이 없는 것은 **이익** 성장이다(3.6% vs 3.0%).
> 3. **우리 실측이 그 편향과 정합** — 871: 교체 시 p95 38.8%→**52.9%**, 30% 초과 48→**67**. 판정 이동 197/515(38.3%)인데 `over_cap→years 46` vs `years→over_cap 44`로 **대칭** → 정보 증가가 아니라 분산 증가의 모양.
> 4. **두 값은 같은 것을 재지 않는다** — 872: 현행 기준값이 야후 low/high **범위 안에 드는 경우 19.9%뿐**이고, 벗어난 방향도 below 193 / above 218로 대칭이다. 범위폭 중앙은 **3.16%p**로 좁다. 좁은 띠 밖으로 대칭으로 벗어난다는 것은 **추정 오차가 아니라 대상이 다르다**는 뜻이다.
> 5. **실무 방식을 쓸 수 없다** — New Constructs는 컨센서스를 단기에만 쓰고 장기는 GDP 3%로 수렴시킨다(`REVDCF_SPEC` §5). 우리 엔진은 `매출(t)=매출(t−1)×(1+g)`의 **단일 g**라 페이드를 넣으면 원전 구조 이탈이다(🚫 창작 금지).
> 6. **비교 구조** — 역DCF는 *시장이 건 기대* 와 *내 기대* 를 견주는 모델인데 컨센서스는 시장 기대의 대리물이다. "내 기대" 자리에 넣으면 양변이 수렴해 GAP이 "컨센서스 대 주가"가 된다.
>
> 🔴 **남는 사실(숨기지 않는다)**: 우리 성장률은 **시장의 근시일 기대와 80% 어긋난다**(872). 이건 결함이 아니라 **다른 것을 본다는 선언**이며, 화면·방법론에 그대로 밝힌다.
>
> 🔴 **재검토 조건**: **무료로 접근 가능한 multi-year 매출 전망 소스**가 확보되면 이 결정을 다시 연다. 그 전에는 재론하지 않는다.
>
> 🔴 **이 결정은 현행 추정기를 승인하지 않는다** — §10 #42 참조.

## §2 — `docs/REVDCF_SPEC.md`

**2-1. 차이 원장 driver 1 행 최종화** — §1의 "결정 / 근거 / 남는 사실 / 재검토 조건"을 요약해 넣는다.
🔴 **"원전이 틀렸다"고 쓰지 말 것.** 원전은 사람이 판단을 넣는 모델이고 우리는 자동이라 **그 자리를 채울 재료가 다르다** — 그 사실만 적는다.

**2-2. §11 실측 원장** — 872 수치 추가(`baseInsideRange` 102/513·19.9% · below 193 / above 218 · 범위폭 중앙 3.16%p · 부호반전 55 중 range내 0).

**2-3. §10 미결 #42 보강** — 🔴 **이 승인이 `drivers.ts:163`을 승인한 것이 아님을 명시**한다.
> CKL이 지지한 것은 **"매출 성장의 지속성"**이지 **"끝점 2개 CAGR"이라는 추정기**가 아니다. 현행은 5년 중 **첫해·끝해만** 쓰고 중간 3년을 버린다 — 한 해 이상치가 전체를 흔든다. 대안(회귀 기울기·중앙값 성장·이상치 제거) **미측정**. 🔴 driver 1의 원전 대조는 닫혔으나 **추정기 품질은 열려 있다.**

## §3 — 🔴 `docs/LENS_DEV_PLAYBOOK.md` #72 신규 (이 STEP의 핵심)

**문제**: 2026-08-02 하루에 **네 번**, 문서에 적힌 수치·인용이 원본과 달랐다. 넷 다 **원본을 여는 순간 뒤집혔다.**

| # | 문서에 적혀 있던 것 | 원본 | STEP |
|---|---|---|---|
| 1 | New Constructs 제외 사유 = "매출0 · **OTC** · **주식구조 복잡**" | 저장본·라이브 양쪽에 `OTC` **0건**. 원본의 제외 서술은 *"no revenue"* **하나뿐** | 866B |
| 2 | `frames` **4,998** = "우리 유니버스의 하한" | **다른 모집단**이었다 — 그 태그를 보고한 **모든 filer**(OTC 1,537·외국 937·ADR 394 포함) | 866 |
| 3 | 847 **63.3%** = "가이던스 커버리지" | **언어 존재율**이었다. 금액 추출은 **30.3%**(871 전수 재측정) | 871 |
| 4 | CKL 2003 = "**우연 수준** · 2년25%·3년12.5%·4년6.3%" | **0.5ⁿ 귀무가설**을 실측치로 옮긴 것. 원문 결론은 **매출 지속성 실측 6.3% vs 기대 3.1% ≈ 2배** | 872 |

**원인**: 넷 다 **수치를 만든 맥락에서 떼어내 다른 주장의 근거로 재사용**했다.
🔴 **그리고 셋은 답이 이미 파일 안에 있었다.** `probe_847_guidance.json`의 `note`가 *"가이던스 언어 정규식 근사"*라고 적고 있었고, `frames` 한계는 `REVDCF_SPEC` §B-0에 *"하한선이다"*로 적혀 있었다. **안 열어서 못 본 게 아니라, 열고도 숫자만 읽었다.**

**해결**: ① 수치를 재사용하기 전에 **그 수치가 무엇을 센 것인지 원본 또는 산출 파일의 `note`·정의에서 다시 읽는다** ② **지금 주장하려는 것과 같은 대상을 센 것인지** 확인한다 ③ 외부 문헌은 **원본을 `data/sources/`에 저장한 뒤에만 인용**한다(규칙 ⓪).

**교훈**: 🔑 **수치는 숫자가 아니라 정의와 한 몸이다. 정의를 떼면 값이 아니라 방향이 뒤집힌다.** 위 넷 중 셋은 값이 아니라 **의미가 반대**였다.
🔑 **규칙 ⓪(원본 저장)이 실제로 작동한 사례** — 872가 CKL PDF를 먼저 받게 하지 않았다면 4번은 안 잡혔다. **인용을 쓰려면 원본부터 받는다.**
**조건**: 외부 문헌·이전 STEP 산출물·발췌본을 근거로 쓰는 모든 자리.

## §4 — `docs/STATE.md`

- "▶ 다음" **2번**을 `승인 대기` → **`✅ driver 1 = 판정 완료(현행 유지·2026-08-02 승인)`** 로 바꾸고 근거를 한 줄로 압축(상세는 진행표 각주).
- **다음 행 = 차이 2행 `driver 3`(세율)** 을 1번 안에 명시. 🔴 **착수는 장은태 지시 후**라고 붙일 것.
- 🔴 STATE **1~2p 상한** 유지 — 길어지면 2번 항목을 압축한다(삭제 아님).

## §5 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ scripts/ data/    # 🔴 출력 없어야 함
```

```sql
select as_of, count(*) from revdcf_results group by as_of order by as_of desc;  -- 604 ×3
select count(*) from us_market_cap;                                             -- 5,886
```

```bash
git add docs/LENS_COMPLETION_STANDARD.md docs/REVDCF_SPEC.md \
        docs/LENS_DEV_PLAYBOOK.md docs/STATE.md docs/CHANGELOG.md docs/STEP_873_COMMAND.md
git commit -m "STEP 873: close divergence row 1 (sales growth) as keep-current, log the citation discipline

- driver 1 stays on the trailing 5-year sales CAGR; this is recorded as a knowing departure
  from the primary source, not as compliance
- grounds: Yahoo analyst revenue stops at +1y while the model needs one sustained rate,
  CKL 2003 finds sales growth does persist while analysts' long-horizon forecasts do not,
  our 871 swap fattened the upper tail and moved verdicts symmetrically, and 872 showed the
  current base sits outside the analyst band 80 percent of the time
- state plainly in the ledger that our number diverges from near-term market expectations,
  and name the condition that reopens the decision: a free multi-year revenue forecast source
- the approval does not bless the estimator itself; the endpoint-only CAGR stays open as #42
- playbook #72: four citations broke the same way today, each reversing on contact with the
  source, and three had the caveat sitting unread in the file that produced the number
- documents only; no code, flag unchanged"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§1 진행표 1행 ③ = ✅ 현행 유지 · 각주 6근거 + 남는사실 + 재검토조건 확인
§2 SPEC: 차이 원장 driver 1 최종화 · §11 872 수치 · §10 #42 보강(추정기 미승인 명시)
§3 플레이북 #72 신규 — 4건 표 · 원인 · 해결 3단계 · 교훈
§4 STATE: 2번 판정완료로 교체 · 다음 = driver 3 명시 · 상한 유지 ?
무변경: revdcf_results 604×3 · us_market_cap 5,886 · lib/app/components/messages/scripts/data diff 없음
tsc 0 · test ?/? · push ?
🔴 못 한 것 · 미측정
```

🔴 **driver 3 착수를 제안하지 말 것.** 지시는 장은태가 한다.
