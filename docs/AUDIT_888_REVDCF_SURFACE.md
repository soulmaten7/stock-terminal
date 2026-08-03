<!-- 2026-08-03 · STEP 888 · 감사 전용 — 수정 0 -->
# 역DCF 표면 전수 감사 — 브랜드 정체성 가드레일 대조 (STEP 888)

> 🔴 **이 문서는 감사 산출물이다. 문구를 하나도 고치지 않았다.** 교정은 889. 이 문서는 "무엇이 걸리는지"만 확정한다.
> 기준 원문(직접 개봉·`docs/BRAND_IDENTITY.md`) — §0/§4/§5/§6, `CLAUDE.md:339~344`와 대조(§1 참조).

## §0 판정 없음 확인

DoD 항목 6(주장 정합)의 판정 칸은 이 STEP에서 바꾸지 않았다 — `docs/LENS_COMPLETION_STANDARD.md`에 "888 감사 완료 → 889 교정 대기" 한 줄만 추가했다(판정 칸은 🔶 그대로).

---

## §1 기준 원문 대조

`docs/BRAND_IDENTITY.md` 직접 개봉(2026-08-03) — 아래는 원문 그대로(요약 아님):

- **§0**: *"우리는 예언하지도, 추천하지도 않는다. 우리는 불을 건넨다 — 그리고 당신을 존중해, 그 불을 당신이 직접 들게 한다."*(1. 한 줄 근간)
- **§2 자립**: *"추천하지 않는다. 분석은 우리가, 판단·경쟁은 당신이."*
- **§4 가드레일**: *"'약한 신호'를 숨기지 않는다. 불확실성을 드러낸다. 과장·확신하지 않는다. 능력을 팔되, 의존을 팔지 않는다."*
- **§5 목소리**: *"모든 카피·문구·안내문은 이 톤을 기준으로 쓴다. 따뜻한 마케팅 카피 금지. 건조·직설·냉소·정직."*
- **§6 🔒**(라인 100): *"카피는 항상 '전문가처럼 본다/분석한다'로. '전문가가 추천한다'로 읽히면 정체성 위반(§4·§0 남의 말 함정)."*

`CLAUDE.md:339~344`(AGENTS.md 인클루드 내부) 대조 결과 — **어긋나지 않는다.** 같은 3기둥(무기·직시·자립)을 같은 문장("추천 안 함. 분석은 우리가, 판단은 당신이")으로 반복하며, `docs/BRAND_IDENTITY.md`를 "권위"로 명시 지정한다. 두 문서 사이 모순 없음.

---

## §2 7렌즈 교정 원칙 (직접 개봉 · `docs/_archive/LENS_7_COMPLETED.md` 81·141·207·273행)

822(밸류)·824(저변동)·825(퀄리티)·826(자산성장) 네 건의 실제 교정 내역(원문 그대로):

| STEP | 무엇을 → 무엇으로 (원문 확인) |
|---|---|
| 822 밸류 | `factorEnds.valuation` "비쌈/쌈"→"비싼 편/싼 편" · `na`를 사유 분기(`naPreferred`/`naLoss`/`naMissing` → "적자 (판정 제외)"·"우선주 (판정 제외)"·"산출 불가") |
| 824 저변동 | `factorEnds.lowvol` "출렁/차분"→"출렁이는 편/차분한 편" · `calmHigh` 임계 40%가 "문서에만 명시"였고 **화면엔 없던 것**을 발견 → readings에 "연변동성 40%(우리가 정한 대략적 실무 기준·원전 근거 아님)" 노출 |
| 825 퀄리티 | `factorEnds.quality` "평범/알짜"→"수익성 낮은 편/높은 편" · `na` 사유 분기(`naNoGrossProfit`/`naMissing`) · **"은행이라 단정 안 함"**(사실만: "보고하지 않는 회사") |
| 826 자산성장 | `factorEnds.assetgrowth` "공격적/보수적"→"공격적인 편/보수적인 편" · `na` 사유 3분기(`naMissing`/`naOneYear`/`naGap`) · 유니버스 서술("대형·중형")이 시장별로 부정확했던 것 정정 |

