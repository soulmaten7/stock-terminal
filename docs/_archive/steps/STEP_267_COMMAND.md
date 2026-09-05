<!-- 2026-06-15 -->
# STEP 267 — '순위' 헤더 줄바꿈 수정 (홈 랭킹 테이블 4종)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_267_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (UI 버그)
랭킹 테이블의 '순위' th가 `w-12`(48px, 패딩 빼면 ~16px)로 너무 좁아 "순위"가 **2줄로 접힘**. → **고정폭 제거 + `whitespace-nowrap`**으로 한 줄.
- 대상 4파일(같은 패턴): MarketClient(주식)·HomeEtfRanking(ETF)·HomePerfRanking(ETN/리츠)·MarketDirectoryClient(/market).

## 전제 상태
- 현재 HEAD: STEP 266 적용 후(`e5b8b3d`)
- 변경 **4파일** (각 1줄)

---

## 작업 1/4 — `components/market/MarketClient.tsx`
**찾기:**
```tsx
                      <th className="text-left font-medium px-3 py-2.5 w-12">순위</th>
```
**바꾸기:**
```tsx
                      <th className="text-left font-medium px-3 py-2.5 whitespace-nowrap">순위</th>
```

## 작업 2/4 — `components/home-v6/HomeEtfRanking.tsx`
**찾기:**
```tsx
                    <th className="w-12 px-4 py-2.5 text-left font-medium">순위</th>
```
**바꾸기:**
```tsx
                    <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium">순위</th>
```

## 작업 3/4 — `components/home-v6/HomePerfRanking.tsx`
**찾기:**
```tsx
                    <th className="w-12 px-4 py-2.5 text-left font-medium">순위</th>
```
**바꾸기:**
```tsx
                    <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium">순위</th>
```

## 작업 4/4 — `components/market/MarketDirectoryClient.tsx`
**찾기:**
```tsx
                    <th className="w-12 px-4 py-2.5 text-left font-medium">순위</th>
```
**바꾸기:**
```tsx
                    <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium">순위</th>
```

> 고정 `w-12` 제거 → 칼럼이 "순위"+패딩 폭으로 자동, `whitespace-nowrap`으로 한 줄 보장. 데이터(순위 숫자)는 1~2자리라 영향 없음.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add components/market/MarketClient.tsx components/home-v6/HomeEtfRanking.tsx components/home-v6/HomePerfRanking.tsx components/market/MarketDirectoryClient.tsx && git commit -m "fix(v7): '순위' 헤더 줄바꿈 수정 — 고정폭 제거+whitespace-nowrap (랭킹 4종) (STEP 267)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **dev 재시작** 후 홈 주식·ETF·ETN·리츠 + /market → '순위'가 **한 줄**로
- [ ] 행 정렬·다른 칼럼 그대로

## 주의·예상 이슈
- 순위 칼럼이 살짝 넓어질 수 있음(한 줄 보장) — 의도.
- **문서 TODO**(다음 갱신): STEP 265·266·267.

---
> STEP 267 = '순위' 헤더 한 줄. 전제 STEP 266(`e5b8b3d`). (리츠 레이아웃 '차이'는 사용자 확인 후 별도 처리 — 코드상 ETN과 동일 컴포넌트.)
