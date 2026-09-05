# STEP 778 — "한 입 브리핑": 오늘 화면 리드 문단 (LLM 1일 1회 · 3중 브랜드 가드)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)
**⚠️ STEP 777 완료 후 실행**

**전제 상태**: STEP 777 커밋 이후 HEAD · 트리 클린

**결정(07-21)**: 오늘 화면 헤더 바로 아래 **시황 리드 한 단락**(Morning Brew의 '에디터 노트' 자리 — 오픈 동력의 핵심). 하루 1회 배치 생성 · **대화형 아님** · 기존 R2 인프라 재사용 · 비용 ≈ 하루 1~2콜.

---

## 수정

### 1) 테이블 (Cowork이 MCP 선적용 예정 · 마이그 파일 아카이브)

`daily_brief(brief_date date, market text, text_ko text, text_en text, source_facts jsonb, created_at)` — PK(brief_date, market). market = 'KR'|'US'.

### 2) 생성 파이프 — 신규 `/api/cron/daily-brief` (vercel.json 21:00 UTC 추가 — 일 1회·Hobby 정합)

- **입력(결정론 사실만·`source_facts`로 저장)**: 해당 시장 어제 지수 등락(KR=KOSPI/KOSDAQ·US=S&P/NASDAQ) · 렌즈 전환 통계(강점 N·주의 N) · 거래대금 상위 전환 종목 3개(이름·렌즈·from→to) · (KR용) 간밤 미국 지수 한 줄.
- **LLM(기존 R2 모델·언어 게이팅 패턴)**: "아래 사실만으로 3~4문장 시황 요약. 건조하게. **전망·예측·추천·매수·매도 표현 절대 금지.** 사실에 없는 내용 금지." ko/en 각각 생성.
- **🔒 3중 가드(후처리 — 프롬프트 신뢰 금지)**: 산출물에 금지어 검출 시(`전망|예상|추천|매수|매도|목표가|사야|팔아|오를 것|내릴 것|기대|유망` + en 대응어) **그 글 폐기 → 결정론 폴백**(사실 조립 문장: "어제 코스피 +3.56%. 렌즈 전환 138건 — 강점 34·주의 55. 반도체 대형주에서 모멘텀 전환이 몰렸다." 식 템플릿)으로 저장. 언어 검증(ko에 한글 비율)도 기존 패턴 재사용. 어떤 경우에도 빈 값 없이 저장.
- 멱등(같은 날 재실행 upsert). 실패 시 Sentry + 저장 안 함(화면은 섹션 생략).

### 3) 오늘 화면 배선

- 위치: **헤더(날짜·지수 한 줄) 바로 아래**, 관심 섹션 위 — 리드 문단(15px·line-height 여유·라벨 "한 입 브리핑" 12px muted + "TR-AI·사실만" 배지 기존 스타일 재사용).
- 서버 프리페치에 포함(771 패턴 — `daily_brief` 오늘자(없으면 최신) 조회). 해당 날짜 데이터 없으면 **섹션 생략**(지어내지 않음).
- ko 화면=KR 브리핑·en 화면=US 브리핑(`text_ko`/`text_en`은 로케일).

### 4) 헬스체크 등록

- `/api/cron/health` CHECKS에 `daily_brief`(최신 brief_date 나이 · 임계 25h) 추가 — 조용히 죽는 것 방지.

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. push·배포 후 크론 수동 실행(CRON_SECRET) → `daily_brief` KR·US 행 생성(Cowork MCP로 내용·가드 통과 확인 — 금지어 grep 0) → `/` 헤더 아래 리드 문단 렌더(SSR 포함) · `/en` 미국판.
3. **가드 실사격**: 금지어 필터 유닛 테스트(금지어 포함 문장 → 폴백 대체) 1개 이상.
4. 커밋:
   ```bash
   git add app/ components/ lib/ supabase/migrations/ vercel.json messages/ docs/STEP_778_COMMAND.md
   git commit -m "STEP 778: daily one-bite brief - LLM lead paragraph with deterministic input + banned-word fallback guard"
   git push
   ```

## 완료 보고 → Cowork에게: 생성된 브리핑 원문(ko·en) + 가드 테스트 결과 + 커밋 해시. (내용 톤 최종 판정 = 장은태.)
