<!-- 2026-08-18 · Claude Code 실측 · 코드 diff 0 · DB 쓰기 0 · 화면 변경 0 -->

# 렌즈 전수감사 ⑦ — 자산성장(CMA) — **7렌즈 마지막** (등급 「표본 약함」·partial)

> `docs/LENS_AUDIT_06_FSCORE.md`(⑥F스코어) 다음 순서 — **이것으로 7렌즈 전수감사가 끝난다**(①밸류·②모멘텀·③저변동·④퀄리티·⑤기술·⑥F스코어·⑦자산성장). 7렌즈 종합·정리는 이 STEP의 몫이 아니다(하나를 하나씩).
> **범위**: `lib/lenses.ts:367~407`(assetGrowth) · `lib/lensCopy.ts`(`assetgrowth` 블록) · `lib/lensTones.ts` · `lib/lensCuts.ts` · `lens_scores`·`lens_cuts`·`lens_state_changes` 실측.
> 🔴 **판정은 장은태가 한다.** 이 문서는 결함을 실측으로 뜯어 적는 데까지다.
> 🔴 **조회 시각**: DB 조회 2026-08-18 07:1x UTC. `lens_scores` US `updated_at` 균일 `2026-08-17 22:03:40 UTC`. `lens_cuts.as_of` = `2026-08-17`.

---

## 요약

| | 항목 | 판정 |
|---|---|:--:|
| 🔴 | ⓪-4① 집계 레이어 | **확정 결함 — ⑤ 결함①과 같은 뿌리(묶어서 기록).** 코드 주석 *"라벨=확장 강도 … verdict 아님"*인데 `lenses.ts:396`의 `verdict.tone`은 `conservative→pos/aggressive→warn`. `lensTones.ts`가 `partial` 등급도 검증 렌즈와 동일 가중으로 집계 |
| 🟢 | ⓪-4② 연도 정렬 가드 | **코드상 존재 확인**(`nonConsecutive`, STEP803) — 🔴 **모집단 역방향 검사는 구조적으로 불가**(야후 연도 목록이 DB 어디에도 저장 안 됨). 98.7% 커버리지가 "가드 통과"인지 "가드 우회"인지 **직접 검증 못함**, 단 STEP1060의 175종목 실조회 표본에서 내부 연도결측 0건이었다는 방증은 있음(간접) |
| 🟢 | ⓪-4③ 원전 두 층 | **이미 화면에 공개돼 있음**(STEP816/826 작업). 현상의 원전=Cooper-Gulen-Schill(2008), 계산 사양=Fama-French(2015) CMA — `lensCopy.ts` note가 **"같은 계열"로 이미 명시**. 「포트폴리오 기법 vs 종목별 백분위」·「소형주 집중 vs 우리 상위1,000」도 **이미 공개됨** |
| 🟡 | ⓪-4④ 손계산 | **구조적으로 불가능 — 네 번째 사례 확정**(④grossProfit·⑤rsi14/pos52w·⑥reason에 이어). `us_fundamentals_snapshot`엔 `total_assets` 컬럼 자체가 없고, `us_fundamentals`는 종목당 1개년뿐 |
| 🟢 | 공개 문구(⓪-3b) | `lensCopy.ts` note가 **매우 상세**(원전·재현연구 견고성·소형주 편중·금융사 포함 차이·생존편향 전부 공개) — 결함으로 이중 계상 안 함 |
| — | 앞선 결함 18건 생존 | **18/18 그대로**(⑥ 인용, 08-18 이후 git log 변경 0건) |

---

## ⓪-4 반증조건 판명

**전제①(집계 레이어)** — **참, 결함 확정.** 아래 §1.

**전제②(연도 가드 작동)** — **코드는 존재하나 라이브 검증 불가**(측정 한계, 결함 여부 미확정). 아래 §2.

**전제③(원전 공개)** — **참 — 이미 화면에 공개돼 있다.** STEP816·826이 이미 이 작업을 완료해뒀다(아래 §3, 인용 위주).

**전제④(손계산 가능)** — **틀렸다(불가능) — 네 번째 사례.** 아래 §4.

---

## §1. 🔴 집계 레이어 결함 — ⑤ 결함①과 같은 뿌리 (최우선)

`lib/lenses.ts:367~368` 렌즈 상단 주석: *"표본 약함: 방향·독립성은 진짜(βHML낮음=밸류와 별개)이나 우리 표본 유의 미달. 라벨=확장 강도(공격적/보통/보수적 · **verdict 아님**)."*

