# STEP 929 — 🔴 DoD 원문이 7렌즈용이라는 사실 · 923·928의 모호함 3건이 같은 원인 (사실 기록만 · 판정 금지)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_929_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `1c31a49`(STEP 928 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF**(Preview만 ON) · `revdcf_results` 3,020 · `us_market_cap` 5,892 · `lens_cuts` 10행 · `cron_heartbeats` 1행

🔴 **불변 금지선**: 🔑 **`docs/LENS_COMPLETION_STANDARD.md`의 DoD 9항목 정의를 고치지 말 것** · 🔑 **완성 현황표의 판정 칸을 하나도 바꾸지 말 것** · 🔑 **921에서 승인된 완성 정의("DoD9 제외 8항목")를 바꾸지 말 것** · **`REVDCF_ENABLED` Production을 켜지 말 것** · **환경변수를 고치지 말 것** · **재배포하지 말 것** · DB **쓰기 금지** · **크론 수동 실행 금지** · **메일 발송 금지** · `lib/**`·`app/**`·`components/**`·`messages/**`·`data/**`·`.github/**`·`vercel.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **이 STEP은 사실만 기록한다. 판정 금지 · 권고 금지 · 코드 diff 0.**
🔴 **안건 3 대기 유지**(22:45 UTC 크론 관측) · **②단계(증액) 시작 금지.**
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 먼저 원문을 직접 재확인한다

🔴 **아래는 Cowork이 읽은 것이다. 실행 측이 `docs/LENS_COMPLETION_STANDARD.md`를 직접 열어 재확인한다**(#82 · 884 전례: Cowork이 읽었다고 한 것이 실제와 달랐던 적이 있다).
🔴 **재확인 결과가 다르면 다르다고 적고 그 값으로 진행한다.**

### Cowork이 읽은 것 (2026-08-06)

| 위치 | 내용 |
|---|---|
| 파일 머리 | `<!-- 2026-07-29 · STEP 812 신설 -->` · 제목 **「렌즈 완성 기준 (Definition of Done) + 3중 검증 규칙」** |
| **왜** 절 | *"**7렌즈**를 한꺼번에 만든 결과 열 라운드에 걸쳐 전부에서 결함이 드러났다(…) 새 렌즈 전에 **기존 7개를 하나씩 완결**하고, 그 전에 '완성'의 정의를 세운다."* |
| 현황표 제목 | **「완성 현황표 (렌즈 7 × 항목 9)」** |
| 현황표 8행째 | **「역DCF(모델·US 전용)」** — 🔑 **문서 자신이 US 전용으로 표시** |
| **DoD 7** | *"**화면 일관성** — 카드·목록·**변화 피드·이메일·브리핑**에서 같은 이름·판정·단위."* |
| **DoD 9** | *"**라이브 실측** — **KR**·US 각 2종목."* |

## §1 — 🔴 세 가지 사실 (🔴 판정하지 말고 사실로만 적을 것)

### 1. 문서의 성격

🔑 **이 문서는 7렌즈용으로 신설됐고**(STEP 812 · "왜" 절), 현황표도 **렌즈 7 × 항목 9**로 제목이 붙어 있다. **역DCF는 8번째 행으로 나중에 얹혔다.**
🔴 **역DCF가 언제 그 표에 추가됐는지 `git log`/`CHANGELOG`로 확인**한다. 🔴 **못 찾으면 "못 찾음"으로 적는다.**

### 2. DoD 9와 「US 전용」의 충돌

**DoD 9 = *"라이브 실측 — KR·US 각 2종목"*** · 같은 문서의 현황표는 역DCF를 **「모델·US 전용」**으로 표시.
🔴 **US 전용 모델에 KR 2종목은 원리적으로 충족 불가**라는 사실을 적는다.
🔴 **Cowork 실측(2026-08-06)**: Preview에서 KR 종목(SK하이닉스 `000660`) 페이지는 **정상 렌더**되고 7렌즈 전부 표시되나 **역DCF 카드는 없다**(7렌즈 종합 카드 다음 바로 푸터). `/revdcf` 방법론 페이지의 *"미국 거래소(NYSE·나스닥 등) 상장 종목만 계산합니다"*와 정합.
🔴 **"그러므로 DoD9을 고쳐야 한다"고 쓰지 말 것.** 🔑 **사실만.**

### 3. DoD 7의 다섯 표면 중 셋이 N/A

**DoD 7 = *"카드·목록·변화 피드·이메일·브리핑"*** · 🔑 **925 확인**: 역DCF는 **변화 피드·이메일·브리핑에 나오지 않는다(N/A)**.
🔴 **925의 그 확인을 직접 재인용**한다(문구 그대로). 🔴 **다르면 다르다고 적는다.**

## §2 — 🔴 모호함 3건이 같은 원인이라는 사실

| STEP | 발견 | 내용 |
|---|---|---|
| 923 | DoD 7 *"같은 이름"* | **무엇의 이름인지 원문에 추가 정의 없음**(`:24` 확인 · 판정라벨/종목명 둘 다 가능) |
| 928 | DoD 9 *"라이브"* | **원문에 "production" 단어 없음** — 921 §4의 *"원문이 production 노출을 뜻한다"*는 **원문 인용이 아니라 921의 해석**이었음 |
| 929 | DoD 9 *"KR"* | **US 전용 모델에 KR 요구** — 같은 문서가 역DCF를 「US 전용」으로 표시 |

🔑 **세 건 모두 "7렌즈용으로 쓰인 문구를 역DCF에 적용할 때" 나온다.** 🔴 **이 관찰을 사실로 적되, 원인을 단정하지 말 것** — 🔑 **문서를 그렇게 쓴 의도가 무엇이었는지는 이 STEP이 알 수 없다.**

## §3 — 판정서 (`docs/DECISION_929_DOD_SCOPE.md` 신설)

🔴 **사실 문서다. 권고를 쓰지 말 것.** 🔴 **선택지를 나열하되 어느 것도 권하지 말 것.**

- **§0~§2 사실**(원문 인용 · Cowork 실측 · 3건 표)
- 🔴 **현재 승인된 정의와의 관계** — 921에서 장은태가 *"DoD9 제외 8항목"*을 승인했다. 🔴 **§1-2 사실이 그 승인과 정합한다는 것만 적고**, 🔴 **"그래서 옳았다"거나 "그러니 더 빼야 한다"고 쓰지 말 것.**
- 🔴 **DoD7의 현재 상태** — 923에서 재개방(종목명), 924·926으로 표시는 수정됨, 🔴 **"같은 이름" 해석은 여전히 미결**. §1-3(셋이 N/A)을 **추가 사실로만** 붙인다.
- 🔴 **장은태가 정할 수 있는 것을 질문 형태로만 나열**한다(🔴 답을 쓰지 말 것):
  - 역DCF에 DoD 9항목을 **그대로** 적용할 것인가, **적용 가능한 항목만** 볼 것인가.
  - DoD 7의 다섯 표면 중 역DCF에 **해당하는 둘**만으로 판정할 것인가.
  - DoD 9를 역DCF에 대해 **US 2종목만**으로 읽을 것인가.
  - 🔴 **각 질문이 무엇을 바꾸는지**는 적되 🔴 **어느 쪽이 낫다고 쓰지 말 것.**
- 🔴 **완성까지 남은 것 현재 상태**: `#70`(결정형) · `#71`(🟢 928 소진) · `#74`(승인 완료) · **DoD7**(미결). 🔴 **각 항목 상태만.**

