# STEP 869 — 화면 문구 정정 + 사고 기록 커밋 (문서·문자열 전용 · 로직 diff 0)

**실행 명령어** (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

```
@docs/STEP_869_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `6044c3e`(STEP 868 · origin/main 반영) · tsc 0 · vitest 153/153 · `REVDCF_ENABLED` **OFF** · 프로덕션 = `https://onetrillion.app` · `/api/revdcf` 차단 확인(7종목)

**장은태 승인**: 2026-08-02 — 869 묶음 승인 + **순서 재배열(② 먼저)** + `sampleNote` 지침(숫자 하드코딩 금지).

---

## 🔴 순서와 그 이유 — ② → ① → ③

| 순서 | 항목 | 성격 | 왜 이 순서인가 |
|---|---|---|---|
| **1** | 🔴 **`sampleNote` 문구** | **거짓 방지** | **플래그를 켜는 순간 화면이 거짓말한다.** 866이 "상위 1,000"을 *근거 없이 승계된 목록*으로 격하했고 867이 유니버스를 재확정했는데, 문구는 그대로다. 지금은 안 보이지만 **켜는 순간 사실이 아닌 문장이 나간다** |
| **2** | ① **사고 기록 3종 커밋** | **끊어진 인용 복구** | `STATE.md:10`이 `docs/PROD_ACCESS_ANSWER2_2026-08-02.md`를 근거로 인용하는데 **파일이 저장소에 없다**(untracked). 다른 기기·다음 세션에서 **STATE의 근거가 열리지 않는다** |
| **3** | ③ **죽은 키 제거** | **청소** | 아무것도 안 깨뜨린다. 마지막 |

🔑 **①③은 지금 아무것도 안 깨뜨린다. ②만 "켜는 순간" 실패한다.** 그래서 ②가 먼저다.

---

## 🔴 금지사항

| # | 금지 |
|---|---|
| 1 | 🔴 **`components/`·`lib/`·`app/` 로직 수정** — `messages/*.json`과 `docs/`만 바뀌어야 한다 |
| 2 | 🔴 **문구에 숫자를 박지 말 것** — 아래 §1 참조 (`CLAUDE.md` §12 **B분류**) |
| 3 | `REVDCF_ENABLED`를 켜지 말 것 · 플래그·베타·노출 논의 금지 |
| 4 | `revdcf_results`·`us_market_cap` 쓰기 · `data/us_symbols.json` 수정 |
| 5 | 🔴 `docs/PROD_ACCESS_*.md` 3종의 **내용을 수정하지 말 것** — 커밋만 한다. 사고 기록 원본이다 |
| 6 | 🔴 방법론 페이지에 **유니버스 설명 문구를 새로 만들지 말 것** — §4 참조 |

---

## 1단계 (최우선) — `sampleNote` 정정

### 현재 (ko/en 둘 다 폐기된 유니버스를 말한다)

```
ko: "미국 시총 상위 1,000 중 이 기법이 성립하는 {total}개 기준"
en: "Based on {total} of the top 1,000 US companies where this method applies"
```

`components/RevDcfSection.tsx:97`에서 **실제로 렌더된다**(`r.sampleTotal != null`일 때).

### 🔴 고치는 원칙 — 숫자를 넣지 않는다

`CLAUDE.md` §12 값 분류 원장:

> **B. 외부 소스 값** = 남이 주기적으로 갱신하는 값 → **숫자를 적지 않는다. 소스·좌표·주기·저장위치만**

867이 확정한 것은 **"거래소 상장 = 조달 범위"**이지 **컷이 아니다.** 그리고 `{total}`은 이미 런타임 값(`r.sampleTotal` ← API의 `sampleTotal` ← DB 카운트)이다.

| | |
|---|---|
| ❌ `"미국 거래소 상장 2,857개 중 …"` | **또 하드코딩.** 다음에 또 낡는다 |
| ✅ **앞의 "상위 1,000" 수식어만 제거** | 모집단 설명은 방법론 페이지 몫 |

### 적용

```
ko: "이 기법이 성립하는 {total}개 기준"
en: "Based on {total} companies where this method applies"
```

🔴 **`{total}` 플레이스홀더 이름·개수를 바꾸지 말 것** — `RevDcfSection.tsx:97`이 `{ total: r.sampleTotal }`로 넘긴다. 이름이 틀리면 런타임에 깨진다.
🔴 **ko·en을 반드시 같이** 고칠 것. 실측: `RevDcf` 키 개수 **ko 32 / en 32 · 차집합 0**. 한쪽만 건드리면 패리티가 깨진다.

---

## 2단계 — 사고 기록 3종 커밋

전부 untracked다(`git ls-files --error-unmatch` 실측):

```
docs/PROD_ACCESS_DIAGNOSTIC_2026-08-02.md   🔴 UNTRACKED
docs/PROD_ACCESS_ANSWER_2026-08-02.md       🔴 UNTRACKED
docs/PROD_ACCESS_ANSWER2_2026-08-02.md      🔴 UNTRACKED
```

🔴 **내용을 한 글자도 고치지 말고 그대로 `git add`만 한다.** 사고 당시의 판단·오판이 그대로 남아 있어야 기록으로 값이 있다.

`docs/INDEX.md`가 있으면 세 파일을 **사고 기록**으로 한 줄씩 등재한다(있는 경우에만 · 없으면 건너뛴다).

---

## 3단계 — 죽은 키 제거

```
RevDcf.position
  ko: "{n}년 — 이 기법 성립 {total}개 중 상위 {pct}%"
  en: "{n} years — top {pct}% of {total} where this method applies"
```

- `REVDCF_SPEC`: *"STEP 855 §2 — '상위 x%'(방향 헷갈림) 폐기. years 표본 내 순위 + 3분류로 대체"*
- 전수 grep: **참조 코드 0건**(`components/`·`app/` 어디에도 `t("position"` 없음)
- 대체된 키(`rankLine`)는 살아 있고 정상이다 — `"이 기법 성립 {total}개 중 {rank}번째로 긴 기간"` (전부 런타임 값)

→ **ko·en 양쪽에서 `position` 키를 삭제한다.** 🔴 한쪽만 지우면 패리티가 깨진다(32/32).

---

## 4단계 — 🔴 손대지 말 것 (전수 점검 결과 · 기록만)

`RevDcf`·`RevDcfMethod` 전 키에서 숫자·고정 표현을 전수 탐지한 결과, **아래는 B분류가 아니라 유지 대상**이다:

| 키 | 내용 | 왜 유지인가 |
|---|---|---|
| `RevDcfMethod.repro` | `"$285.2 / 8년 (원전 $285.20 / 8년)"` | **원전 도미노 사례의 고정값.** 원전이 바뀌지 않으므로 갱신되는 값이 아니다 |
| `RevDcfMethod.betaCaveat` | `"Fama-French 1992"` | **문헌 인용.** 고정 |
| `RevDcf.overCapExplained` | ko `"25년 예측기간과 …"` / en `"The 25-year forecast period …"` | **859에서 원전 T8 `C31`로 확정된 지평.** 원전 고정값(A분류) |
| `RevDcf.rankLine` | `"{total}개 중 {rank}번째로 긴 기간"` | 전부 런타임 값. 정상 |

🔴 **`overCapExplained`의 "25"에 대한 관찰 (869 범위 밖 · §10 미결에만 적는다)**
코드의 `maxYears: 25`(`app/api/cron/revdcf/route.ts:70·71·73`)와 문구의 "25년"이 **따로 논다.** 지금은 값이 같아서 문제가 없지만, **851 "표시 25년 컷이 문서에만 있고 코드엔 없던" 사고와 같은 구조**다. 한쪽만 바뀌면 화면이 거짓말한다.
🔴 **이번에 고치지 말 것.** `docs/REVDCF_SPEC.md` §10 미결에 **한 줄로 기록만** 한다: *"화면 문구의 '25년'과 코드 `maxYears: 25`가 배선돼 있지 않다 — 851 유형. 배선 여부는 장은태 판단."*

🔴 **방법론 페이지 유니버스 문안도 만들지 말 것.** 867이 `REVDCF_SPEC` §7에 ko/en 초안을 적어 뒀으나 `messages/*.json`에는 없다. **화면 문구 신설은 플래그 ON 전 판단 사항**이므로 §10 미결에 *"867 §7 유니버스 공개 문안이 messages에 미반영 — 장은태 판단 대기"*로 기록만 한다.

---

## 5단계 — 검증

```bash
npx tsc --noEmit          # 0
npx vitest run            # 153/153 (🔴 messages 패리티 테스트가 있으면 여기서 걸린다)
git diff --stat HEAD -- components/ lib/ app/     # 🔴 출력 없어야 함
git diff --stat HEAD -- messages/                 # ko.json·en.json 2개만
```

🔴 **`git diff --stat HEAD -- components/ lib/ app/`에 한 줄이라도 나오면 멈추고 보고할 것.**

**커밋 + push**:

```bash
git add messages/ko.json messages/en.json \
        docs/PROD_ACCESS_DIAGNOSTIC_2026-08-02.md \
        docs/PROD_ACCESS_ANSWER_2026-08-02.md \
        docs/PROD_ACCESS_ANSWER2_2026-08-02.md \
        docs/REVDCF_SPEC.md docs/STATE.md docs/CHANGELOG.md docs/STEP_869_COMMAND.md
git commit -m "STEP 869: stop the sample-size copy from naming a retired universe, commit the incident record

- RevDcf.sampleNote said 'top 1,000 US companies' in ko and en; 866 demoted that list as
  inherited without basis and 867 refixed the universe, so the line would have gone out false
  the moment the flag is turned on
- drop the hardcoded population from the copy rather than substituting a new number
  (CLAUDE.md 12, class B: wire external/moving values, do not write them down); {total} is
  already a runtime count
- remove RevDcf.position in both locales: 855 replaced it with rankLine, zero code references
- commit the three PROD_ACCESS incident files verbatim; STATE cites ANSWER2 as evidence but
  the file was untracked, so the citation did not resolve outside this machine
- record two deferred items: the '25-year' copy is not wired to maxYears (851-type risk), and
  867's universe disclosure copy is not yet in messages
- no logic changes: components/, lib/, app/ untouched. Flag stays OFF"
git push
```

## 6단계 — 멈춘다

**보고 형식**:

```
① sampleNote: ko "?" / en "?"  (숫자 제거 확인 · {total} 유지 확인)
② PROD_ACCESS 3종: tracked 확인 (git ls-files 3/3)
③ position 제거: ko/en 양쪽 · RevDcf 키 개수 ?/? (제거 후 31/31 기대)
④ 미결 2건 §10 기록: 25년 배선 · 867 §7 문안 미반영
diff: components/·lib/·app/ 출력 없음 · messages/ 2파일
tsc 0 · vitest ?/? · push 커밋 ? · REVDCF_ENABLED OFF 유지
```

🔴 **플래그를 켜는 것·방법론 문안 신설·베타에 대해 한 줄도 쓰지 말 것.** 판정은 장은태가 한다.