### 🔑 추출한 원칙 (889가 이 문장을 기준으로 교정한다)

> **화면 문구는 절대적 판단어가 아니라 상대적·서술적 표현("~한 편"·분포/시장 대비)으로 쓴다. 계산이 안 되는 경우 그 이유를 뭉뚱그리지 않고 실제 원인별로 정확히 분기해서 표시한다. 확인되지 않은 구체적 원인(예: 특정 업종·특정 상태 단정)은 사실만 남기고 단정하지 않는다. 임의로 정한 상수·기준·컷은 그 사실 자체("우리가 정한 기준·원전 근거 아님")를 화면에 명시한다.**

네 건 모두 "절대→상대 전환"·"결측 사유 정확 분기"·"단정 금지"·"임의 상수 노출" 중 최소 하나 이상에 해당했다(밸류·퀄리티·자산성장=사유 분기+상대화, 저변동=임의 상수 노출+상대화). 🔴 4건이 공통으로 보여주는 것은 **"화면이 실제로 아는 것보다 더 확실하게/더 단순하게 말하고 있었다"**는 것이고, 교정은 전부 "덜 확실하게, 더 정확하게" 방향이었다.

---

## §3 감사 대상 전수 목록

`#80` 절차(내용으로 grep → 목록화 → 판정 → 보고)로 만든 전수 목록.

1. `messages/ko.json` `RevDcf` 블록 — **27개 최상위/중첩 키군**(badge 5·headline 5·band 2·expectationLevel 3·driverDesc 6·skip 5·driver 7·boardBadge 3 + 단독 키 12 = 총 값 문자열 48개)
2. `messages/ko.json` `RevDcfMethod` 블록 — **7개 행(row) × 4열(i/s/o/w) = 28 + 단독 키 8**(title·intro·structure·reproTitle·repro·ledgerTitle·col×4·betaCaveat·notInvestmentAdvice) = 총 값 문자열 40개
3. `messages/en.json` 동일 두 블록 — **키 집합 1:1 패리티 확인**(`RevDcf`·`RevDcfMethod` 전 키 diff, 누락·초과 0건)
4. `components/RevDcfSection.tsx`(165행) · `components/RevDcfBadge.tsx`(15행) · `app/[locale]/revdcf/page.tsx`(63행) · 보드 노출처(`components/toolbox/UsMarketBoard.tsx` 2곳: 데스크톱 442·517행, 모바일 555행)
5. 하드코딩 문자열 — 위 4개 파일 전수 grep(`"[가-힣]`·JSX 텍스트노드 패턴) — **0건**(전부 `t()` 경유, 코드 주석만 한글)
6. 색상 토큰 — verdict별 클래스 전수(아래 §5 표에 통합 기재)
7. 관심목록(`components/favorites/WatchlistClient.tsx`) — grep 결과 **revdcf 참조 0건**(배선 자체가 없음 — 노출 없음이라 감사 대상에서 제외, 사실만 기록)

**총 감사 대상 = 메시지 값 문자열 88개(ko 48+40, en 동수 구조) + 컴포넌트 3개 + 보드 노출 2곳 + 색상 클래스 5종.**

---

## §4 씨앗 6건 확인 결과 (관찰과 다르면 다르다고 — 확인함)

