# Phase 4 — 수익화 + 운영 인프라 명령어

---

## 명령어 1: 토스페이먼츠 결제 연동

```
토스페이먼츠 정기결제(빌링)를 연동해줘.

[.env.local에 추가] (내가 값을 알려줄게)
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=

[구독 플랜]
- Free: 무료, 홈 1층 + 뉴스/공시만
- Premium: 월 29,000원, 모든 기능
- Pro: 월 49,000원, 모든 기능 + AI분석 + 알림

[파일]
app/api/payment/billing/route.ts — 빌링키 발급
app/api/payment/subscribe/route.ts — 정기결제 등록
app/api/payment/webhook/route.ts — 결제 웹훅 처리
lib/payment.ts — 토스페이먼츠 유틸리티

[구독 페이지 수정]
기존 /pricing 페이지에 실제 결제 버튼 연결
결제 성공 → Supabase users 테이블의 plan 필드 업데이트
결제 실패 → 에러 메시지 표시

[접근 제어]
- Free 사용자: 홈 1층, 뉴스/공시, 링크허브만
- Premium: 종목 상세, 시장분석, 스크리너, 비교
- Pro: Premium + AI분석 + 키워드 알림
- AuthGuard 컴포넌트에 plan 체크 추가
```

---

## 명령어 2: AI 분석 5종 GPT 연동

```
종목 상세의 AI분석 탭을 실제 GPT로 연동해줘.

[.env.local]
OPENAI_API_KEY= (내가 알려줄게)

[app/api/ai-analysis/route.ts 수정]
- 종목 코드 받으면 해당 종목의 재무제표, 수급, 공시 데이터를 수집
- GPT-4o에게 5가지 분석 기법으로 정리 요청
- 결과를 Supabase ai_analysis 테이블에 캐싱 (1주일 유효)

[5가지 분석 프롬프트]
1. 가치분석: PER/PBR/ROE 해석, 동종업계 비교, 적정가치 범위
2. 기술적분석: 현재 추세, 지지/저항선, 이평선 배열 상태
3. 퀀트분석: 모멘텀/밸류/퀄리티 팩터 점수
4. 배당분석: 배당 안정성, 배당수익률 추이, 배당성향
5. 수급분석: 외국인/기관 매매 흐름, 공매도 추이

[면책 조항]
모든 AI 분석 결과 하단에:
"본 분석은 AI가 공개 데이터를 정리한 것으로, 투자 권유가 아닙니다. 투자 판단은 본인 책임입니다."

Pro 플랜 전용 — Free/Premium은 분석 미리보기(첫 2줄)만 보여주고 잠금.
```

---

## 명령어 3: 알림 시스템

```
키워드 알림 + 가격 알림 시스템을 만들어줘.

[Supabase 테이블 추가]
alerts 테이블:
- id, user_id, type (keyword/price), condition, target, is_active, created_at

[알림 유형]
1. 키워드 알림: 특정 키워드가 공시/뉴스에 등장하면 알림
   - 예: "삼성전자" + "유상증자" → 알림
2. 가격 알림: 특정 종목이 목표가에 도달하면 알림
   - 예: 삼성전자 ≥ 80,000원 → 알림

[알림 전달]
- 1차: 사이트 내 알림 (헤더 🔔 뱃지)
- 2차: 이메일 알림 (Supabase Edge Function 또는 Make)
- Push 알림은 나중에

[마이페이지에 알림 관리]
- 내 알림 리스트 (활성/비활성 토글)
- 알림 추가/삭제
- 알림 히스토리

Pro 플랜 전용 — Free/Premium은 알림 최대 3개, Pro는 무제한.
```

---

## 명령어 4: 관리자 대시보드 고도화

```
기존 /admin 페이지를 고도화해줘.

[추가 기능]
1. 사용자 통계
   - 일별 가입자 수, 활성 사용자 수
   - 플랜별 사용자 분포 (Free/Premium/Pro)
   - Recharts 차트로 시각화

2. 채팅 제재
   - 비속어 신고 목록
   - 사용자 채팅 금지 (1일/7일/영구)
   - 채팅 로그 검색

3. 광고 관리
   - 배너 등록/수정/삭제
   - 광고 노출 통계 (인상 수, 클릭 수)
   - 광고 위치별 관리 (1층 메이저 / 2~3층 일반)
   - 광고 기간 관리 (시작일/종료일)

4. Make 자동화 모니터링
   - Make 시나리오 실행 상태 (성공/실패)
   - 마지막 데이터 업데이트 시간
   - 수동 실행 버튼

관리자 접근: Supabase users 테이블 role="admin" 체크
```

---

## 명령어 5: Make 자동화 세팅 가이드

```
Make (Integromat) 자동화 시나리오 설계를 문서로 정리해줘.
(실제 Make 세팅은 내가 직접 할 거야 — 시나리오 설계만)

[시나리오 1: 뉴스 수집 — 매 시간]
트리거: 매 시간 정각
1. HTTP 모듈로 RSS 5개 매체 fetch
2. JSON 파싱
3. Supabase INSERT (중복 체크: 제목+URL 해시)

[시나리오 2: DART 공시 수집 — 매 5분 (장중)]
트리거: 평일 08:30~18:00, 매 5분
1. HTTP 모듈로 DART API 호출
2. is_important 판별 (키워드 매칭)
3. Supabase INSERT

[시나리오 3: KRX 수급 데이터 — 매일 16:30]
트리거: 평일 16:30
1. HTTP로 한투 API 투자자별 매매동향
2. 외국인/기관/개인 순매수 데이터 파싱
3. Supabase INSERT (supply_demand 테이블)

[시나리오 4: AI 분석 갱신 — 매주 일요일]
트리거: 매주 일요일 03:00
1. Supabase에서 인기 종목 TOP 50 조회
2. 각 종목 재무/수급 데이터 수집
3. OpenAI GPT API로 5가지 분석 생성
4. Supabase ai_analysis 테이블 UPSERT

[시나리오 5: 경제 캘린더 — 매주 월요일]
트리거: 매주 월요일 06:00
1. FRED API로 이번 주 지표 발표 일정
2. Supabase economic_calendar 테이블 INSERT

이 내용을 docs/MAKE_AUTOMATION.md에 저장해줘.
```
