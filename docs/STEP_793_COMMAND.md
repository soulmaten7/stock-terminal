# STEP 793 — 🔴 베타 전 보안·과금 차단 (무인증 LLM · 캐시 포이즈닝 · 크론 인증 · 수신거부 GET)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus` 🔴 **Opus 권장**(보안 경계 판단 + 6개국 라우트 동시 수정)

**전제 상태**: STEP 792 문서 커밋 `637dfbf` 이후 HEAD · 트리 클린

**배경(07-22 · Cowork 3중 검수)**: 베타 직전 보안 감사에서 과금 남용·데이터 오염 통로 발견. **이 STEP은 기능 추가가 아니라 구멍 봉인이다 — 사용자 눈에 보이는 동작은 바뀌지 않아야 한다.**

---

## 수정

### 1) 무인증 LLM 엔드포인트 8종 보호

대상: `app/api/{events,kr-events,jp-events,cn-events,vn-events,gb-events}/summary/route.ts` + `app/api/brief/route.ts` + `app/api/news-brief/route.ts`

- **캐시 히트는 현행대로 누구나**(비로그인 사용자도 이미 생성된 요약을 봐야 함 — 제품 가치).
- **캐시 미스(= 새 LLM 호출)는 아래 3중 게이트 통과 시에만**:
  1. **알려진 대상만**: 요청한 식별자가 우리 DB/API에 실제로 존재하는지 확인 후에만 생성(예: KR은 `/api/kr-events` 목록에 있는 `rcept_no`인지, US는 우리가 아는 `accession`인지 — 각 국가별로 이미 있는 조회 경로 재사용. 새 조회가 과하면 최소한 **식별자 형식 엄격 검증**).
  2. **레이트리밋**: IP 기준 신규 생성 요청에 상한(예: 분당 5회·시간당 30회). 인프라 추가 없이 **모듈 스코프 in-memory 카운터**로 구현(서버리스 인스턴스별이라 완벽하진 않으나 스크립트 남용은 차단). `lib/rateLimit.ts` 신설 후 8개 라우트 공용.
  3. **봇 차단**: `user-agent`가 알려진 크롤러(googlebot·bingbot·bot/spider/crawler 일반 패턴)면 **생성 금지**(캐시 히트만 응답). `app/sitemap.ts`가 수천 종목을 노출하고 있어 크롤러가 종목 페이지를 훑으면 심볼당 LLM 호출이 발생하는 구조임.
- 초과 시 429 + 빈 요약(화면은 현행처럼 조용히 숨김 — UI 변경 없음).

### 2) 🔴 캐시 포이즈닝 차단 (CN·VN·US)

- **CN**(`cn-events/summary`)·**VN**(`vn-events/summary`): 현재 캐시 키(`id`)와 본문 소스(`pdf`/`url`)가 **독립 파라미터**라 임의 문서를 임의 ID로 저장 가능 → **캐시 키를 본문 URL에서 파생**시킬 것(GB 라우트 `gb-events/summary`의 방식이 정답 — 그 구현을 참고해 통일).
- **US**(`events/summary`): SEC 아카이브 정규식의 doc 부분이 `(.+)`라 `../`로 다른 공시 본문을 읽으면서 캐시 키는 원래 accession으로 유지됨 → doc 패턴을 `[A-Za-z0-9._-]+`로 제한(경로 구분자 금지).
- `filing_summaries`에 저장되는 `symbol`도 형식 검증 후 저장.

### 3) 크론 인증 정비

- `app/api/cron/jp-disclosures/route.ts` — **CRON_SECRET 검증 추가**(15개 중 유일 누락). `days` 파라미터 상한도 축소(예: 최대 7).
- **전 크론 공통**: `if (auth !== \`Bearer ${process.env.CRON_SECRET}\`)` 패턴은 env 미설정 시 `Bearer undefined`로 통과함 → **`if (!process.env.CRON_SECRET || auth !== ...) return 401`** 로 전 크론 일괄 수정(공용 헬퍼 `lib/cronAuth.ts` 추출 권장).

### 4) 수신거부 GET 부수효과 제거

- `app/api/email/unsub/route.ts` — 현재 **GET 한 번으로 구독 해제**. 메일 클라이언트·보안 게이트웨이의 링크 프리페치가 사용자 의사 없이 해제시킴.
- 조치: **GET = 확인 페이지만**("수신거부하시겠어요?" + 버튼), 실제 해제는 그 버튼의 POST. **`List-Unsubscribe-Post`(RFC 8058) 경로의 POST 핸들러는 현행 유지**(원클릭 수신거부는 표준이므로 유지해야 함).
- 이미 해제된 토큰으로 다시 들어와도 안내가 자연스럽게(멱등).

### 5) `/api/dart` 오픈 프록시 제한

- `endpoint` 파라미터를 **화이트리스트**(실제 사용 중인 엔드포인트만)로 제한. 우리 DART 키로 임의 OpenDART 엔드포인트를 호출하는 무인증 프록시 상태(일 20,000건 쿼터).
- 사용처를 grep해 실제 필요한 endpoint만 남길 것(미사용이면 라우트 자체 제거 검토 후 보고).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. **동작 불변 확인(중요)**: 로그인/비로그인 모두 — 종목 상세에서 공시 펼치면 요약 정상, 오늘 브리핑·뉴스 브리핑 정상(캐시된 것). KR·US 각 1종목 라이브.
3. **차단 확인**: (a) 존재하지 않는 rcept/accession으로 요청 시 LLM 미호출·에러 응답 (b) 같은 IP로 연속 요청 시 상한 후 429 (c) `curl -A "Googlebot"` 로 요청 시 신규 생성 안 됨 (d) CN/VN에서 임의 URL + 임의 id 조합이 거부되는지 (e) `/api/cron/jp-disclosures` 무인증 호출 401.
4. 수신거부: 메일의 링크를 **미리보기/프리페치**해도 구독이 유지되고, 버튼을 눌러야 해제되는지 실제 계정으로 확인.
5. 커밋:
   ```bash
   git add app/ lib/ messages/ docs/STEP_793_COMMAND.md
   git commit -m "STEP 793: gate LLM routes (known-id + rate limit + bot block), fix cache poisoning and path traversal, cron auth hardening, unsubscribe GET side effect"
   git push
   ```

## 완료 보고 → Cowork에게: 차단 테스트 결과 5종 + 동작 불변 확인 + 커밋 해시. (직후 794.)
