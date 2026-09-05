<!-- 2026-09-05 신설 · docs/ORDER_트릴리언이관_0905.md STEP2 -->
# 배포 안전장치 (deploy-gates)

> 이 저장소 전용 안전장치. 대부분 **사고에서 나왔다** — 사유는 원문 확인 시 `CLAUDE.md`(구) 절대규칙 / `docs/COMMIT_GATES.md`에서 유래를 볼 수 있다.

## 1. 커밋 전 체크리스트 — 정본은 `docs/COMMIT_GATES.md`

커밋 전 **반드시 `docs/COMMIT_GATES.md`의 9개 게이트를 순서대로 돈다**(원본 게이트·정정 게이트·재현 게이트·근거 게이트·완결 게이트·커밋 게이트·미추적 파일 참조 게이트·배포 확인 게이트·신선도 점검 등록 게이트). 이 문서는 그 체크리스트를 대체하지 않는다 — 여기는 `COMMIT_GATES.md`에 없는 항목만 추가한다.

## 2. 프로덕션 노출 승인 규칙

- 🔴 **프로덕션 화면을 바꾸거나 사용자에게 노출하는 작업은 장은태 명시 승인 없이 진행하지 않는다.**
- **육안 검증 전 노출 금지.** curl/HTML 확인은 육안 검증이 아니다 — 사람이 실제 화면을 보고 승인해야 한다.
- 새 기능은 **피처 플래그(기본 OFF)**로 배선하고, 켜는 것은 승인 후.
- **이미 보류로 정해진 사항을 스스로 선택지로 다시 열지 않는다.** 판단 근거·위험 평가의 재료로도 쓰지 않는다.
- 장은태가 자기 눈으로 확인하기 전에는 노출·확산에 관한 논의를 꺼내지 않는다.
- 위반 이력(2026-08-01): STEP815~852가 전부 "화면 변경 0"이었는데 853에서 스스로 프로덕션 출시를 결정한 사례 — 육안 검증도 없었다.

## 2-1. UI 변경 자체 검증 — 헤드리스 Chrome 픽셀 실측 (2026-09-05 확립)

- 위 §2의 "육안 검증"은 **장은태가 사람 눈으로 보는 승인**을 대체하지 않는다 — 아래는 그 전 단계, Claude 자신이 코드를 push하기 전에 스스로 확인하는 방법이다.
- CSS 클래스만 봐서는(`max-w-[1040px]` 값이 같다 등) 실제 화면에서 정말 정렬되는지 확신할 수 없을 때, 로컬 `Google Chrome.app`을 `--headless=new --disable-gpu --screenshot`으로 띄워 스크린샷을 찍고, Python(PIL)로 특정 y행의 좌/우 첫 비-배경 픽셀 x좌표를 찾아 두 요소의 정렬을 **숫자로** 비교한다(예: 헤더 로고 좌측 227px vs 사이드바 카드 우측 1212px).
- **함정**: 짧은 페이지에서 `--window-size`로 큰 뷰포트를 주면, `min-h-[calc(100svh-Npx)]` 같은 CSS가 그 뷰포트 높이에 맞춰 다시 늘어나(재계산) 푸터가 항상 뷰포트 경계 밖으로 밀려나 스크린샷에 안 잡힌다(뷰포트를 아무리 키워도 같은 문제가 재발). 해결 = Chrome을 `--remote-debugging-port`로 띄우고 CDP(`Page.getLayoutMetrics`의 `cssContentSize`)로 실제 문서 전체 높이를 구한 뒤, `Page.captureScreenshot`에 `captureBeyondViewport: true` + 그 높이의 `clip`을 줘서 뷰포트 크기를 바꾸지 않고 전체 페이지를 캡처한다.
- 이 방법은 **로컬 dev·프로덕션 둘 다** 적용 가능(같은 스크립트로 URL만 바꿔 실측) — push 전 검증(로컬)과 배포 후 확인(프로덕션 게이트 8)에 모두 쓴다.

## 3. Supabase 프로젝트 규칙

- **정답 = "Trillion" `ccbwxcszdoyjxvckedfp`**(ap-northeast-2). 마이그레이션·MCP·앱 런타임 전부 이 ref.
- ⛔ **금지 ref**: POTAL `zyurflkhiregundhisky` · 구 "OT-Marketing" `qxkmwlkchyxfzxbonhtj`. 절대 사용 금지.
- 🐞 **CLI footgun**: `supabase/.temp/linked-project.json`이 OT-Marketing에 링크돼 있다 → **`supabase db push` 등 CLI DB 명령 절대 금지**(재링크 전까지). 마이그레이션은 MCP로 적용한다.
- 상세 = `docs/SYSTEM_MAP.md` §2.

## 4. 그 외 안전장치

- **빌드 깨진 코드 push 금지.**
- **console.log 남긴 채 커밋 금지.**
- **Public 저장소에 비밀(API 키·토큰) 커밋 금지** — 값은 사용자 → `.env.local`(로컬)/Vercel(prod), 코드는 `process.env.X` 참조만.
- **Vercel Hobby 플랜 = 크론 일 1회 한도.** 더 촘촘한 스케줄(`*/3` 등)을 넣으면 배포 전체가 조용히 거부된다(실증 사례 있음).
- **git이 추적하지 않는 파일을 소스에서 참조하지 않는다**(절대경로든 상대경로든, `.gitignore` 제외든 전부). 판정 기준은 `git ls-files`(추적 여부)·`git check-ignore`(제외 여부) — `docs/COMMIT_GATES.md` 게이트 7과 동일 규칙, 여기서도 강조. 사고 사례(STEP990): 38시간·25 STEP 배포가 조용히 실패했다.
- **실측 데이터에 하드코딩 이상치 가드(시총 상한·전일대비 ±X%·수익률 밴드 등)를 걸지 않는다** — 대세 상승장에서 진짜 데이터를 지운다. present-day 수치는 LLM 훈련지식 밖이므로, "말이 안 되는 값"으로 보여도 임의로 오염 단정하지 말고 독립 출처(WebSearch 등)로 먼저 검증한다.
- **한 번에 하나의 작업만** — 커밋 단위도 마찬가지.
- **기존 POTAL Supabase 프로젝트 URL/Key 절대 재사용 금지** — 위 §3과 동일 규칙(중복 강조, 사고 위험이 커서 남긴다).

## 5. 브랜치·작업 폴더 규약

`docs/COMMIT_GATES.md`의 "브랜치 규약"·"작업 폴더도 하나다" 절 그대로 유지: **`main`에 직접 push, 브랜치·PR·worktree를 만들지 않는다.** 근거·예외 없음 이유는 그 문서 참조.
