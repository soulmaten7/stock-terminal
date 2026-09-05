# STEP 927 — 🔴 **`#71` 원인 확정**: Preview 500 = Supabase 환경변수 Preview 스코프 부재 (기록만 · 수리는 장은태)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_927_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `99054af`(STEP 926 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 3,020 · `us_market_cap` 5,892 · `lens_cuts` 10행 · `cron_heartbeats` 1행

🔴 **불변 금지선**: 🔑 **`REVDCF_ENABLED`를 켜지 말 것** · **환경변수를 만들거나 고치지 말 것**(🔑 **Claude Code도 Cowork도 API 키를 다루지 않는다 — 장은태 몫**) · DB **쓰기 금지** · **크론 수동 실행 금지** · **메일 발송 금지** · `lib/**`·`app/**`·`components/**`·`messages/**` 수정 금지 · `data/us_symbols.json`·`.github/workflows/**`·`vercel.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **이 STEP은 문서만 고친다. 코드 diff 0.**
🔴 **DoD 판정 칸을 바꾸지 말 것** · **②단계(증액) 시작 금지** · **안건 3 대기 유지**(22:45 UTC 크론 관측).
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🔴 Cowork 실측 (2026-08-06 · 인증된 브라우저)

`#71`(Preview 500)은 897·898에서 **B판정**으로 막혔고, 921이 *"revdcf-preview는 '없음'이 아니라 '이미 정의됐지만 못 씀'"*으로, 923·925가 **원인 미규명**으로 남겼다. 🔑 **Cowork이 브라우저로 재현하고 로그를 읽어 확정했다.**

### 확인 순서 (전부 읽기 · 배포·설정 변경 0)

| 단계 | 관측 |
|---|---|
| Vercel Deployments | 🔑 **`revdcf-preview` Preview 배포가 전부 `Ready`** — **빌드는 성공한다** |
| Preview URL 접속 | `stock-terminal-git-revdcf-preview-toms-projects-c798474e.vercel.app` → 🔴 **`Internal Server Error`(500) 재현** |
| Runtime Logs(요청 직후, 보존 1시간 내) | 🔴 **`Error: Your project's URL and Key are required to create a Supabase client!`** |
| 로그 상세 | **Middleware 500** · **Execution Duration 10ms** · **External APIs: No outgoing requests** · Environment `preview` · Branch `revdcf-preview` |
| 환경변수 스코프(값 미열람 · 마스킹 상태) | 🔴 **`NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY`·`SUPABASE_SERVICE_ROLE_KEY`·`DATABASE_URL` 등이 전부 `Production` 전용** |
| 대조 | `REVDCF_ENABLED`는 **`Preview` 전용**(Aug 1 추가) · Sentry 4종·`EDINET_API_KEY`는 **Production and Preview** |

### 🔴 원인 = 확정

🔑 **middleware가 Supabase 클라이언트를 만들 때 URL/Key가 없어 즉시 던진다.** 🔑 **10ms·외부 호출 0건이 이를 뒷받침한다 — 네트워크 이전 단계다.**

🔑 **아이러니를 기록할 것**: `REVDCF_ENABLED`는 **Preview에만** 켜져 있다. 🔴 **역DCF를 보려고 만든 환경인데 Supabase가 없어 페이지 자체가 뜨지 않는다.**

## §1 — 🔴 처방 (🔑 **Claude Code가 실행하지 말 것 — 장은태 몫**)

🔑 **환경변수 추가는 API 키를 다루는 행위다. Cowork도 Claude Code도 하지 않는다.** 🔴 **아래를 문서에 적기만 한다.**

### 1단계 — 위험 0 (먼저 이것만)

**`NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY` 두 개를 Preview 스코프에 추가.**

🔑 **왜 위험 0인가**: `NEXT_PUBLIC_` 접두어라 **이미 Production 사이트의 브라우저 번들에 들어가 있는 공개 값**이다. Supabase는 anon key가 공개되는 것을 **전제로 설계**되어 RLS로 보호한다. 🔴 **새로운 노출이 아니다.**

**방법**: Vercel → Settings → Environment Variables → 해당 변수 「•••」 → Edit → Environment에 **Preview 체크** 추가 → Save → 🔴 **`revdcf-preview` 재배포**(환경변수는 기존 배포에 소급 적용되지 않는다).

### 2단계 — 1단계 후에만 판단

🔴 **재배포 후에도 500이면** 로그를 다시 읽어 **서버 전용 키**(`SUPABASE_SERVICE_ROLE_KEY`·`DATABASE_URL`)가 필요한지 확인한다.
🔴 **필요하더라도 자동으로 추가하지 말 것** — 🔑 **`service_role`은 RLS를 우회하는 마스터 키다.** Preview에 두면 **Deployment Protection에 전적으로 의존**하게 된다. 🔴 **그 위험 판단은 별도이고 장은태 몫이다.**

## §2 — 🔴 문서 갱신 (여러 곳에 "미규명"으로 박혀 있다)

🔴 **각 문서를 열어 실제 문구를 확인하고 고친다.** 🔴 **취소선 보존.** 🔴 **줄 번호를 믿지 말고 내용으로 찾는다**(878).

