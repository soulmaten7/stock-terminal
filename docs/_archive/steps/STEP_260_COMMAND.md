<!-- 2026-06-15 -->
# STEP 260 — 펀드 탭 제거 (거래소 상품 아님·데이터 없음 → 정리)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_260_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (스코프 정리)
펀드는 거래소 상품이 아니고(은행·증권사 창구 판매), 무료 수익률 데이터도 없어 운종 '수익률 성적표' 컨셉에 안 맞음. 네이버·토스도 안 다룸. → **펀드 탭 제거.**
- 탭: 주식 · ETF · ETN · ~~펀드~~ · 리츠 · 리딩방 리스트 → **주식 · ETF · ETN · 리츠 · 리딩방 리스트**
- 리츠는 유지(상장 주식·데이터 됨).

## 전제 상태
- 현재 HEAD: STEP 259 적용 후(`f6b1a8c`)
- 변경:
  - `components/home-v6/HomeRankingTabs.tsx` (3곳 제거)
  - **파일 삭제**: `components/home-v6/HomeFundDirectory.tsx`, `app/api/fund/route.ts`
- `.env.local`의 `DATA_GO_KR_KEY`는 미사용이 되지만 **그대로 둬도 무해**(삭제 불필요).

---

## 작업 1/2 — `components/home-v6/HomeRankingTabs.tsx` (3곳 제거)

**① TABS에서 펀드 제거 — 찾기:**
```tsx
  { key: "etn", label: "ETN" },
  { key: "fund", label: "펀드" },
  { key: "reit", label: "리츠" },
```
**바꾸기:**
```tsx
  { key: "etn", label: "ETN" },
  { key: "reit", label: "리츠" },
```

**② import 제거 — 찾기:**
```tsx
import HomeEtnRanking from "./HomeEtnRanking";
import HomeFundDirectory from "./HomeFundDirectory";
```
**바꾸기:**
```tsx
import HomeEtnRanking from "./HomeEtnRanking";
```

**③ 렌더 라인 제거 — 찾기:**
```tsx
      {tab === "etn" && <HomeEtnRanking />}
      {tab === "fund" && <HomeFundDirectory />}
      {tab === "reit" && <HomePerfRanking apiPath="/api/yahoo/reit-performance" emptyLabel="리츠" />}
```
**바꾸기:**
```tsx
      {tab === "etn" && <HomeEtnRanking />}
      {tab === "reit" && <HomePerfRanking apiPath="/api/yahoo/reit-performance" emptyLabel="리츠" />}
```

---

## 작업 2/2 — 펀드 전용 파일 삭제

```bash
cd ~/stock-terminal && git rm components/home-v6/HomeFundDirectory.tsx app/api/fund/route.ts
```

> (`HomeEtfRanking`의 `fixedAsset="fund"` 분기는 이제 호출 안 됨 — 무해, 그대로 둠.)

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeRankingTabs.tsx && git commit -m "refactor(v7): 펀드 탭 제거 (거래소 상품 아님·무료 수익률 데이터 없음) — 탭 주식·ETF·ETN·리츠·리딩방 (STEP 260)" && git push
```
> `git rm`이 이미 스테이징하므로 위 커밋에 삭제도 포함됨.

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **dev 서버 재시작 + 홈** → 탭이 **주식·ETF·ETN·리츠·리딩방 리스트** (펀드 사라짐)
- [ ] 다른 탭·새로고침 유지 정상
- [ ] (URL `?tab=fund` 들어와도 '주식'으로 안전하게 떨어짐)

## 주의·예상 이슈
- `HomeFundDirectory`·`/api/fund` 삭제로 빌드 시 참조 에러 없는지 확인(다른 곳 미참조 — 안전).
- STEP 257~259(펀드 명령서)는 아카이브로 그대로 둠.
- **문서 TODO**(다음 갱신): STEP 254~260.

---
> STEP 260 = 펀드 탭 제거. 전제 STEP 259(`f6b1a8c`).
> 운종 핵심 재정렬: 거래되는 상품(주식·ETF·ETN·리츠) 수익률 + 리딩방·채널 검증 + 토론·신뢰.
