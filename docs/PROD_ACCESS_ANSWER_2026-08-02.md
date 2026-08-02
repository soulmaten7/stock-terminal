<!-- 2026-08-02 · 작성 = 이전 세션 Cowork · 대상 = docs/PROD_ACCESS_DIAGNOSTIC_2026-08-02.md 질의서 -->
# 🔴 프로덕션 접속 진단 — **답변서**

> **한 줄**: 🔴 **도메인이 틀렸다.** 우리 정식 주소는 **`onetrillion.app`**이고, `trillion.im`은 **저장소 전체에 0건**이다.
> 진단서 §2의 TLS 실패·`empty reply` 관측은 **우리 사이트가 아닌 곳을 찌른 결과**다.
>
> **이 문서를 읽는 순서**: §1(결론) → §2(근거) → §3(질문별 답) → §4(재검증 대상) → §5(다음 행동).

---

## §1. 결론 — 3줄

1. 🔴 **정식 URL = `https://onetrillion.app`** (코드 6곳에 하드코딩된 폴백). `trillion.im`은 **코드·문서 어디에도 없다**.
2. 🔴 **`stock-terminal.vercel.app`이 남의 사이트라는 진단은 맞다.** 그래서 **그 URL로 확인한 "프로덕션 404"는 전부 무효**다 — 아래 §4-1이 이 세션의 가장 위험한 발견이다.
3. 🔴 **B·C·E 질문(기준선·Vercel 설정·최근 변화)은 이전 세션에 기록이 없다.** 모른다고 답한다. 추정하지 않는다.

---

## §2. 근거 (전부 코드 개봉 · 추정 아님)

### 2-1. `onetrillion.app`이 코드에 박혀 있다

```
app/[locale]/layout.tsx:49    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://onetrillion.app")
app/sitemap.ts:39             const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://onetrillion.app"
app/robots.ts:4               const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onetrillion.app'
app/[locale]/page.tsx:17      const SITE_BASE = ... ?? "https://onetrillion.app"      // JSON-LD
app/[locale]/stock/[symbol]/page.tsx:25  const BASE = ... ?? "https://onetrillion.app"
app/api/cron/email-brief/route.ts:16     const SITE_BASE = ... ?? "https://onetrillion.app"
                                   :17   const FROM = "Trillion <brief@onetrillion.app>"
```

부가 확인: `lib/edgar.ts`·`lib/eightK.ts`·`lib/og.ts`·`lib/stockNews.ts`·`app/api/sec/*`의 User-Agent가 전부 `@onetrillion.app`.

### 2-2. `trillion.im` = 저장소 전체 **0건**

전수 grep(`docs/`·`app/`·`lib/`·`components/`·루트 `*.ts`·`*.json`·`*.md`) 결과 **유일한 히트는 진단서 자신**(`docs/PROD_ACCESS_DIAGNOSTIC_2026-08-02.md`)뿐이다.

→ 🔴 **`trillion.im`은 이 프로젝트에 배선된 적이 없다.** 장은태가 따로 보유한 도메인일 수는 있으나, **코드·DNS 관점에서 우리 프로덕션이 아니다.**

### 2-3. 과거 실측 기록도 전부 `onetrillion.app`

```
docs/STEP_661_CN_HK_COMMAND.md:167   curl "https://onetrillion.app/api/cn-events?symbol=0700.HK"
docs/STEP_691_ETN_PRODUCT_INFO_COMMAND.md:41  curl -s "https://onetrillion.app/api/etf-holdings?symbol=530107"
docs/STEP_473_COMMAND.md:237         배포(onetrillion.app 반영)는 코드 변경이라 push 필요
docs/SUPABASE_MIGRATION_HANDOFF.md:81  onetrillion.app 도메인 → Vercel(가비아 DNS, 이메일 MX 유지)
```

🔑 **DNS는 가비아에서 관리한다**(Vercel 네임서버가 아니라 가비아 DNS에 레코드를 꽂은 구조). 인증서 문제를 볼 때 이 사실이 필요하다.

### 2-4. `vercel.json` 크론 = **9개 · 전부 일 1회** (실측 파싱)

