<!-- 2026-08-02 · 작성 = Cowork · 목적 = 이전 세션에 질의 -->
# 🔴 프로덕션 접속 진단 — 이전 세션에 묻는 것

> **한 줄**: STEP 867 push 후 배포를 확인하려 했으나 **`trillion.im`이 HTTPS 핸드셰이크 단계에서 거부**되고, 대조용으로 쓴 `stock-terminal.vercel.app`은 **남의 사이트**로 판명됐다. **우리 프로덕션의 정식 URL과 정상 동작 기준선을 모르는 상태**다.
>
> **이 문서는 판정이 아니라 질의서다.** 아래 §5의 질문에 답해 주면 원인을 좁힐 수 있다.

---

## 1. 발단

2026-08-02 STEP 867(문서 전용·코드 diff 0)을 push한 뒤, 명령서의 검증 항목이었던 *"배포 후 `/` 200 · 역DCF 라우트 404 유지"* 를 확인하려다 막혔다.

🔴 **중요**: 이 push는 `lib/**`·`app/**`·`scripts/**`·`data/us_symbols.json` **diff 0**이다. 문서 파일만 바뀌었다. **이 push가 원인일 가능성은 구조적으로 매우 낮다.**

---

## 2. 관측 사실 (전부 실측 · 추정 아님)

### 2-1. `trillion.im` — HTTPS 핸드셰이크 실패

| 대상 | 관측 위치 | 방법 | 결과 |
|---|---|---|---|
| `https://trillion.im` (apex) | 사용자 로컬(맥) | curl | `error:10000438:SSL routines:OPENSSL_internal:TLSV1_ALERT_INTERNAL_ERROR` |
| `https://trillion.im` | 사용자 로컬 | WebFetch | 동일 |
| `https://www.trillion.im` | 사용자 로컬 | curl | 동일 |
| `https://trillion.im` | **Anthropic 클라우드 컨테이너** | Python SSL | `[SSL: TLSV1_ALERT_INTERNAL_ERROR] tlsv1 alert internal error (_ssl.c:1016)` |
| `https://www.trillion.im` | **Anthropic 클라우드 컨테이너** | Python SSL | 동일 |

🔑 **서로 완전히 독립된 두 네트워크에서 동일 재현.** 사용자 로컬 환경·방화벽·DNS 문제가 아니다.
🔑 **`TLSV1_ALERT_INTERNAL_ERROR`는 서버가 보내는 alert다.** 클라이언트가 끊은 게 아니다.

### 2-2. `trillion.im` — 평문 HTTP는 응답

| 경로 | 결과 |
|---|---|
| `http://trillion.im/` | **200** |
| `http://trillion.im/revdcf` 계열 (로케일 프리픽스 유무 무관) | **"empty reply from server"** |

🔴 **여기가 이상하다.** `docs/STATE.md`상 역DCF 라우트는 **플래그 OFF라 404가 정상**이다. `empty reply`는 404가 **아니다** — 응답 본문 없이 연결이 끊긴 것이다. **정상 404와 다른 현상**이다.

### 2-3. `stock-terminal.vercel.app` — 우리 사이트가 아니다

| | 그 사이트 | 우리 저장소 |
|---|---|---|
| title | `Market Terminal — Personal Stock & Crypto Analysis` | `messages/ko.json:3` = `Trillion — 종목을 보는 눈을, 누구에게나` |
| 헤더 | `MARKET TERMINAL` / `CONNECTING...` | 트릴리언 |
| 문구 | *"stocks and **crypto**"* | `messages/en.json`에 `crypto` **0건** |

저장소 전체 grep: `Market Terminal` **0건**.

→ 🔴 **`stock-terminal.vercel.app`은 다른 팀이 선점한 서브도메인이다.** 이 URL로 한 200 OK 확인은 **무효**다. (Vercel은 `<프로젝트명>.vercel.app`을 먼저 잡은 팀에 준다.)

### 2-4. Vercel 링크 — 스코프가 `toms-projects`

