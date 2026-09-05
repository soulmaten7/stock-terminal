# STEP 934 — 🔴 A안 실현 가능성 산술: **`RETRY_MAX`를 올리면 97%를 넘는가** (진단만 · 판정 금지)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_934_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `5be5bb9`(STEP 933 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `docs/STATE.md` **131줄**(상한 142) · `REVDCF_ENABLED` Production **OFF**(Preview만 ON) · `revdcf_results` 3,020 · `us_market_cap` 5,892

🔴 **불변 금지선**: 🔑 **②단계를 시작하지 말 것 — 이 STEP도 진단이다** · **`RETRY_MAX`·`RETRY_MS`·게이트 산식·임계값(97/95)·`maxDuration` 불변** · **`lib/lensPrecompute.ts`(917 계측) 수정 금지** · **DoD 판정 칸 수정 금지** · **`REVDCF_ENABLED` Production을 켜지 말 것** · **환경변수 수정·재배포 금지** · DB **쓰기 금지**(읽기만) · **크론 수동 실행 금지** · **메일 발송 금지** · `lib/**`·`app/**`·`components/**`·`messages/**`·`data/**`·`.github/**`·`vercel.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **이 STEP은 코드를 읽고 산술만 한다. 코드 diff 0 · 판정 0.**
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 933이 남긴 미확정

933 보고:

> *"`RETRY_MAX`를 올리면 실제로 97% 커버리지를 넘는지는 **여전히 모름**(511건 전부 성공 보장 없음, 915는 표본 20건뿐) — 이 STEP도 판정하지 않았다."*

🔑 **이것이 A안(취득 수리)의 성패를 가른다.** 🔴 **그리고 산술로 답할 수 있는 부분이 있다.**

## §1 — 🔴 `freshCoverage`의 정의를 코드로 확인 (이 STEP의 전부가 여기 걸린다)

🔴 **`lib/lensPrecompute.ts`를 열어 다음을 확정한다.** 🔴 **`grep` 매칭은 존재 증거이지 내용 증거가 아니다**(#82) — 읽어서 확인.

1. 🔑 **`freshCoverage`가 계산되는 시점** — **재시도(stage2) 전인가 후인가.** 🔴 **이 하나가 §2의 결론을 뒤집는다.**
2. **분모가 무엇인가** — `STOCK_SYMS` 길이인가, `us_market_cap` 행 수인가, 다른 것인가. 🔴 **정확한 값을 적는다.** 🔑 **933이 5,966으로, `us_market_cap`은 5,892로 적혀 있다 — 74 차이의 정체도 함께.**
3. **분자가 무엇인가** — `freshSet` 크기인가. 🔑 **`freshSet`에 재시도 성공분이 들어가는가.**
4. **`retryAll`의 구성** — 916은 `[...noCapField, ...noResponse]`로 확인했다. 🔴 **재확인**하고, 🔑 **`retryAll`에 든 511건이 "현재 stale/결측인 전부"인지, 그 일부인지** 적는다.

🔴 **여기서 확인한 사실만으로 §2를 계산한다. 추정 금지.**

## §2 — 🔴 상한 산술 (🔴 Cowork 계산이다 · 재계산해 확인할 것)

🔴 **아래는 Cowork의 계산이고 §1 전제에 의존한다. 틀리면 틀렸다고 적는다.**

**전제**(§1에서 확인될 경우): `freshCoverage`는 **재시도 후** 값 · 분모 **5,966**.

- fresh ≈ 0.9143766756032171 × 5,966 ≈ **5,455**
- 97% 기준선 = 0.97 × 5,966 ≈ **5,787**
- **부족분 ≈ 332~333건**
- 🔴 **미시도분 = `retryAllLen` 511 − `retrySetLen` 400 = 111건**
- 🔑 **111건을 전부 살려도 (5,455+111)/5,966 ≈ 93.3% — 97%에 못 미친다.**

🔴 **이 결론이 맞다면 `RETRY_MAX` 증액만으로는 게이트를 넘지 못한다.**

**반대 경우**(§1에서 `freshCoverage`가 **재시도 전** 값으로 확인되면):
🔴 **위 계산은 성립하지 않는다.** 🔑 **400건 시도 성공분이 아직 반영 안 된 것이므로 다시 계산해야 한다.** 🔴 **그 경우 어떤 값이 필요한지 적고, 없으면 "다음 실행에서 관측 필요"로 남긴다.**

🔴 **어느 쪽이든 "그러니 B안으로 가야 한다"고 쓰지 말 것.** 🔑 **사실만.**

## §3 — 🔴 511이 전부가 아닐 가능성

🔑 **`retryAllLen` 511은 "이번 실행에서 재시도 대기로 분류된 수"다.** 🔴 **"현재 stale/결측인 종목 전부"와 같은지 확인**한다(§1-4).

1. 🔴 **DB로 대조**(읽기만) — `us_market_cap`에서 **최신 `as_of`가 아닌 행 수**를 세고 511과 비교한다. 🔑 **915는 464(07-30 잔류)였고 933은 511이다.** 🔴 **두 수가 다른 이유를 사실로 적는다**(측정 대상이 다른 것인지, 실제로 늘어난 것인지).
2. 🔴 **결측(행 자체 없음) 74~78건**(915)이 `retryAll`에 포함되는지 확인한다. 🔑 **포함 안 되면 그 74건은 `RETRY_MAX`를 아무리 올려도 안 채워진다.**
3. 🔴 **커버리지 상한을 계산한다** — 🔑 **`retryAll`이 아예 못 닿는 종목이 있다면, 이론상 도달 가능한 최대 커버리지가 97% 미만일 수 있다.** 🔴 **그 값을 낸다.**

## §4 — 🔴 A안 실현 가능성 (🔴 사실 판정만 · 처방 금지)

§2·§3 결과로 다음 중 하나를 **사실로** 적는다:

- **가능** — `RETRY_MAX` 증액으로 97% 도달이 산술상 가능하다(필요 성공률 명시).
- **불가** — 미시도분을 전부 살려도 97%에 못 미친다(부족분 명시).
- **미상** — §1 전제가 확정되지 않아 계산 불가(무엇이 더 필요한지 명시).

🔴 **"불가"여도 `RETRY_MAX`를 바꾸지 말 것** · 🔴 **B안·C안·D안을 권하지 말 것** · 🔴 **A·B·C·D 병기 유지.**
🔑 **916→933에서 예측이 한 번 뒤집혔다.** 🔴 **이번 계산도 실측이 아니라 산술이라는 것을 명시한다.**

## §5 — 🔴 문서 갱신

1. `docs/DECISION_912_LIVE.md` — §1 정의 확인 · §2 산술 · §3 도달 상한 · §4 가능/불가/미상. 🔴 **②단계 미판정 유지.**
2. `docs/REVDCF_SPEC.md` §11 실측·산술 등재.
3. `docs/STATE.md` — 🔴 **"▶ 다음 00" 갱신** · 🔴 **131줄 유지**(필요하면 압축).
4. `docs/CHANGELOG.md` — 🔴 **934 항목 추가**(931 플레이북).

## §6 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
wc -l docs/STATE.md                                    # 🔴 131 이하
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git status --porcelain                                 # 🔴 ?? 0건
```

