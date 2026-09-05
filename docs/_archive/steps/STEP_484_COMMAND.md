<!-- 2026-07-01 -->
# STEP 484 — 레버리지/인버스 배지 오탐 수정 (Bearings→인 버그)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_484_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (`lib/avatar.ts` `leverageInfo` 1함수)
US/JP 종목표에서 **영문 회사명에 배지 오탐** 수정. 예: "RBC **Bear**ings"가 `/BEAR/` 부분매칭 → "인"(인버스) 배지. "**Bull**~", "**Inverse**~" 등도 동일 오탐.
- **원인**: 영어 키워드(BEAR·BULL·INVERSE·LEVERAGE)가 부분문자열까지 매칭.
- **해결**: 단어 경계(`\b`) 적용 → 실제 레버리지 ETF("… Bull 3X")만 잡고, "Bearings"·"Bullish" 같은 정상명은 제외. (한글 인버스·레버리지·2배·3배·2X·3X는 그대로.)
> 클라이언트 유틸이라 HMR 즉시.

---

## 1) `lib/avatar.ts` — `leverageInfo` 영어 키워드에 단어 경계

**찾을 것:**
```ts
export function leverageInfo(name: string): { label: string; inverse: boolean } | null {
  const n = (name || "").toUpperCase();
  const inverse = /인버스|INVERSE|BEAR/.test(n);
  let mult: string | null = null;
  if (/3\s*X|3배/.test(n)) mult = "3x";
  else if (/2\s*X|2배/.test(n)) mult = "2x";
  else if (/레버리지|LEVERAGE|BULL/.test(n)) mult = "2x";
  if (mult) return { label: mult, inverse };
  if (inverse) return { label: "인", inverse: true };
  return null;
}
```
**바꿀 것:**
```ts
export function leverageInfo(name: string): { label: string; inverse: boolean } | null {
  const n = (name || "").toUpperCase();
  const inverse = /인버스|\bINVERSE\b|\bBEAR\b/.test(n);
  let mult: string | null = null;
  if (/\b3\s*X\b|3배/.test(n)) mult = "3x";
  else if (/\b2\s*X\b|2배/.test(n)) mult = "2x";
  else if (/레버리지|\bLEVERAGE\b|\bBULL\b/.test(n)) mult = "2x";
  if (mult) return { label: mult, inverse };
  if (inverse) return { label: "인", inverse: true };
  return null;
}
```

---

## 2) 빌드 + 검증
```bash
npm run build
```
- [ ] 🇺🇸 미국 종목표 45위 근처 **RBC Bearings** → 로고/이니셜(정상), "인" 배지 사라짐.
- [ ] 실제 레버리지 ETF(KODEX 레버리지·인버스, "… Bull/Bear 3X")는 배지 그대로.

## 3) 커밋
```bash
git add lib/avatar.ts && git commit -m "fix: 레버리지/인버스 배지 영문명 오탐 수정 — 단어경계(\\b)로 Bearings·Bullish 등 제외 (STEP 484)" && git push
```

## 📋 US 검수 결과 (참고)
- ✅ 종목표 6,081개·$ 시세·정렬·페이지네이션·10개마다 광고·증권사(한국어) 정상
- ✅ 뉴스(이미지)·리포트·기업재무·ETF·공모주 피드 정상 · 공시(SEC)·거시(FRED) 정상
- ✅ 인덱스 티커 닛케이225+USD/JPY 반영 · 일본 변경으로 인한 회귀 없음
- ⚠️ **배지 오탐(이 STEP)** 이 유일한 발견 갭.
