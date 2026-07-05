<!-- 2026-07-05 -->
# STEP 583 — 이벤트 층 정직화 4종 (라벨 과장 제거 · flagLens · F-Score 플래그 · 9.01/AB)

> **목표**: STEP 582 눈검수서 나온 4가지 정직·완성 수정. ① **5.02 라벨 과장 제거**("임원 사임/선임(CEO·CFO)" → "임원·이사진 변동" · 대부분 루틴이라 severity↓·**렌즈 플래그 안 함**). ② **F-Score 카드에도 ⚠️/📌 플래그** 배선(빠졌던 것). ③ **9.01 노이즈** 항목칩에서 제거(중대 item만). ④ **A/B 박스 분리**(⚠️ 근거 흔듦 / 📌 새 사실). 핵심 원칙 = **flagLens**(서브내용 무관하게 확실히 영향 주는 이벤트만 렌즈 플래그·나머진 리스트에만). **소스는 Cowork이 이미 수정** → Claude Code는 **빌드 + 눈검수 + 커밋 + push**.
> **전제 HEAD**: `bc2674a`(STEP 582).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_583_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것 (확인용)
- `lib/eightK.ts` — `EightKDef.flagLens` 추가 · 5.02="임원·이사진 변동"·severity info·flagLens=false · 확실 이벤트(2.02·4.02·4.01·2.01·2.06·5.01·1.03·3.01)만 flagLens=true.
- `app/stock/[symbol]/page.tsx` — `FlagChip`·`FlagBox` 공통 컴포넌트(A/B 분리) · `buildLensFlags`가 flagLens만 · **F-Score 카드에 flags 전달** · 항목칩 `e.defs`(9.01 제외).
- `docs/EVENT_LAYER_SPEC.md` — 5.02 행·flagLens 원칙 반영.
- Cowork 사전: `tsc --noEmit` EXIT=0 · 신규 eslint 0(잔여 381행 setState=기존·비차단).

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -20
```
- [ ] 무에러.

## 1) 눈검수 (NVDA)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/lensdev.log 2>&1 &) ; sleep 14 ; echo "http://localhost:3000/stock/NVDA 확인" ; sleep 1
# 확인 후: pkill -f "next dev"
```
- [ ] **최근 공시 리스트**: 5.02가 **"임원·이사진 변동"**(CEO·CFO 사임/선임 아님)으로 표시. 항목칩에 **9.01 안 뜸**(2.02·5.02만).
- [ ] **F-Score 카드 헤더**에 이제 **⚠️ 근거 주의** 칩(2.02 실적). 펼치면 FlagBox.
- [ ] **퀄리티·자산성장**: ⚠️ 근거 주의(2.02)만 — 5.02발 📌는 이제 **안 뜸**(리스트에만).
- [ ] "방향 판정 아님 · 좋다/나쁘다 안 함" 문구 유지.

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add lib/eightK.ts "app/stock/[symbol]/page.tsx" docs/EVENT_LAYER_SPEC.md docs/STEP_583_COMMAND.md && git commit -m "fix(events): 8-K 라벨 정직화(5.02=임원·이사진 변동) + flagLens(확실한 이벤트만 렌즈 플래그) + F-Score 카드 플래그 + 9.01 제거 + A/B 박스 분리 (STEP 583)" && git push
```

## ✅ 여기까지 = 이벤트 층 정직화 완료. 다음 = ②단계 'AI 원문 실독 요약'(정확한 내용 명시) 설계 · 또는 세션 문서 매듭.
