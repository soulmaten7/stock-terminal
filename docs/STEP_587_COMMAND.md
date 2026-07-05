<!-- 2026-07-05 -->
# STEP 587 — 종목 페이지 전문가 톤 1차 (접힘 카드 판정형 + 디스클레이머 통합 + 카피 자연화)

> **목표**: 페이지를 "AI 설명체"에서 **프로 대시보드 톤**으로. ① **접힌 카드 = 판정+핵심 수치 선언형**(설명체 문장 → 펼치면 "이게 뭐예요?"로 초보용). ② **디스클레이머 통합**(상단 1줄 + 인라인 반복 8군데 제거 · 법적 문구는 전역 푸터 그대로). ③ **카피 자연화**(공지·이벤트·플래그의 어색한 직역체 손봄). **소스는 Cowork이 이미 수정** → Claude Code는 **빌드 + 눈검수 + 커밋 + push**.
> **전제 HEAD**: `cd83323`(STEP 586).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_587_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것 (확인용)
- `app/stock/[symbol]/page.tsx`
  - **접힘 카드** = 판정(verdict) + 핵심 수치 선언형(예: "추세는 위쪽 · 200일선 1.99%"). 설명체 `L.summary`는 펼침의 "이게 뭐예요?"로만.
  - **상단 공지** 1줄("검증된 기법들이 이 종목을 저마다 어떻게 보는지 보여드려요. 사고팔 신호가 아니라, 스스로 판단할 재료예요.") + 인라인 반복(하단 "예측도 권유도"·이벤트 "판단은 당신 몫/좋다·나쁘다"·플래그 "방향 판정 아님"·스트립 "정답 아님/당신 몫") **제거**.
  - 이벤트·플래그 문구 자연화("렌즈 점수엔 아직 안 반영된 최신 공시예요" 등) · 시간축 소제목 군더더기 제거.
- `docs/VOICE_GUIDE.md` — "디스클레이머는 한 곳에만" 원칙 추가.
- 법적 문구는 **전역 푸터**에 그대로.
- Cowork 사전: `tsc --noEmit` EXIT=0.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -20
```
- [ ] 무에러.

## 1) 눈검수 (NVDA) — 무엇이 바뀌었나
```bash
cd ~/stock-terminal && (npm run dev >/tmp/lensdev.log 2>&1 &) ; sleep 14 ; echo "http://localhost:3000/stock/NVDA 새로고침해서 확인" ; sleep 1
# 확인 후: pkill -f "next dev"
```
- [ ] **접힌 렌즈 카드**들이 "~하는 방법이에요" 설명 대신 **판정 + 수치**로 보임 (예: Momentum → "강하게 오르는 흐름 · 12-1 36.57%"). 카드 펼치면 "이게 뭐예요?" 설명 있음.
- [ ] 상단 = 한 줄 공지. 페이지 하단·이벤트·스트립의 반복 디스클레이머 **사라짐**. 맨 아래 전역 푸터 법적 문구는 **그대로**.

## 2) 커밋 + push (→ 배포 확인용)
```bash
cd ~/stock-terminal && git add "app/stock/[symbol]/page.tsx" docs/VOICE_GUIDE.md docs/STEP_587_COMMAND.md && git commit -m "refactor(ui): 종목 페이지 전문가 톤 1차 — 접힘 카드 판정+수치 선언형 + 디스클레이머 통합(상단 1줄·법적문구=전역푸터) + 카피 자연화 (STEP 587)" && git push
```

## ✅ 여기까지 = 전문가 톤 1차. 배포본 보고 방향 맞으면 → 판정 문구 자체 다듬기(구어 제거)·상단/여백/타이포 밀도 → 전체 적용.
