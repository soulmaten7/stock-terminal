# STEP 920 — 🔴 Cowork 육안 실측: 한국어 표에서 **어절 중간 줄바꿈** 다수 (화면 수정 · 값 불변)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_920_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `93b2b15`(STEP 919 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 3,020 · `us_market_cap` 5,892 · `lens_cuts` 10행 · `cron_heartbeats` 2행

🔴 **불변 금지선**: `REVDCF_ENABLED` Production **OFF 유지** · DB **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**`·`vercel.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **`lib/**` 수정 금지 — 산식·917 계측 전부 불변.** `RETRY_MAX`·`RETRY_MS`·게이트·임계값(97/95)·`maxDuration` 불변 · **②단계(증액) 시작 금지** · **`#37`·`#43`용 화면 만들지 말 것** · 안건 3·4에 손대지 말 것.
🔴 **이 STEP은 표시(CSS/클래스)만 고친다. 문구·값·번역 내용 변경 0.**
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 Cowork 브라우저 실측 (2026-08-06 · `localhost:3333`)

919가 *"완전한 육안 검증은 아님"*으로 남긴 자리를 Cowork이 브라우저로 직접 봤다. 🔑 **897(브라우저 육안)·898(표 열 쪼개짐)·911(Vercel 대시보드)에 이어 네 번째로 같은 플레이북이 성립했다** — *"이 세션 도구의 한계 ≠ 시스템의 한계."*

**`/revdcf` 「원전과 다른 점」 표 · 한국어 · 뷰포트 폭 1568px**에서 **어절 중간에서 줄이 갈리는 곳**이 다수 관측됐다:

| 열 | 행 | 실제 렌더 | 갈린 어절 |
|---|---|---|---|
| 원전 | 세율 | `무차입 현금세` / `율` | **현금세율** |
| 원전 | 운전자본 | `한계형 · 무이` / `자 유동부채만` / `차감` | **무이자** |
| 원전 | 자본비용 | `(도미노는 벤` / `더 베타 1·실` / `제 채권` / `YTM)` | **벤더** · **실제** |
| 원전 | 자본비용 민감도 | `사용자가 스프` / `레드시트에서` | **스프레드시트** |
| 원전 | 분포 내 위치 | `없음 (종목 하` / `나만 분석)` | **하나만** |
| 우리 | 자본비용 | `업종 무차입 베타를 재레버` / `리지해 조립` | **재레버리지** |
| 우리 | 터미널 | `expected_inflation (다` / `모다란 DB)` | **다모다란** |

🔴 **영어(`/en/revdcf`)는 같은 위치에서 정상**이다 — 단어가 공백으로 갈려 어절 중간이 깨지지 않는다.

🔑 **그래서 이건 번역 문제도 문구 문제도 아니라 한국어(CJK) 줄바꿈 문제다.** 브라우저는 기본적으로 CJK를 **글자 단위**로 끊는다.

🔴 **위 표를 먼저 재현해 확인한다.** 🔴 **재현이 안 되면 안 된다고 적고 중단한다**(폭·폰트·브라우저에 따라 갈리는 위치가 달라질 수 있다).

## §1 — 🔴 원인 확인 (추정 금지)

1. **해당 표 컴포넌트를 열어** 현재 `word-break`·`overflow-wrap`·`white-space` 관련 클래스가 무엇인지 **그대로 적는다.**
2. 🔴 **898이 무엇을 어떻게 고쳤는지 확인한다** — *"증분재투자율" → "증분 재투 자율"* 을 `whitespace-nowrap`으로 막았다는 기록이 있다. 🔴 **그 클래스가 지금 어디에 붙어 있는지 코드로 확인**하고, 🔑 **개별 셀 대응이었는지 전역이었는지** 적는다.
3. 🔴 **`whitespace-nowrap`의 한계를 적는다** — 그건 **아예 줄바꿈을 막는 것**이라 좁은 화면에서 **셀이 넘치거나 표가 가로로 밀릴 수 있다.** 🔑 **어절 단위로 끊는 것과는 다른 처방이다.**

## §2 — 🔴 919가 만든 것인가, 원래 있던 것인가

🔑 **919는 "사유" 열에 긴 텍스트를 넣었다**(`#17` 병기 · `#29` 다모다란 경고). 🔴 **사유 열이 넓어지면 원전 열이 좁아져 없던 갈림이 드러날 수 있다.**

1. 🔴 **919 이전 커밋(`ab12d1e`)에서 같은 페이지를 띄워 §0 표가 재현되는지 본다.** 🔴 **`git stash`/별도 워크트리 등 안전한 방법으로** — 🔴 **`main` 상태를 망가뜨리지 말 것.**
2. 🔴 **결과를 세 갈래로 적는다**: 919 이전에도 있었다(919 무관) / 919가 드러냈다(원인은 폭 배분) / 919가 만들었다.
3. 🔴 **어느 쪽이든 고친다** — 🔑 **원인 귀속과 수리 여부는 별개다.** 다만 **기록은 정확히.**

## §3 — 🔴 수정