그러나 같은 파일 396행: `verdict: ... agState === "conservative" ? "pos" : agState === "aggressive" ? "warn" : "flat"` — **코드 주석이 "verdict 아님"이라 명시한 바로 그 필드가, 실제로는 pos/warn 톤을 가진 verdict 객체다.**

`lib/lensTones.ts`의 `STATE_SPEC`:
```
assetgrowth: ["conservative", "aggressive", "mid"]
```
`toneForKey`·`tonesFromStates`·`tonesFor`·`firstPosLens`(⑤ 감사가 확인한 4개 소비처 — `app/api/watchlist/quotes/route.ts`·`app/api/explore/lens-top/route.ts`·`app/api/krx/ranking/route.ts`·`app/api/yahoo/*-list/route.ts`)는 **등급(`strong`/`partial`/`ref`)을 전혀 보지 않는다.** 자산성장은 `STATE_SPEC` 삽입 순서상 **6번째**(momentum, technical, valuation, lowvol, quality, **assetgrowth**, fscore) — `firstPosLens`가 앞의 다섯이 전부 non-pos일 때만 자산성장을 대표 배지로 고른다.

`lensCopy.ts`의 `assetgrowth.note`는 매우 상세하지만(§3 참조), **"이 렌즈의 판정이 관심목록·보드 등 집계 화면에서 검증된 다른 렌즈와 동일 가중치로 셈된다"는 사실은 어디에도 없다.**

🔑 **⑤ 기술 감사가 발견한 결함("`reference` 등급 신호가 검증 렌즈와 동급 「강점」으로 셈됨")이 두 번째 렌즈에서 재현됐다.** F-스코어(⑥)는 등급이 `strong`(검증)이라 이 문제에서 제외됐지만, 자산성장은 `partial`(표본 약함·t≈1.6 유의미달)이라 기술과 같은 처지다. **개별 결함 2건이 아니라, 「`lensTones.ts`의 집계 레이어가 렌즈 등급을 반영하지 않는다」는 하나의 구조적 결함이 지금까지 두 렌즈(기술·자산성장)에서 나타난 것으로 기록한다.**

---

## §2. 연도 정렬 가드 (⓪-4②) — 코드 확인 + 라이브 검증의 한계

`lib/lenses.ts:372~376`:
```
const lr = d.financials[d.financials.length - 1];
const prev = d.financials[d.financials.length - 2];
const gap = nonConsecutive(lr, prev);  // STEP803 §5 — 연도 차 ≠ 1이면 계산 불가
const assetGrowthPct = !gap && lr?.totalAssets != null && prev?.totalAssets != null && prev.totalAssets > 0
  ? (lr.totalAssets / prev.totalAssets - 1) * 100 : null;
```
가드 자체는 **코드에 실재**한다(`nonConsecutive`가 `gap=true`면 `assetGrowthPct`가 무조건 `null`).

🔴 **역방향 검사(⓪-5②㉡, "연도 차 ≠ 1인데 값이 계산된 종목이 있는가")는 구조적으로 수행 불가** — 야후가 반환한 연도 목록(`d.financials`의 `date`)은 어디에도 저장되지 않는다(`lens_scores`엔 `assetgrowth_value`·`assetgrowth_state`뿐). DB만으로는 "이 종목의 최신 두 회계연도가 실제로 인접했는지"를 사후 검증할 방법이 없다 — **추측으로 "없을 것"이라 말하지 않는다, 「검사 불가」로 명시한다.**

간접 방증 하나: STEP1060이 175종목 야후 실조회(2026-08-18)에서 **연도 목록 내부 결측(비연속) 0/175**를 확인했다 — 이는 자산성장 전용 검증은 아니지만(그 STEP은 재무건전성 4개 렌즈 공통 데이터 소스를 봤다), **같은 데이터 소스(야후 `fundamentalsTimeSeries`)를 쓰므로 어느 정도 신뢰할 수 있는 방증**이다. 98.7%(986/999)라는 높은 커버리지가 "가드를 통과해서" 나온 것인지 "가드가 걸릴 일이 애초에 드물어서"인지는 **이 STEP만으로는 최종 확정 못 함**(미측정으로 남김).

---

## §3. 원전 두 층 + 공개 여부 (⓪-4③) — 이미 완료된 작업 인용

🔴 **`LENS_DEV_PLAYBOOK.md` #25(STEP553~554)·#46(STEP816)·#56(STEP826)이 이 작업을 이미 완료해뒀다.** 중복 대조하지 않고 그 결론을 인용·재확인한다.

