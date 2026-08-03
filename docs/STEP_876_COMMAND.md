# STEP 876 — driver 4 판정 근거 보정 + A안 정확 재측정 + 플레이북 결번 메움

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_876_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `e8375d0`(STEP 875 · `main`·`revdcf-preview` 동일) · tsc 0 · test 153/153 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` **5,887**(875에서 +1 드리프트 공개 — 일일 크론 정상 갱신으로 추정 · 두 프로브 모두 쓰기 호출 없음)

---

## §0. 왜 이 STEP인가 — 875 앵커가 내 판정 근거를 흔들었다

**앵커는 성공했다.** 원전 공식 구현이 소수점 15자리까지 맞았다:

```
driver 5 marginal : 0.11616592089691762  vs 원전 0.1161659208969176   ✅
driver 4 원전식   : 0.005011166545534203 vs 원전 0.005011166545534272 ✅
```

**계산 구조(끝점차·5년 창·필요현금 2%)는 정확하다.**

🔴 **그런데 같은 앵커가 874 A안 구현의 결함을 드러냈다.**

```
874 코드의 A안 (AP + AccruedLiabilitiesCurrent 2종만)  → 4.219%
원전 4항목 전부                                        → 0.501%  ✅
```

도미노에서 **Advertising fund liabilities · Other accrued liabilities 2개 항목을 놓쳐 값이 8배 틀렸다.** 공식 오류가 아니라 **태그 매핑의 불완전**이다.

**그러면 875 §2 판정 각주의 근거 3번이 성립하지 않는다:**

> ~~*"3. 집계가 세부 분해보다 낫다는 근거 … 874 실측도 같은 방향(A안 65/515 = **12.6%**, 병목 `AccruedLiabilities` 284 결측)"*~~

🔑 **12.6%는 "원전 방식의 커버리지"가 아니라 "불완전한 태그 매핑의 커버리지"다.** 도미노 한 종목에서 8배 틀린 구현으로 잰 수를 방법론 근거로 썼다.
🔴 **B안도 앵커 검증이 불가능하다** — T4 `Inputs`에 집계 필드가 없고 섹션 헤더가 *"Non-Interest Bearing Current Liabilities:"* 뿐이다. 원전은 처음부터 무이자만 골라 넣는 걸 전제한다.

**🔴 driver 4 판정 자체는 살아남는다** — 근거 1(다모다란 *"as a percent of revenues"* 권고)·2(증분식 불안정성 문헌)·4(바꿔도 `years` 12종목만 이동)는 그대로다. **근거 3번만 무효다.**
**그러나 진짜 A안 커버리지는 아직 모른다.** 이 STEP이 잰다.

---

## 🔴 금지사항

| # | 금지 |
|---|---|
| 1 | 🔴 `lib/**`·`app/**`·`components/**`·`messages/**` 수정 — `drivers.ts` 고치지 말 것 |
| 2 | `revdcf_results`·`us_market_cap` 쓰기 · 플래그·화면 변경 |
| 3 | 🔴 **driver 4 판정(✅ 현행 유지)을 뒤집지 말 것** — 근거 3번만 교체한다. 재측정 결과가 어떻든 ③칸은 그대로 |
| 4 | 🔴 **driver 5의 제3 방식을 재지 말 것** — 별건 |
| 5 | 🔴 **다음 행 착수 제안 금지** |

🔴 **3번 강조**: 재측정에서 A안 커버리지가 높게 나와도 **판정을 다시 열지 않는다.** 근거 1·2·4가 판정을 지탱하고, 3번은 애초에 없어도 됐던 것이다. **근거가 하나 줄었다는 사실을 기록하는 것이 이 STEP의 목적이다.**

---

## §1 — A안 태그 매핑을 원전 4항목에 맞춰 다시 잰다

**신규 파일**: `scripts/probe_876_wc_tags.ts` (측정 전용) · companyfacts는 **866 캐시 재사용**

원전 T4의 운영유동부채 **4항목**(`Tutorial 4` C44 = C39+C41+C42+C43):

| 원전 항목 | 도미노 라벨 | 874가 쓴 태그 | 🔴 필요 |
|---|---|---|---|
| ① 매입채무 | Accounts payable | `AccountsPayableCurrent` | ✅ |
| ② 미지급비용 | Accrued expenses | `AccruedLiabilitiesCurrent` | ✅ |
| ③ **광고기금부채** | Advertising fund liabilities | 🔴 **없음** | 회사특유 — 일반 태그 탐색 |
| ④ **기타 미지급부채** | Other accrued liabilities | 🔴 **없음** | 일반 태그 탐색 |

**할 것**
1. `AccountsPayableCurrent`·`AccruedLiabilitiesCurrent` 외에 **무이자 유동부채 성격의 us-gaap 태그를 515사 companyfacts에서 전수 수집**해 빈도순으로 낸다(예: `OtherAccruedLiabilitiesCurrent`·`OtherLiabilitiesCurrent`·`EmployeeRelatedLiabilitiesCurrent`·`AccruedIncomeTaxesCurrent` 등). 🔴 **목록을 미리 정해놓고 찾지 말고, 실제로 무엇이 있는지부터 세어라.**
2. 🔴 **이자부 태그는 명시적으로 배제**한다(`ShortTermBorrowings`·`LongTermDebtCurrent`·`CommercialPaper` 등). 원전이 `C40`을 뺀 것과 같다.
3. 확장 태그 집합으로 A안을 다시 계산해 **커버리지·중앙비율·음수·계산불가**를 낸다.
4. 🔴 **도미노 앵커 재실행** — 확장 태그로 도미노를 돌려 **0.501%가 나오는지.** 안 나오면 그 사실과 수치를 적는다.

**보고 표**

| | 874 A안(2종) | 876 A안(확장) | B안 | 현행 |
|---|---|---|---|---|
| 계산 가능 / 515 | 65 (12.6%) | ? | 514 | 515 |
| 중앙 비율 | 15.63% | ? | 5.83% | 1.80% |
| 음수 / 계산불가 | 14 / 450 | ? | 220 / 1 | 236 / 0 |
| 도미노 앵커 | 4.219% ❌ | ? | 테스트 불가 | 대응 없음 |

🔴 **`years` 이동까지 다시 낼 것** — 확장 A안으로 엔진을 다시 태워 `years` 177→? · GAP 중앙 11→? · 유출/유입.

산출: `docs/probe_876_wc_tags.json`

## §2 — driver 4 판정 각주 보정

`docs/LENS_COMPLETION_STANDARD.md` 진행표 3행 각주에서 **근거 3번을 아래로 교체**한다. 🔴 **③칸(✅ 현행 유지)은 건드리지 말 것.**

> ~~3. 집계가 세부 분해보다 낫다는 근거 — 874 실측 A안 12.6%~~
> **3. 🔴 무효(876).** 874의 A안 구현은 원전 4항목 중 **2개(광고기금부채·기타 미지급부채)를 놓쳐** 도미노에서 **4.219%**를 냈다(원전 0.501%). 12.6%는 **원전 방식의 커버리지가 아니라 불완전한 태그 매핑의 커버리지**였다. 다모다란의 *"composite … more accurate than breaking it down"*은 여전히 유효한 문헌 근거이나, **우리 실측이 그것을 뒷받침한다는 주장은 철회한다.**
> **3′. 확장 태그로 재측정(876): 커버리지 ?/515 · 도미노 앵커 ?** — (§1 결과로 채움)

🔴 **재측정 결과와 무관하게 판정은 유지된다.** 근거 1·2·4가 지탱한다. 그 사실도 각주에 한 줄로 적을 것.

## §3 — 🔴 플레이북 결번 메움 + 신규

**현재 70·71·72·**74**만 있고 #73이 결번이다.** 874 명령서 초안이 #73을 지시했다가 명령서를 다시 쓰며 그 절이 빠졌고, 875는 #74로 지정했다. **Cowork 실수다.**

**#73**(결번 메움 · 874에서 빠진 내용):
- **문제**: 870이 만든 차이 9행 진행표가 `registry.ts`와 어긋나 **이미 확정된 4행(driver 3·4·5·인플레)이 `대기`로 표시**돼 있었다.
- **원인**: 새 관리 표를 만들며 기존 원장과 **행이 아니라 개수만** 대조했다(871: "10 vs 9").
- **교훈**: 🔑 **새 표를 기존 원장과 맞출 때는 개수가 아니라 행을 맞춘다. 개수 일치는 정합을 보장하지 않는다.** 🔑 **문서가 코드보다 새롭다고 더 맞는 게 아니다** — 이번엔 새 문서가 틀리고 오래된 코드가 맞았다.

**#75**(신규):
- **문제**: driver 4 판정 근거로 쓴 커버리지 12.6%가 **불완전한 구현으로 잰 수**였다. 앵커(도미노)를 돌려보니 그 구현은 원전 값의 **8배**를 냈다.
- **원인**: **커버리지를 재기 전에 그 구현이 옳은지 확인하지 않았다.** 앵커 테스트가 874에 있었으나 *"원본 셀이 그 값을 낸다"*로 대체돼 실제로는 안 돌았다.
- **교훈**: 🔑 **커버리지·분포 같은 집계는 그 구현이 한 케이스라도 정답을 재현한 뒤에 재야 의미가 있다. 앵커 없이 잰 커버리지는 방법의 커버리지가 아니라 버그의 커버리지다.**
- **조건**: 원전·외부 기준값이 존재하는 모든 지표.

## §4 — 문서 · 검증 · 커밋

- `docs/REVDCF_SPEC.md` §11에 §1 수치 추가 · §10 미결의 driver 4 항목에 *"A안 진짜 커버리지 = §1 결과"* 반영
- `docs/PRIMARY_SOURCE_MAP.md`에 앵커 결과 요약 추가(기존 삭제 금지)
- `docs/STATE.md`는 **driver 4 판정 유지** — 근거 보정만 반영. 🔴 1~2p 상한

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/   # 🔴 출력 없어야 함
```

```sql
select as_of, count(*) from revdcf_results group by as_of order by as_of desc;  -- 604 ×3
select count(*) from us_market_cap;   -- 🔴 5,887 기준. 또 바뀌면 그대로 보고(크론 정상 갱신 추정)
```

```bash
git add scripts/probe_876_wc_tags.ts docs/probe_876_wc_tags.json \
        docs/LENS_COMPLETION_STANDARD.md docs/REVDCF_SPEC.md docs/PRIMARY_SOURCE_MAP.md \
        docs/LENS_DEV_PLAYBOOK.md docs/STATE.md docs/CHANGELOG.md docs/STEP_876_COMMAND.md
git commit -m "STEP 876: retract a coverage-based ground for driver 4 and remeasure it properly

- the 875 anchor showed our A-variant implementation missed two of the four non-interest
  current liability items the source uses, returning 4.219 percent on Domino against 0.501
- so the 12.6 percent coverage cited as a ground was the coverage of a broken implementation,
  not of the source method; that ground is withdrawn while the verdict stands on the others
- rebuild the tag set by counting what actually exists across the universe rather than
  assuming a list, exclude interest-bearing items as the source does, and rerun the anchor
- playbook 73 fills a gap left when a step was rewritten; playbook 75 records that coverage
  measured without an anchor is the coverage of a bug
- measurement and documents only; no engine change, flag unchanged"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§1 확장 태그: 수집된 무이자 태그 빈도순 상위 ? · 커버리지 ?/515 · 중앙 ? · 음수/계산불가 ?
   🔴 도미노 앵커 → ?(기대 0.501%) · years 177→? · GAP 11→? · 유출/유입 ?
§2 근거 3번 무효 처리 + 3′ 채움 · ③칸 ✅ 유지 확인
§3 플레이북 #73 결번 메움 · #75 신규
§4 SPEC·MAP·STATE
무변경: revdcf_results 604×3 · us_market_cap ? · lib/app/components/messages diff 없음
tsc 0 · test ?/? · push ?
🔴 못 한 것 · 미측정
```

🔴 **판정을 다시 열지 말 것. 다음 행을 제안하지 말 것.**
