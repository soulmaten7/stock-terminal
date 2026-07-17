# STEP 745 — 보드 상단 자동 미리보기 · 5개국 미러 (④B-미러)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제:** STEP 744(④B-KR) 완료·라이브 검증 OK. ④ 3/3(마지막).
**대상:** `components/toolbox/UsMarketBoard.tsx` · `JpMarketBoard.tsx` · `CnMarketBoard.tsx` · `VnMarketBoard.tsx` · `GbMarketBoard.tsx` (5파일). 공유 부품(`BoardTopLensCard`·`LensPreview` example)은 **744에서 이미 만듦 — 재사용만**.

## 목표
744에서 KR(MarketBoard)에 넣은 자동 미리보기 2가지를 **나머지 5개 보드에 동일 적용**. 6개국 보드가 구조적으로 미러라 같은 패턴.

## 각 보드에 적용할 2가지 (744의 MarketBoard §3-a·§3-b와 동일)
각 파일에서 MarketBoard와 동일한 지점을 찾아:

### (a) 데스크톱 우측 aside 기본값
기존(각 보드의 `<aside … lg:block …>` 안):
```tsx
          <LensPreview stock={selectedStock} market="XX" />
```
교체:
```tsx
          <LensPreview stock={selectedStock ?? sorted[0] ?? null} market="XX" example={!selectedStock} />
```
> `market="XX"`는 그 파일의 기존 값 그대로(US/JP/CN/VN/GB). **상태(setSelectedStock) 안 건드리고 표시만 폴백** — URL 복원과 안 싸움.

### (b) 모바일 인라인 카드
좌/우 컬럼을 감싸는 `<div className="flex gap-4">` **바로 위**에:
```tsx
      {!loading && sorted.length > 0 ? (
        <div className="mb-3 lg:hidden">
          <BoardTopLensCard stock={sorted[0] ?? null} market="XX" />
        </div>
      ) : null}
```
> `import BoardTopLensCard from './BoardTopLensCard';` 추가. `market`은 각 보드 값. 기존 모바일 탭시트는 **그대로**.

## 보드별 market 값
| 파일 | market |
|---|---|
| `UsMarketBoard.tsx` | `US` |
| `JpMarketBoard.tsx` | `JP` |
| `CnMarketBoard.tsx` | `CN` |
| `VnMarketBoard.tsx` | `VN` |
| `GbMarketBoard.tsx` | `GB` |

> ⚠️ 각 보드의 변수명(`selectedStock`·`sorted`·`loading`)이 MarketBoard와 같은지 확인 후 적용. ETF/서브탭 구조가 보드마다 미세하게 다를 수 있으니, **aside 라인과 `flex gap-4` 래퍼를 각 파일에서 실제로 찾아** 그 지점에 넣을 것(줄번호 가정 금지). 만약 어떤 보드에 `sorted`가 다른 이름이면 그 보드의 "정렬된 전체 목록" 메모를 사용.

## 마무리
```
npm run build   # tsc + messages.test.ts
git add -A && git commit -m "feat(board·5국): 상단 자동 렌즈 미리보기 미러(US·JP·CN·VN·GB) — 데스크톱 sorted[0]+예시 라벨 + 모바일 BoardTopLensCard·KR과 동일" && git push
```

## 검증 (배포 후 Cowork)
- `/` → 국가탭 US·JP·CN·VN·GB 각각: 데스크톱 우측 패널이 클릭 전에도 거래 상위 종목 렌즈 + "거래 상위 예시" 라벨. 모바일 인라인 카드.
- `/en`도 영어 라벨.
- 6개국 전부 자동 미리보기 일관.
