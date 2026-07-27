# STEP 794 — 견고성 마감 (렌즈 격리 · upsert 로깅 · 타임아웃 · 헬스체크 · 죽은 크론 정리)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)
**⚠️ STEP 793 완료 후 실행**

**전제 상태**: STEP 793 커밋 이후 HEAD · 트리 클린

**배경(07-22 · Cowork 3중 검수)**: 과거 6대 함정(Promise.all 전체실패·무타임아웃·1000행 캡·`.in()` URL 길이·upsert 삼킴·Hobby 크론)이 대부분 방어됐으나 **핵심 경로에 잔존분**이 확인됨.

---

## 수정

### 1) 🔴 렌즈 계산 per-lens 격리 (제품 핵심)

- `lib/lensCompute.ts` — `Promise.all(LENSES.map(l => l.compute(...)))`에 **렌즈별 try/catch 없음** → 7개 중 하나만 throw하면 `/api/lens`·`/api/brief`가 통째로 실패하고 **종목 화면의 렌즈 카드가 전부 사라짐**.
- 조치: 같은 파일의 F-Score 블록이 이미 쓰는 try/catch 격리 방식과 동일하게, **렌즈별로 실패를 흡수**하고 실패한 렌즈만 제외(나머지는 정상 표시). 실패 시 Sentry 캡처 1줄(어느 렌즈·어느 심볼인지).
- 렌즈가 0개가 되는 극단 케이스에서도 화면이 기존 결측 문구로 정직하게 처리되는지 확인.

### 2) 공시요약 6개 라우트 — upsert 에러 로깅

- `app/api/{events,kr-events,jp-events,cn-events,vn-events,gb-events}/summary/route.ts`의 `filing_summaries` upsert가 **반환값을 받지 않음**(교훈 #31 패턴). `/api/brief`·`/api/news-brief`에는 이미 적용된 `if (upErr) console.error(...)` + Sentry를 6곳에 동일 적용.
- 이유: 저장 실패 시 같은 공시를 볼 때마다 LLM 재호출 = 조용한 유료 누수.

### 3) 타임아웃 — 사용자 대면 핫패스 우선

- `lib/edgar.ts`의 외부 fetch 2곳(SEC company_tickers·companyfacts)에 **`AbortSignal.timeout` 또는 기존 `withTimeout` 래퍼 적용**(5~8초). 이 경로는 `/api/lens`·`/api/brief`(maxDuration 30) 핫패스라 지연이 곧 화면 실패.
- 그 외 크론 전용 경로(krSnapshot·fss·youtube 등)는 **이번 스코프 밖**(300s 예산 안이고 헬스체크가 감시).

### 4) 헬스체크 감시망 보강

- `app/api/cron/health/route.ts` CHECKS에 추가:
  - **`email-brief`**: 현재 발송 이력을 남기는 테이블이 없어 조용히 멈춰도 감지 불가 → `email_subscriptions`에 발송 기록 컬럼을 추가하거나(예: `last_sent_at`) 별도 경량 로그 테이블 1개 신설 후 나이 감시(선택은 Claude Code 판단·간단한 쪽).
  - **`jp-disclosures`**: `jp_disclosures` 최신 `submit_datetime`/`updated_at` 나이 감시.
- `youtube-refresh`는 아래 5)에서 제거되므로 추가하지 않음.

### 5) 파킹 전용 크론 7개 제거 (장은태 승인)

- `vercel.json`에서 **`jp-perf`·`cn-perf`·`vn-perf`·`gb-perf`·`kr-etp`·`fss-advisors`·`youtube-refresh`** 스케줄 제거 → 크론 15개 → 8개.
- **라우트 파일·컴포넌트·테이블은 그대로 둔다**(복원 시 `vercel.json`에 한 줄 되돌리면 끝). 삭제 금지.
- `docs/PARKED_FIELD_SURFACES.md`에 "크론도 중지됨(복원 = vercel.json 스케줄 재등록)" 명시.
- ⚠️ **제거 전 확인**: 이 7개 데이터가 현재 5면(오늘·탐색·상세·관심·마이) 어디에도 안 쓰이는지 grep으로 재확인 후 진행. 하나라도 쓰이면 그 크론은 **남기고** 보고에 사유 기재.
- 🔴 배포 후 **크론 8개가 실제 등록됐는지 Vercel에서 확인**(G9 — 조용한 전량 거부 전례).

### 6) 조용한 빈 결과에 Sentry

- `lib/todayChanges.ts` — DB 에러 시 빈 배열 반환(오늘 화면이 통째로 비고, daily-brief·email-brief 입력도 부실해짐)에 Sentry 캡처 추가. 사용자 화면 동작은 현행 유지(빈 상태 문구).
- 크론 라우트들의 500 반환 지점에도 Sentry 캡처 추가(감지 지연 최대 24h → 즉시).

### 7) `explore/lens-top` 1000행 캡

- `app/api/explore/lens-top/route.ts` — `.range()` 페이지네이션 없음. US 선계산 유니버스가 **정확히 1,000종목**이라 지금이 경계선. 유니버스가 늘면 랭킹이 조용히 잘림 → `.range()` 루프 적용(다른 라우트 패턴 재사용).

### 8) `email-brief` 확장성 2건

- `.in("user_id", ...)` **1000개 청크** 적용(구독자 1000명 초과 시 조용한 400 → 전원에게 "변화 없음" 메일 발송).
- 구독자별 `auth.admin.getUserById` **직렬 루프** → 배치 조회로 변경(수백 명에서 60s 타임아웃).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. **렌즈 격리 실증**: 특정 렌즈가 throw하도록 임시 주입(또는 데이터 결측 종목)해서 **나머지 렌즈가 정상 렌더**되는지 확인 후 원복.
3. 라이브: 종목 상세 렌즈 정상 · 공시 요약 정상 · 오늘 화면 정상.
4. **크론 확인**: 배포 후 Vercel에 크론 **8개** 등록(전량 거부 없음). 남긴 8개 목록을 보고에 기재.
5. 헬스체크 수동 실행 → 새 항목 2개가 정상/이상을 올바르게 보고하는지.
6. 커밋:
   ```bash
   git add app/ lib/ vercel.json supabase/migrations/ docs/
   git commit -m "STEP 794: per-lens isolation, upsert error logging, edgar timeout, health checks, drop parked crons, sentry on silent empties"
   git push
   ```

## 완료 보고 → Cowork에게: 렌즈 격리 실증 결과 + 등록된 크론 8개 목록 + 커밋 해시. (직후 795.)