| # | Cowork 관찰 | 직접 확인 결과 |
|---|---|---|
| 1 | `badge.valueDestroying`="가치훼손"이 배지 4종 중 유일한 가치판단어 | ✅ **관찰과 일치**. `badge`={years:"기대 해독", valueDestroying:"가치훼손", belowOne:"무성장 설명", overCap:"설명 불가", skipped:"해당 없음"} — 나머지 넷은 모델이 "무엇을 설명/못 하는지"의 서술어이고 "가치훼손"만 대상(기업)에 대한 평가어. `boardBadge`도 동일 단어 재사용(2곳 노출: 상세페이지+보드) |
| 2 | `value_destroying`만 위험색(빨강), `below_one`=muted·`over_cap`=accent | ✅ **관찰과 일치**(직접 확인). `RevDcfBadge.tsx:11`·`RevDcfSection.tsx:57` 둘 다 `value_destroying`에만 `bg-unjong-danger/15 text-unjong-danger`. `years`=primary·`below_one`=muted·`over_cap`=accent·`skipped`=muted(:60) |
| 3 | `RevDcfMethod.row.tax`="원전 재료 커버 58%·이상값 16.2%"가 885 재측정(77.4%)과 어긋남 | ✅ **관찰과 일치하되 정확화 필요**: 847 원측정(604 모집단·58%)과 885 재측정(464 모집단 중 359·77.4%)은 **모집단이 달라 직접 비교가 안 됨**(`LENS_COMPLETION_STANDARD.md`가 이미 이렇게 기록). 화면은 847 스냅샷을 **날짜 표시 없이** 얼려서 보여주고 있다 — CLAUDE.md §12 C분류("측정 스냅샷은 원장에 날짜와 함께") 위반. en도 동일("Source inputs cover 58%, 16.2% anomalies") |
| 4 | `RevDcfMethod.repro`="$285.2/8년"이 T7 기준(GAP7)·T8 기준(GAP8) 중 어느 쪽인지 화면에 없음 | ✅ **관찰과 일치**. 코드(`REFERENCE_CASE.reproduced`)·`REVDCF_SPEC.md`는 "8은 T8의 정확한 조합에서만 나오는 knife-edge"임을 알고 있으나, 화면 문구는 이 사실 없이 "$285.20/8년"을 단순 재현 성공으로만 제시 |
| 5 | `RevDcfBadge.tsx`에 `years` 분기가 안 보인다 | 🔴 **관찰과 다르다 — 실제로는 존재한다.** `RevDcfBadge.tsx:10`: `verdict === "years"` 분기가 있고 `{gapYears}{t("yUnit")}`(예: "8년")을 `bg-unjong-primary/15 text-unjong-primary`로 렌더한다. 보드에서 `years` 종목은 숫자+"년" 배지가 뜬다 — 누락이 아니라 **다른 형태(라벨이 아니라 숫자)**로 존재. 진짜 질문("숫자만 있고 라벨이 없어 다른 배지와 형태가 다르다")로 재정의 필요 |
| 6 | `RevDcfMethod.row.wc`="한계형" 등 원장 행이 880·887 이후 상태와 안 맞는가 | 🔴 **관찰이 자리를 잘못 짚었다.** 880은 driver **5**(고정자본/`capIntensity`)를 marginal로 전환했고, 그 자리는 `row.wc`가 아니라 `row.cap`이다. **`row.cap`은 이미 정확하다**("한계형(880부터 원전과 동일 방식 채택)" — 880 반영 완료). `row.wc`(운전자본/driver4)는 880과 무관하며 875 판정(level 유지) 그대로라 낡지 않았다. **대신 실제로 낡은 자리는 다른 곳**: `row.tax`(driver3)·`row.term`(인플레)이 887에서 "동일 식·값만 차이"로 재분류됐는데 화면 원장은 여전히 이 둘을 "원전과 다른 방식을 택함"으로만 서술한다. 그리고 **driver6(자본비용/WACC)는 원장 표(`row` 7종: growth·tax·wc·cap·term·sensitivity·distribution)에 행 자체가 없다** — 881이 확정한, GAP에 가장 크게 기여하는 항목이 공개 원장에서 통째로 빠져 있다 |

---

## §5 감사표