🔴 **`lib/lensPrecompute.ts`에 diff가 나오면 되돌리고 보고한다.**
🔴 **DB 사전/사후 스냅샷 일치 확인**(읽기만 했는지).
🔴 **push 전에 `git pull --rebase`가 필요할 수 있다.** 🔴 **충돌이 나면 중단하고 보고한다.**
🔴 **커밋 메시지는 §1 확인·§2 재계산 결과에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것** — 916이 산술로 확정한 것이 933 실측에 뒤집힌 전례가 바로 앞에 있다.

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 934: work out whether raising the cap could clear the threshold at all

- the count that bound is known now, but not whether lifting it reaches ninety-seven percent, and
  that turns entirely on when coverage is measured: before the retries or after them
- so the function is read rather than assumed, along with what its denominator counts and whether
  the names it retries are all the names that are missing
- if coverage is measured after retrying, the untried remainder is a hundred and eleven against a
  shortfall three times that size, and the cap is not the thing standing in the way
- rows that have no entry at all cannot be recovered by retrying more of them, so the ceiling that
  is reachable at all is calculated separately
- this is arithmetic, not a measurement, and the step before this one had its arithmetic overturned
  by the first real numbers, which is noted where the conclusion is written"
git push && git push origin main:revdcf-preview
```

## §7 — 보고 후 멈춘다

```
§1 🔴 freshCoverage 계산 시점(재시도 전/후) · 분모·분자 정의 · 5,966 vs 5,892의 74 차이
   retryAll 구성 재확인 · 🔴 코드를 읽고 확인했는지(grep만 아님)
§2 🔴 Cowork 산술 재계산 — fresh 5,455 · 기준선 5,787 · 부족 332 · 미시도 111 · 93.3%
   🔴 맞는가 틀린가 · 🔴 §1이 "재시도 전"이면 어떻게 달라지는가
§3 🔴 511 vs 915의 464 차이 사실 · 결측 74~78이 retryAll에 드는가
   🔴 도달 가능 최대 커버리지
§4 🔴 가능 / 불가 / 미상 중 하나 · 🔴 처방 안 썼는지 · A·B·C·D 병기 유지
   🔴 "산술이지 실측 아님" 명시했는지
무변경: 🔴 RETRY_MAX·RETRY_MS·게이트·임계값·maxDuration 불변 · lib/lensPrecompute.ts diff 0
       DoD 판정 칸 전부 불변 · 코드 diff 0 · 환경변수 0 · 재배포 0
       REVDCF_ENABLED Production OFF · 크론 미실행 · 메일 발송 0 · DB 쓰기 0(읽기만)
tsc 0 · test ?/? · wc -l STATE ? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **②단계를 시작하지 말 것. `RETRY_MAX`를 바꾸지 말 것. B·C·D안을 권하지 말 것. 게이트·임계값을 바꾸지 말 것. 917 계측을 건드리지 말 것. 크론을 돌리지 말 것. DB에 쓰지 말 것. 다음 STEP을 제안하지 말 것.**
