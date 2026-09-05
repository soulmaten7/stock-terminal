<!-- 2026-07-05 -->
# STEP 580 — 시간축 스트립 + 기법별 best-viz 카드 + 단/중/장 그룹핑 (종목 페이지 UI · 시간축 스트립 STEP B)

> **목표**: `/stock/[symbol]` 렌즈 페이지를 **시간축(단기·중기·장기) 중심**으로 재구성. 상단 = 시간축 스트립(단기 RSI 존 · 중기 모멘텀 퍼센타일 · 장기 팩터 묶음+개수), 하단 = 단기/중기/장기로 묶은 기법 카드 + 기법별 best-viz(퍼센타일 게이지·RSI 존·F-Score 체크리스트). **소스는 Cowork이 이미 수정** → Claude Code는 **빌드 + 눈검수 + 커밋 + push**만.
> **전제 HEAD**: `f2c70d1`(STEP 579 — horizon+퍼센타일 백엔드).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_580_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것 (확인용 — 재수정 불필요)
- `app/stock/[symbol]/page.tsx` — 전면 재작성:
  - 타입에 `horizon`·`percentile` 추가.
  - `HorizonStrip`(단기 RSI 존·중기 모멘텀 퍼센타일 바·장기 팩터 pill+“N중 M 우호” + 데이터 기반 요약 한 줄).
  - `PctGauge`(팩터 5종 퍼센타일 게이지·랭크 0~100·방향별 lo/hi) · `RsiZone`(기술 침체–중립–과열).
  - 카드를 `horizon`으로 **단기/중기/장기 섹션 그룹핑**, F-Score는 장기 끝에. Spectrum은 퍼센타일 없을 때(비US) **폴백**.
- Cowork 사전 검증: `tsc --noEmit` EXIT=0 · ESLint 신규 문제 0건(잔여 1건은 원본 HEAD에도 있던 `setState in effect`·비차단·배포 이력 있음).

## 0) 빌드 검증
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Type error|Error:" | head -20
```
- [ ] "Compiled successfully"(또는 무에러). ※ `setState synchronously within an effect` 경고가 보여도 **원본과 동일·비차단**(무시).

## 1) 눈검수 — 실제 화면 확인 (권장)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/lensdev.log 2>&1 &) ; sleep 14 ; echo "브라우저에서 아래 2개 열어 확인:"
echo "  US  → http://localhost:3000/stock/NVDA   (시간축 스트립 + 퍼센타일 게이지 뜸)"
echo "  KR  → http://localhost:3000/stock/005930 (스트립·그룹 뜨되 퍼센타일 없이 방향/폴백)"
# 확인 끝나면: pkill -f "next dev"
```
- [ ] **NVDA**: 상단 “시간축으로 한눈에” 3칸(단기 RSI·중기 모멘텀 상위%·장기 팩터 pill+“N중 M 우호”) + 아래 단기/중기/장기 섹션, 팩터 카드에 랭크 게이지, F-Score 9칸 체크리스트.
- [ ] **005930(삼성전자)**: 스트립·그룹은 뜨고, 팩터 카드는 퍼센타일 대신 방향(폴백)만 — 에러 없이.
- [ ] 상단 “예측 아님·사라/사지마라 안 함” 고지 유지.

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add "app/stock/[symbol]/page.tsx" docs/STEP_580_COMMAND.md && git commit -m "feat(lens): 시간축 스트립(단기 RSI·중기 모멘텀 퍼센타일·장기 팩터 묶음) + 기법별 best-viz 게이지 + 단/중/장 그룹핑 — 종목 페이지 UI (STEP 580)" && git push
```

## ✅ 여기까지 = STEP B(UI) 완료. 스크린샷 찍어 Cowork에 공유 → 문구·간격·색 미세조정.