## §4 — 🔴 문서 갱신

🔴 **각 문서를 열어 실제 문구를 확인하고 고친다.** 🔴 **취소선 보존** · 🔴 **줄 번호를 믿지 말고 내용으로 찾는다**(878).

1. `docs/LENS_COMPLETION_STANDARD.md` — 🔴 **DoD 정의와 판정 칸은 절대 건드리지 말 것.** 🔑 **역DCF 행 각주에만** *"929: 이 기준표는 7렌즈용으로 신설(STEP 812)됐고 역DCF는 뒤에 추가됨 · DoD7·DoD9 문구가 역DCF에 적용될 때의 사실은 `DECISION_929_DOD_SCOPE.md`"* 수준의 **포인터 한 줄**을 추가한다.
2. `docs/DECISION_921_COMPLETION.md` — 🔴 **본문 불변** · §4의 *"원문이 production 노출을 뜻한다"*가 **해석이었다는 928 정정**에 §1-2 사실을 **덧붙이기만** 한다.
3. `docs/DECISION_923_NAMING.md` — DoD7 관련 §1-3 사실 추가(🔴 본문 불변).
4. `docs/REVDCF_SPEC.md` §11 · `docs/STATE.md`(🔴 **142줄 상한** · 🔴 **22:45 UTC 크론 관측 대기 유지**) · `docs/CHANGELOG.md`