```
/api/cron/us-perf         0 22 * * *
/api/cron/kr-perf         0 10 * * *
/api/cron/kr-etp         15 10 * * *
/api/cron/kr-lens-scores 30 10 * * *
/api/cron/lens-scores    30 21 * * *
/api/cron/health          0 12 * * *
/api/cron/daily-brief    30 22 * * *
/api/cron/email-brief     0 23 * * *
/api/cron/revdcf         45 22 * * *
```

`vercel.json`에 `crons` 외 다른 키는 없다(보호·리다이렉트 설정 없음).

---

## §3. 질문별 답

### A. 정식 URL

| # | 질문 | 답 |
|---|---|---|
| **1** | 프로덕션 정식 주소 | 🔴 **`https://onetrillion.app`**. apex/www 중 어느 쪽이 정본인지는 **Vercel 도메인 설정에서 확인 필요**(코드는 apex를 씀) |
| **2** | Vercel 팀 접미사 URL 형태 | 🔴 **모름.** 진단서가 찾은 `stock-terminal-toms-projects-c798474e.vercel.app`이 302 → `vercel.com/login`을 준다면 **도메인은 살아 있고 배포 보호가 걸린 것**이 맞다. 이전 세션엔 이 URL 기록 없음 |
| **3** | `stock-terminal.vercel.app`을 우리 것으로 쓴 적 | 🔴 **문서상 없음.** 과거 STEP들은 전부 `onetrillion.app`으로 실측했다. **다만 아래 §4-1 참조 — 최근 STEP 검증에서 이 URL을 썼을 가능성을 배제 못 한다** |

### B. 기준선 — 🔴 **이전 세션에 기록 없음**

| # | 질문 | 답 |
|---|---|---|
| **4** | curl/WebFetch로 `https://trillion.im` 성공 기록 | 🔴 **없다.** 애초에 잘못된 도메인이라 성공했을 리가 없다. `onetrillion.app`으로는 **STEP 661·691 시절 성공 기록이 문서에 있다**(날짜는 그 STEP 시점) |
| **5** | 브라우저로 마지막 확인 | 🔴 **모름.** 이전 세션이 아는 육안 검증은 전부 **`localhost:3333`(프리뷰 dev·플래그 ON)**이었다. **프로덕션을 브라우저로 본 기록은 없다** |
| **6** | `/revdcf` 404를 실제로 확인했나 | 🔴 **여기가 핵심. §4-1 참조 — "확인했다"고 적혀 있으나 어느 URL인지 기록이 없다** |

### C. Vercel 설정 이력 — 🔴 **전부 모름**

| # | 질문 | 답 |
|---|---|---|
| **7** | 배포 보호를 켠 적 | 🔴 **기록 없음.** 이전 세션은 Vercel 대시보드에 접근한 적이 없다 |
| **8** | 봇 차단·WAF·방화벽 | 🔴 **기록 없음** |
| **9** | 도메인 연결 시점·인증서 발급 확인 | 🔴 **시점 미상.** 단서 = `SUPABASE_MIGRATION_HANDOFF.md`에 *"onetrillion.app 도메인 → Vercel(가비아 DNS, 이메일 MX 유지) + OAuth Site URL·Redirect 갱신 = Phase C"*. **가비아 DNS + MX 유지** 구조라는 것만 확실 |
| **10** | Vercel 계정/팀 다중 여부 · `toms-projects`가 본인 팀인지 | 🔴 **모름.** `.vercel/project.json`은 gitignore라 이전 세션 문서에 흔적이 없다 |

🔑 **관련 기록 1건**: `CHANGELOG` 2026-07-12(3)에 **Vercel 빌드 캐시 함정** — env를 늦게 추가하면 캐시 재사용으로 `NEXT_PUBLIC_*`가 인라인되지 않아 무동작. 해결 = *"'Use existing Build Cache' 끄고 재배포"*. 🔴 **`NEXT_PUBLIC_SITE_URL`도 같은 함정에 걸릴 수 있는 변수다.**

### D. 플랜 한도 — 🔴 **STATE가 낡았을 가능성**

| # | 질문 | 답 |
|---|---|---|
| **11** | Hobby에서 크론 9개가 도나 | 🔴 **모순이다.** `vercel.json` 실측 = 크론 **9개**. **Vercel Hobby는 크론 개수 제한이 있다**(빈도 외에). 9개가 실제로 등록·실행 중이라면 **Hobby가 아닐 가능성이 높다** → `STATE.md`의 *"Vercel = Hobby"*는 **재확인 대상**. 🔴 이전 세션은 대시보드를 못 봐서 어느 쪽인지 모른다 |
| **12** | 100 배포 한도에 걸린 적 | 🔴 **기록 없음** |

