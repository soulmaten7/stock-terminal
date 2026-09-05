<!-- 2026-06-30 -->
# STEP 470 — 헤더 '코인' 탭 색상 화이트 통일 (준비중은 뱃지로)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_470_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
헤더 '코인' 탭이 너무 흐림(`text-white/30`) → **'주식'과 동일한 화이트**로 통일. '준비중'은 작은 회색 뱃지로 빼서 상태만 표시(활성/비활성 구분은 주식=bold로 유지).

## 전제
- 최신 main + 469. `components/layout/Header.tsx` 1곳 수정. 클라이언트 → HMR.

---

## `components/layout/Header.tsx` — 코인 span 색상 — 찾기:
```tsx
                <span
                  key={m.label}
                  className="flex shrink-0 cursor-not-allowed items-center gap-1 px-3 py-2 text-sm font-medium text-white/30"
                  title="준비 중"
                >
                  {m.label}
                  <span className="text-[10px] font-normal text-white/30">준비중</span>
                </span>
```
바꾸기:
```tsx
                <span
                  key={m.label}
                  className="flex shrink-0 cursor-not-allowed items-center gap-1 px-3 py-2 text-sm font-medium text-white"
                  title="준비 중"
                >
                  {m.label}
                  <span className="rounded bg-white/15 px-1 py-0.5 text-[9px] font-normal text-white/70">준비중</span>
                </span>
```

---

## 확인 (HMR — 새로고침)
- 헤더 `주식  코인 [준비중]` — **코인 = 주식과 같은 화이트**, '준비중'은 작은 회색 뱃지.
- 코인은 여전히 클릭 불가(`cursor-not-allowed`).
- 빌드 에러 없음.

## 빌드·커밋
- 보류. 469 + 470 묶어서 커밋·배포.