`.vercel/project.json` (2026-06-24 생성 · gitignore됨 · 로컬 전용):

```json
{"projectId":"prj_o5Eao0DzSsFCo9Oa7ZkxdSKLSHdk",
 "orgId":"team_75sBjDtj4rCJOBtQ2d1gnYE6",
 "projectName":"stock-terminal"}
```

Vercel API 조회 결과(이 세션에 붙은 Vercel 계정으로):

```
403 Forbidden
"Not authorized: Trying to access resource under scope "toms-projects-c798474e".
 You must re-authenticate to this scope or use a token with access to this scope."
teamId: team_75sBjDtj4rCJOBtQ2d1gnYE6 · scope: toms-projects-c798474e
```

그리고 이 세션의 Vercel 계정은 `list_teams` → **`{"teams": []}`** (팀 없음).

→ **프로젝트는 `toms-projects-c798474e` 팀 아래 존재한다.** 이 세션에 연결된 Vercel 계정은 그 팀 소속이 아니라 **배포 로그·도메인 설정을 볼 수 없다.**

### 2-5. 팀 접미사 도메인 — **배포 보호(Deployment Protection)에 막힘**

```
https://stock-terminal-toms-projects-c798474e.vercel.app
  → 302 Found → https://vercel.com/login
```

🔑 **302 → `vercel.com/login`은 Vercel Authentication(배포 보호)이 켜져 있을 때의 전형적 동작이다.** 도메인 자체는 **살아 있다.**

---

## 3. 확정된 것

1. **TLS 실패는 클라이언트 환경 탓이 아니다** — 독립된 두 네트워크에서 동일 재현.
2. **`stock-terminal.vercel.app`은 우리 것이 아니다** — 이 URL 기반 확인은 전부 무효.
3. **Vercel 프로젝트는 `toms-projects-c798474e` 팀 소속이다** — 현재 세션 계정으로는 접근 불가(403).
4. **팀 접미사 도메인에는 배포 보호가 걸려 있다** (302 → vercel.com/login).
5. **`trillion.im`은 평문 HTTP로 루트 200을 준다** — 도메인·DNS·라우팅은 살아 있다.
6. **STEP 867 push는 프로덕션 코드를 0줄도 바꾸지 않았다** (`git diff --stat HEAD -- lib/ app/ scripts/ data/us_symbols.json` 출력 없음).

## 4. 배제하지 못한 것 (🔴 추정 금지 구간)

- Vercel **봇 차단 / Attack Challenge Mode / WAF**가 비브라우저 TLS 클라이언트를 거부하는 것인지
- **TLS 인증서 갱신 실패 / SNI 설정 문제**인지
- **엣지 장애**인지
- `/revdcf` 계열의 `empty reply`가 **원래 그랬는지**, 아니면 **새로 생긴 것인지**
- 브라우저로는 정상인지 (🔴 **아직 아무도 브라우저로 안 봤다**)

🔴 **push 전 기준선이 없다.** 867 이전에 같은 명령으로 확인한 기록이 없어 "전에는 됐다"를 말할 수 없다.

---

## 5. 🔴 이전 세션에 묻는 것

**A. 정식 URL**
1. 프로덕션 정식 주소는 무엇인가 — `trillion.im`(apex)인가, `www.trillion.im`인가?
2. Vercel 배포 URL(팀 접미사 포함)의 정확한 형태는? `stock-terminal-toms-projects-c798474e.vercel.app`이 맞나?
3. `stock-terminal.vercel.app`을 우리 것으로 쓴 적이 있나? 있다면 언제 바뀌었나?

**B. 기준선 — "전에는 됐다"의 근거**
4. **curl 또는 WebFetch로 `https://trillion.im`에 성공한 기록이 있나?** 있다면 **언제 · 어떤 명령 · 어떤 응답**이었나?
5. 마지막으로 **브라우저에서** `trillion.im`을 직접 연 게 언제인가? 정상이었나?
6. `/revdcf` 계열이 **404를 준 것을 실제로 확인한 적**이 있나? 아니면 "플래그 OFF니까 404일 것"이라는 전제였나?
   🔴 이게 핵심이다 — `STATE.md`가 *"프로덕션 404 유지"* 를 상시 사실로 적고 있는데, **실측 근거가 있는지** 확인이 필요하다.

