<!-- 2026-07-06 -->
# STEP 592 — R2: 종목 브리핑 (핵심 긴장 + 지켜볼 것 · 예측 아님)

> **목표**: AI 브리핑 레이어 **R2**. 종목 페이지 최상단에 **"이 종목 브리핑"** — 우리 **결정론 렌즈 판정 + 최근 공시 사실**만 근거로 LLM이 **핵심 긴장(시간축·기법 엇갈림) + 지켜볼 것(관찰 가능한 촉매)**을 한 문단. **예측·판정·"사라/팔아라" 절대 금지**(가드레일 프롬프트). 지연 생성 + 종목·날짜 캐시(하루 1회). 마스터 = `docs/AI_BRIEFING_SPEC.md`.
> **전제**: STEP 591(`e0d033d`) 이후. **소스·마이그레이션 = Cowork 완료** → Claude Code는 **빌드 + 라이브 검증 + 커밋**.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_592_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것 (확인용)
- **신규 `app/api/brief/route.ts`** — GET `?symbol=` → 캐시 확인(`stock_briefings` 종목+날짜) → **서버에서 `computeSymbolLenses` 재계산**(우리가 계산한 판정에만 근거) + `fetchMaterial8K` 공시 → facts 구성 → **gpt-4o-mini** 브리핑(가드레일 시스템 프롬프트: 예측·권유 금지·긴장+지켜볼것·facts 밖 금지·temp 0.3) → 캐시 저장.
- **`app/stock/[symbol]/page.tsx`** — `StockBrief`(지연 로드·민트 카드 "이 종목 브리핑"·하단 "방향 판단 안 함"·실패 시 숨김) 최상단 배치(브리핑 → 시간축 스트립 → 렌즈 순).
- **`supabase/migrations/031_stock_briefings.sql`** — Cowork이 **Supabase MCP로 Trillion(`ccbwxcszdoyjxvckedfp`) 적용 완료**(테이블 + public read). 재적용 불필요.
- Cowork 사전: `tsc --noEmit` EXIT=0.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -20
```
- [ ] 무에러.

## 1) 🔴 라이브 검증 (브리핑이 긴장+지켜볼것으로 나오나·예측 없나)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/r2dev.log 2>&1 &) ; sleep 15
node -e '(async()=>{try{const s=await (await fetch("http://localhost:3333/api/brief?symbol=NVDA")).json();console.log("BRIEF:",JSON.stringify(s));}catch(e){console.log("err",String(e));}})();'
# 확인 후: pkill -f "next dev"
```
- [ ] `BRIEF: {"brief":"…한국어 3~4문장…","cached":false}` — **핵심 긴장(시간축/기법 엇갈림) + 지켜볼 것(촉매)** 담김. 한 번 더 실행 → `cached":true`.
- [ ] **예측·"사라/팔아라"·목표가 없음**(사실·긴장·관찰 촉매만). (dev 포트 다르면 3333 조정.)

## 2) 눈검수
```bash
echo "http://localhost:3333/stock/NVDA — 최상단 민트 '이 종목 브리핑' 카드(시간축 스트립 위) 확인"
```
- [ ] 페이지 열면 맨 위 **"이 종목 브리핑"**(민트) → 한국어 브리핑 → 그 아래 시간축·렌즈. 하단에 "방향 판단은 하지 않아요".

## 3) 커밋 + push
```bash
cd ~/stock-terminal && git add "app/api/brief/route.ts" "app/stock/[symbol]/page.tsx" supabase/migrations/031_stock_briefings.sql docs/STEP_592_COMMAND.md && git commit -m "feat(ai): R2 종목 브리핑 — 결정론 판정+공시 사실로 핵심긴장+지켜볼것 1문단(예측·판정 금지)·종목+날짜 캐시·gpt-4o-mini (STEP 592)" && git push
```

## ✅ 여기까지 = R2(종목 브리핑) 라이브 = **US 완성형에 R1+R2 완료.** 다음 = R3(뉴스 요약·토픽태그·US) → US 완성 매듭 → R1-KR(DART)부터 국가탭 데이터 교체 → SEO.
> ⚠️ 브리핑에 예측/권유가 섞여 나오면 커밋 전 멈추고 실제 brief 텍스트를 Cowork에 공유(프롬프트 강화).
