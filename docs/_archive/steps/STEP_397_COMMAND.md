<!-- 2026-06-25 -->
# STEP 397 — 글로벌 빠른 수정 (P0 개인정보 보호책임자 + about 한자 + /coin 빈 동선)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_397_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
완성도 감사에서 나온 **P0 + 빠른 글로벌 수정 3건**:
1. **🔴 P0** — 개인정보처리방침의 보호책임자가 `[추후 입력]` 플레이스홀더로 공개 중(법적 필수 항목·신뢰 훼손) → 실제 값.
2. about 페이지의 구 브랜드 한자 `(雲從)` 제거(리브랜드 후 부정확, CLAUDE.md 한자표기 X 규칙).
3. 헤더 메뉴의 `코인`이 항상 노출 → 클릭 시 `/coin` "준비 중" 빈 동선 → **출시 전까지 메뉴 숨김**(`/coin` 페이지는 유지, 링크만 제거).

## 전제
- 최신 main. (STEP 396 ToolboxClient·US 큐레이션 문서가 미커밋이어도 무방 — 배치 때 함께 푸시.)
- 배포 X (배치). 이 STEP은 로컬 편집 + 빌드 + 로컬 커밋까지만.

---

## 1단계 — 편집 3건

### (1) `app/privacy/page.tsx`  — 보호책임자 실값
찾기:
```
    body: ["성명·직책: [추후 입력]", "연락처: [추후 입력]"],
```
바꾸기:
```
    body: ["성명·직책: 장은태 / 대표", "연락처: contact@onetrillion.app"],
```

### (2) `app/about/page.tsx`  — 한자 제거
찾기:
```
        트릴리언(雲從)은 정확한 정보, 솔직한 토론, 검증된 신뢰로 투자자가 잘못된 정보나 과장된
```
바꾸기:
```
        트릴리언은 정확한 정보, 솔직한 토론, 검증된 신뢰로 투자자가 잘못된 정보나 과장된
```

### (3) `components/layout/Header.tsx`  — 코인 메뉴 숨김
찾기:
```
const MENU = [
  { href: '/', label: '주식', match: (p: string) => p === '/' },
  { href: '/coin', label: '코인', match: (p: string) => /^\/coin/.test(p) },
] as const;
```
바꾸기:
```
const MENU = [
  { href: '/', label: '주식', match: (p: string) => p === '/' },
] as const;
```

## 2단계 — 빌드
```bash
pkill -f "next dev" 2>/dev/null; npm run build
```
에러 없으면 다음. (텍스트·배열 수정이라 에러 가능성 낮음.)

## 3단계 — 로컬 커밋 (푸시·배포 X)
```bash
git add app/privacy/page.tsx app/about/page.tsx components/layout/Header.tsx
git commit -m "polish(STEP 397): 개인정보 보호책임자 실값(P0)+about 한자제거+코인 메뉴 숨김"
```

## 확인
- `/privacy` 9번 항목에 `장은태 / 대표` · `contact@onetrillion.app` 표기.
- `/about` 첫 문단 "트릴리언은 …"(한자 없음).
- 헤더에 `코인` 메뉴 사라지고 `주식`만.
