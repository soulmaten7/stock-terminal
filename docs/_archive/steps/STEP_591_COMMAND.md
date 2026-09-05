<!-- 2026-07-06 -->
# STEP 591 — R1-US: 8-K 공시 원문 AI 요약 (지연 생성·전역 캐시)

> **목표**: AI 브리핑 레이어 **R1 첫 조각**. 종목 페이지 "최근 중대 공시" 각 항목에 **원문을 LLM이 읽어 한국어 사실 요약(2~3줄)**을 지연 로드로 표시. 전역 캐시(`filing_summaries`)로 공시당 1회만 생성. **예측·판정 없음(사실만)**. 마스터 = `docs/AI_BRIEFING_SPEC.md`.
> **전제**: STEP 590(docs) 커밋 이후. **소스·마이그레이션은 Cowork이 이미 완료** → Claude Code는 **env 확인 + 빌드 + 라이브 검증 + 커밋**.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_591_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것 (확인용)
- **신규 `lib/eightKSummary.ts`** — 원문 텍스트 추출(본문 + 필요시 **EX-99.x**·HTML strip·10K자 캡). SEC UA 재사용. (2.02 실적은 본문이 껍데기·실제는 EX-99.1 → 첨부까지 읽음.)
- **신규 `app/api/events/summary/route.ts`** — GET `?symbol=&link=&items=` → `filing_summaries` 캐시 확인 → 원문 추출 → **OpenAI gpt-4o-mini** 요약(사실만·가드레일·temp 0.2) → 캐시 저장. **SSRF 가드**(sec.gov/Archives URL만).
- **`app/stock/[symbol]/page.tsx`** — `AiFilingSummary`(지연 fetch·민트 틴트 "AI 요약"·실패 시 조용히 숨김) + `EventLayer`가 `symbol` 받음 + **중대 이벤트에만** `withAi`(루틴 공시는 요약 안 함=비용 절약).
- **`supabase/migrations/030_filing_summaries.sql`** — Cowork이 **Supabase MCP로 Trillion(`ccbwxcszdoyjxvckedfp`)에 이미 적용 완료**(테이블 + public read RLS). Claude Code는 재적용 불필요.
- Cowork 사전: `tsc --noEmit` EXIT=0.

## 0) env 확인
```bash
cd ~/stock-terminal && (grep -q OPENAI_API_KEY .env.local && echo "OPENAI_API_KEY ✓" || echo "❌ OPENAI_API_KEY 없음"); (grep -q SEC_USER_AGENT .env.local && echo "SEC_USER_AGENT ✓" || echo "⚠ SEC_USER_AGENT 없음(기본 UA로 동작하나 권장)")
```
- [ ] OPENAI_API_KEY 있음. (없으면 요약 500 — 키부터 채우기.)

## 1) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -20
```
- [ ] 무에러.

## 2) 🔴 라이브 검증 (핵심 — 진짜 8-K 원문 → 한국어 요약 나오나)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/r1dev.log 2>&1 &) ; sleep 15
node -e '(async()=>{const base="http://localhost:3333";for(const sym of ["NVDA","AAPL","MSFT"]){try{const ev=await (await fetch(base+"/api/events?symbol="+sym)).json();const e=(ev.events||[]).find(x=>x.link&&x.link.includes("/Archives/"));if(!e)continue;console.log(sym,"공시:",e.items.join(","),e.link);const q=new URLSearchParams({symbol:sym,link:e.link,items:e.items.join(",")});const s=await (await fetch(base+"/api/events/summary?"+q)).json();console.log("→ AI 요약:",JSON.stringify(s));return;}catch(err){console.log(sym,"err",String(err));}}console.log("중대 8-K 있는 종목 못 찾음");})();'
# 확인 후: pkill -f "next dev"
```
- [ ] `→ AI 요약: {"summary":"…한국어 2~3줄…","cached":false}` 나옴(첫 호출=LLM 생성). **한 번 더 실행하면 `cached":true`**.
- [ ] 요약이 **사실만**(예측·"사라/팔아라" 없음)·원문 내용과 대체로 일치. (dev 포트 다르면 3333→맞게 조정.)

## 3) 눈검수
```bash
echo "http://localhost:3333/stock/NVDA — '최근 중대 공시' 아래 민트 'AI 요약' 블록 + 원문 링크 확인"
```
- [ ] 중대 공시 카드 밑에 **"AI 요약"(민트 틴트)** 지연 로드 → 한국어 사실 요약. 루틴 공시엔 없음.

## 4) 커밋 + push
```bash
cd ~/stock-terminal && git add lib/eightKSummary.ts "app/api/events/summary/route.ts" "app/stock/[symbol]/page.tsx" supabase/migrations/030_filing_summaries.sql docs/STEP_591_COMMAND.md && git commit -m "feat(ai): R1-US 8-K 공시 원문 AI 요약 — 지연 생성+전역 캐시(filing_summaries)·원문 읽어 사실만·gpt-4o-mini (STEP 591)" && git push
```

## ✅ 여기까지 = R1-US(공시 원문 요약) 라이브. 다음 = R1-KR(DART) → R1 기타(JP·CN) → **R2 브리핑** → R3 뉴스 → 전 국가탭 → SEO.
> ⚠️ 라이브 검증(2단계)에서 요약이 안 나오면 커밋 전에 멈추고 `/tmp/r1dev.log` + 요약 JSON 에러를 Cowork에 공유.