### E. 최근 변화

| # | 질문 | 답 |
|---|---|---|
| **13** | 08-01~08-02 대시보드 변경 | 🔴 **기록 없음.** 이전 세션은 대시보드를 건드리지 않았다 |
| **14** | 최근 배포 성공 여부·로그 확인 | 🔴 **본 적 없음.** 다만 **865 이후 프로덕션 코드 변경 0줄**(866·867은 문서·프로브만)이므로, **배포가 실패했더라도 화면 내용은 865 시점 그대로여야 정상**이다 |

---

## §4. 🔴 이 답변에서 새로 드러난 것 — **재검증 대상**

### 4-1. 🔴 **"프로덕션 404 유지"는 무효일 수 있다** (가장 중요)

`docs/STATE.md`와 STEP 863·864·865 검증 항목에 *"프로덕션 404 유지"*가 상시 적혀 있다. **그런데 어느 URL로 확인했는지가 기록 어디에도 없다.**

🔑 **만약 `stock-terminal.vercel.app`(= 남의 사이트)으로 확인했다면**, 그 404는
- ❌ "우리 피처 플래그가 작동한다"는 증거가 **아니고**
- ✅ "남의 사이트에 `/revdcf`라는 경로가 없다"는 뜻일 뿐이다.

**두 경우 모두 404라서 응답만으로는 구분되지 않는다.**

| 확인된 것 | 미확인 |
|---|---|
| ✅ 플래그 로직은 코드상 정상 — `lib/revdcf/flag.ts` = `process.env.REVDCF_ENABLED === "true"` (기본 OFF) | 🔴 **프로덕션에서 실제로 404가 나오는지** |
| ✅ 소비처 3곳 — `app/[locale]/stock/[symbol]/page.tsx` · `app/[locale]/revdcf/page.tsx` · `app/api/revdcf/batch/route.ts` | 🔴 **Vercel 환경변수에 `REVDCF_ENABLED`가 실수로 `true`로 들어가 있지 않은지** |

🔴 **`onetrillion.app`으로 다시 확인하기 전까지 "프로덕션 404 유지"를 사실로 쓰지 말 것.**

### 4-2. 진단서 §2-2의 `empty reply` 해석 무효

`http://trillion.im/revdcf`가 준 `empty reply`는 **우리 앱의 동작이 아니다**(그 도메인에 우리 앱이 없으므로). `proxy.ts`의 `NON_PAGE`·`STATIC_FILE` 정규식 검토(§7-4)는 **지금 시점에 불필요하다** — `onetrillion.app`에서 같은 증상이 재현될 때만 착수한다.

### 4-3. `STATE.md` "Vercel = Hobby" 재확인 필요

크론 9개와 정합하지 않는다. 확인되면 `STATE.md`를 고쳐야 한다.

---

## §5. ▶ 다음 행동 (순서 고정)

### 1단계 — 🔴 **도메인만 바꿔 재측** (다른 건 이 결과를 보고)

```bash
curl -sI https://onetrillion.app/            | head -1
curl -sI https://onetrillion.app/revdcf      | head -1
curl -sI https://onetrillion.app/en/revdcf   | head -1
curl -sI https://onetrillion.app/api/revdcf  | head -1
```

**판정 기준**

| 결과 | 뜻 |
|---|---|
| `/` 200 + `/revdcf` 404 | ✅ 정상. **진단서 §2·§4의 절반이 소멸**. 플래그도 정상 작동 확인 |
| `/` 200 + `/revdcf` **200** | 🚨 **플래그가 프로덕션에서 ON이다** — 즉시 Vercel env 확인·차단 |
| `/` 자체가 실패 | → 2단계 |

### 2단계 — 브라우저 육안 (Chrome MCP)

`https://onetrillion.app/` 한 번. 🔴 **curl은 육안 검증이 아니다**(CLAUDE.md 절대 규칙). 봇 차단·WAF 여부는 브라우저로만 갈린다.

### 3단계 — `trillion.im` 정체 확인

