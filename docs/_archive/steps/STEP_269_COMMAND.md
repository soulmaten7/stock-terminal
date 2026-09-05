<!-- 2026-06-15 -->
# STEP 269 — 랭킹 표 칼럼 위치 통일 (종목명 칸 flex로 현재가·대비 오른쪽 고정)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_269_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (UI 정렬 통일 — 진짜 원인)
표(`table w-full`, auto 레이아웃)가 **종목명 칸을 내용(이름) 길이에 맞춰 자동 크기** → 리츠(짧은 이름)는 종목명 칸이 좁아 현재가·대비가 왼쪽으로 당겨지고, ETF/ETN/주식(긴 이름)은 오른쪽. → 탭마다 칼럼 x 위치가 다름.
- **해결**: 종목명 th에 `w-full`(width:100%) → 종목명이 남는 폭을 모두 흡수 → **현재가·대비가 이름 길이와 무관하게 항상 오른쪽 끝**에 고정 → 전 탭 일치.
- 대상 4파일: MarketClient(주식)·HomeEtfRanking(ETF)·HomePerfRanking(ETN/리츠)·MarketDirectoryClient(/market).

## 전제 상태
- 현재 HEAD: STEP 268 적용 후(`3e85c04`)
- 변경 **4파일** (각 종목명 th 1줄)

---

## 작업 1/4 — `components/market/MarketClient.tsx`
**찾기:**
```tsx
                      <th className="text-left font-medium px-3 py-2.5">종목명</th>
```
**바꾸기:**
```tsx
                      <th className="text-left font-medium px-3 py-2.5 w-full">종목명</th>
```

## 작업 2/4 — `components/home-v6/HomeEtfRanking.tsx`
**찾기:**
```tsx
                    <th className="px-3 py-2.5 text-left font-medium">종목명</th>
```
**바꾸기:**
```tsx
                    <th className="px-3 py-2.5 text-left font-medium w-full">종목명</th>
```

## 작업 3/4 — `components/home-v6/HomePerfRanking.tsx`
**찾기:**
```tsx
                    <th className="px-3 py-2.5 text-left font-medium">종목명</th>
```
**바꾸기:**
```tsx
                    <th className="px-3 py-2.5 text-left font-medium w-full">종목명</th>
```

## 작업 4/4 — `components/market/MarketDirectoryClient.tsx`
**찾기:**
```tsx
                    <th className="px-4 py-2.5 text-left font-medium">종목명</th>
```
**바꾸기:**
```tsx
                    <th className="px-4 py-2.5 text-left font-medium w-full">종목명</th>
```

> `w-full`이 종목명 칸을 100%로 → 다른 칼럼(순위·현재가·대비·♡)은 내용폭, 종목명이 슬랙을 흡수. 이름이 길든 짧든 현재가·대비 위치 동일.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add components/market/MarketClient.tsx components/home-v6/HomeEtfRanking.tsx components/home-v6/HomePerfRanking.tsx components/market/MarketDirectoryClient.tsx && git commit -m "fix(v7): 랭킹 표 종목명 칸 w-full — 현재가·대비 위치 전 탭 통일 (STEP 269)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **dev 재시작** 후: 주식·ETF·ETN·리츠 탭 전환해도 **현재가·1일전 대비 칼럼이 같은 위치**(오른쪽 끝)에 고정
- [ ] /market(상품 리스트)도 동일
- [ ] 종목명은 왼쪽 정렬 유지, 로고·이름 그대로

## 주의·예상 이슈
- 종목명 칸이 넓어지며 이름 오른쪽 여백 생김(정상 — 값 칼럼을 오른쪽에 고정하기 위함).
- **문서 TODO**(다음 갱신): STEP 265~269.

---
> STEP 269 = 종목명 w-full로 칼럼 위치 통일. 전제 STEP 268(`3e85c04`).