**원전 두 층**(이미 `lensCopy.ts:75~76`에 공개돼 있음, 코드로 확인):
- **현상의 원전** = Cooper, Gulen & Schill (2008), *"Asset Growth and the Cross-Section of Stock Returns"*, Journal of Finance 63(4) — note: *"2008년 쿠퍼·굴렌·실이 '자산을 빠르게 불린 회사일수록 이후 수익은 오히려 약하다'를 데이터로 밝혔어요"*.
- **계산 사양의 출처** = Fama-French(2015) 5팩터 CMA — note: *"파마·프렌치 5팩터 중 투자 팩터(CMA)이기도 해요"*, `nameEn: "Asset Growth (CMA)"`(`lenses.ts:370`)와 정합.
- **둘의 관계도 이미 명시**: *"자산성장(투자 팩터 — Cooper-Gulen-Schill 2008 / 파마-프렌치 5팩터 CMA · **같은 계열**)"* — 이름 안에 두 층이 섞여 있지 않고, **오히려 그 관계 자체를 명시적으로 밝히고 있다.** ④퀄리티·⑤기술이 원전 인용 누락을 결함으로 지목했던 것과 **다른 상황** — 결함 아님.

🔴 **이 STEP의 신규 시도**: Cooper-Gulen-Schill(2008) 원문을 물리적으로 재확보해 `data/sources/`에 보관하려 했으나(④⑤⑥이 각각 Novy-Marx·George-Hwang·Piotroski를 무료 공개본으로 확보한 방식 그대로), **원문 미확보로 종료한다.** 저자(Cooper, 유타대) 개인 홈페이지·SSRN(두 워킹페이퍼 버전, 403 차단)·구글 검색을 확인했으나 무료 전문 PDF를 찾지 못함(유료 구매·robots 우회 금지 규정 준수). STEP816이 과거 "원문(FF5 Table1 primary·CGS 동일)"을 대조했다고 기록했으나 그 시점 파일이 `data/sources/`에 남아있지 않다(STEP816은 2026-08-01 「원전 인벤토리」 관행 신설 이전 STEP).

**「포트폴리오 기법 vs 종목별 백분위」 공개 여부** — **이미 공개돼 있음**(STEP826이 명시적으로 정정): `lensCopy.ts:76` note — *"원문의 큰 효과(저−고 연 ~20%)는 소형·초소형주·동일가중에 크게 기대요 … 우리 유니버스는 오늘 상위 1,000(KR·US 모두 시총)이라 효과가 가장 센 초소형주 구간을 충분히 안 담아, 우리 표본에선 방향만 +이고 통계적으론 약해요."* `scope.failure`에도 동일 내용 반복. **결함 아님.**

