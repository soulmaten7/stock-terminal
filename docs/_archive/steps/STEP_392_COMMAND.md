<!-- 2026-06-24 -->
# STEP 392 — 잘린 종목명 풀네임(툴팁+시트) + 관심종목 토글 에러 되돌리기 (P2/P3 마무리)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_392_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
1. **잘린 종목명 보기(A안)**: 데스크탑은 종목명 hover 시 `title` 툴팁으로 풀네임 / 모바일은 종목 탭 시 뜨는 증권사 시트 헤더에 **풀네임 다 보이게**(시트 헤더 truncate 제거 → 줄바꿈).
2. **관심종목 토글 에러 되돌리기**: `toggleWatch`가 실패해도 별이 켜진 채 남던 것(fire-and-forget) → 실패 시 **낙관적 업데이트 revert**(다른 토글들과 일관).

변경 1파일: `components/toolbox/MarketBoard.tsx` (3곳).

---

## ① 표 종목명 — hover 툴팁(title)
**찾기:**
```tsx
                        <span className="truncate font-medium text-unjong-primary">{r.name}</span>
```
**바꾸기:**
```tsx
                        <span title={r.name} className="truncate font-medium text-unjong-primary">{r.name}</span>
```

## ② 증권사 시트 헤더 종목명 — 풀네임(truncate 제거)
**찾기:**
```tsx
                <p className="truncate font-bold text-unjong-primary">{selectedStock.name}</p>
```
**바꾸기:**
```tsx
                <p className="font-bold leading-snug text-unjong-primary">{selectedStock.name}</p>
```

## ③ toggleWatch — 실패 시 되돌리기
**찾기:**
```tsx
    }).catch(() => {});
```
**바꾸기:**
```tsx
    }).then((res) => { if (!res.ok) throw new Error('watchlist'); }).catch(() => {
      setWatchSet((prev) => { const n = new Set(prev); add ? n.delete(r.symbol) : n.add(r.symbol); return n; });
    });
```
> `add`·`r`은 `toggleWatch` 함수 스코프 안 → 그대로 사용 가능. 이 `}).catch(() => {});`는 toggleWatch에만 있음(관심종목 로드 effect의 catch는 `.catch(() => {});`로 형태 다름).

---

## ✅ 빌드 + 커밋
```bash
cd ~/stock-terminal && npm run build
```
무에러 시:
```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(market): 잘린 종목명 툴팁+시트 풀네임 + 관심종목 토글 실패 시 revert (STEP 392)" && git push
```

## ✅ 런타임 (새로고침)
- 데스크탑: 잘린 종목명에 마우스 올리면 풀네임 툴팁.
- 모바일: 종목 탭 → 증권사 시트 헤더에 긴 이름도 **다 보임**(줄바꿈).
- 관심종목 별: 정상 토글(실패 시 자동 원복 — 보통은 티 안 남).

---

> **한 줄 요약**: 잘린 종목명 풀네임 노출(데스크탑 툴팁/모바일 시트) + 관심종목 토글 실패 revert. P2/P3 정리 마무리.
