# STEP 898 — 🔴 Cowork 브라우저 육안 검증 결과 반영 · 방법론 표 가독성 결함

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_898_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `52a9ec4`(STEP 897 · `main`·`revdcf-preview` 동일) · tsc 0 · test 169/169 · `REVDCF_ENABLED` **Production OFF · Preview true** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: 🔴 **`REVDCF_ENABLED` Production을 켜지 말 것** · `revdcf_results`·`us_market_cap`·`lens_scores` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**`·`lib/lensPrecompute.ts` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 Cowork이 브라우저로 직접 본 것 (897의 "구조적 한계"가 풀렸다)

897 못 한 것: *"브라우저 자동화 도구가 없어 `RevDcfSection`의 실제 DOM 렌더는 **한 번도 육안으로 못 봄** — 구조적 한계며 이번에도 못 풂."*

🔑 **Cowork에게는 브라우저 도구가 있다.** 2026-08-04 직접 확인했다. **이 절은 실측이지 추정이 아니다.**

### 확정된 것

| # | 확인 | 결과 |
|---|---|---|
| 1 | Preview URL `/revdcf` | 🔴 **`Internal Server Error`(500)** — 897의 *"Supabase env 부재로 작동 불능 **추론**"*이 **실측으로 확정**됐다 |
| 2 | Vercel SSO 벽 | 🔴 **인증된 브라우저는 통과한다.** 897이 *"curl 포함 전부 차단"*이라 한 것은 **익명 접근 기준**이었다 — 두 겹 중 첫 겹은 벽이 아니다 |
| 3 | 로컬 `/revdcf` | ✅ 정상 렌더 |
| 4 | `repro` 문구 | ✅ **T8 기준 8년 · T7 기준 7년이 둘 다 화면에 있다**(882·889 요구 충족) |
| 5 | 원장 표 **자본비용 행** | ✅ **실제로 렌더된다**(889 §4-1). *"차이의 대부분은 방법이 아니라 금리 시점"* + **업종 근사 미측정**까지 노출 |
| 6 | 세율 행 | ✅ 887 재분류(*"방법이 다른 게 아니라 값의 시점이 다릅니다"*)가 화면에 반영 |
| 7 | 로컬 `/stock/AM`(과거 `MISSING_TAG` 행) | ✅ *"필요한 재무 항목이 5년치 확보되지 않았습니다"* — **896이 옛 코드용으로 남긴 문구가 작동한다** |

### 🔴 발견된 결함

**방법론 페이지 `원전과 다른 점` 표 — 첫 열(`항목`)이 좁아 단어가 쪼개진다.**

```
성장률       → 성장 / 률
운전자본     → 운전 / 자본
증분재투자율 → 증분 / 재투 / 자율     ← 🔴
자본비용     → 자본 / 비용
터미널       → 터미 / 널
```

🔑 **`증분재투자율`이 `증분 재투 자율`로 보인다. "자율"은 전혀 다른 단어다 — 미관이 아니라 오독 유발이다.**

## §1 — 표 가독성 수정

- 🔴 **문구를 바꾸지 말 것.** `messages/*.json`의 `RevDcfMethod.row.*.i` 값은 **그대로 둔다**(889가 원칙으로 정한 것이다).
- **레이아웃만** 고친다 — 첫 열 최소폭 확보 또는 줄바꿈 억제. 🔴 **좁은 화면에서 표가 깨지지 않는지 함께 본다**(모바일 풀블리드 선례 — `CLAUDE.md` 2026-07-17).
- 🔴 **다른 표·다른 렌즈에 닿지 않게** 한다. 변경 범위를 grep으로 확인하고 보고한다.
- 🔴 **`app/globals.css` 토큰 정의를 건드리지 말 것.**

## §2 — `revdcf-preview` 브랜치 판정 (§0 #1·#2 반영)

897이 목적을 문서화했으나, **Preview가 500이면 그 브랜치는 지금 아무 검증도 못 한다.**

🔴 **판정한다**(플레이북 #79 — 대기 금지):
- **A. Preview 스코프에 Supabase env를 넣는다** → 🔴 **이 STEP에서 하지 말 것.** env 변경은 장은태 승인 사항이다. **필요하면 권고만** 적는다.
- **B. 브랜치를 유지하되 "배포 검증용 아님"으로 문서에 명시**한다.
- **C. 다른 용도**(코드 보존·리뷰 등)를 적는다.

🔴 **하나를 고르고 근거를 적는다.** 🔴 **897이 적은 목적 서술과 모순되면 897 쪽을 정정한다**(#80 절차).

## §3 — 문서 반영

- `docs/REVDCF_SPEC.md` §11 실측 원장 — §0의 7건을 **육안 검증 실측**으로 등재(출처: Cowork 브라우저·2026-08-04). 🔴 **§10에 "Preview 500" 신규**.
- `docs/LENS_COMPLETION_STANDARD.md` — DoD 7(화면) 각주에 §0 결과 기록. 🔴 **DoD 7을 판정하지 말 것** — 크로스 서피스(카드·목록·배지·브리핑) 점검이 아직 남았다.
- 🔴 **897의 *"라이브 렌더 미검증"* 서술을 #80 절차로 전수 정정**한다 — 이제 일부는 검증됐다. 🔴 **전부 검증된 것은 아니므로**(신규 3분기 코드·`NO_MARKETCAP`·`EX`·`HTTP_*`는 **DB 행 0건**이라 여전히 미확인) **무엇이 검증됐고 무엇이 아닌지 나눠 적는다.**
- `docs/LENS_DEV_PLAYBOOK.md` 🔴 **신규**: *"Cowork과 Claude Code의 도구가 다르다. 한쪽이 '구조적으로 불가능'이라 적은 것이 다른 쪽에서는 가능할 수 있다 — 포기하기 전에 반대쪽 도구를 확인한다."*(897→898)
- `docs/STATE.md` 🔴 142줄 상한 · `docs/CHANGELOG.md`

## §4 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/api/ messages/ data/ .github/   # 🔴 출력 없어야 함
git status --porcelain                                            # 🔴 ?? 0건
```

🔴 **커밋 메시지는 §2 판정에 맞게 실행 측이 고쳐 쓴다**(894 교훈).

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 898: fix a table column that was splitting a word into a different word

- the rendering had never been looked at, and looking at it showed the first column too narrow
  to hold its labels: one of them breaks across lines into a word that means something else
- the wording is left exactly as it is, since it was chosen under a rule; only the column changes
- the preview deployment answers with a server error, which confirms as measurement what the
  previous step could only infer from reading code, so what that branch is for is settled here
- what was and was not verified by eye is recorded separately, because several skip reasons have
  no rows in the database yet and still cannot be seen"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§1 표 수정 내용 · 좁은 화면 확인 · 🔴 변경 범위 grep(다른 표·렌즈 무영향)
   🔴 messages/*.json 문구 무변경 확인
§2 revdcf-preview 판정(A/B/C 중 하나) + 근거 · 897 서술과 모순 시 정정 내역
§3 SPEC §11 육안 실측 7건 등재 · §10 "Preview 500" 신규
   🔴 "라이브 미검증" 전수 정정 — 검증된 것 / 아직 아닌 것 구분 목록
   플레이북 신규
무변경: lib/app/api/messages/data/.github diff 0 · DoD 판정 칸 불변(7 판정 안 함)
       REVDCF_ENABLED Production OFF 유지 · 크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **문구를 바꾸지 말 것. env를 바꾸지 말 것. DoD 7을 판정하지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