**등급 밴딩·컷 방향**(C-1 #4): `dir:"low"`의 근거는 note에 *"자산을 공격적으로 불린 회사일수록 이후 수익은 오히려 약하다"*(낮을수록 우호)로 명시 — 컷 자체는 `lens_cuts`(§5 확인)에서 **시장 분포 유도**(고정값 아님, STEP826 "cutoff 상대화 완료"와 정합).

**금융사 포함 차이**: CGS 원문은 SIC6(금융) 제외, 우리는 총자산이 있으면 포함 — note에 *"은행·보험은 CGS 원문은 제외했으나 우리는 총자산이 있어 값이 나와요(은행 자산성장=예금·대출 팽창이라 제조업 설비투자와 뜻 달라 해석 주의)"*로 **이미 공개**. 결함 아님.

---

## 🟢 잘 된 것

1. **원전 두 층(현상/계산)과 그 관계가 이름부터 화면 문구까지 정확히 공개**되고 있다 — ④⑤가 지적한 원전 인용 누락 문제 자체가 이 렌즈엔 없다.
2. **컷이 분포 유도**(고정 상수 아님) — 방향 부호(`dir:"low"`)의 근거도 note에 명시.
3. **na 사유가 3갈래로 분기**(`naMissing`/`naOneYear`/`naGap`, STEP826에서 이미 개선) — ①밸류·⑥이 지적했던 "뭉뚱그림" 함정을 이미 피했다.
4. **규모 의존성(소형주 편중) 캐비어트가 매우 상세하게 공개** — 원전 헤드라인(~20%/년)과 우리 실측(연~+8%, 이후 재검증에선 +3.37%·t=0.87까지 하향)의 차이를 유니버스 구성으로 정직하게 설명.
5. **재현연구(Hou-Xue-Zhang 2020) 인용까지 포함** — 447개 이상현상 중 3분의 2가 탈락한 가운데 생존한 축이라는 맥락까지 note에 있음.

---

## §4. 손계산 — 🔴 네 번째 「검산 인프라 공백」 사례 확정

⓪-4④에서 명령서 작성 중 미리 확인된 대로, 이 STEP이 직접 재확인:

```sql
-- us_fundamentals_snapshot 컬럼(15개): symbol·cik·fiscal_year·net_income·equity·revenue·
--   operating_income·dna·debt·non_operating_assets·shares·source_tags·unavailable_reason·
--   fetched_at·captured_at  → total_assets 컬럼 자체가 없음
-- us_fundamentals: total_assets 있음, 그러나 종목당 정확히 1개년(⑥ §1 확정, 5,820행=5,820종목)
```

자산성장 = (당기−전기)/전기 총자산 — **2개 연도의 총자산이 필요**한데, 우리 SEC 캐시 두 테이블 중 하나는 그 필드 자체가 없고, 다른 하나는 연도가 1개뿐이다. **손계산에 필요한 원자료가 이 STEP이 허용된 범위(재취득 0) 안에 없다 — 구조적으로 불가능.**

🔑 **패턴 확정**: ④퀄리티(grossProfit/costOfRevenue 원시값 미저장) → ⑤기술(rsi14/pos52w 원시값 미저장) → ⑥F스코어(reason 미저장 + 3년치 SEC 데이터 부재) → **⑦자산성장(2년치 총자산이 SEC 캐시 어디에도 없음)** — **네 번째로 확인.** 7렌즈 중 4개 렌즈에서 반복된 이 패턴은 개별 렌즈의 우연한 공백이 아니라 **"파생 표시값·근거값을 DB에 영구 저장하지 않는다"는 설계 전반의 특징**으로 정리할 수 있다(판정은 장은태 몫).

---

## §5. DB 전수 실측 (조회 2026-08-18 07:1x UTC)

- `lens_scores` US 999행. `assetgrowth_value` 비결측 **986(98.7%)**·결측 **13(1.3%)**.
- 분포: min **−55.56%** · p10 −2.415 · p50 6.88 · p90 33.685 · **max 120,677.99%**(BMNR — 자산 대규모 재편·자본조달 기업, 관측만·오염 단정 안 함. 그 외 상위: IONQ 1,192%·ASTS 425%·SNPS 269%·NBIS 250% — 전부 2026년 실제 고성장/M&A 기업, 자릿수 이상 아님).
- `assetgrowth_state`: mid **395** · aggressive **296** · conservative **295** · na **13**.
- `updated_at` **전 999행 균일 `2026-08-17 22:03:40 UTC`** — ③ 감사 신규②(스테일) 재현 안 됨(정상).
- `lens_cuts`(assetgrowth): `lo=2.52 · hi=12.725 · n=986 · as_of=2026-08-17` — 분포 p10/p50/p90과 정합(p30/p70 유도로 보임, STEP805 관행과 일치).
- `lens_state_changes`(07-20~08-07): **52건/38종목 — `LENS_DISPOSITION` §1 정확히 재현**(독립 검증 완료). 7렌즈 중 노출 최소라는 배경 서술과 정합.
- 🔴 **중간 판정 근거(reason) 저장 여부**: `lens_scores`엔 `assetgrowth_value`·`assetgrowth_state`만 존재 — **§4에서 이미 확정한 네 번째 패턴과 동일한 사실**(별도 컬럼 없음).

---

## §6. 앞선 결함 18건 생존 확인 (①6+②5+③4+⑤3)

`LENS_AUDIT_06_FSCORE.md`가 **"18/18 그대로"**를 이미 확정. 재조사하지 않고 인용한 뒤 08-18 이후 관련 파일 `git log` 확인:

```
git log --oneline --since="2026-08-18T00:00:00" -- lib/lenses.ts lib/lensCopy.ts lib/lensTones.ts lib/lensCompute.ts lib/lowvol.ts lib/technical.ts lib/fscore.ts lib/lensCuts.ts
→ (커밋 0건)
```

**18/18 그대로.**

---

## §7. 질문 귀속(2-9) — 억지로 맞추지 않는다

`lensCopy.ts:72` `assetgrowth.question` = **"몸집을 무리하게 불리지 않았나?"**. W-2 정본 여섯("비싸게 사는가"·"재정 상태 좋아지나"·"사업이 커지는가"·"현금 얼마나 나눠주나"·"망할 위험 있나"·"최근 뭐가 바뀌었나")과 대조:

- **"사업 자체가 커지고 있을까?"(성장)와 인접하지만 다르다** — 성장 질문은 "커지는가(사실)"를 묻고, 자산성장 렌즈는 "너무 무리하게 커지는가(과잉투자 경계)"를 묻는다. 성장은 이미 다른 재료(매출 5년 CAGR, `ROADMAP_V2.md:310`)로 채워져 있다 — 같은 칸에 넣으면 "커진다"와 "무리하게 커진다"가 섞인다.
- 나머지 다섯과는 개념이 겹치지 않는다.
- `ROADMAP_V2.md` W-2-4 자체가 자산성장을 **"구조 잔여 3건 중 하나, 처분 판정 미정"**으로 이미 분류해뒀다 — ⑤·⑥(이미 배정됨)과 다른 상황이고, **새 질문 후보로 남아 있는 상태다.**

**분류 = 새 질문 후보 또는 미배정 상태 유지.** 🔴 결론 내지 않고 재료만 놓는다 — "성장"에 부속시킬지, 독립 질문("자본 규율"류)으로 세울지, 아예 안 쓸지는 W-2-1 원칙대로 **정보 목록이 먼저** 확정된 뒤의 문제이며 장은태 판정 대상이다.

---

## §8. 🔑 7렌즈 전수 완결 확인

`lib/lenses.ts`의 `Lens` 타입 `export const` 전수(코드 grep, 이름 목록 아님):

```
momentum(142행)·technical(193행)·valuation(238행)·lowVol(281행)·quality(322행)·assetGrowth(369행)  — 6개
```
+ `lib/fscore.ts`의 `computeFScore`(별도 모듈, `FScore` 타입 — `Lens` 인터페이스 밖이라 grep에 안 잡히지만 7렌즈 카드의 일부로 렌더됨, ⑥에서 이미 감사) = **7개**.

| # | 렌즈 | 감사 문서 |
|:--:|---|---|
| ① | valuation(밸류) | `VALUE_LENS_DEFECT_AUDIT_2026-08-07.md` |
| ② | momentum(모멘텀) | `LENS_AUDIT_02_MOMENTUM_2026-08-07.md` |
| ③ | lowVol(저변동) | `LENS_AUDIT_03_LOWVOL.md` |
| ④ | quality(퀄리티) | `LENS_AUDIT_04_QUALITY.md` |
| ⑤ | technical(기술) | `LENS_AUDIT_05_TECHNICAL.md` |
| ⑥ | fscore(F-스코어) | `LENS_AUDIT_06_FSCORE.md` |
| ⑦ | assetGrowth(자산성장) | 이 문서 |

**7/7 전수 확인 — 감사 안 된 렌즈 없음.**

---

## 못 한 것 / 철회·정정한 것 / 미측정으로 남은 것

**못 한 것**
- 손계산 3종목 — 원자료(2년치 총자산)가 이 STEP의 재취득 금지 범위 안에 없다(§4).
- 역방향 검사(연도 차≠1인데 값 있음) — 야후 연도 목록이 DB 어디에도 없어 구조적으로 불가(§2).
- Cooper-Gulen-Schill(2008) 원문 물리적 재확보 — 무료 공개본을 찾지 못함(§3, 원문 미확보로 종결).

**철회·정정한 것**
- 없음. 직전 감사(①~⑥) 및 `LENS_DEV_PLAYBOOK` #25·#46·#56 인용은 코드 재확인 결과 전부 정확했다.

**미측정으로 남은 것**
- 98.7% 커버리지가 "가드 통과"인지 "가드가 걸릴 일이 드묾"인지의 정확한 구분(§2, 간접 방증만 있음).
- 자산성장 극단치(BMNR 120,677.99% 등)의 개별 원인 확인(재무 데이터 자체는 야후 실시간이라 이 STEP 범위에서 재조회하지 않음 — 자릿수 이상은 아니라는 정황만 확인).
- `firstPosLens`·집계 화면에서 자산성장이 실제로 몇 % 종목의 "대표 강점" 배지가 되는지의 라이브 관측(코드 구조 확인까지, ⑤와 동일 한계).

🔴 **판정은 장은태가 한다. 이 문서는 결함을 놓는 것까지다.**
