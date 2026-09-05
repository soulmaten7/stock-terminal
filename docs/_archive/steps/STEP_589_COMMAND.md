<!-- 2026-07-05 -->
# STEP 589 — 시간축 스트립 초보 관점 정리 (장기 칸 단어-우선 + 암호 꼬리표 제거)

> **목표**: 카드가 프로 톤이 되며 스트립이 초보 서빙을 떠안음 → 스트립을 초보 눈으로 점검. 단기·중기는 「**단어**·숫자」인데 장기만 「5중 1 우호·종합점수 아님(개수)」로 패턴이 깨지고 꼬리표가 암호 같았음. → 장기도 **합의도 단어 우선**(엇갈림/대체로 우호적/대체로 비우호적)으로 3칸 나란히, 숫자는 「N개 중 M개 우호」로 풀고 암호 꼬리표 제거. **소스는 Cowork이 이미 수정** → Claude Code는 **빌드 + 눈검수 + 커밋 + push**.
> **전제 HEAD**: `1c8fc0c`(STEP 588).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_589_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것 (확인용)
- `app/stock/[symbol]/page.tsx` `HorizonStrip`:
  - 장기 **합의도 단어** 추가(`lWord`/`lTone`) — **정직**: 종합 점수 아님, 장기 렌즈들이 얼마나 한쪽으로 쏠렸나만 서술. 기본값 **엇갈림**, favorable/unfavorable가 **60%(ceil) 이상**일 때만 방향 단어. 전부 중립이면 **뚜렷하지 않음**.
    - `favN>=ceil(0.6·N)` → "대체로 우호적"(pos) · `unfavN>=ceil(0.6·N)` → "대체로 비우호적"(warn) · fav=unfav=0 → "뚜렷하지 않음" · 그 외 → "엇갈림".
  - 장기 카드 하단 = **단어 + 「N개 중 M개 우호」**(기존 "5중 1 우호 · 종합점수 아님(개수)" 대체 — 암호 꼬리표 제거, 색은 lTone).
  - 하단 요약 줄 = 3칸 **단어 병렬**("단기 X · 중기 Y · 장기 Z — 시간축마다 결이 달라요").
- Cowork 사전: `tsc --noEmit` EXIT=0.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -20
```
- [ ] 무에러.

## 1) 눈검수 (NVDA)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/lensdev.log 2>&1 &) ; sleep 14 ; echo "http://localhost:3000/stock/NVDA '시간축으로 한눈에' 카드 확인" ; sleep 1
# 확인 후: pkill -f "next dev"
```
- [ ] 장기 칸이 **단어 우선**(예: "엇갈림 · 5개 중 1개 우호")으로 단기·중기와 나란히 읽힘.
- [ ] 하단 요약 = "단기 중립 · 중기 강세 · 장기 엇갈림 — 시간축마다 결이 달라요" 식 3단어 병렬.
- [ ] "종합점수 아님(개수)" 암호 꼬리표 사라짐.

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add "app/stock/[symbol]/page.tsx" docs/STEP_589_COMMAND.md && git commit -m "refactor(ui): 시간축 스트립 초보 정리 — 장기 칸 합의도 단어-우선(엇갈림/대체로 우호적) + N개 중 M개 우호 + 암호 꼬리표 제거 (STEP 589)" && git push
```

## ✅ 여기까지 = 스트립 초보 정리 완료. **폴리싱 종료** → 다음 = **AI 원문 요약**(8-K 원문 LLM 요약·OpenAI 키 있음·Pro). 그리고 세션 문서 매듭(585~589).
