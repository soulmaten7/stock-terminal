<!-- 2026-07-06 -->
# STEP 595 — KR 공시 이벤트 층 (DART · US EDGAR 층의 KR 짝)

> **목표**: KR 종목 페이지에 **최근 중대 공시**(DART) 카드 — US가 STEP 581~583에서 지은 이벤트 층의 KR 버전. corp_code로 DART `list.json` 조회 → 중대 공시 키워드 필터(결정론) → 카드. **LLM·원문 요약 없음**(그건 STEP 596 R1-KR). 이게 R1-KR·R2-KR의 토대. 마스터 = `docs/AI_BRIEFING_SPEC.md`.
> **전제**: STEP 594(`8f57512`) 이후. **소스 = Cowork 완료** → Claude Code는 **빌드 + 라이브 검증 + 커밋**.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_595_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것 (확인용)
- **신규 `lib/dartEvents.ts`** — `fetchDartMaterial(symbol)`: 6자리 코드 → `getDartCorpCode`(기존) → DART `/list.json`(최근 6개월) → **중대 공시 키워드 필터**(유상증자·합병·실적·소송 등) → `{date,report_nm,rcept_no,url}`.
- **신규 `app/api/kr-events/route.ts`** — GET `?symbol=` → `{symbol, events}` · 10분 캐시.
- **`app/stock/[symbol]/page.tsx`** — `KrEventLayer`(지연·비면 숨김·DART 원문 링크) + **`isKR` 감지**(6자리 ±.KS/.KQ) → KR이면 `KrEventLayer`, US면 기존 `EventLayer`. R3 뉴스(`StockNewsBrief`)는 **US만**(KR 뉴스는 이후).
- 새 테이블 없음(인메모리 캐시). Cowork 사전: `tsc --noEmit` EXIT=0.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -20
```
- [ ] 무에러.

## 1) 🔴 라이브 검증 (DART 중대 공시가 나오나 — corp_code 매핑·필터)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/kr1dev.log 2>&1 &) ; sleep 15
node -e '(async()=>{for(const sym of ["005930","000660","035420"]){try{const s=await (await fetch("http://localhost:3333/api/kr-events?symbol="+sym)).json();console.log(sym,"KR-EVENTS:",JSON.stringify(s).slice(0,500));if((s.events||[]).length)return;}catch(e){console.log(sym,"err",String(e));}}})();'
# 확인 후: pkill -f "next dev"
```
- [ ] `KR-EVENTS: {"symbol":"005930","events":[{"date":"2026...","report_nm":"...","url":"...dart.fss.or.kr..."}]}` — **삼성전자(005930)/SK하이닉스(000660)/NAVER(035420) 중 하나라도 공시 목록** 반환.
- [ ] `report_nm`이 한국어 공시명(주요사항보고서·실적·유상증자 등)·`url`이 DART 원문. (dev 포트 다르면 3333 조정.)
- ⚠️ 셋 다 `events:[]`면: `dart_corp_codes` 테이블 미시드 / DART 키 / 최근 중대 공시 없음 중 하나 → `/tmp/kr1dev.log` + 결과를 Cowork에 공유(무작정 커밋 X).

## 2) 눈검수
```bash
echo "http://localhost:3333/stock/005930.KS — 렌즈 밑에 '최근 중대 공시'(DART) 카드 확인. (US 종목은 기존 EDGAR 층 그대로.)"
```

## 3) 커밋 + push
```bash
cd ~/stock-terminal && git add lib/dartEvents.ts "app/api/kr-events/route.ts" "app/stock/[symbol]/page.tsx" docs/STEP_595_COMMAND.md && git commit -m "feat(ai): KR 공시 이벤트 층 — DART corp_code→list.json 중대 공시 필터·KR 종목 페이지 공시 카드(EDGAR의 KR 짝) (STEP 595)" && git push
```

## ✅ 여기까지 = KR 공시 이벤트 층(토대). 다음 = **STEP 596 R1-KR 요약**(DART 원문 zip→XML→텍스트·`fflate` 추가 → gpt-4o-mini 사실 요약). 그 위에 R2-KR·R3-KR.
> ⚠️ 1단계에서 공시가 안 나오면 커밋 전 멈추고 로그 공유 — corp_code 시드 여부부터 볼 것.
