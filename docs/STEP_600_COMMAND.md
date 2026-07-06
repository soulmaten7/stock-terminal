<!-- 2026-07-06 -->
# STEP 600 — 브랜딩: 'TRAI' → 'AI 렌즈' (헤더 로고 재사용 + 언어별 렌즈)

> **목표**: 폐기한 옛 이름 **"TRAI"**(4개 보드 8군데 + 종목 헤더)를 **"(로고) AI 렌즈"**로 통일. 헤더의 **T 블록 로고 재사용**(새 에셋 X). "AI"·로고=고정, **"렌즈"만 언어별**(ko 렌즈·en Lens·ja レンズ·zh 镜头). 정적 UI·데이터 없음.
> **전제**: STEP 599(`7e336c5`) 이후. **소스=Cowork 완료** → Claude Code는 **빌드 + 다중 눈검수 + 커밋**.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_600_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것
- **신규 `components/AiLensBadge.tsx`** — `TLensLogo`(헤더와 동일 T 블록·민트) + `AiLensBadge`(로고+AI+언어별 렌즈·링크형 `arrow`·필형 `pill`) + `LENS_WORD` 맵(ko/en/ja/zh). "AI"·로고 고정.
- **4개 보드**(MarketBoard·JpMarketBoard·CnMarketBoard·UsMarketBoard) — "TRAI →" 링크(8군데) → `<AiLensBadge href arrow />` / 바텀시트 버튼 "TRAI — 기법별 전망" → 로고+"AI 렌즈 — 기법별 전망".
- **종목 페이지 헤더** — "AI LENS" 텍스트 배지 → `<AiLensBadge pill />`(로고+AI 렌즈).
- Cowork 확인: `tsc --noEmit` EXIT=0 · 코드에 "TRAI" 잔재 없음(AiLensBadge 주석 제외).

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```
- [ ] 무에러.

## 1) 🔴 다중 눈검수 (여러 탭에서 일관성 — 3곳 이상)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/branddev.log 2>&1 &) ; sleep 14
echo "확인:"
echo " (a) http://localhost:3333/  → 종목·상품 보드(KR)에서 행의 'TRAI →' 자리에 [T로고] AI 렌즈 → 보이나"
echo " (b) 미국 토글 → US 보드도 동일하게 [T로고] AI 렌즈 →"
echo " (c) http://localhost:3333/stock/NVDA → 상단 배지가 [T로고] AI 렌즈 (옛 'AI LENS' 텍스트 아님)"
echo " (d) 모바일 폭에서 종목 클릭 → 바텀시트 버튼 '[T로고] AI 렌즈 — 기법별 전망'"
sleep 1
# 확인 후: pkill -f "next dev"
```
- [ ] (a)(b)(c) **세 곳 모두** [민트 T로고] + "AI 렌즈"로 표시 · **"TRAI" 글자 완전히 사라짐**.
- [ ] 로고가 헤더 좌상단 로고와 동일한 T 블록 모양.

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add components/AiLensBadge.tsx "components/toolbox/MarketBoard.tsx" "components/toolbox/JpMarketBoard.tsx" "components/toolbox/CnMarketBoard.tsx" "components/toolbox/UsMarketBoard.tsx" "app/stock/[symbol]/page.tsx" docs/STEP_600_COMMAND.md && git commit -m "feat(brand): 'TRAI'→'AI 렌즈' — 헤더 T 로고 재사용 배지(AiLensBadge)·언어별 렌즈(AI·로고 고정)·4개 보드+종목 헤더 8군데 교체 (STEP 600)" && git push
```

## ✅ 여기까지 = AI 렌즈 브랜딩 통일. 옛 'TRAI' 청산 + Trillion 로고로 인식. (다른 국가탭 AI 확장은 여전히 사용자 승인 후.)
