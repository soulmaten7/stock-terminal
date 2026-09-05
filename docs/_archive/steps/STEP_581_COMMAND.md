<!-- 2026-07-05 -->
# STEP 581 — 8-K 중대 이벤트 사실 레이어 백엔드 (US · 이벤트 층 STEP C1)

> **목표**: EDGAR submissions의 `items` 코드로 종목별 '중대 8-K 이벤트'를 **결정론적으로 분류**(NLP 없이) → `/api/events?symbol=`. 렌즈 점수엔 안 섞음. 다음 UI(STEP C2)에서 이벤트 리스트 + 렌즈 ⚠️/📌에 사용. **소스는 Cowork이 이미 작성** → Claude Code는 **빌드 + `items` 필드 실검증 + 커밋 + push**.
> **전제 HEAD**: `be7c96f`(STEP 580).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_581_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것 (확인용 — 재수정 불필요)
- `lib/eightK.ts` — 8-K item→렌즈 매핑 config(`EIGHTK` · A/B/general 3분류·severity) + `fetchMaterial8K(ticker)`(ticker→CIK via company_tickers.json → `data.sec.gov/submissions/CIK.json` → form=8-K·중대 item만 필터·분류). SEC User-Agent 기본값 포함.
- `app/api/events/route.ts` — `GET ?symbol=` → `{symbol, events[]}`. 10분 캐시. 비US·미상장은 `events:[]`.
- `docs/EVENT_LAYER_SPEC.md` — 3회 검수 확정 스펙(가드레일·매핑표·free/pro·KR 별도).
- `docs/BUSINESS_STRATEGY.md` — 결정 로그 "3개의 시계"(2026-07-05).
- Cowork 사전: `tsc --noEmit` EXIT=0.

## 0) 빌드 검증
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -20
```
- [ ] 무에러(setState 경고는 기존 것·무시).

## 1) 🔴 핵심 검증 — EDGAR `items` 실제로 오는지 (내 설계 가정)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/lensdev.log 2>&1 &) ; sleep 14 ; \
echo "== NVDA (US: 중대 8-K 이벤트 배열 떠야) ==" ; curl -s "http://localhost:3000/api/events?symbol=NVDA" | head -c 900 ; echo ; \
echo "== AAPL ==" ; curl -s "http://localhost:3000/api/events?symbol=AAPL" | head -c 500 ; echo ; \
echo "== 005930 (비US: events 빈 배열이어야) ==" ; curl -s "http://localhost:3000/api/events?symbol=005930" | head -c 200 ; echo ; \
pkill -f "next dev"
```
- [ ] NVDA/AAPL 응답에 `"events":[{...}]` — 각 항목에 `date`·`items`(예 "2.02")·`defs`(label·klass·lenses) 존재. **여기가 뜨면 EDGAR item코드 결정론 분류 = 검증 완료.**
- [ ] 005930 = `"events":[]` (비US 안전).
- ⚠️ 만약 events가 비어 나오면(SEC 차단·필드 다름) **커밋 말고 Cowork에 결과 붙여줘** — 설계 재점검.

## 2) 커밋 + push (1번 통과 시에만)
```bash
cd ~/stock-terminal && git add lib/eightK.ts app/api/events/route.ts docs/EVENT_LAYER_SPEC.md docs/BUSINESS_STRATEGY.md docs/STEP_581_COMMAND.md && git commit -m "feat(events): 8-K 중대 이벤트 사실 레이어 백엔드 — EDGAR item코드 결정론 분류(lib/eightK)+/api/events(US)+EVENT_LAYER_SPEC (STEP 581)" && git push
```

## ✅ 여기까지 = 이벤트 층 백엔드 완료. 다음 = STEP C2(UI) — 이벤트 리스트 섹션 + 렌즈 카드 ⚠️(A)/📌(B) 플래그.