| # | 자리 | 현재 | 노출 | 가드레일 | 사유 | 실측 연결 |
|---|---|---|---|---|---|---|
| 1 | `RevDcf.badge.valueDestroying`·`boardBadge.valueDestroying` (ko"가치훼손"/en"Value-destroying") | 위 §4-1 | 상세페이지+보드(2곳) — **위반 소지 항목 중 최고 노출** | §4·§6 | 다른 3개 배지가 "모델이 뭘 설명 못 하는지"의 서술어인데 이것만 "가치훼손"이라는 평가어 — §6 "전문가가 추천한다로 읽히면 위반"의 인접 위험(추천은 아니나 판단을 대신 내려주는 어투) | 822의 "비쌈/쌈"이 같은 유형으로 이미 교정된 선례 |
| 2 | verdict 색상 토큰(`RevDcfBadge.tsx:11`·`RevDcfSection.tsx:56~60,105,109,112`) | years=primary·valueDestroying=**danger(빨강)**·belowOne=muted·overCap=accent·skipped=muted | 상세+보드(2곳) | §4 | "문구를 고쳐도 색이 남으면 판단은 그대로"(STEP 자체 지적) — 4개 판정 중 1개만 위험색이라 시각적으로 "나쁨"이 표시됨 | RevDcfBadge.tsx:11 직접 확인 |
| 3 | `RevDcfMethod.row.tax.w` ko"원전 재료 커버 58%·이상값 16.2%"/en"Source inputs cover 58%, 16.2% anomalies" | 방법론 페이지(낮은 노출·opt-in) | `CLAUDE.md §12`(C분류: 스냅샷은 날짜와 함께) | 847 스냅샷(604모집단)을 날짜 없이 얼려 노출. 885가 다른 모집단(464 중 359)에서 77.4%를 쟀으나 **직접 비교 불가**(모집단 상이 — `LENS_COMPLETION_STANDARD.md` 명시) | 847(58%/16.2%)·885(359/464·77.4%) |
| 4 | `RevDcfMethod.repro` ko"$285.2 / 8년"/en 동일 | 방법론 페이지 | §4(불확실성을 드러낸다) | GAP=8은 T8의 정확한 값 조합에서만 나오는 knife-edge(881: T7 그대로면 GAP=7) — 화면은 이 사실 없이 단순 재현 성공으로 제시 | 881 5단계 분해·격리실험(`scripts/probe_881_wacc.ts`) |
| 5 | `RevDcfMethod`의 `row` 7종(growth·tax·wc·cap·term·sensitivity·distribution)에 **driver6(자본비용/WACC) 행 없음** | 방법론 페이지 | §4 — 페이지 자체 제목("원전과 다른 점 — 그대로 공개")과 모순 | GAP에 가장 큰 영향을 주는 항목(881: WACC ±1%p→아래below_one/15년 이동)이 "그대로 공개"를 표방하는 표에서 통째로 빠짐. `app/[locale]/revdcf/page.tsx:21`의 `rows` 배열 자체에 "wacc"가 없음 | 881 5단계 분해(회사T7 vs 업종조립 차이) |
| 6 | `row.tax`(driver3)·`row.term`(인플레) — 887 재분류("동일 식·값만 차이") 미반영 | 방법론 페이지 | 판단 보류 | 887은 대조표 구조만 재분류했고 화면 배선은 대상 밖이었음(플래그 OFF·의도적 범위) — "차이"로 계속 보여줄지, 887 언어로 갱신할지는 실제 교정(889) 판단 필요 | 887(`docs/LENS_COMPLETION_STANDARD.md` "동일 식·값만 차이" 절) |
| 7 | `en badge.years`="Expectations" vs `ko badge.years`="기대 해독" | 상세+보드 | 판단 보류(경미) | "해독(decode)"이 모델 정체성의 핵심 동사("시장이 건 기대를 해독")인데 영어는 이 프레이밍을 담지 않음 — 위반은 아니나 보이스 손실 | — |
| 8 | `belowOne` 배지색(muted) vs 헤드라인 색(`RevDcfSection.tsx:109` `text-unjong-primary`) 불일치 | 상세페이지 | 판단 보류(UI 일관성·가드레일 무관) | 같은 판정에 배지=중립색·헤드라인=브랜드색으로 서로 다름 — 가드레일 위반은 아니나 표시 일관성 문제 | — |
| 9 | `RevDcfBadge.tsx`의 `years` 분기 | 숫자+단위만 표시, 텍스트 라벨 없음(§4-5) | 통과 | 형태가 다른 3종(텍스트 배지)과 다르나 **누락이 아니며 의도적**(숫자 자체가 정보량이 더 큼) — 가드레일 무관 | — |
| 10 | `RevDcf.headline.*`(valueDestroying/belowOne/overCap/years/wideBand) | §0 원문 예시 참조 | 상세페이지 | 통과 | 전부 "이 기법으로는/지금 이익률로는" 식으로 **모델의 한계 안에서** 서술 — 대상(기업)에 대한 절대 평가가 아니라 모델-가격 관계 서술 | — |
| 11 | `RevDcf.growthNote`·`asOfNote`·`expectationLevel.{low,mid,high}` | "과거 5년 실적…애널리스트 전망 아닙니다"·"기대가 낮은 편/중간/높은 편" | 상세페이지 | 통과 | 이미 §2 원칙("~한 편")을 따르고 있고, 방법의 한계를 자진 고지 | — |
| 12 | `RevDcf.lossMaking`·`RevDcf.skip.*`(5종) | §3 원문 | 상세페이지 | 통과 | 사유별로 분기돼 있고(`noMarginalCapex`가 `missingTag`와 별도 — 880 §1 원칙 그대로), 단정적 업종·상태 추정 없음 | 862·880 선례와 일치 |
| 13 | `RevDcfMethod.intro`·`structure`·`notInvestmentAdvice`·`betaCaveat`·`ledgerTitle` | §3 원문 | 방법론 페이지 | 통과 | `structure`="정확한 표현은 '원전 수준'이 아니라 '원전 구조 + 우리 조달 방식'"은 CLAUDE.md 표준 문구 그대로. `notInvestmentAdvice`="예측도 추천도 아닙니다"는 §0/§6 그대로. `betaCaveat`는 연구 인용으로 불확실성 자진 공개 | — |
| 14 | `RevDcfMethod.row`의 growth·wc·cap·sensitivity·distribution 4열(i/s/o/w) | §3 원문 | 방법론 페이지 | 통과 | 판단어 없이 방법 차이만 중립 서술("컨센서스 미보유"·"실측상 GAP이 자본비용에 가장 민감" 등) | — |
| 15 | ko/en 키 패리티(`RevDcf`+`RevDcfMethod` 전체) | §3 확인 | — | 통과 | 두 언어 키 집합 1:1 일치, 누락·초과 0건 | — |
| 16 | 하드코딩 문자열(4개 파일 전수) | §3-5 확인 | — | 통과 | 0건 — 전부 `t()` 경유 | — |
| 17 | 관심목록 노출 | grep 0건 | 노출 없음 | 해당 없음 | 배선 자체가 없어 감사 대상 아님(사실만 기록) | — |

**요약**: 감사 대상 총 **17행**(§5 표 기준. §3의 원자 문자열 단위로 세면 88개) · **위반 소지 5건**(#1~5) · **통과 10건**(#9~16, 관심목록 제외) · **판단 보류 3건**(#6~8, 왜 보류인지 각 행 "사유" 칸에 명시) · 노출 없음 1건(#17, 관심목록).

🔴 **새로 찾은 것(6개 씨앗 외)**: #5(driver6/WACC이 공개 원장에 행 자체가 없음 — 가장 큰 발견)·#7(en"Expectations"의 "해독" 프레이밍 손실)·#8(below_one 배지/헤드라인 색 불일치). 씨앗 #6은 관찰이 틀렸고(row.wc 아니라 row.cap이 대상, 이미 정상), 재조사로 진짜 문제(#5, #6-표)를 찾음.

---

## 무변경 확인

`messages/`·`components/`·`lib/`·`app/`·`scripts/`·`data/` **diff 0**(이 문서·`docs/` 나머지 파일만 변경). `REVDCF_ENABLED` OFF · 크론 미실행 · `revdcf_results` 604×3 · `us_market_cap` 5,887 무변경.
