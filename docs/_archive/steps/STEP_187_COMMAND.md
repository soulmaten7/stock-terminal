<!-- 2026-06-06 -->
# STEP 187 — 미리보기 월 라벨 가장자리 잘림 수정

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_187_COMMAND.md 파일 내용대로 실행해줘`

## 목표
캔들차트 맨 왼쪽 월 라벨이 `textAnchor="middle"`로 차트 끝에 찍혀 **왼쪽이 잘림**("26.3"→"5.3"처럼 보임).
- 왼쪽 끝 라벨 → `start`(왼쪽정렬), 오른쪽 끝 라벨 → `end`(오른쪽정렬), 가운데 → `middle`
- x도 차트 안으로 clamp → 잘림 방지. 값 자체("26.3")는 정상.

## 전제 상태
- HEAD: STEP 186 적용된 상태
- 변경: `components/home-v6/HomeStockDetail.tsx`(월 라벨 렌더 블록만) 1파일

---

## 작업 1/1 — `CandleChart` 월 라벨 블록 교체

**찾기:**
```tsx
      {/* 월 축 라벨 */}
      {labels.map((l, i) => (
        <text key={`l${i}`} x={l.x} y={h - 3} fontSize={8} fill="#94a3b8" textAnchor="middle">
          {l.text}
        </text>
      ))}
```

**바꾸기:**
```tsx
      {/* 월 축 라벨 (양 끝 잘림 방지: 왼쪽=start, 오른쪽=end) */}
      {labels.map((l, i) => {
        const anchor = l.x < 16 ? "start" : l.x > w - 16 ? "end" : "middle";
        const lx = l.x < 1 ? 1 : l.x > w - 1 ? w - 1 : l.x;
        return (
          <text key={`l${i}`} x={lx} y={h - 3} fontSize={8} fill="#94a3b8" textAnchor={anchor}>
            {l.text}
          </text>
        );
      })}
```

> 핵심: 첫 라벨은 왼쪽 끝에서 오른쪽으로(start), 마지막 라벨은 오른쪽 끝에서 왼쪽으로(end) 그려져 잘리지 않음. "26.3"이 온전히 표시됨.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeStockDetail.tsx && git commit -m "fix(v7): 미리보기 월 라벨 가장자리 잘림 — 양 끝 anchor 보정(26.3 정상 표시) (STEP 187)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 미리보기 캔들 **맨 왼쪽 라벨이 "26.3"으로 온전히** 표시(잘린 "5.3" 사라짐), 오른쪽 끝 라벨도 안 잘림
- [ ] 만약 여전히 "5.3" 등 값 자체가 이상하면 → 잘림이 아니라 데이터 문제이니 Cowork에 알릴 것(time 포맷 재확인)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 원인은 잘림(렌더 위치)이지 값 오류 아님. 보정 후 "26.3" 정상 표시 예상.
- 라벨 폰트/색은 그대로(fontSize 8, #94a3b8).

---
> STEP 187 = 월 라벨 잘림 수정. 전제 STEP 186. 다음: 카테고리 2열 등. 문서 묶어 갱신.