**C. Vercel 설정 이력**
7. **배포 보호(Deployment Protection / Vercel Authentication / Password Protection)를 켠 적이 있나?** 언제, 어느 도메인에?
8. **봇 차단(Attack Challenge Mode) · WAF · 방화벽 규칙**을 켠 적이 있나?
9. `trillion.im` 도메인을 Vercel에 붙인 시점과, **인증서 발급이 정상 완료됐는지** 확인한 기록이 있나?
10. Vercel 계정/팀이 여러 개인가? `toms-projects-c798474e`는 장은태 본인 팀이 맞나?

**D. 플랜 한도**
11. `vercel.json`에 **크론이 9개** 있다. `STATE.md`는 *"Vercel = Hobby: 크론 일 1회 한도"*라고 적고 있다.
    - Hobby 플랜에서 크론 9개가 실제로 등록·실행되고 있나?
    - 배포가 이 때문에 거부되거나 크론이 잘린 적이 있나?
    - 아니면 플랜이 Pro로 바뀌었고 STATE가 낡은 건가?
12. *"하루 100 배포"* 한도에 걸린 적이 있나? (오늘 867 push = 1 배포)

**E. 최근 변화**
13. 2026-08-01~08-02 사이에 **Vercel 대시보드에서 무언가 바꾼 게 있나**(도메인·환경변수·보호 설정·플랜)?
14. 최근 배포가 **성공**했나? 배포 로그를 본 적이 있나?

---

## 6. 참고 — 현재 설정 스냅샷

| 항목 | 값 |
|---|---|
| HEAD | `e18541f` (STEP 867) · origin/main 반영 완료 |
| 프로덕션 코드 | `9c5185b`(STEP 865) 이후 **변경 0** — 866~867은 문서·측정 프로브만 |
| 피처 플래그 | `REVDCF_ENABLED` **OFF** |
| `vercel.json` 크론 | **9개** (us-perf·kr-perf·kr-etp·kr-lens-scores·lens-scores·health·daily-brief·email-brief·**revdcf**) |
| 미들웨어 | `middleware.ts` **없음** · 루트 `proxy.ts` 사용 (next-intl + Supabase SSR) |
| i18n | `localePrefix: 'as-needed'` · ko 기본(프리픽스 없음) · en |
| `next.config.ts` | 레거시 라우트 12개 → `/` 리다이렉트 · 보안 헤더 3종 · Sentry(DSN 있을 때만) |
| tsc / vitest | 0 / 151-151 |

🔴 **`proxy.ts`의 `NON_PAGE`·`STATIC_FILE` 정규식**이 `/revdcf` 경로를 어떻게 처리하는지는 이 문서에서 확인하지 않았다. `empty reply`와 관련될 수 있으니 확인 대상.

---

## 7. 다음에 할 수 있는 것 (지시 대기)

1. **브라우저로 직접 확인** — Chrome MCP로 `trillion.im` `/`와 역DCF 라우트 2개만. **가장 빠르고 확실하다.**
2. **Vercel 재인증** — `toms-projects-c798474e` 스코프에 접근 가능한 계정/토큰으로 바꾸면 배포 로그·도메인·보호 설정을 직접 읽을 수 있다.
3. **`vercel` CLI** — 로컬에 로그인돼 있다면 `vercel ls` / `vercel inspect`로 정식 URL과 상태 확인.
4. **`proxy.ts` 경로 처리 검토** — `/revdcf` `empty reply`의 코드 쪽 가능성.

🔴 **1번을 권한다.** 나머지는 전부 "왜 안 되는지"를 추정하는 경로이고, 1번만이 **되는지 안 되는지**를 먼저 확정한다.
