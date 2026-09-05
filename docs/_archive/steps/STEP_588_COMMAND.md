<!-- 2026-07-05 -->
# STEP 588 — 판정 보이스 v2 (렌즈 판정 문구 프로 톤 일관화)

> **목표**: 접힘 카드의 '주연'이 된 **판정 문구(verdict.phrase)**의 톤 불일치 정리 — 구어체("강하게 오르는 흐름"·"알짜로 잘 버는 우량"·"공격적으로 확장 중")를 **선언형 프로 톤**으로 일관화(VOICE_GUIDE 기준). **쉬운 해석(plain)은 초보용이라 그대로**(펼침에서 따뜻하게). **소스는 Cowork이 이미 수정** → Claude Code는 **빌드 + 눈검수 + 커밋 + push**.
> **전제 HEAD**: `aee78cf`(STEP 587).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_588_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것 (확인용)
- `lib/lensCopy.ts` `LENS_READINGS.ko` **판정 문구만** 일관화(plain 유지):
  - 모멘텀: 강한 상승 추세 / 뚜렷한 추세 없음 / 하락 추세
  - 저변동: 낮은 변동성 / 보통 변동성 / 높은 변동성
  - 밸류: 이익 대비 싼 편 / 이익 대비 보통 / 이익 대비 비싼 편
  - 퀄리티: 높은 수익성 / 보통 수익성 / 낮은 수익성
  - 자산성장: 공격적 확장 / 보통 확장 / 보수적 운영
  - 기술: 상승 추세 / 추세 불분명 / 하락 추세(200일선 아래)
  - F-Score: 재무 건전 / 재무 보통 / 재무 취약 · 미적용=산출 불가
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
- [ ] 접힌 카드 판정이 일관된 프로 톤: Momentum **"강한 상승 추세"** · Quality **"높은 수익성"** · Value "이익 대비 비싼 편" · Asset Growth **"공격적 확장"** · Technical "상승 추세" · Low Vol "보통 변동성".
- [ ] 카드 펼치면 쉬운 해석(plain)은 그대로 따뜻하게.

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add lib/lensCopy.ts docs/STEP_588_COMMAND.md && git commit -m "refactor(copy): 판정 보이스 v2 — 렌즈 판정 문구 프로 톤 일관화(강하게 오르는 흐름→강한 상승 추세·알짜로 잘 버는 우량→높은 수익성 등) (STEP 588)" && git push
```

## ✅ 여기까지 = 판정 보이스 프로 일관화. 다음 = (a) 시간축 스트립 초보 관점 점검 → 그다음 **멈추고 AI 원문 요약**(OpenAI 키 있음). · 세션 문서 매듭(585~588)도 곧.
