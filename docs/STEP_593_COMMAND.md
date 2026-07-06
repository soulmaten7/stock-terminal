<!-- 2026-07-06 -->
# STEP 593 — R3: 종목 뉴스 요약 + 중립 토픽 태그 (조건부·감성 점수 아님)

> **목표**: AI 브리핑 레이어 **R3**(가장 얇게·US 완성형 매듭). 종목 페이지 "최근 뉴스" — Google News 헤드라인을 LLM이 **사실 요약(2~3줄) + 중립 토픽 태그**(신제품·공급계약·규제 등, **강세/약세 아님**). 헤드라인 없으면 **숨김**(조건부). **예측·감성 점수 금지**. 지연 생성 + 종목·날짜 캐시. 마스터 = `docs/AI_BRIEFING_SPEC.md`.
> **전제**: STEP 592(`3b51efe`) 이후. **소스·마이그레이션 = Cowork 완료** → Claude Code는 **빌드 + 라이브 검증 + 커밋**.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_593_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것 (확인용)
- **신규 `lib/stockNews.ts`** — Google News RSS(키리스·앱 기존 뉴스 소스 계열)에서 종목 헤드라인 파싱.
- **신규 `app/api/news-brief/route.ts`** — GET `?symbol=` → `news_briefs` 캐시 → 헤드라인 fetch → 없으면 `summary:null` → **gpt-4o-mini(JSON 모드)** 사실 요약+토픽 태그(방향 태그 금지 프롬프트) → 캐시.
- **`app/stock/[symbol]/page.tsx`** — `StockNewsBrief`(지연·조건부·헤드라인 없으면 숨김·토픽 태그 칩) 이벤트 층 **아래** 배치.
- **`supabase/migrations/032_news_briefs.sql`** — Cowork이 **Supabase MCP로 Trillion(`ccbwxcszdoyjxvckedfp`) 적용 완료**. 재적용 불필요.
- Cowork 사전: `tsc --noEmit` EXIT=0.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -20
```
- [ ] 무에러.

## 1) 🔴 라이브 검증 (뉴스 요약+토픽 태그 나오나·방향 태그 없나)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/r3dev.log 2>&1 &) ; sleep 15
node -e '(async()=>{for(const sym of ["NVDA","AAPL","TSLA"]){try{const s=await (await fetch("http://localhost:3333/api/news-brief?symbol="+sym)).json();console.log(sym,"NEWS:",JSON.stringify(s));if(s.summary)return;}catch(e){console.log(sym,"err",String(e));}}})();'
# 확인 후: pkill -f "next dev"
```
- [ ] `NEWS: {"summary":"…한국어 2~3줄…","tags":["신제품","규제"…],"cached":false}` — **사실 요약 + 중립 토픽 태그**. 한 번 더 → `cached":true`.
- [ ] 태그가 **사실 토픽**(신제품·공급계약·규제·실적…)이지 **강세/약세 방향 아님**. 요약에 예측·권유 없음. (`summary:null`이면 Google News가 헤드라인 반환 안 한 것 — 다른 종목로 확인 or `/tmp/r3dev.log` 공유.)

## 2) 눈검수
```bash
echo "http://localhost:3333/stock/NVDA — '최근 중대 공시' 아래 민트 '최근 뉴스'(요약+토픽 태그 칩) 확인. 헤드라인 없으면 섹션 자체가 안 보임(조건부)."
```

## 3) 커밋 + push
```bash
cd ~/stock-terminal && git add lib/stockNews.ts "app/api/news-brief/route.ts" "app/stock/[symbol]/page.tsx" supabase/migrations/032_news_briefs.sql docs/STEP_593_COMMAND.md && git commit -m "feat(ai): R3 종목 뉴스 요약 — Google News 헤드라인→사실 요약+중립 토픽태그(감성점수 아님)·조건부·종목+날짜 캐시·gpt-4o-mini (STEP 593)" && git push
```

## ✅ 여기까지 = R3 라이브 = **🎉 US 완성형(R1 공시요약 + R2 브리핑 + R3 뉴스) 완결.** 다음 = 세션 문서 매듭(591~593) → **R1-KR(DART)부터 국가탭 데이터 교체** → 전 국가탭 → SEO.
> ⚠️ R3 v1 한계: 티커 검색(`{symbol} stock`)이라 짧은 티커는 노이즈 가능 — 나중에 회사명 기반으로 개선. 방향 태그/예측 섞이면 커밋 전 멈추고 Cowork에 공유.