## §5 — 🔴 플레이북

> 🔑 **다른 것을 위해 쓰인 기준을 새 대상에 적용하면, 안 맞는 자리가 하나씩 따로 나타난다.** `LENS_COMPLETION_STANDARD.md`는 7렌즈용으로 신설됐고 역DCF가 뒤에 얹혔다. 그 결과 **923(DoD7 "같은 이름")·928(DoD9 "production")·929(DoD9 "KR")이 각각 독립된 모호함으로 보였지만 원인은 하나였다.** 🔴 **원문의 문구가 대상에 안 맞을 때는 그 문구만 보지 말고 "이 문서가 누구를 위해 쓰였는가"를 먼저 확인한다.**

## §6 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git diff HEAD -- docs/LENS_COMPLETION_STANDARD.md    # 🔴 육안 확인 — 각주 포인터 1줄 외에 변경이 있으면 되돌린다
git status --porcelain                                # 🔴 ?? 0건
```

🔴 **DoD 정의나 판정 칸에 diff가 나오면 되돌리고 보고한다.**
🔴 **push 전에 `git pull --rebase`가 필요할 수 있다**(925 전례). 🔴 **충돌이 나면 중단하고 보고한다.**
🔴 **커밋 메시지는 §0 재확인 결과에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것** — 913·914·916·919·926 전례. **초안은 매번 틀렸다.**

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 929: record that the completion standard was written for the seven lenses, and what that explains

- the file says so in its own opening: it was created because seven lenses shipped with defects, to
  define what finishing one means, and its table is titled seven lenses by nine items
- the reverse-DCF sits in that table as an eighth row labelled US-only, while the ninth item asks
  for two Korean names and two American ones, which the model cannot supply by construction
- a Korean page was opened on the preview deployment: it renders, the seven lenses are all there,
  and the reverse-DCF card is not, matching what the methodology page already discloses
- three separate ambiguities found over three steps turn out to share this one cause, and that is
  written down as an observation rather than as a reason to rewrite anything
- no definition is changed, no verdict cell is touched, and the approved reading of finished stays
  exactly as it was approved"
git push && git push origin main:revdcf-preview
```

## §7 — 보고 후 멈춘다

```
§0 🔴 원문 직접 재확인 결과(Cowork이 읽은 표와 같은가 다른가)
   🔴 역DCF가 현황표에 언제 추가됐는지(못 찾으면 "못 찾음")
§1 세 가지 사실 — 문서 성격 · DoD9 vs US전용 충돌 · DoD7 다섯 중 셋 N/A
   🔴 925 문구 직접 재인용 · 🔴 "고쳐야 한다"고 안 썼는지
§2 모호함 3건 표 · 🔴 원인 단정 안 했는지
§3 DECISION_929 신설 — 🔴 권고 없음 · 🔴 질문만 나열 · 🔴 답 안 씀
   🔴 921 승인과의 관계를 "정합한다"까지만 적었는지
§4 LENS_COMPLETION_STANDARD 각주 포인터 1줄만 · 🔴 정의·판정 칸 불변(git diff 육안)
   DECISION_921·923 사실 추가(🔴 본문 불변)
§5 플레이북 1건
무변경: 🔴 DoD 정의·판정 칸 전부 불변 · 🔴 승인된 완성 정의 불변
       코드 diff 0 · 환경변수 변경 0 · 재배포 0 · REVDCF_ENABLED Production OFF
       ②단계 미착수 · 안건 3 대기 불변 · 크론 미실행 · 메일 발송 0 · DB 쓰기 0
tsc 0 · test ?/? · push ?(🔴 rebase 필요했는지) · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **DoD 정의를 고치지 말 것. 판정 칸을 바꾸지 말 것. 승인된 완성 정의를 바꾸지 말 것. 권고하지 말 것. 질문에 답하지 말 것. 코드를 고치지 말 것. `REVDCF_ENABLED` Production을 켜지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
