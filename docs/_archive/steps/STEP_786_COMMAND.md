# STEP 786 — 렌즈 카드 헤더 모바일 붕괴 수정 (고정 3열 → 모바일 2행 · 데스크톱 현행)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)

**전제 상태**: STEP 785 커밋 `371a062`(origin `37531d1`) 이후 HEAD · 트리 클린

**배경(07-22 · 폰 실물 발견)**: 종목 상세 렌즈 카드 **접힘 헤더**(`StockLensClient.tsx` 1120행)가 `grid-cols-[auto_1fr_auto]`로 모든 폭에서 3열 고정 → 모바일 375px에서 1열(렌즈 영문명 "Technical (RSI · MA)")과 3열(등급 배지+화살표 고정폭)이 폭을 먹고 가운데 판정 문구에 6~7글자만 남아 **글자 단위 세로 붕괴**("하락 추/세/(200/일선 아/래)", 저변동성은 1글자씩). 785(섹션 헤더)와 동일한 병(좁은 폭 가로 강제)인데 카드 헤더가 스코프에서 누락됐음.

---

## 수정

### 1) 접힘 헤더 레이아웃 — 모바일 2행 / sm+ 현행 3열

목표 렌더(모바일):
```
Technical (RSI · MA) · 기술            [참고용] [∨]
하락 추세 (200일선 아래)   200일선 -42.19%
```

- 컨테이너를 반응형으로: 모바일 = 세로 2행(1행: 렌즈명 블록 + 우측 배지·화살표 / 2행: 판정 문구 전폭), **sm+ = 기존 `grid-cols-[auto_1fr_auto]` byte 동일**.
  - 구현은 Tailwind 반응형 그리드/플렉스 중 기존 코드에 자연스러운 쪽 선택(예: 모바일 `flex flex-col gap-1.5` → `sm:grid sm:grid-cols-[auto_1fr_auto]`; 1행 내부는 `flex items-center justify-between`).
- 2행(판정 문구 `L.verdict.phrase` + `L.headline`)은 모바일에서 **전폭 좌측 정렬**·기존 색/크기 토큰 불변. `whitespace-nowrap` 강제 금지(잘림 유발) — 레이아웃으로 해결.
- 등급 배지·화살표(44px 터치 타깃)는 1행 우측 고정, 크기·동작 불변.
- 접힘 상태에서 verdict 없을 때의 `L.summary` 분기도 같은 2행 자리 사용(현행 로직 유지).

### 2) 동일 패턴 전수

- `app/[locale]/stock/[symbol]/StockLensClient.tsx` + `EtfLensClient.tsx`에서 `grid-cols-[` / 고정 3열 헤더 패턴 grep → 같은 증상 가능한 곳 동일 처리(ETF "상품 구성" 카드 포함).
- 펼침(내부 콘텐츠·782/783 서사)은 **손대지 말 것** — 이번 건은 접힘 헤더 레이아웃만.

### 3) 회귀 방지

- sm+ 데스크톱 렌더 변화 0(diff에서 확인).
- 긴 렌즈명(`Low Volatility (BAB)`)·긴 판정 문구·en 로케일에서도 글자 단위 붕괴 없어야 함.

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. **모바일 폭 실측**(375px·414px): KR 종목(삼성전자 등)·US 종목 상세에서 7렌즈 접힘 카드 전부 — 렌즈명 1행·판정 문구 2행 자연 줄바꿈(글자 단위 붕괴 0)·배지/화살표 정위치. `/en` 동일 확인. 펼쳤을 때 782/783 서사 정상(회귀 0).
3. 데스크톱(1280px) 헤더 현행과 동일 스팟 확인.
4. 커밋:
   ```bash
   git add app/ components/ docs/STEP_786_COMMAND.md
   git commit -m "STEP 786: stack lens card header on mobile (fix character-level wrap of verdict phrase)"
   git push
   ```

## 완료 보고 → Cowork에게: 모바일 폭 검증 결과 + 커밋 해시. 최종 판정 = 장은태 폰.
