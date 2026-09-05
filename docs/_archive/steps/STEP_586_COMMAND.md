<!-- 2026-07-05 -->
# STEP 586 — 한국어 보이스 패스 v1 (원어민 전문가 톤) + VOICE_GUIDE

> **목표**: 카피를 "적절한 단어를 찾은 AI"에서 **"적절한 단어를 고른 원어민 전문가"** 톤으로. 라벨 재집필(**표본 약함→약한 신호 · 건전성→재무 건전성 · 근거 주의→자료 갱신**) + 공지·플래그 문장 재집필 + **`docs/VOICE_GUIDE.md` 신설**(기준 문서). **소스는 Cowork이 이미 수정** → Claude Code는 **빌드 + 눈검수 + 커밋 + push**.
> **전제 HEAD**: `bf237f2`(STEP 585).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_586_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것 (확인용)
- `lib/lenses.ts` — 밸류·자산성장 등급 `표본 약함` → **`약한 신호`**.
- `app/stock/[symbol]/page.tsx` — 공지 재집필("오를지 맞히는 게 아니에요…") · 등급 범례 자연화 · F-Score 배지 `건전성`→**`재무 건전성`**(+펼침 3곳) · 플래그 칩 `근거 주의`→**`자료 갱신`**·`새 사실`→`새 소식` · 플래그 박스 문장 재집필.
- `lib/lensCopy.ts` — 자산성장 outlook `(단, 표본 약함)` → `(다만 근거는 아직 약해요)` + 문장 자연화.
- `docs/VOICE_GUIDE.md` — 원어민 전문가 보이스 원칙·do/don't·before/after·라벨 결정.
- Cowork 사전: `tsc --noEmit` EXIT=0 · eslint 잔여 1건(403 setState=기존·비차단). ※ 딥 검증노트(자세히)·LENS_READINGS 전체 재보이스 = **v2**(다음).

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
- [ ] 상단 공지: **"오를지 맞히는 게 아니에요. …시선이 엇갈리면 그게 오히려 봐야 할 지점이고요."**
- [ ] **밸류·자산성장 배지 = "약한 신호"** (표본 약함 아님) · **F-Score 배지 = "재무 건전성"**.
- [ ] 이벤트/렌즈 플래그 = **"자료 갱신"**(⚠️) · **"새 소식"**(📌). 박스 문장도 자연스러운지.
- [ ] 전체적으로 "번역체 AI"보다 사람이 쓴 느낌인지(주관 눈검수).

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add "app/stock/[symbol]/page.tsx" lib/lenses.ts lib/lensCopy.ts docs/VOICE_GUIDE.md docs/STEP_586_COMMAND.md && git commit -m "feat(copy): 한국어 보이스 패스 v1 — 원어민 전문가 톤 라벨/공지/플래그 재집필(표본약함→약한 신호·건전성→재무 건전성·근거주의→자료 갱신) + VOICE_GUIDE (STEP 586)" && git push
```

## ✅ 여기까지 = 보이스 v1(고가시성 라벨·공지·플래그). 다음 = 보이스 v2(LENS_READINGS 판정 문구·outlook 전체 재보이스) · 또는 ② AI 원문 요약(OpenAI 키 있음).
