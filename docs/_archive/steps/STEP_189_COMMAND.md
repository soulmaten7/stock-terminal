<!-- 2026-06-06 -->
# STEP 189 — 등락 색 한국식 전환 (상승=빨강 · 하락=파랑, 전역)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_189_COMMAND.md 파일 내용대로 실행해줘`

## 목표
한국 시장 표준(토스·키움 동일)으로 색 전환:
- **상승 / 양봉 / 순매수+ = 빨강 `#F04452`** (toss-red)
- **하락 / 음봉 / 순매수- = 파랑 `#3182F6`** (toss-blue)
- 현재: 상승=초록 `#1AC267`, 하락=빨강 `#F04452` (서구식) → 뒤집기
- 25개 파일에 색이 흩어져 있어 **sed 일괄 치환**
- ⚠️ 예외: `components/ui/StockLogo.tsx` 의 `#F04452`는 **인버스 ETF 배지**(방향색 아님) → 제외

## 전제 상태
- HEAD: STEP 188 적용·커밋 완료(워킹트리 clean — 아래 치환만 들어가게)
- 변경: `app`·`components` 의 `*.tsx`/`*.ts` 다수 (globals.css 팔레트는 안 건드림)

---

## 작업 1/3 — success/danger 방향 토큰 → 빨강/파랑
`StockInfoPanel`·`WatchlistPanel`·`StockDetailPanel`이 `isUp ? text-unjong-success : text-unjong-danger`로 방향색을 씀(나머지 danger는 에러/신고용이라 건드리면 안 됨). 이 정확한 패턴만 치환:

```bash
cd ~/stock-terminal
grep -rl 'text-unjong-success" : "text-unjong-danger' app components --include='*.tsx' --include='*.ts' \
  | xargs sed -i '' 's/isUp ? "text-unjong-success" : "text-unjong-danger"/isUp ? "text-[#F04452]" : "text-[#3182F6]"/g'
```

## 작업 2/3 — 하드코딩 hex 전역 스왑 (StockLogo 제외)
초록#1AC267(상승)→빨강#F04452, 빨강#F04452(하락)→파랑#3182F6. 충돌 방지 위해 임시 마커 경유:

```bash
cd ~/stock-terminal
grep -rl -e '#1AC267' -e '#F04452' app components --include='*.tsx' --include='*.ts' \
  | grep -v 'components/ui/StockLogo.tsx' \
  | xargs sed -i '' -e 's/#F04452/@@DOWN@@/g' -e 's/#1AC267/#F04452/g' -e 's/@@DOWN@@/#3182F6/g'
```

> 동작: ①모든 #F04452(하락 빨강)→@@DOWN@@ ②#1AC267(상승 초록)→#F04452(빨강) ③@@DOWN@@→#3182F6(파랑). 결과: 상승=빨강, 하락=파랑.

## 작업 3/3 — 치환 검증 (초록이 남아있으면 안 됨)
```bash
cd ~/stock-terminal
echo "남은 #1AC267 (0이어야 정상):"
grep -rn '#1AC267' app components --include='*.tsx' --include='*.ts' | wc -l
echo "남은 @@DOWN@@ (0이어야 정상):"
grep -rn '@@DOWN@@' app components --include='*.tsx' --include='*.ts' | wc -l
```
둘 다 **0**이어야 함. (globals.css의 `--color-toss-green: #1AC267`는 팔레트라 남아있어도 정상 — 위 grep은 .tsx/.ts만 봄)

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add app components && git commit -m "refactor(v7): 등락 색 한국식 — 상승=빨강(#F04452)·하락=파랑(#3182F6) 전역 (StockLogo 인버스 제외) (STEP 189)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 검증 grep 둘 다 0 / 커밋·push
- [ ] 홈에서 **상승=빨강·하락=파랑** 확인: 지수 카드(코스피 -5.54% → 파랑), 스파크라인 채움색, 랭킹 등락률, 미리보기 캔들(양봉 빨강·음봉 파랑)·거래량
- [ ] 관심레일·하단 티커·투자자동향·종목 상세페이지도 동일하게 반영
- [ ] 신고/로그아웃/에러 문구의 빨강(danger)은 **그대로**여야 함(방향색 아님)
- [ ] StockLogo 인버스 배지 빨강 유지(레버리지 파랑과 구분)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·롤백
- 혹시 가격이 아닌데 색이 뒤집힌 요소 있으면 알려주세요(개별 보정).
- 잘못되면 즉시 롤백: `cd ~/stock-terminal && git checkout app components`
- globals.css는 안 건드림(toss-red/blue/green 팔레트 보존).

---
> STEP 189 = 등락 색 한국식 전환. 전제 STEP 188. 다음: 카테고리 2열 등. 문서 묶어 갱신.
