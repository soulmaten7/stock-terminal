<!-- 2026-06-20 -->
# STEP 328 — [UI] 증권사 이름 밑 부가설명(note) 제거

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_328_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
증권사 행에서 이름 밑 부가설명(`20년 연속 1위`·`신규 계좌 급증` 등 = `note`) 제거. 순위 + 이름 + 점유율만.

> 변경: `components/toolbox/BrokerRanking.tsx` 1곳. (종목·상품 안 + 독립 증권사 탭 둘 다 반영)

---

## 📄 `components/toolbox/BrokerRanking.tsx`

**찾기:**
```tsx
            title={b.name}
            subtitle={b.note ?? undefined}
            stat={b.share != null ? `${b.share}%` : undefined}
```
**바꾸기:**
```tsx
            title={b.name}
            stat={b.share != null ? `${b.share}%` : undefined}
```

---

## ✅ 검증
```bash
npm run build
```
- 빌드 무에러.

개발 서버: 증권사 행이 **순위 · 로고 · 이름 · 점유%**만 — 이름 밑 부가설명 사라짐.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add components/toolbox/BrokerRanking.tsx && git commit -m "ui(market): 증권사 행 부가설명(note) 제거 — 이름 밑 문구 삭제 (STEP 328)" && git push
```

---

> **한 줄 요약**: 증권사 행 subtitle(note) 제거.