장은태에게 직접 물을 것: **"`trillion.im`을 산 적이 있나? Vercel에 붙인 적이 있나?"**
🔴 코드에 없는 도메인이라 **우리가 추측으로 답할 수 없다.**

### 4단계 — Vercel 재인증 (필요할 때만)

`toms-projects-c798474e` 스코프 접근 권한이 있는 계정/토큰으로 바꿔야 배포 로그·도메인·보호 설정·**플랜**을 읽을 수 있다. 1·2단계가 정상이면 **플랜 확인(D-11)만** 하면 된다.

---

## §6. 🔴 이 답변서를 받은 세션이 지킬 것

1. 🔴 **§5의 1단계 결과가 나오기 전에 원인을 추정하지 말 것.** 진단서 §4는 전부 잘못된 도메인 기반이라 재료로 쓸 수 없다.
2. 🔴 **`STATE.md`의 "프로덕션 404 유지"를 실측으로 확정하거나, 미검증으로 강등할 것.** 지금 상태는 **근거 불명**이다.
3. 🔴 **프로덕션 화면을 바꾸는 어떤 작업도 장은태 승인 없이 STEP으로 만들지 말 것**(CLAUDE.md 절대 규칙). 이 진단은 **읽기 전용**이다.
4. 🔴 **`REVDCF_ENABLED`는 OFF 유지.** 만약 1단계에서 ON으로 드러나면 **끄는 것 자체는 즉시 보고 후 장은태 지시**로 한다.
5. 🔴 답변에 `[3중 점검]` 블록을 붙이고, **✅는 실제로 한 것만** 적을 것(2026-08-02 위반 사례 = `CLAUDE.md` ⓪-3).

---

## §7. 참고 — 이전 세션이 남긴 상태

| 항목 | 값 |
|---|---|
| 문서 HEAD | `a15959d`(문서 전용) · 그 위 867 = `e18541f` |
| **프로덕션 코드** | **`9c5185b`(STEP 865) 이후 0줄 변경** — 866·867은 문서·프로브만 |
| 피처 플래그 | `REVDCF_ENABLED` **OFF**(`lib/revdcf/flag.ts` 미변경 · 소비처 3곳) |
| 역DCF DoD | 1·2 ✅ / 3(도메인 상한)·4·5·6·8 🔶 / 7·9 ❌ |
| 🔴 A층 | **재개방**(`docs/REVDCF_SPEC.md` §4 **A-9**) — 유동성 컷 폐기 후보 · 모집단 재확정 필요 |
| 다음 작업 | **STEP 866**(SEC 전수 실측) — 🔴 **장은태 지시 후** |
| 정본 문서 | 현재상태 `docs/STATE.md` · 모델설계 `docs/REVDCF_SPEC.md` · 이력 `docs/CHANGELOG.md` |

---

```
[3중 점검]  ← 이 답변서 작성 시점
⓪ 원전 인벤토리 : 해당 없음(인프라 건 · 원전 무관)
A-0 우리 자산 : layout.tsx:49 · sitemap.ts:39 · robots.ts:4 · page.tsx:17 · stock/[symbol]/page.tsx:25 ·
                email-brief/route.ts:16 개봉 → onetrillion.app 확인 / trillion.im 전수 grep 0건 /
                vercel.json 크론 9개 파싱 / STEP_661·691·473·SUPABASE_MIGRATION_HANDOFF 과거 실측 기록 /
                flag.ts + 소비처 3곳
A  원문       : 🔴 못 함 — 실제 HTTP 요청을 하지 않았다(§5 1단계가 그것)
B  실무       : 해당 없음
C  반대 증거  : "프로덕션 404 유지"의 검증 URL이 기록에 없음 → 남의 사이트 404였을 가능성 제기(§4-1)
검증          : 원문 ✅(코드 개봉) / 우리실측 ✅(grep·JSON 파싱) / 제3자 🔴 **못 함 — 접속 안 해봄**
검수          : 반박 = 도메인 가정 자체를 의심 / 출처 = 파일:행 명시 /
                이전발언 = STATE "Vercel=Hobby"·"프로덕션 404 유지" 둘 다 모순 지적 / 분기비중 = 해당 없음
🔴 미측정     : onetrillion.app 실제 응답 · trillion.im 소유 여부 · Vercel 플랜·보호설정 ·
                프로덕션 REVDCF_ENABLED 실제 값 · 프로덕션 404 실측
```