1. **한국어 줄바꿈을 어절 단위로** 바꾼다 — `word-break: keep-all`(Tailwind `break-keep`)이 표준 처방이다. 🔴 **실행 측이 코드베이스에 맞는 방식으로 판단해 적용**한다(Cowork이 클래스명을 지정하지 않는다).
2. 🔴 **적용 범위를 판단해 적는다** — 이 표만인가 / `/revdcf` 페이지 전체인가 / 전역인가. 🔑 **넓게 잡으면 다른 화면도 같이 고쳐지지만 의도치 않은 변화가 생길 수 있다.** 🔴 **좁게 시작하고 근거를 적는 쪽을 권한다.**
3. 🔴 **`keep-all`만으로는 긴 어절이 넘칠 수 있다** — 필요하면 `overflow-wrap`을 함께 준다. 🔴 **넘침이 생기는지 §4에서 확인한다.**
4. 🔴 **898의 `whitespace-nowrap`과 충돌하거나 중복되는지 확인**하고, 🔑 **`break-keep`으로 통일하는 것이 나은지 판단**한다. 🔴 **통일한다면 898이 막았던 "증분재투자율"이 여전히 안 갈리는지 §4에서 반드시 확인한다.**
5. 🔴 **문구·번역 내용은 한 글자도 바꾸지 말 것.** 🔴 **`messages/` diff가 나오면 되돌린다.**

## §4 — 🔴 육안 재검증

1. **로컬 dev를 띄운 채로 두고 보고한다** — 🔑 **Cowork이 브라우저로 직접 다시 본다.** 🔴 **포트와 URL을 보고에 적을 것**(919는 `localhost:3333`, `REVDCF_ENABLED=true`).
2. 🔴 **실행 측도 먼저 확인한다** — §0 표의 7곳이 해소됐는지, **898의 "증분재투자율"이 여전히 정상인지**, 🔴 **표가 가로로 넘치지 않는지.**
3. 🔴 **ko/en 둘 다** 본다. 🔴 **en이 나빠지지 않았는지** — `keep-all`은 영어엔 영향이 적지만 확인한다.
4. 🔴 **좁은 폭에서도 본다** — 🔑 **이 결함은 폭이 좁을수록 심해진다.** 🔴 **어느 폭에서 확인했는지 적는다.**

## §5 — 문서 · 검증 · 커밋

- `docs/CHANGELOG.md` · `docs/STATE.md`(🔴 142줄 상한)
- 🔴 **`docs/LENS_DEV_PLAYBOOK.md` 신규**:
  > 🔑 **한국어 화면은 렌더를 눈으로 봐야 한다.** 테스트(키 패리티·ICU·플레이스홀더)와 `curl` 텍스트는 **어절 중간 줄바꿈을 잡지 못한다** — 텍스트로는 멀쩡하고 픽셀에서만 깨지기 때문이다. **이력**: 898("증분재투자율" → "증분 재투 자율") · 920(원전 열 7곳). 🔴 **한국어 문구를 넣거나 표 폭 배분을 바꾼 STEP은 육안 검증을 붙인다.**
- 🔴 **`docs/REVDCF_SPEC.md` §11에 §0 실측 등재** · 🔴 **897·898·911·920으로 같은 플레이북이 네 번 성립했음을 기록.**

```bash
npx tsc --noEmit && npm run test          # 🔴 182/182 유지
git diff --stat HEAD -- lib/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git diff --stat HEAD -- messages/                          # 🔴 출력 없어야 함(문구 불변)
git status --porcelain                                     # 🔴 ?? 0건
```

🔴 **`messages/`에 diff가 나오면 문구를 건드린 것이다 — 되돌리고 보고한다.**
🔴 **커밋 메시지는 §2 결과와 §3 실제 적용 범위에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것** — 913 대폭 재작성 · 914 프로브 버그 2건 · 916 유니버스 가설 기각 · 919 `lib/` 충돌 재설계.

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 920: stop Korean words from breaking apart mid-word in the comparison table

- a browser was pointed at the page and the source column shows words split across lines at
  arbitrary characters, which the tests cannot see because the text is intact and only the pixels
  are wrong; the English column at the same widths is fine, since spaces give it somewhere to break
- whether the previous step caused this or merely revealed it by widening the column beside it is
  checked against the commit before it, and recorded either way
- the fix asks the browser to break Korean at word boundaries rather than at characters, which is
  a different instruction from forbidding breaks altogether — the approach taken for one cell
  earlier, and one that pushes the overflow somewhere else instead of removing it
- no wording changes, no translations touched, nothing computed moves"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§0 🔴 §0 표 7곳 재현 확인(재현 안 되면 "재현 안 됨"으로 중단)
§1 현재 word-break/overflow-wrap/white-space 클래스 그대로
   🔴 898이 붙인 whitespace-nowrap의 위치와 범위 · 그 방식의 한계
§2 🔴 919 이전 커밋에서 재현되는가 — 919 무관 / 919가 드러냄 / 919가 만듦
   🔴 main 상태 안 망가뜨렸는지
§3 적용한 방식과 🔴 적용 범위(표만/페이지/전역)와 근거
   🔴 898 whitespace-nowrap과 충돌·중복 여부 · 통일했는지
   🔴 messages/ diff 0(문구 불변)
§4 🔴 육안 재검증 — 7곳 해소 · "증분재투자율" 여전히 정상 · 가로 넘침 없음
   ko/en 둘 다 · 🔴 어느 폭에서 봤는지 · 🔴 dev 서버 URL/포트(Cowork이 다시 본다)
무변경: lib/ diff 0(산식·917 계측) · messages/ diff 0 · data/.github/vercel.json diff 0
       RETRY_MAX·RETRY_MS·게이트·임계값·maxDuration 불변 · ②단계 미착수
       #37·#43 화면 없음 유지 · DoD 판정 칸 전부 불변 · 안건 3·4 대기 불변
       REVDCF_ENABLED Production OFF · 크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **문구·번역을 바꾸지 말 것. 산식과 917 계측을 건드리지 말 것. ②단계를 시작하지 말 것. `#37`·`#43`용 화면을 만들지 말 것. 안건 3·4에 손대지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
