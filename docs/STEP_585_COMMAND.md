<!-- 2026-07-05 -->
# STEP 585 — 페이지명 "AI LENS" + 공지 컴팩트 + 이벤트 층 severity 재구성

> **목표**: ① 페이지 이름 **"AI LENS"**(발견성 AI + 정체성 LENS·"검증된 기법으로 읽는 여러 관점" 앵커). ② "이 화면 읽는 법" **컴팩트**(한 줄 + "자세히" 접기 = progressive disclosure). ③ 이벤트 층 **severity 재구성** — 중대(실적·재작성·파산 등)=기본 노출 / 루틴(반복 5.02·8.01)=묶어서 접힘("정기 공시 N건 · 임원·이사진 변동 4 …"). **소스는 Cowork이 이미 수정** → Claude Code는 **빌드 + 눈검수 + 커밋 + push**.
> **전제 HEAD**: `1958a48`(STEP 584).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_585_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것 (확인용)
- `app/stock/[symbol]/page.tsx` — 상단 **AI LENS 배지 + 앵커 문구** · "이 화면 읽는 법" → 한 줄 요약 + `<details>` 자세히(등급·사라 안 함) · `EventLayer` severity 분기(material 정렬 노출 / routine 그룹핑 접힘 · 중대 없으면 "중대한 사건 없어요").
- Cowork 사전: `tsc --noEmit` EXIT=0 · 신규 eslint 0(잔여 403 setState=기존·비차단).

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
- [ ] 상단에 **"AI LENS"** 배지 + "검증된 기법으로 이 종목을 읽는 여러 관점".
- [ ] "이 화면 읽는 법"이 **한 줄 + "▾ 자세히"**로 접힘(펼치면 신뢰도 등급).
- [ ] **이벤트 층**: **분기 실적(2.02)만 기본 노출**, 아래에 **"정기 공시 5건 · 임원·이사진 변동 4 · 기타 중대 사건 1 ▸"**(누르면 펼쳐짐). 5.02 4줄 반복 사라짐.
- [ ] 005930(KR): 이벤트 층 없음.

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add "app/stock/[symbol]/page.tsx" docs/STEP_585_COMMAND.md && git commit -m "feat(ui): 페이지명 AI LENS + '이 화면 읽는 법' 컴팩트(progressive disclosure) + 이벤트 층 severity 재구성(중대=노출·루틴=묶어 접힘) (STEP 585)" && git push
```

## ✅ 여기까지 = AI LENS 네이밍 + 정보 설계(compact/detail) 완료. 다음 = ② AI 원문 실독 요약 설계 · 또는 추가 미세조정.
