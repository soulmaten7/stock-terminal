<!-- 2026-07-05 -->
# STEP 587 — 디스클레이머 통합 (상단 1줄 + 인라인 반복 제거)

> **목표**: "예측 아님·사라·판단은 당신·정답 아님"이 페이지 8군데 흩어져 방어적·AI스럽던 것을, **유료 표준(TipRanks·Danelfin = /disclaimer 한 곳 + UI는 당당)**대로 정리. 상단 **긍정 포지셔닝 1줄** + 인라인 반복 **제거**(법적 문구는 전역 푸터에 이미 있음). 카드는 사과 없이 당당하게. **소스는 Cowork이 이미 수정** → Claude Code는 **빌드 + 눈검수 + 커밋 + push**.
> **전제 HEAD**: `cd83323`(STEP 586).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_587_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것 (확인용)
- `app/stock/[symbol]/page.tsx` — 상단 공지 = **"매수·매도 권유가 아니라, 스스로 판단하는 출발점"** 1줄(포지셔닝) · 인라인 반복 **7군데 제거**(페이지 하단 "예측도 권유도"·이벤트 "판단은 당신 몫"+"좋다/나쁘다"·플래그 "방향 판정 아님"·스트립 "정답 아님"+"당신 몫"·공지 legend "사라·사지마라") · 구조 설명(사실 vs 판정 분리)만 짧게 유지.
- `docs/VOICE_GUIDE.md` — "디스클레이머는 한 곳에만" 원칙 추가.
- 법적 문구는 **전역 푸터(components/layout/Footer)에 그대로** — 안 건드림.
- Cowork 사전: `tsc --noEmit` EXIT=0.

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
- [ ] 상단 = "검증된 기법들이 이 종목을 각자 어떻게 보는지… **매수·매도 권유가 아니라, 스스로 판단하는 출발점**으로요" 1줄.
- [ ] 페이지 하단 "예측도 권유도 아니에요…" **사라짐**. 이벤트·플래그·스트립에서 "판단은 당신 몫/좋다·나쁘다/방향 판정 아님/정답 아님" **사라짐**.
- [ ] **전역 푸터**(맨 아래 "투자 권유 또는 투자 자문이 아닙니다…")는 **그대로**.
- [ ] 카드들이 사과 없이 당당하게 읽히는지(주관).

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add "app/stock/[symbol]/page.tsx" docs/VOICE_GUIDE.md docs/STEP_587_COMMAND.md && git commit -m "refactor(copy): 디스클레이머 통합 — 상단 포지셔닝 1줄 + 인라인 반복 제거(법적 문구=전역 푸터) + VOICE_GUIDE 원칙 (STEP 587)" && git push
```

## ✅ 여기까지 = 카피 정리(반복 제거·당당한 톤). 다음 = 보이스 v2(카드 판정·outlook 전체 재보이스) · 또는 세션 문서 매듭(585~587) · 또는 AI 원문 요약.
