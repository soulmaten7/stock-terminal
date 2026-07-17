# STEP 742 — 관심목록 가격 정렬 고정 + 설명 문구 종목화 (②a 폴리시)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제:** ②a(739·740·741) 완료 후. 관심목록 마감 폴리시.
**대상:** `components/favorites/WatchlistClient.tsx` (레이아웃 소폭) + `messages/ko.json`·`en.json`(`Favorites.desc` 1줄).

## 목표
1. **가격 위치 고정** — 데스크톱에서 여러 종목의 현재가가 이름 길이와 무관하게 **세로로 정렬**되게. (지금은 이름 바로 뒤라 이름 길이 따라 좌우로 움직임.)
2. **페이지 설명 문구**를 리딩방 중심 → **종목 중심**으로.

## 수정 1 — WatchlistClient 행 레이아웃 (가격 정렬)
원리: 종목명 그룹을 `flex-1`로 늘려 이름 길이 변동을 **이름 truncate가 흡수**하게 하고, **렌즈 요약에 데스크톱 고정폭**을 줘서 가격(그룹 오른쪽 `ml-auto` 정렬)이 **항상 같은 x**에 오게 한다.

### 1-a. 종목명 그룹 div (현재 150줄 근처) — 데스크톱에서 flex-1로
기존:
```tsx
            <div className="flex min-w-0 items-center gap-2">
```
교체:
```tsx
            <div className="flex min-w-0 items-center gap-2 sm:flex-1">
```

### 1-b. 종목명 span (152줄) — 데스크톱에서도 늘어나 truncate (변동 흡수)
기존:
```tsx
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent sm:flex-initial">{f.name_ko ?? f.symbol}</span>
```
교체 (`sm:flex-initial` 제거):
```tsx
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{f.name_ko ?? f.symbol}</span>
```

### 1-c. 렌즈 요약을 데스크톱 고정폭으로 감싸기 (159줄)
기존:
```tsx
            <LensSummary lens={lensMap[f.symbol]} t={t} />
```
교체 (데스크톱 고정폭 `sm:w-64` + 오른쪽 정렬로 가격이 밀리지 않게):
```tsx
            <div className="shrink-0 sm:flex sm:w-64 sm:justify-end">
              <LensSummary lens={lensMap[f.symbol]} t={t} />
            </div>
```

> 결과: 데스크톱 = `[로고 · 이름(flex-1 truncate) · 티커 · 가격(오른쪽)] … [렌즈 w-64]`. 이름 그룹이 `row폭 − w-64`로 **고정폭**이 되므로 그 안에서 `ml-auto`로 오른쪽 붙은 가격은 **모든 행에서 같은 x** → 세로 정렬. 모바일(<sm)은 기존 2줄(이름/가격 윗줄·렌즈 아랫줄) 그대로.
> ⚠️ 영어 렌즈 문구("0 strong · 0 caution · 0 neutral")가 `w-64`에서 넘치면 `sm:w-72`로 올릴 것. 그 외 로직·색·기능(지연 렌즈·해제·클릭)은 **불변**.

## 수정 2 — 페이지 설명 문구 (Favorites.desc)
`messages/ko.json` (현재 `"desc": "별표한 링크·리딩방 모음 …"`):
```json
    "desc": "관심 종목을 렌즈로 한눈에 보고, 즐겨찾는 링크까지 한곳에 모아요.",
```
`messages/en.json` (현재 `"desc": "Your starred links and advisory rooms …"`):
```json
    "desc": "See your starred stocks through the lenses, and keep your links in one place.",
```
> `Favorites` 네임스페이스 안의 페이지-레벨 `desc`(즐겨찾기 h1 아래) 하나만. 다른 `desc`(다른 네임스페이스)는 건드리지 말 것. ko·en 둘 다 수정(패리티 유지).

## 마무리
```
npm run build   # tsc + messages.test.ts(패리티)
git add -A && git commit -m "polish(watchlist): 데스크톱 현재가 세로 정렬 고정(이름 flex-1·렌즈 고정폭) + 즐겨찾기 설명 종목 중심 문구(ko·en)" && git push
```

## 검증 (배포 후 Cowork)
- 이름 길이가 다른 관심종목 2~3개(예: 삼성전자·SK하이닉스·한국전력) → 데스크톱에서 현재가 오른쪽 끝이 **세로로 정렬**되는지.
- 모바일 2줄 유지·렌즈 정상.
- `/favorites` 설명이 종목 중심 문구로.
