# STEP 928 — 🟢 **`#71` 수리 완료 기록** · 921 §2 정정 · DoD9 선택지 재개(판정 아님)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_928_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `c0d46e9`(STEP 927 · `main`·`revdcf-preview` 동일) · tsc 0 · test 182/182 · `REVDCF_ENABLED` Production **OFF** · `revdcf_results` 3,020 · `us_market_cap` 5,892 · `lens_cuts` 10행 · `cron_heartbeats` 1행

🔴 **불변 금지선**: 🔑 **`REVDCF_ENABLED` Production을 켜지 말 것**(🔴 **Preview 스코프에만 켜져 있다 — Production은 OFF 유지**) · **환경변수를 더 고치지 말 것** · **재배포하지 말 것** · DB **쓰기 금지** · **크론 수동 실행 금지** · **메일 발송 금지** · `lib/**`·`app/**`·`components/**`·`messages/**` 수정 금지 · `data/us_symbols.json`·`.github/workflows/**`·`vercel.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **이 STEP은 문서만 고친다. 코드 diff 0.**
🔴 **DoD 판정 칸을 바꾸지 말 것** · **DoD9을 판정하지 말 것** · **②단계(증액) 시작 금지** · **안건 3 대기 유지**(22:45 UTC 크론 관측).
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 🟢 수리 완료 실측 (Cowork · 장은태 승인 하 직접 조작 · 2026-08-06)

927이 원인을 확정했고, 장은태 승인을 받아 Cowork이 환경변수 스코프를 조정했다. 🔴 **값은 입력하지 않고 Environments 체크박스만 변경했다.**

### 조치

| 변수 | 이전 | 이후 | 승인 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production | **Production and Preview** | 1단계(위험 0 · 공개 값) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production | **Production and Preview** | 1단계 |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | **Production and Preview** | 🔴 **2단계 · 별도 승인** |

각 조치 후 `revdcf-preview` **재배포**(빌드 캐시 미사용).

### 🔴 에러가 단계적으로 바뀐 기록 (원인 분해의 증거)

1. **초기**: `Error: Your project's URL and Key are required to create a Supabase client!` · **Middleware 500** · 10ms · 외부 호출 0건
2. **1단계 후**: middleware 통과 → `Error: supabaseKey is required.` · **`/[locale]` SSR** · 클라이언트 사이드 예외로 표면화
3. **2단계 후**: 🟢 **정상 렌더**

🔑 **1·2단계가 각각 다른 계층을 고쳤다** — middleware는 `NEXT_PUBLIC_` 2개, 서버 컴포넌트는 `lib/supabase/admin.ts:6`의 `SUPABASE_SERVICE_ROLE_KEY`.

### 🔴 코드 근거 (device 저장소 직접 grep)

```
lib/supabase/server.ts:8-9     NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
lib/supabase/client.ts:3-4     동일
lib/supabase/anon-client.ts:5-6 동일
lib/supabase/admin.ts:5-6      NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY   ← 2단계의 원인
```

