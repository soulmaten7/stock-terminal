# STEP 743 — 종목 페이지 압축 렌즈 헤더 (④A)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제:** ②a(739~742) 완료·문서 동기화 후(HEAD `44fa289` 이후). ④ 1/3.
**대상:** `app/[locale]/stock/[symbol]/StockLensClient.tsx` (헤더에 요약 삽입) + `messages/ko.json`·`en.json`(노트 1키).

## 목표
종목 상세 페이지 **맨 위(이름·현재가 바로 아래)**에 **압축 렌즈 요약**(점 7개 + "강점 X · 주의 Y · 보통 Z") + **정직한 한 줄**을 얹어, 스크롤 전에 30초 글랜스를 준다. 밑의 상세 6렌즈 카드 + F스코어는 그대로(중복 아님 — 위=요약, 아래=상세).

## 배경 (코드 지도)
- `StockLensClient.tsx`는 이미 `/api/lens`로 `data`(`{ lenses?: LensRead[], fscore? }`)를 갖고 있음(약 919~930줄 fetch). **새 fetch 불필요.**
- 헤더 블록 약 **1025~1049줄**: `<h1>`(이름)·티커·현재가 `<p>`(약 1035~1036줄)·`intro` 문단(약 1038줄). **삽입 지점 = 현재가 `<p>` 바로 다음, intro 앞.**
- **압축 요약 렌더·tone 추출은 이미 있는 패턴을 그대로 복사**: `components/favorites/WatchlistClient.tsx`
  - `LensSummary`(29~62줄): `TONE_DOT`(pos=`bg-unjong-accent`·warn=`bg-amber-400`·flat=`bg-unjong-muted`) 점7 + 카운트 라벨 + 로딩 스켈레톤(회색 점7).
  - tone 추출(99~108줄): `data.lenses[].verdict.tone`(pos/warn/flat) + `data.fscore`(`supported`면 `score>=7?pos:score<=3?warn:flat`).

## 구현
`StockLensClient.tsx` 헤더 현재가 `<p>` 다음에 압축 렌즈 요약 블록 삽입:
1. **tone 배열 계산**(data 있을 때): WatchlistClient 99~108줄과 **동일 로직**으로 `data.lenses` + `data.fscore`에서 `tones: ('pos'|'warn'|'flat')[]` 만든다.
2. **렌더**:
   - `loading`(또는 `!data`): 회색 점 7개 스켈레톤 + "렌즈 읽는 중…".
   - `tones.length === 0`(집계할 렌즈 없음): 요약 숨김(헤더는 이름·가격만).
   - 정상: 점 7개(각 tone 색·지름 7px 원) + `강점 {pos} · 주의 {warn} · 보통 {flat}` + **아래 한 줄 노트**.
3. **i18n(최소)**:
   - 카운트·로딩 라벨은 **기존 `Favorites` 키 재사용** — `const tf = useTranslations('Favorites');` 추가 후 `tf('lensSummary', { pos, warn, flat })`·`tf('lensLoading')`. (새 키 없음 → 패리티 무리스크.)
   - 정직한 노트만 **새 키 1개**를 이 페이지가 쓰는 네임스페이스(`t`가 참조하는 것)에 추가, ko·en 둘 다:
     - ko: `"lensHeaderNote": "종합 매수·매도 점수는 없습니다 · 판단은 당신"`
     - en: `"lensHeaderNote": "No overall buy or sell score — you decide"`
   - `messages.test.ts` 패리티 위해 **양쪽 동일 키**.
4. 스타일: 다크 토큰만(`text-unjong-muted`·`text-unjong-accent`·`amber-400`). 노트는 `text-[11px] text-unjong-muted` 정도. 요약은 헤더 `max-w-4xl` 안에 `mt-2`.

> ⚠️ 밑의 상세 카드·HorizonStrip·F스코어 카드는 **불변**. 요약은 헤더에 얹기만. ETF 페이지(`EtfLensClient`)는 6렌즈가 없으니 **손대지 않음**(주식만).

## 마무리
```
npm run build   # tsc + messages.test.ts(패리티)
git add -A && git commit -m "feat(stock): 종목 페이지 상단 압축 렌즈 헤더(점7+강점/주의/보통+정직한 노트)·상세 카드 위 30초 글랜스·기존 LensSummary 패턴 재사용" && git push
```

## 검증 (배포 후 Cowork)
- `/stock/005930`(삼성전자) 등 → 이름·현재가 아래에 점7 + "강점 2 · 주의 2 · 보통 3"(관심목록과 동일 값) + 노트. 밑의 상세 카드 정상.
- 로딩 중 스켈레톤 → 채워짐. `/en`에서 영어 노트·카운트.
- ETF(예: `/stock/069500`)는 요약 없이 기존대로.
