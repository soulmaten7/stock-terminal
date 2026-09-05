# STEP 868 — 🚨 `/api/revdcf` 게이팅 누락 차단 (A안) + 재발 방지 테스트

**실행 명령어** (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

```
@docs/STEP_868_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `e18541f`(STEP 867 · origin/main 반영 완료) · tsc 0 · vitest 151/151 · `REVDCF_ENABLED` **OFF**(프로덕션 실측) · 프로덕션 = `https://onetrillion.app`

**장은태 승인**: 2026-08-02 — *"§5-1 A안으로 진행해"*. 근거 = `docs/PROD_ACCESS_ANSWER2_2026-08-02.md` §5-1.

---

## 🚨 무엇을 고치는가

`app/api/revdcf/route.ts`가 **피처 플래그를 확인하지 않는다.** 플래그가 OFF인데 프로덕션에서 역DCF 결과 전체가 공개로 나간다.

```
https://onetrillion.app/api/revdcf?symbol=AAPL
→ 200 · {"result":{"verdict":"over_cap","drivers":{...},"asOf":"2026-08-03",...}}
```

**노출 범위**: 심볼당 26개 필드(verdict · WACC ±1%p 밴드 · 드라이버 9개 · 분포 내 순위 등) · **604 종목 전부** · 인증·레이트리밋 **0건** · 30분 캐시.

**원인**: STEP 854가 게이팅을 3곳에 넣으면서 이 라우트를 빠뜨렸다. `git log --follow app/api/revdcf/route.ts` = 이력 **2개**(`5475a95` STEP 853 생성 · `2248b21` STEP 855)뿐이고 **854 커밋이 없다** → 853 배포 시점부터 계속 공개.

🔴 **개인정보 유출이 아니다.** 공개 재무데이터에서 우리가 계산한 값이다. 문제는 **DoD 3·4·5·6·8이 🔶인 미완성 모델의 숫자가 육안 승인 전에 우리 도메인으로 나가는 것**이다.

---

## 🔴 금지사항

| # | 금지 |
|---|---|
| 1 | 🔴 **`REVDCF_ENABLED`를 켜지 말 것** — OFF 유지. 켜는 건 육안 검증 + 장은태 명시 승인 후 |
| 2 | 🔴 **B안(404) 쓰지 말 것** — 승인된 건 A안이다 |
| 3 | `lib/revdcf/engine.ts`·`drivers.ts`·`compute.ts` 수정 · `revdcf_results`·`us_market_cap` 쓰기 |
| 4 | 화면 컴포넌트(`components/RevDcfSection.tsx`) 수정 · `data/us_symbols.json` 수정 |
| 5 | 🔴 **베타·노출·확산 논의를 꺼내지 말 것.** "사용자가 적으니 위험이 낮다" 같은 평가도 금지 |
| 6 | 이 사고를 계기로 다른 라우트를 "겸사겸사" 손보지 말 것 — **이 파일 하나만** |

---

## 1단계 — 차단 (A안 · 코드 2줄)

**파일**: `app/api/revdcf/route.ts`

**(1) import 추가** — 2행 다음:

```ts
import { revdcfEnabled } from "@/lib/revdcf/flag";
```

**(2) 가드 삽입** — 🔴 **13행 `export async function GET(req: Request) {` 바로 다음, 14행 `symbol` 파싱보다 앞**:

```ts
export async function GET(req: Request) {
  // 🔴 STEP 868: 피처 플래그 OFF면 데이터에 닿기 전에 끊는다.
  //   854가 게이팅을 3곳(페이지 2·batch 1)에만 넣고 이 라우트를 빠뜨려 853부터 공개돼 있었다.
  //   {result:null}은 기존 반환 형태 재사용 — RevDcfSection이 이미 미렌더로 처리한다(부작용 0).
  if (!revdcfEnabled()) return NextResponse.json({ result: null });

  const symbol = ...
```

🔴 **캐시 조회·`createAdminClient()`·DB 접근보다 반드시 앞**이어야 한다. 뒤에 넣으면 DB를 치고 나서 버리는 꼴이 된다.

**예상 동작 변화 (의도된 것 · 놀라지 말 것)**

| 요청 | 이전 | 이후 |
|---|---|---|
| `/api/revdcf?symbol=AAPL` | 200 + 전체 결과 | **200 + `{"result":null}`** |
| `/api/revdcf` (symbol 없음) | 400 `{"error":"no symbol"}` | **200 `{"result":null}`** |

🔴 두 번째 줄이 바뀌는 건 가드가 파싱보다 앞이기 때문이다. **정보 노출이 줄어드는 방향이라 그대로 둔다.**

**부작용 0 근거** (직접 확인함 · 추정 아님)
- `components/RevDcfSection.tsx:29` = `setR(j.result ?? null)` · `:34` = `if (!loaded || !r) return null;`
- `route.ts`에 `{result:null}`을 반환하는 경로가 **이미 2개** 존재(`if (!asOf)` · `if (!row)`) — 새 형태가 아니다
- 유일한 호출자인 `RevDcfSection`은 `app/[locale]/stock/[symbol]/page.tsx:176`의 `revdcfEnabled() &&` 뒤에 있어 **OFF면 애초에 호출자가 없다**

## 2단계 — 🔴 재발 방지 테스트 (신규)

**현재 `app/api/revdcf/`에 테스트가 0개다.** `lib/revdcf/`에는 `compute.test.ts`·`engine.test.ts`만 있다. **그래서 854의 누락을 아무도 못 잡았다.**

**신규 파일**: `app/api/revdcf/route.test.ts`

```ts
// STEP 868 — 플래그 OFF면 데이터가 나가지 않는다는 것을 고정한다.
// 🔴 이 테스트가 없어서 854 게이팅 누락이 853부터 프로덕션에 남아 있었다.
```

**최소 2케이스**:

1. `REVDCF_ENABLED` **미설정** → `GET(new Request("http://x/api/revdcf?symbol=AAPL"))` 이 `{result: null}` 반환 · 🔴 **`createAdminClient`가 호출되지 않을 것**(모킹해서 호출 0회 단언)
2. `REVDCF_ENABLED = "false"` → 동일

🔴 **`REVDCF_ENABLED="true"` 케이스는 만들지 말 것** — Supabase 접속이 필요해지고, 지금 확인할 것은 **"꺼졌을 때 안 나간다"** 하나다.

🔴 **테스트에서 `process.env`를 만졌으면 반드시 원복**(`afterEach`). 다른 테스트 151개에 영향 주지 말 것.

## 3단계 — 문서 (구멍을 막은 뒤)

| 파일 | 무엇 |
|---|---|
| `docs/STATE.md` | 🔴 *"프로덕션 404 유지"* 문구를 **정확히** 고친다: "페이지 2곳(`/revdcf`·`/en/revdcf`)은 **404 실측 확인**(2026-08-02 · `onetrillion.app`) · `/api/revdcf`는 **853부터 공개돼 있었고 STEP 868에서 차단**" · 프로덕션 URL을 `onetrillion.app`으로 명시 |
| `docs/CHANGELOG.md` | 오늘 블록 신규 — 발견 경위(867 push 후 배포 확인 → 도메인 오인 → 재측 중 발견) · 원인(854 게이팅 누락) · **노출 기간(853 배포~2026-08-02)** · 노출 범위(26필드·604종목) · 조치(A안) |
| `docs/LENS_DEV_PLAYBOOK.md` | 문제해결 로그 신규 행 — 🔑 교훈 **"게이팅 감사는 데이터 출구에서 시작한다. 게이팅된 곳을 세면 누락이 안 보인다"** + **"플래그를 새로 만들면 그 데이터를 밖으로 내보내는 곳 전수를 세고, 각각에 테스트를 붙인다"** |
| `docs/REVDCF_SPEC.md` §7 | 플래그 서술에 **API 라우트 2개 포함** 명시(현재 페이지 기준으로만 적혀 있다) |

🔴 **`docs/PROD_ACCESS_*.md` 3종은 수정하지 말 것** — 사고 기록이다. 그대로 둔다.

## 4단계 — 검증 (🔴 배포 후 실측 필수)

```bash
npx tsc --noEmit          # 0
npx vitest run            # 🔴 153/153 (기존 151 + 신규 2) — 숫자를 보고할 것
git diff --stat HEAD -- lib/revdcf/ components/ data/us_symbols.json   # 출력 없어야 함
```

**커밋 + push**:

```bash
git add app/api/revdcf/route.ts app/api/revdcf/route.test.ts \
        docs/STATE.md docs/CHANGELOG.md docs/LENS_DEV_PLAYBOOK.md \
        docs/REVDCF_SPEC.md docs/STEP_868_COMMAND.md
git commit -m "STEP 868: gate /api/revdcf behind the feature flag (was publicly reachable since 853)

- app/api/revdcf/route.ts had no revdcfEnabled() check; STEP 854 gated the two pages and
  the batch route but missed this one, so full reverse-DCF results (26 fields x 604 tickers)
  were served publicly while the flag was OFF
- return {result: null} before parsing/caching/DB access; reuses an existing response shape
  that RevDcfSection already renders as hidden, so no client change is needed
- add route.test.ts: flag off must return null and must not construct the Supabase client
- correct STATE: the 404 claim covered the pages only, never the API route
- flag stays OFF"
git push
```

🔴 **배포 완료를 기다린 뒤(Vercel 빌드 ~2분) 프로덕션 실측**:

```
https://onetrillion.app/api/revdcf?symbol=AAPL      → 기대 {"result":null}
https://onetrillion.app/api/revdcf?symbol=MSFT      → 기대 {"result":null}   (캐시 아닌지 교차 확인)
https://onetrillion.app/api/revdcf/batch?symbols=AAPL → 기대 {"enabled":false,"verdicts":{}}  (무변화)
https://onetrillion.app/revdcf                       → 기대 404  (무변화)
https://onetrillion.app/                             → 기대 200  (무변화)
https://onetrillion.app/stock/AAPL                   → 기대 역DCF 섹션 없음  (무변화)
```

🔴 **`AAPL` 하나만 보고 끝내지 말 것.** 라우트에 30분 인메모리 캐시가 있어 배포 전 값이 남아 있을 수 있다. **캐시에 없던 심볼(MSFT)로 교차 확인**해야 진짜 차단이다.
🔴 **여전히 결과가 나오면 즉시 멈추고 보고할 것.** 추가 조치를 스스로 만들지 말 것.

## 5단계 — 멈춘다

**보고 형식**:

```
코드: route.ts import 1줄 + 가드 1줄 (삽입 위치 = GET 직후·symbol 파싱 앞)
테스트: app/api/revdcf/route.test.ts 신규 2케이스 · vitest ?/? (기존 151)
문서: STATE(404 문구 정정) · CHANGELOG(사고 기록) · LENS_DEV_PLAYBOOK(교훈) · REVDCF_SPEC §7
push: 커밋 ? · origin/main 반영
🔴 배포 후 실측:
  /api/revdcf?symbol=AAPL  → ?
  /api/revdcf?symbol=MSFT  → ?      ← 캐시 교차 확인
  /api/revdcf/batch        → ?
  /revdcf                  → ?
  /                        → ?
  /stock/AAPL              → 역DCF 섹션 ?
tsc 0 · lib/revdcf·components diff 없음 · REVDCF_ENABLED OFF 유지
```

🔴 **플래그를 켜는 것·베타·노출 확대에 대해 한 줄도 쓰지 말 것.** 판정은 장은태가 한다.
