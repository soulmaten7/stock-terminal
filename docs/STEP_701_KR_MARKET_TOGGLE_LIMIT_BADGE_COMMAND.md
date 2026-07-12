<!-- 2026-07-11 -->
# STEP 701 — 🇰🇷 종목보드 코스피/코스닥 토글 + 상한/하한 배지 (1차 완성기준 · KR DoD)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**목표:** 한국 '종목' 탭 보드에 ① **전체/코스피/코스닥 세그먼트 토글** ② **상한/하한 배지**. RELEASE_ROADMAP §1 "1차 전 처리항목"·KR DoD(감사 item D).
**전제:** HEAD `de7a25d`(STEP700 후). 데이터·API 준비됨 — `app/api/krx/ranking`은 이미 `market=kospi|kosdaq|all` 지원(`q.eq("market", market)`), 스냅샷에 `market`('kospi'/'kosdaq') 채워짐. **대부분 프론트(`components/toolbox/MarketBoard.tsx`) 작업.**

---

## 1) 코스피/코스닥 토글
- `MarketBoard.tsx`에 상태 추가: `const [market, setMarket] = useState<'all'|'kospi'|'kosdaq'>('all')`.
- `fetchRows`의 stock 분기가 `market`을 쓰도록: `fetch('/api/krx/ranking?market=' + market + '&sort=amount&limit=2600')`. (fetchRows에 market 인자 전달 또는 상태 참조.)
- **재조회 트리거**: 종목 탭에서 `market` 변경 시 rows 재fetch(해당 useEffect 의존성에 market 추가). `tab==='stock'`일 때만 토글 적용(ETF/ETN/리츠는 코스피/코스닥 개념 없음 → 토글 숨김).
- **캐시 키 분리**: `getCache/setCache` 키를 `market:stock:${market}`로(전체/코스피/코스닥 각각 캐시).
- **UI**: 종목 탭 상단(검색/정렬 근처)에 작은 세그먼트 버튼 3개 `전체 · 코스피 · 코스닥`. 활성=민트 강조(기존 서브탭 버튼 스타일 재사용). **모바일 동일 노출.**

## 2) 상한/하한 배지
- 헬퍼: `const limitBadge = (chg: number) => chg >= 29.5 ? '상한' : chg <= -29.5 ? '하한' : null;` (KR 일일 등락 상한 ±30% 근사).
- **PC 표**: 등락률(changePercent) 칸 옆에 배지. 상한=빨강 계열 배경, 하한=파랑 계열 배경, 작은 pill(`text-[10px] px-1 rounded`). null이면 미표시.
- **모바일 카드**: 등락률 옆 동일 배지.
- 색은 기존 상승=빨강/하락=파랑 관례 따름(unjong 토큰 사용). 새 색 도입 금지.

## 3) 빌드·확인
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && (npm run dev &) ; sleep 7 ; echo "확인"
```
- 종목 탭: **전체/코스피/코스닥** 눌러 각각 종목 세트 바뀜(코스피만/코스닥만). 정렬·검색·기간 유지. PC·모바일 동일.
- **상한/하한**: 등락률 ≥+29.5% 종목에 "상한", ≤−29.5%에 "하한" 배지. (오늘 상한가 종목으로 확인.)
- ETF/ETN/리츠 탭엔 토글 안 뜸. 회귀 없음·console.log 없음·tsc 0.

## 4) CHANGELOG
```
- **701**: 🇰🇷 종목보드 **코스피/코스닥 세그먼트 토글**(ranking market 파라미터·캐시 분리) + **상한/하한 배지**(±29.5% 근사). KR DoD(item D)·1차 완성기준. PC·모바일 동일.
```

## 5) 커밋
```bash
git add components/toolbox/MarketBoard.tsx docs/CHANGELOG.md docs/STEP_701_KR_MARKET_TOGGLE_LIMIT_BADGE_COMMAND.md
git commit -m "feat(kr): 종목보드 코스피/코스닥 토글 + 상한/하한 배지 (1차 KR DoD)"
git push
```

## Cowork에게 보고
- 토글 3종 동작(종목 세트 분리)·상한/하한 배지 표시·모바일 동일·tsc 0·CI 초록.
