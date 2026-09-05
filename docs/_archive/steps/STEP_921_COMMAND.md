# STEP 921 — 안건 4 재료 완성: **"모델 완성"이 무엇인가** · 920 육안 결과 등재

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_921_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `fa2ae6c`(STEP 920 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 3,020 · `us_market_cap` 5,892 · `lens_cuts` 10행 · `cron_heartbeats` 2행

🔴 **불변 금지선**: 🔑 **`REVDCF_ENABLED`를 켜지 말 것 — 이 STEP은 "켤 조건"을 적을 뿐 켜지 않는다.** · DB **쓰기 금지** · **크론 수동 실행 금지** · `lib/**` 수정 금지(산식·917 계측 불변) · `data/us_symbols.json`·`.github/workflows/**`·`vercel.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **DoD 판정 칸을 바꾸지 말 것** · **보류 항목(DoD 7·9)을 실제로 작업하지 말 것 — 요구사항 확인만** · **②단계(증액) 시작 금지** · 안건 3에 손대지 말 것.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🟢 920 육안 검증 완료 (Cowork 실측 2026-08-06 · `localhost:3333`)

920이 *"픽셀 재검증은 이 세션 도구로 불가"*로 남긴 자리를 Cowork이 브라우저로 닫았다. 🔴 **아래를 문서에 등재한다**(920 보고의 미결 항목 해소).

| 폭 | 결과 |
|---|---|
| 기본(≈1568px) | 🟢 §0 표 **7곳 전부 해소** · 「증분 재투자율」 정상 유지 · 가로 넘침 없음 |
| 좁은 폭(≈1280px) | 🟢 동일 정상 · 🔑 열 폭 배분이 개선돼 「가이던스·Value Line」이 한 줄로 들어감 |
| 모바일(≈500px) | 🟢 어절 갈림 **0곳** · 🔑 `break-words` 안전망 작동(`expected_inflation` 미넘침) · 🔴 표가 **가로 스크롤**되나 스크롤바가 명시적이라 반응형 처리로 보임(`break-keep` 무관) |
| `/en/revdcf` | 🟢 변화 없음 · 정상 |

🔴 **920이 미확정으로 남긴 *"919 무관 vs 919가 드러냄"*은 미확정 그대로 둔다.** 🔑 **표시는 고쳐졌고 원인 귀속은 실질 영향이 없다.** 🔴 **억지로 닫지 말 것.**

## §1 — 🔴 먼저 열어라 (안건 4)

🔴 **Cowork은 DoD 7·9의 실제 요구사항을 모른다. 기억으로 쓰지 말 것.**

1. `docs/LENS_COMPLETION_STANDARD.md`의 **DoD 9항목 원문**을 연다. 🔴 **7번·9번의 문구를 그대로 인용**하고, **각각이 무엇을 요구하는지** 한 줄로 적는다.
2. `docs/STATE.md`(903 §3 기록)에서 **안건 4의 실제 문구**와 **903이 지적한 순환**의 원문을 인용한다.
3. `docs/DECISION_908_PENDING.md` 안건 4 · `docs/DECISION_907`~`918` 중 909가 적은 **선택지 3개와 성립 여부**를 인용한다.
4. `docs/STATE.md` **보류 목록 원문**을 인용한다 — 🔑 **"항목 7·9(노출)"이 왜 보류됐는지.**
5. 🔴 **줄 번호를 믿지 말고 내용으로 찾는다**(878) · 🔴 **`grep` 매칭은 존재 증거이지 내용 증거가 아니다**(#82).

## §2 — 🔴 진짜 질문을 드러낸다: 플래그를 켜는 조건

909가 확인한 것:
- *"9개 전부 ✅"* → **불가**(DoD 3이 🅿️로 닫혔다)
- *"3을 🅿️ 인정 + 나머지 8개 ✅"* → DoD 7·9를 닫아야 함 → **플래그 ON 필요** → **순환**
- *"7·9를 뺀 7개 닫힘"* → 현재 상태

🔑 **그러면 안건 4는 실질적으로 "`REVDCF_ENABLED`를 언제 켤 것인가"다.** 🔴 **이것이 맞는지 §1 원문으로 확인**하고, 맞으면 그렇게 적는다. 🔴 **틀리면 틀렸다고 적는다.**

1. 🔴 **플래그를 켜려면 실제로 무엇이 준비돼야 하는지 전수로 적는다** — DoD 7·9가 요구하는 것 + 코드·인프라상 선행조건. 🔴 **요구사항을 읽어서 적는 것이지 만드는 게 아니다.**
2. 🔴 **그중 이미 준비된 것과 안 된 것을 가른다.** 🔴 **"아마 될 것"이 아니라 확인한 것만.**
3. 🔑 **순환을 깨는 방법이 있는지 본다** — 예: 플래그를 켜지 않고도 DoD 7·9를 부분적으로 닫을 길(프리뷰 배포·내부 확인 등)이 있는가. 🔴 **없으면 없다고 적는다.**
4. 🔴 **`revdcf-preview` 브랜치가 이 목적에 쓰일 수 있는지** 확인한다 — 🔑 **매 STEP push해 온 브랜치인데 용도가 문서에 정의돼 있는지.** 🔴 **정의가 없으면 "없음"으로 적는다.**

## §3 — 🔴 남은 항목 전수 재확인

🔑 **"완성"을 정의하려면 남은 것이 몇 개인지 알아야 한다.**

1. `docs/REVDCF_SPEC.md` §10에서 **미소진 `#` 항목을 전수 열거**한다. 🔴 **개수와 목록을 적는다.**
2. **원리적 불가 3건**(`#44`·`#45`·`#48` — 원전 책 page 92 미확보)이 여전히 그 상태인지 확인한다. 🔴 **원전 자료가 그 사이 확보됐는지도.**
3. `docs/STATE.md` §9 **인프라 미확정 항목**을 열거한다. 🔴 **911·915에서 일부 해소됐으니 현재 상태로 갱신**한다.
4. 🔴 **각 항목이 "완성"의 필요조건인지 아닌지 표시**한다. 🔑 **원리적 불가가 필요조건이면 완성은 영원히 불가능하다** — 그건 정의가 잘못된 것이다.
5. 🔴 **`#26`·`#33`처럼 진작 끝났는데 표시가 안 된 것이 또 있는지** 본다. 🔴 **`#22`처럼 무효인 것도.**

## §4 — 🔴 권고 (미루지 말 것)

**"모델 완성"의 정의 **하나**를 권고한다.** 🔴 **910·918 형식 그대로**:

- **권고 한 줄** — 무엇을 만족하면 완성인가.
- **근거** — 🔴 **전부 §1 원문 또는 §2·§3 확인에 걸려야 한다.**
- 🔴 **대가** — 이 정의가 포기하는 것. 🔑 **느슨하면 안 끝난 걸 끝났다 하고, 빡빡하면 영원히 안 끝난다.**
- 🔴 **불리한 사실** — 반드시 적는다.
- 🔴 **완성 이후에 남는 것** — 🔑 **완성이 "전부 끝"이 아니라면 무엇이 남는지 명시**한다(원리적 불가·보류·라이브 건).
- 🔴 **재검토 조건.**

🔴 **DoD 정의를 이 STEP에서 고치지 말 것** — 🔑 **그건 장은태 승인 후다.** 🔴 **권고 문서에만 적는다.**
🔴 **승인은 장은태 것임을 명시**한다(910 §5).

## §5 — 문서 · 검증 · 커밋

- `docs/DECISION_921_COMPLETION.md` 신설 — §1~§4.
- `docs/DECISION_908_PENDING.md` — 안건 4에 **"921 권고 제출 · 승인 대기"**. 🔴 **안건 3은 그대로 대기**(22:45 UTC 크론 관측 후).
- `docs/CHANGELOG.md` · 🔴 **920 육안 결과(§0) 등재** — `docs/REVDCF_SPEC.md` §11 · `docs/LENS_DEV_PLAYBOOK.md`(897·898·911·920 네 번째 성립 기록에 **육안으로 닫힌 것**까지)
- `docs/STATE.md` — 🔴 142줄 상한 · 🔴 **"▶ 다음"에 22:45 UTC 크론 관측 대기를 유지**

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git status --porcelain                                                                # 🔴 ?? 0건
```

🔴 **커밋 메시지는 §4의 실제 권고에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것** — 913 대폭 재작성 · 914 프로브 버그 2건 · 916 유니버스 가설 기각 · 919 `lib/` 충돌 재설계. **초안은 매번 틀렸다.**

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 921: say what finishing this model would actually mean, since the current wording cannot be met

- the standard asks for nine items to pass and one of them was closed at a ceiling rather than
  passed, so the wording as written is already unreachable; two of the remaining items cannot be
  closed until the feature is visible, which it cannot be until those items close
- that circle is what the pending question really is, so what turning it on would require is
  listed from the standard itself rather than guessed, and separated into ready and not
- everything still open is counted alongside: the items that cannot be answered without a source
  page we do not have, and the infrastructure notes that later steps partly resolved
- a definition is recommended with what it gives up, and what remains after it is met is named
  rather than left to look like nothing
- separately, the table fix from the previous step was checked in a browser at three widths and
  the split words are gone"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§0 920 육안 결과 등재 · 🔴 "919 무관 vs 드러냄"을 억지로 안 닫았는지
§1 DoD 7·9 원문 인용과 각각의 요구 · 903 순환 원문 · 909 선택지 3개 · 보류 목록 원문
§2 🔴 안건 4 = "플래그를 언제 켜는가"가 맞는지(원문 확인)
   🔴 플래그 ON 선행조건 전수 · 준비된 것 / 안 된 것
   🔴 순환을 깨는 길이 있는가(없으면 "없음") · revdcf-preview 용도 정의 유무
§3 🔴 미소진 # 전수(개수·목록) · 원리적 불가 3건 현황 · STATE §9 갱신
   🔴 각 항목이 완성의 필요조건인지 · 🔴 진작 끝났거나 무효인 것이 또 있는가
§4 🔴 권고 1개 + 근거·대가·불리한사실·완성 이후 남는 것·재검토조건
   🔴 DoD 정의 안 고쳤는지 · 🔴 승인은 장은태 것임을 명시했는지
무변경: 🔴 REVDCF_ENABLED Production OFF(안 켬) · lib/ diff 0(산식·917 계측)
       app/components/messages/data/.github/vercel.json diff 0
       DoD 판정 칸 전부 불변 · 보류 항목 7·9 미작업 · ②단계 미착수
       안건 3 대기 불변 · 크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **`REVDCF_ENABLED`를 켜지 말 것. DoD 정의와 판정 칸을 고치지 말 것. 보류 항목 7·9를 실제로 작업하지 말 것. ②단계를 시작하지 말 것. 안건 3에 손대지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
