# STEP 784 — 이메일 모닝 브리핑 (opt-in · 기존 daily_brief 재사용 · Resend)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)
**⚠️ 782/783과 독립 — 781 완료 후 언제든 실행 가능**

**전제 상태**: STEP 781 커밋 이후 HEAD · 트리 클린

**결정(07-22)**: 재방문 훅 1차 실험 = 푸시가 아니라 **이메일**(Morning Brew 모델·권한 불필요·열람 측정 가능·베타 전 완성 목표). 법적 성격 = **정보성**(계약에 따른 정보제공·명시 opt-in·원클릭 수신거부) — 광고 내용 삽입 금지. 비용 = Resend 무료 티어(일 100통)로 베타 커버.

**테이블은 Cowork이 MCP로 라이브 선적용 완료** — 마이그 파일만 아카이브로 커밋:

```sql
-- supabase/migrations/20260722_create_email_subscriptions.sql (이미 라이브 적용됨)
create table if not exists public.email_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_brief boolean not null default false,
  locale text not null default 'ko',
  unsub_token uuid not null default gen_random_uuid(),
  updated_at timestamptz not null default now()
);
-- RLS on · own-row select/insert/update · delete revoke (적용 완료)
```

---

## 수정

### 1) 마이페이지 opt-in 토글

- 마이페이지에 "모닝 브리핑 이메일" 토글(기본 OFF) + 한 줄 설명("매일 아침 시황 한 입과 내 관심종목 상태 변화를 보내드립니다 — 언제든 끌 수 있어요"). ON 시 `email_subscriptions` upsert(현재 로케일 저장·클라 RLS 경로), OFF 시 `daily_brief=false`.
- i18n ko/en 패리티.

### 2) 발송 크론 — 신규 `/api/cron/email-brief`

- `vercel.json`에 **일 1회 22:15 UTC**(KST 07:15 — 21:00 UTC daily_brief 생성 후) 추가. 🔴 **G9 준수**: Hobby = daily-only. 추가 후 **배포가 실제 성공하는지 반드시 확인**(크론 정책 위반 시 조용한 전량 거부 전례).
- 로직(CRON_SECRET 보호·멱등):
  1. `daily_brief` 오늘자 조회(KR·US) — 없으면 no-op(지어내지 않음).
  2. `email_subscriptions`에서 `daily_brief=true` 사용자 + 이메일(auth) 조회.
  3. 사용자별 조립: 로케일 기준 브리핑(ko=KR `text_ko`·en=US `text_en`) + **그 사용자 관심종목의 오늘 상태 전환**(`lens_state_changes` × watchlist 교집합·최대 5행·776 종목당 묶기 문법·없으면 섹션 생략) + "오늘 화면 열기" 링크.
  4. Resend API 발송 — from `brief@onetrillion.app`(도메인 인증 완료), 제목 ko "오늘의 한 입 브리핑 · {M월 D일}" / en "Today's one-bite brief · {Mon D}". HTML 단순(다크 강제 금지 — 이메일 클라이언트 호환 우선·브랜드 민트 포인트만).
  5. **수신거부**: 본문 하단 링크 + `List-Unsubscribe` 헤더 → 신규 `/api/email/unsub?token={unsub_token}` (토큰 검증·`daily_brief=false`·간단한 확인 문구 응답). 로그인 불필요(토큰만).
- 배치 발송(Resend batch 100/call)·실패 Sentry·구독자 0이면 no-op·maxDuration 내.
- env: `RESEND_API_KEY` — `.env.local`·Vercel에 있는지 확인, 없으면 **장은태에게 추가 요청 후 진행**(Supabase SMTP에 쓴 Resend 키와 동일 계정 키 — Cowork/Claude Code는 키 값을 직접 다루지 않음).

### 3) 콘텐츠 원칙

- 본문 = 기존 산출물 재조립만(daily_brief는 이미 금지어 가드 통과본). **새 LLM 콜 금지·광고/프로모션 문구 금지·예측/추천 금지.** 푸터에 "사실만 · 판단은 당신" 기존 문법 + 수신거부.

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build` · 배포 성공 확인(G9).
2. 라이브: 장은태 계정 토글 ON → 크론 수동 실행(CRON_SECRET) → **soulmaten7@gmail.com 실제 수신 확인**(제목·브리핑·관심종목 변화 섹션·링크) → 수신거부 링크 클릭 → 토글 OFF 반영 + 재실행 시 미발송 확인.
3. `/en` 로케일 계정 시나리오는 코드 검증(en 템플릿 렌더 유닛 또는 미리보기 라우트)으로 갈음 가능.
4. 커밋:
   ```bash
   git add app/ components/ lib/ supabase/migrations/ vercel.json messages/ docs/STEP_784_COMMAND.md
   git commit -m "STEP 784: opt-in email morning brief - reuse daily_brief + watchlist changes, resend batch, one-click unsubscribe"
   git push
   ```

## 완료 보고 → Cowork에게: 실수신 스크린 기준 확인 + 배포 성공 여부 + 커밋 해시. (열람률 측정은 Resend 대시보드 — 베타 후 푸시/스토어 판단 근거.)
