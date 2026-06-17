<!-- 2026-06-15 -->
# STEP 248 — 글로벌 칩 제거 (주식 탭의 반쪽 '준비 중' 버튼 정리)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_248_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (기능적 완성 #2)
주식 탭 국가칩의 **'글로벌'**은 누르면 "글로벌 마켓 준비 중"만 뜨는 반쪽 버튼 → **제거.** 국가칩 = 국내 · 미국(둘 다 동작)만.

## 전제 상태
- 현재 HEAD: STEP 247(`7228fbe`) 이후 (MarketClient = STEP 243 상태)
- 변경 **1파일**: `components/market/MarketClient.tsx` (find/replace 4곳)
- 결과: `CountryKey` = `"kr" | "us"`, 'global' 참조 0 → 빌드 안전

---

## 작업 1/1 — `components/market/MarketClient.tsx` (find/replace 4곳)

**① 찾기 (COUNTRIES — global 제거):**
```tsx
  { key: "us", label: "미국" },
  { key: "global", label: "글로벌" },
] as const;
```
**바꾸기:**
```tsx
  { key: "us", label: "미국" },
] as const;
```

**② 찾기 (useEffect — global early return 제거):**
```tsx
    if (country === "global") return;
    let cancelled = false;
```
**바꾸기:**
```tsx
    let cancelled = false;
```

**③ 찾기 (렌더 — global 삼항 열기 제거):**
```tsx
      {country === "global" ? (
        <EmptyState icon="🛠️" title="글로벌 마켓 준비 중" description="순차 확장 예정 (STEP 154~)." className="py-12" />
      ) : (
        <div className={embedded ? "grid grid-cols-1 items-start gap-4 xl:grid-cols-3" : ""}>
```
**바꾸기:**
```tsx
      <div className={embedded ? "grid grid-cols-1 items-start gap-4 xl:grid-cols-3" : ""}>
```

**④ 찾기 (렌더 — global 삼항 닫기 제거):**
```tsx
          {embedded && detailSlot}
        </div>
      )}
```
**바꾸기:**
```tsx
          {embedded && detailSlot}
        </div>
```

> 삼항 `{country==="global" ? <EmptyState> : <div>...table...</div>}`에서 글로벌 분기만 들어내고 테이블 분기를 그대로 노출. `EmptyState` import는 다른 곳(로딩/빈 데이터)에서 계속 쓰므로 유지.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add components/market/MarketClient.tsx && git commit -m "fix(v7): 주식 탭 '글로벌' 반쪽 칩 제거(국내·미국만) (STEP 248)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 (`global` 잔여 참조·타입 에러 없음) / 커밋·push
- [ ] 주식 탭 국가칩 = **국내 · 미국** (글로벌 사라짐)
- [ ] 국내·미국 전환·정렬 정상
- ⚠️ 하드 새로고침.

## 주의·예상 이슈
- `EmptyState`는 로딩 후 빈 데이터 상태(`sortedRows.length === 0`)에서 계속 사용 → import 유지.
- **문서 TODO**(다음 갱신): STEP 248~.

---
> STEP 248 = 글로벌 반쪽 칩 제거. 전제 STEP 247(`7228fbe`).
> 다음(기능적 완성 순서): #3 종목 상세가 전 상품(ETF·리츠·미국)에 제대로 뜨는지 · #4 '1 Issue' 점검. (#1 ETN·펀드 = 외부 소스 대기)
