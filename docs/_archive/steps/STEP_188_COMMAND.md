<!-- 2026-06-06 -->
# STEP 188 — 미리보기 거래량 막대 키우기 (토스식: 크게·가깝게)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_188_COMMAND.md 파일 내용대로 실행해줘`

## 목표
거래량 막대가 작고(22px) 캔들과 떨어져(gap 6px) 바닥에 동떨어져 보임 → 토스처럼 **크게(38px)·가깝게(2px)·살짝 진하게**.
- 가격 영역 96→84, 간격 6→2, 거래량 22→38 (전체 높이 138 동일)
- 거래량 색 opacity 0.45→0.55

## 전제 상태
- HEAD: STEP 187 적용된 상태
- 변경: `components/home-v6/HomeStockDetail.tsx`(CandleChart 치수 상수 + 거래량 opacity) 1파일

---

## 작업 1/2 — 치수 상수 조정

**찾기:**
```tsx
  const data = candles.slice(-60);
  const w = 280;
  const priceH = 96;
  const gap = 6;
  const volH = 22;
  const labelH = 14;
  const h = priceH + gap + volH + labelH;
```

**바꾸기:**
```tsx
  const data = candles.slice(-60);
  const w = 280;
  const priceH = 84;
  const gap = 2;
  const volH = 38;
  const labelH = 14;
  const h = priceH + gap + volH + labelH;
```

## 작업 2/2 — 거래량 막대 색 진하게

**찾기:**
```tsx
            fill={up ? "#1AC267" : "#F04452"}
            opacity={0.45}
          />
```

**바꾸기:**
```tsx
            fill={up ? "#1AC267" : "#F04452"}
            opacity={0.55}
          />
```

> 핵심: 거래량 밴드를 22→38px로 키우고 캔들과 간격을 6→2px로 좁혀 가격 차트 바로 밑에 붙임. 막대가 위로 더 차오름.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeStockDetail.tsx && git commit -m "feat(v7): 미리보기 거래량 막대 토스식 — 크게(38px)·가깝게(2px)·진하게 (STEP 188)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 거래량 막대가 **더 크고 위로 차오르며**, 캔들 바로 밑에 붙어 보이는지(바닥에 동떨어진 느낌 사라짐)
- [ ] 월 라벨(26.3·26.4…)·캔들은 그대로
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 상승 추세 종목은 최근 캔들이 위쪽에 몰려 가격 영역 아래가 비는데, 이건 토스도 동일(정상).
- 더 키우려면 `volH` ↑·`priceH` ↓. 너무 진하면 `opacity` ↓.

---
> STEP 188 = 거래량 막대 키움. 전제 STEP 187. 다음: 카테고리 2열 등. 문서 묶어 갱신.
