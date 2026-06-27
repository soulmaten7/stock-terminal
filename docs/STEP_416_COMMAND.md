<!-- 2026-06-26 -->
# STEP 416 — 모바일: US 종목명 셀 가로폭 클램프 (확정 P0)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_416_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
`UsMarketBoard` 종목명 셀은 **심볼(bold) + 이름**을 같이 넣는데, 감싼 `<span className="min-w-0">`에 `truncate`가 없고 이름 `<span>`의 inline `truncate`는 효과가 없음 → **긴 영문 종목명이 안 잘려 표 가로폭(`min-w-[320px]`)을 밀어냄**(모바일 가로 오버플로). 래퍼에 `truncate`를 줘 KR처럼 한 줄 클램프.

## 전제
- 최신 main(STEP 415 `8278b17` 이후). 배포 X(배치). 컴포넌트 1개 → HMR 반영.

---

## `components/toolbox/UsMarketBoard.tsx` — 1곳 수정

찾기:
```tsx
                        <span className="min-w-0">
                          <span className="font-bold text-unjong-primary">{r.symbol}</span>
                          <span title={r.name} className="ml-1.5 truncate text-xs text-unjong-muted">{r.name}</span>
                        </span>
```
바꾸기:
```tsx
                        <span className="min-w-0 truncate">
                          <span className="font-bold text-unjong-primary">{r.symbol}</span>
                          <span title={r.name} className="ml-1.5 text-xs text-unjong-muted">{r.name}</span>
                        </span>
```
(래퍼에 `truncate` 추가 → flex 자식이므로 `min-w-0`와 함께 한 줄 말줄임. 이름 span의 무효 `truncate`는 제거.)

## 빌드 + 로컬 커밋 (푸시·배포 X)
```bash
pkill -f "next dev" 2>/dev/null; npm run build
git add components/toolbox/UsMarketBoard.tsx
git commit -m "fix(STEP 416): 모바일 US 종목명 셀 가로폭 클램프(truncate) — 긴 이름 오버플로 방지"
```

## 확인
- 모바일(좁은 폭)에서 미국 주식 표의 긴 종목명(예: "Applied Materials"·"Mega Fortune Company Limited")이 **한 줄로 잘리고** 표가 가로로 안 넘침. KR 표는 원래 그대로.
