# STEP 897 — 화면을 볼 방법이 있는가 · `revdcf-preview` 정체 · DoD 5 재판정

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_897_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `18f05c5`(STEP 896 · `main`·`revdcf-preview` 동일) · tsc 0 · test **169/169** · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: 🔴 **`REVDCF_ENABLED`를 프로덕션·프리뷰 환경변수에서 켜지 말 것**(장은태 승인 사항) · `revdcf_results`·`us_market_cap`·`lens_scores` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json`·`.github/workflows/**`·`lib/lensPrecompute.ts` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 왜 이 STEP인가

895가 DoD 5를 🔶로 유지한 사유는 **둘**이었고, 896이 **둘 다 고쳤다**(오표시 폴백 · `MISSING_TAG` 3분기).
🔴 **그런데 895의 불리한 사실에 하나가 더 있었다**: *"라이브 렌더로 실제 화면이 어떻게 보이는지는 검증 못 했다(플래그 OFF)."* **896으로 풀리지 않는다.**

🔑 **그리고 이건 DoD 5만의 문제가 아니다. 5·7·9가 전부 "화면을 못 본다"에 걸려 있다.** 그 전제부터 확인한다.

### 🔴 Cowork 사전 확인

- `lib/revdcf/flag.ts`: `process.env.REVDCF_ENABLED === "true"` · **서버 env만**(`NEXT_PUBLIC_` 금지 — 빌드캐시 함정)
- 🔴 **`revdcf-preview` 브랜치의 목적이 어느 문서에도 없다.** `docs/*.md`·`CLAUDE.md` grep 결과 `STATE.md`의 *"push 완료"* 한 줄뿐. **866부터 매 STEP 푸시하고 있는데 왜 있는지가 안 적혀 있다.**
- Vercel MCP는 조회 시 **rate-limit**이라 Cowork이 직접 확인하지 못했다(892도 `list_teams()→[]`).

## §1 — 🔴 `revdcf-preview`는 무엇인가

1. **`.vercel/project.json`**이 있는가. 있으면 `projectId`·`orgId`를 확인한다(🔴 **파일을 수정하지 말 것**).
2. **그 브랜치에 Vercel 프리뷰 배포가 붙는가** — 배포 목록·URL을 확인한다. 🔴 **Vercel MCP가 rate-limit이면 `vercel` CLI 또는 대시보드 확인이 필요하다고 적고, 안 되면 "확인 불가"로 남긴다.** 추정 금지.
3. **그 환경에 `REVDCF_ENABLED`가 설정돼 있는가.** 🔴 **읽기만.** 없으면 없다고 적는다.
4. 🔴 **결과에 따라**:
   - **프리뷰에서 켜져 있다** → 🔑 **화면을 볼 수 있었다.** 866~896이 *"검증 불가"*로 적어온 것이 **사실이 아니었다.** 그 사실을 정정하고 어느 문서들이 그렇게 적었는지 **#80 절차로 전수 목록화**한다.
   - **안 켜져 있다 / 배포가 없다** → 그 브랜치는 지금 **무엇을 하고 있는가.** 🔴 목적을 문서에 적는다(없으면 *"목적 미상 — 866부터 관행적으로 푸시"*라고 정직하게).
   - **확인 불가** → 그렇게 적고 §2로 간다.

🔴 **`REVDCF_ENABLED`를 켜지 말 것.** 확인만 한다.

## §2 — 로컬에서 볼 방법

프로덕션·프리뷰를 안 건드리고도 **로컬 dev에서 플래그를 켜서** 렌더를 볼 수 있는지 확인한다.

- `REVDCF_ENABLED=true`를 **로컬 환경에서만** 주고 `npm run dev`로 `/revdcf`와 종목 상세를 띄운다. 🔴 **`.env.local`에 영구 기록하지 말 것** — 셸 1회성으로. 🔴 **커밋에 들어가지 않게 한다.**
- 🔴 **확인할 것**(896이 만든 것들이 실제로 보이는가):
  - 스킵 사유별 문구 — 특히 **`MULTI_CLASS_SHARES`(오늘 5건 실발생)**가 이제 맞는 문구로 뜨는가
  - **`unspecified` 폴백**이 어떻게 보이는가
  - `MISSING_TAG` 3분기가 각각 다른 문구로 뜨는가 · **과거 행의 `MISSING_TAG`**도 문구가 남아 있는가
  - 889가 고친 배지·색 — `value_destroying`가 **danger가 아닌 색**으로 보이는가
  - 4-1의 **WACC 원장 행**이 방법론 페이지에 보이는가
- 🔴 **스크린샷을 남긴다면 커밋하지 말 것**(용량·이력). 보고에 **글로 서술**한다.
- 🔴 **로컬 렌더 ≠ 프로덕션 렌더.** 이 한계를 판정에 반드시 적는다.

## §3 — 🔴 DoD 5 재판정

895 판정을 **다시 연다.** 사유 둘이 896으로 해소됐고, §1·§2가 세 번째(화면 검증)를 다뤘다.

> **③판정**: ✅ 또는 🔶 유지 — 🔴 **하나만**
> **근거**: 각 근거는 **896의 변경 또는 §1·§2의 확인**에 걸릴 것
> **🔴 대가** · **🔴 불리한 사실** · **🔴 재검토 조건**

🔴 **반드시 다룰 것**:
1. **895가 든 사유 둘이 실제로 해소됐는지** — 896 보고를 믿지 말고 **코드로 확인**한다(플레이북 #82).
2. **화면 검증을 §2로 대체할 수 있는가** — 로컬 렌더가 DoD 5의 *"결측 표기"* 요건을 충족하는가. 🔴 **7렌즈는 라이브에서 검증받았다**(812~818). **다른 기준을 적용하는 것이면 그렇게 명시한다.**
3. 🔴 **자기가 고친 것을 자기가 채점하는 구조**임을 인식하고, 판정 근거를 **896의 자기보고가 아니라 독립 확인**에 건다.

🔴 **DoD 7·9는 판정하지 말 것.** 그 둘은 프로덕션 노출이 전제이고 **플래그를 켜는 것은 장은태 승인 사항**이다.

## §4 — 문서 · 검증 · 커밋

- `docs/AUDIT_895_SKIP_REASONS.md` — 896 반영 후 상태로 갱신(🔴 정본 유지)
- `docs/LENS_COMPLETION_STANDARD.md` — DoD 5 판정 · 🔴 **7·9는 불변**
- `docs/REVDCF_SPEC.md` — **`revdcf-preview` 브랜치 목적**을 §4 또는 운영 절에 기록(§1 결과대로) · §10 갱신
- `docs/STATE.md` 🔴 142줄 상한 · `docs/CHANGELOG.md`
- 🔴 §1에서 *"검증 불가"* 오기재가 발견되면 **#80 절차로 전수 정정**하고 목록을 보고에 싣는다.

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/   # 🔴 출력 없어야 함
grep -rn "REVDCF_ENABLED" .env* 2>/dev/null                              # 🔴 로컬 잔재 0건
git status --porcelain                                                   # 🔴 ?? 0건
```

🔴 **커밋 메시지는 §3 판정 결과에 맞게 실행 측이 고쳐 쓴다**(894 교훈). 아래는 초안이며 판정이 다르게 나면 다시 쓰고 그 사실을 보고한다.

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 897: find out whether the screen was ever unviewable, before judging the item that depends on it

- every step since the audit recorded that the rendering could not be checked because the
  feature sits behind a flag, and a branch has been pushed to on every one of them with no
  document anywhere saying what that branch is for
- so the branch is identified first, and whether a preview of it carries the flag decides
  whether that recorded limitation was ever true
- the boundary item is then rejudged against what can actually be seen, with the difference
  between a local render and a deployed one stated rather than glossed
- the flag is not turned on anywhere; that decision is not this step's to make"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§1 .vercel/project.json 유무 · 프리뷰 배포 유무·URL · REVDCF_ENABLED 설정 유무
   🔴 "검증 불가" 오기재였는가 — 맞으면 전수 목록 + 정정
   🔴 확인 불가면 무엇이 막았는가 · revdcf-preview 목적 기록 내용
§2 로컬 렌더 결과 — MULTI_CLASS_SHARES 5건 문구 · unspecified 폴백 · MISSING_TAG 3분기
   과거 행 MISSING_TAG 문구 잔존 · 배지 색 · WACC 원장 행
   🔴 .env 잔재 0건 확인
§3 🔴 DoD 5 판정 + 근거·대가·불리한사실·재검토조건
   🔴 895 사유 둘의 해소를 독립 확인했는가(896 자기보고 아님)
   🔴 로컬 렌더를 7렌즈 라이브 검증과 다른 기준으로 쓴다면 명시했는가
§4 revdcf-preview 목적 문서화 · AUDIT_895 갱신
무변경: lib/app/components/messages/data/.github diff 0 · DoD 7·9 불변 · 🔴 플래그 OFF 유지
       REVDCF_ENABLED 프로덕션·프리뷰 미변경 · 크론 미실행 · DB 쓰기 0
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **플래그를 어디서도 켜지 말 것. DoD 7·9를 판정하지 말 것. `.env.local`에 플래그를 남기지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