🔴 **이 grep 결과를 문서에 인용할 때 실행 측이 직접 재확인한다**(#82 · Cowork이 읽은 것을 그대로 믿지 말 것).

### 🔴 보안 판단 근거 (2단계)

- **Vercel Authentication = ON**(Standard Protection) — Preview는 **로그인한 팀 멤버만** 접근 가능(설정 페이지 실측).
- `SUPABASE_SERVICE_ROLE_KEY`는 **`NEXT_PUBLIC_` 아님** → 브라우저 번들에 안 들어감.
- 🔴 **남는 위험**: Preview 환경에 RLS 우회 키가 존재한다. 🔴 **이 사실을 문서에 남긴다.**

### 🟢 검증 (Cowork 브라우저 육안)

- `https://stock-terminal-git-revdcf-preview-...vercel.app/` → **홈 정상 렌더**(시장 지수·브리핑·미국/한국 목록 · 회사명 정상)
- `/stock/NVDA` → 🟢 **역DCF 카드 렌더**: 「기대 해독」 배지 · *"시장은 5년의 초과성장을 요구합니다"* · 3점 밴드(9.7%→5년 / **10.7% 기준→5년** / 11.7%→6년) · *"기대가 낮은 편 · 이 기법 성립 131개 중 97번째로 긴 기간"* · 드라이버 6개 · 각주 3줄
- 🔑 **로컬 dev(`localhost:3333`)와 동일한 출력.**

## §1 — 🔴 문서 갱신

🔴 **각 문서를 열어 실제 문구를 확인하고 고친다.** 🔴 **취소선 보존** · 🔴 **줄 번호를 믿지 말고 내용으로 찾는다**(878).

1. `docs/REVDCF_SPEC.md` §10 `#71` — 🟢 **소진 처리**. 🔴 **원인·처방·검증을 함께 남긴다**(§0). 🔴 **남는 위험도 함께.**
2. `docs/DECISION_921_COMPLETION.md` — 🔴 **§2의 *"revdcf-preview로는 순환을 못 깬다"* 판단을 정정한다**(🔴 **본문은 고치지 말고 정정 블록 추가** · 907 전례). 🔑 **못 쓰던 이유가 환경변수 스코프였고 이제 쓸 수 있다.**
3. `docs/DECISION_927_*`(927이 만든 문서가 있으면) — 수리 완료 반영.
4. `docs/STATE.md` §9 인프라 항목 · 🔴 **142줄 상한** · 🔴 **22:45 UTC 크론 관측 대기 유지.**
5. `docs/AUDIT_904_OPEN_ITEMS.md`에 `#71`이 있으면 소진 반영.

## §2 — 🔴 DoD9 선택지 재개 (사실만 · 판정 금지)

921에서 장은태가 승인한 정의: **"모델 완성" = DoD9 제외 8항목 닫힘.**
🔑 **그때 선택지 B("DoD9의 '라이브'를 Preview 실측으로 인정")는 *"Preview 500이 미해결이라 지금은 불가"*라는 이유로 배제됐다.** 🔴 **그 전제가 사라졌다.**

🔴 **다음을 사실로만 적는다. 🔴 판정하지 말 것. 🔴 승인된 정의를 바꾸지 말 것.**

1. **DoD9 원문**을 인용한다 — *"라이브 실측 KR·US 각 2종목"*(921 인용). 🔴 **원문에서 "라이브"가 production 노출을 의미한다고 명시하는지 다시 확인**한다. 🔑 **923이 DoD7의 "같은 이름"에서 겪었듯, 원문이 모호할 수 있다.**
2. 🔴 **Preview에서 DoD9을 충족할 수 있는지 사실로 적는다** — 🔑 **역DCF가 Preview에서 렌더되는 것은 실측됐다**(§0). 🔴 **KR 종목에서도 되는지는 미확인** — 확인하지 말고 "미확인"으로 적는다(별건).
3. 🔴 **선택지가 다시 몇 개가 되는지만 적는다.** 🔴 **"이제 9항목 전부 가능하다"고 단정하지 말 것.**
4. 🔴 **완성까지 남은 것 갱신** — `#70`(결정형) · `#71`(🟢 **소진**) · `#74`(승인 완료) · **DoD7**(923 재개방 · "같은 이름" 해석 모호로 미결). 🔴 **각 항목 상태만.**

## §3 — 🔴 플레이북

- 🔑 **환경변수 스코프 오류는 계층별로 다르게 드러난다.** middleware가 먼저 죽으면 그 뒤 계층의 결손은 안 보인다. 🔴 **하나를 고치면 다음 에러가 나오는 것이 정상이고, 그것은 실패가 아니라 분해다.** **이력**: 927(middleware) → 928(SSR admin 클라이언트).
- 🔑 **`NEXT_PUBLIC_` 접두어 유무가 위험 등급을 가른다.** 전자는 이미 브라우저에 있는 값이라 새 노출이 아니고, 후자는 서버 전용 비밀이다. 🔴 **한 묶음으로 처리하지 말고 단계를 나눈다** — 1단계가 어디까지 고치는지가 원인 분해의 관측이 된다.

## §4 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/ vercel.json   # 🔴 출력 없어야 함
git status --porcelain                                                                # 🔴 ?? 0건
```

🔴 **코드에 diff가 나오면 범위를 넘은 것이다 — 되돌리고 보고한다.**
🔴 **push 전에 `git pull --rebase`가 필요할 수 있다**(925 전례). 🔴 **충돌이 나면 중단하고 보고한다.**
🔴 **커밋 메시지는 §1~§2에서 실제로 고친 문서에 맞게 실행 측이 고쳐 쓴다.** 🔴 **초안이 결과를 전제하지 않았는지 확인할 것** — 913·914·916·919·926 전례. **초안은 매번 틀렸다.**

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 928: record that the preview environment now runs, and what it cost to get there

- two public variables were scoped to preview and the middleware stopped failing; the error that
  replaced it named a different key, which is the second layer rather than the same problem again
- that second one bypasses row level security, so it was raised separately and approved separately,
  with the reason it is acceptable here written down: these deployments require a login, and the
  value never reaches a browser
- the page renders and so does the feature behind the flag, which is the first time either has been
  seen anywhere other than a laptop
- an earlier step ruled this branch out as a route around the completion circle because it did not
  work; it works now, so that reasoning is corrected without changing the definition it fed into
- what the standard means by live is still its own question and is not answered here"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§0 수리 완료 실측 등재 · 🔴 코드 근거(admin.ts) 직접 재확인했는지
   🔴 남는 위험(Preview에 RLS 우회 키 존재) 기록했는지
§1 #71 🟢 소진 · DECISION_921 §2 정정 블록(🔴 본문 불변) · STATE §9 · AUDIT_904
§2 🔴 DoD9 원문 인용 · "라이브"가 production을 뜻한다고 명시하는지
   🔴 Preview 충족 가능성 사실 · KR "미확인" 명시
   🔴 선택지 개수만 · 🔴 판정 안 했는지 · 🔴 승인된 정의 안 바꿨는지
   🔴 완성까지 남은 것: #70 · #71(소진) · #74 · DoD7 각 상태
§3 플레이북 2건
무변경: 🔴 코드 diff 0 · 환경변수 추가 변경 0 · 재배포 0
       🔴 REVDCF_ENABLED Production OFF(Preview만 ON) · DoD 판정 칸 전부 불변
       ②단계 미착수 · 안건 3 대기 불변 · 크론 미실행 · 메일 발송 0 · DB 쓰기 0
tsc 0 · test ?/? · push ?(🔴 rebase 필요했는지) · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **`REVDCF_ENABLED` Production을 켜지 말 것. 환경변수를 더 고치지 말 것. 재배포하지 말 것. 코드를 고치지 말 것. DoD9·DoD7을 판정하지 말 것. 승인된 완성 정의를 바꾸지 말 것. KR Preview 확인을 이 STEP에서 하지 말 것. 크론을 돌리지 말 것. 다음 STEP을 제안하지 말 것.**