1. `docs/REVDCF_SPEC.md` §10 `#71` — **원인 확정**으로 갱신. 🔴 **소진 처리하지 말 것 — 아직 안 고쳐졌다.** 상태는 *"원인 확정 · 수리 미실행(장은태 환경변수 작업 대기)"*.
2. `docs/DECISION_921_COMPLETION.md` — 🔑 **921 §2가 *"revdcf-preview로는 순환을 못 깬다"*고 적었다.** 🔴 **그 판단의 전제가 바뀌었다**: 못 쓰는 이유가 **환경변수 2개**였다. 🔴 **정정을 추가하되 921 본문은 고치지 말 것**(907 전례). 🔴 **"순환을 깰 수 있다"고 단정하지 말 것** — 🔑 **1단계 후 실제로 페이지가 뜨는지 봐야 안다.**
3. `docs/DECISION_923_NAMING.md`·`docs/DECISION_925_BRIEF.md`에 `#71` 관련 서술이 있으면 정정.
4. `docs/STATE.md` §9(인프라 미확정)·보류/다음 항목 — 🔴 **142줄 상한** · 🔴 **22:45 UTC 크론 관측 대기 유지.**
5. `docs/AUDIT_904_OPEN_ITEMS.md`에 `#71`이 있으면 갱신.

## §3 — 🔴 완성까지 남은 것 재계산

승인된 정의(921·장은태): **"모델 완성" = DoD9 제외 8항목 닫힘.**

🔴 **현재 상태를 사실로 적는다**:
- `#70` — 결정형(921: 비용 0)
- `#71` — 🔴 **원인 확정 · 수리 대기**(더 이상 "모름"이 아니다)
- `#74` — 승인 완료(922)
- **DoD7** — 923에서 재개방(종목명) · 924·926으로 표시는 고쳐짐 · 🔴 **원문의 "같은 이름" 해석이 모호해 미결**(923)

🔴 **DoD7과 `#71`을 임의로 닫지 말 것.** 🔴 **"이제 X만 남았다"고 단정하지 말고 각 항목의 상태만 적는다.**

## §4 — 문서 · 검증 · 커밋

- 🔴 **`docs/LENS_DEV_PLAYBOOK.md` 신규**:
  > 🔑 **로그가 1시간만 사는 것이 문제라면, 지금 요청을 만들면 된다.** `#71`은 여러 STEP 동안 *"원인 미규명"*이었는데, **브라우저로 그 URL을 한 번 열자 로그가 생겼고 한 줄로 확정됐다.** 🔴 **재현 가능한 실패는 "실행 시각을 기다리는 대상"이 아니라 "지금 만들 수 있는 관측"이다.** **이력**: 897·898(B판정) → 921(못 씀) → 923·925(미규명) → 927(확정).
- 🔴 **`docs/LENS_DEV_PLAYBOOK.md` 신규 2**:
  > 🔑 **환경변수는 스코프가 있다.** Production에서 되는 것이 Preview에서 안 되면 **코드가 아니라 스코프를 먼저 본다.** 🔴 **`NEXT_PUBLIC_` 접두어 변수와 서버 전용 비밀은 추가 위험이 전혀 다르다** — 전자는 이미 공개, 후자는 RLS 우회 권한.
- `docs/CHANGELOG.md`

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git status --porcelain                                                                # 🔴 ?? 0건
```

🔴 **코드에 diff가 나오면 이 STEP의 범위를 넘은 것이다 — 되돌리고 보고한다.**
🔴 **push 전에 `git pull --rebase`가 필요할 수 있다**(925 전례: GH Actions 봇의 `data/us_symbols.json` 갱신). 🔴 **충돌이 나면 중단하고 보고한다.**
🔴 **커밋 메시지는 §2에서 실제로 고친 문서에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것** — 913 대폭 재작성 · 914 프로브 버그 2건 · 916 유니버스 가설 기각 · 919 `lib/` 충돌 재설계 · 926이 925의 탐지 기준 오류 정정. **초안은 매번 틀렸다.**

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 927: name the cause of the preview five hundred, which was two environment variables all along

- the preview builds succeed and have always succeeded; opening one in a browser reproduces the
  error and the log written by that very request says the database client cannot be constructed
  without a url and a key
- it fails in middleware after ten milliseconds with no outgoing request at all, which places it
  before any network call rather than at one
- the variables exist, scoped to production only, while the flag that makes this feature visible
  is scoped to preview only: the environment built to look at it cannot reach the data
- nothing is changed here. adding those values is handling keys, which is not ours to do, and the
  two public ones carry different risk from the one that bypasses row level security
- an earlier step ruled this branch out as a way around the completion circle on the grounds that
  it did not work; why it did not work is now known, and whether it works is still unobserved"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§0 실측 표 등재 · 🔴 원인 확정 문구
§2 🔴 #71 갱신(🔴 소진 처리 안 함) · DECISION_921 정정 추가(🔴 본문 불변)
   🔴 "순환을 깰 수 있다"고 단정 안 했는지 · 다른 문서의 #71 서술 정정
   STATE §9 갱신 · 🔴 142줄 상한
§3 🔴 완성까지 남은 것 — #70·#71·#74·DoD7 각각의 현재 상태(🔴 단정 없이)
§4 플레이북 2건
무변경: 🔴 코드 diff 0 · 환경변수 미접촉 · REVDCF_ENABLED Production OFF
       DoD 판정 칸 전부 불변 · ②단계 미착수 · 안건 3 대기 불변
       크론 미실행 · 메일 발송 0 · DB 쓰기 0
tsc 0 · test ?/? · push ?(🔴 rebase 필요했는지) · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **환경변수를 만들거나 고치지 말 것. 재배포하지 말 것. 코드를 고치지 말 것. `#71`을 소진 처리하지 말 것. DoD7·DoD9을 판정하지 말 것. `REVDCF_ENABLED`를 켜지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
