<!-- 2026-07-06 -->
# STEP 596 — R1-KR: DART 공시 원문 AI 요약 (zip·EUC-KR → 사실 요약)

> **목표**: R1-US 파이프라인을 **DART 원문**에 얹음 = "US 완성형 → 데이터 교체"의 마지막 조각. KR 공시 카드에 지연 "AI 요약"(원문 읽어 사실만). **핵심 함정: DART 원문은 zip + EUC-KR** — UTF-8로 읽으면 한글 깨짐(선언부 보고 디코더 선택). 마스터 = `docs/AI_BRIEFING_SPEC.md`.
> **전제**: STEP 595(+595B `c55016b`) 이후. `fflate` 이미 설치됨(595B). **소스 = Cowork 완료** → Claude Code는 **빌드 + 라이브 검증 + 커밋**.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_596_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것 (확인용)
- **신규 `lib/dartSummary.ts`** — `fetchDartDocText(rceptNo)`: DART `document.xml`(zip) → 본문 xml → **EUC-KR/UTF-8 자동 디코딩** → 텍스트(10K자 캡).
- **신규 `app/api/kr-events/summary/route.ts`** — GET `?rcept=&symbol=&nm=` → `filing_summaries` 캐시(accession=rcept_no·US와 공유) → 원문 추출 → gpt-4o-mini 사실 요약 → 캐시.
- **`app/stock/[symbol]/page.tsx`** — `KrFilingSummary`(지연·민트 "AI 요약"·실패 숨김) → KrEventLayer 각 공시 카드 밑에.
- **`lib/dartEvents.ts`** — 정기보고서(분기/반기/사업)·잠정실적 키워드 추가 + `page_count 40→100`(삼성전자 등 커버리지 개선).
- 새 테이블 없음(filing_summaries 재사용). Cowork 사전: `tsc --noEmit` EXIT=0.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -20
```
- [ ] 무에러.

## 1) 🔴 라이브 검증 (한글 안 깨지고 사실 요약 나오나 — EUC-KR 핵심)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/kr3dev.log 2>&1 &) ; sleep 15
node -e '(async()=>{const base="http://localhost:3333";for(const sym of ["000660","005930","035420"]){try{const ev=await (await fetch(base+"/api/kr-events?symbol="+sym)).json();const e=(ev.events||[])[0];if(!e)continue;console.log(sym,"|",e.report_nm,"|",e.rcept_no);const q=new URLSearchParams({rcept:e.rcept_no,symbol:sym,nm:e.report_nm});const s=await (await fetch(base+"/api/kr-events/summary?"+q)).json();console.log("→ AI 요약:",JSON.stringify(s));return;}catch(err){console.log(sym,"err",String(err));}}})();'
# 확인 후: pkill -f "next dev"
```
- [ ] `→ AI 요약: {"summary":"…정상 한국어 2~3줄…","cached":false}` — **한글이 안 깨짐**(`ì`·`ê°` 같은 깨진 문자 X)·공시 내용과 일치·예측 없음. 재실행 → `cached:true`.
- ⚠️ 요약이 **깨진 문자**면 EUC-KR 디코딩 실패 → `lib/dartSummary.ts` 인코딩 로직 문제 → 커밋 전 멈추고 실제 summary 문자열을 Cowork에 공유.

## 2) 눈검수
```bash
echo "http://localhost:3333/stock/000660.KS — '최근 중대 공시'(DART) 각 항목 밑에 민트 'AI 요약' 확인."
```

## 3) 커밋 + push
```bash
cd ~/stock-terminal && git add lib/dartSummary.ts "app/api/kr-events/summary/route.ts" "app/stock/[symbol]/page.tsx" lib/dartEvents.ts docs/STEP_596_COMMAND.md && git commit -m "feat(ai): R1-KR DART 공시 원문 AI 요약 — document.xml(zip·EUC-KR) 추출→gpt-4o-mini 사실 요약·filing_summaries 캐시 + 정기보고서 키워드 (STEP 596)" && git push
```

## ✅ 여기까지 = R1-KR 라이브 = **"US 완성형 → 데이터 교체" 실증 완료.** KR도 공시 원문 AI 요약. 다음 후보 = R2-KR(브리핑에 DART 이벤트)·R3-KR(한국 뉴스)·JP/CN · 세션 문서 매듭(595~596).
> ⚠️ 한글 깨지면 커밋 X — 인코딩부터.
