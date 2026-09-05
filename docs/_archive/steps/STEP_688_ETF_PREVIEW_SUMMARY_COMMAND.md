<!-- 2026-07-10 -->
# STEP 688 — 📦 미리보기 렌즈 슬롯에 ETF 구성 요약 — 빌드·커밋만

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**상태:** 코드는 **Cowork(Opus)가 직접 작성·`tsc`=0.** 이 STEP은 **빌드 + 눈 검증 + 커밋/푸시**만.
**바뀐 것:** `components/toolbox/LensPreview.tsx` — 선택 종목이 **ETF/펀드면** 렌즈(기업재무) 대신 **구성 요약**(추종·유형 + 상위 3 보유 + 보수율)을 렌즈 슬롯에 표시. `/api/etf-holdings` fetch 추가·`etf.isFund` 분기. 종목이면 기존 렌즈·브리핑 그대로. 이걸로 보드 ETF 클릭 시 미리보기가 "렌즈 정보 준비 중"으로 비지 않고 페이지(구성 상세)와 일관.

---

## 1. 빌드 → 눈 확인
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && (npm run dev &) ; sleep 7 ; echo "확인"
```
- **한국 탭 → ETF 필터 → KODEX200 클릭** → 우측 미리보기(모바일 시트)에 **"TR-AI 렌즈 · 구성"**: 추종·유형 코스피200 · 삼성전자 32.9%·SK하이닉스 30.8%… · 보수율 0.15%. "TR-AI 렌즈·근거 보기" → 구성 상세.
- **미국 탭 → ETF(SPY 등) 클릭** → 구성 요약(State Street·상위보유).
- **일반 종목(삼성전자·AAPL) 클릭** → 기존 렌즈·브리핑 그대로(회귀 없음).
- console.log 없음. tsc 0.

## 2. CHANGELOG (아래 그대로)
`docs/CHANGELOG.md` 687 불릿 아래:
```
- **688**: 📦 미리보기 렌즈 슬롯 **ETF 구성 요약**(`LensPreview` — ETF면 렌즈 대신 추종·상위3보유·보수율). 보드 ETF 클릭 시 미리보기가 비지 않고 구성 상세와 일관.
```

## 3. 커밋 → 푸시
```bash
git add components/toolbox/LensPreview.tsx docs/CHANGELOG.md docs/STEP_688_ETF_PREVIEW_SUMMARY_COMMAND.md
git commit -m "feat(etf): 미리보기 렌즈 슬롯에 ETF 구성 요약(렌즈 대신 추종·상위보유·보수율)"
git push
```

## Cowork에게 보고
- ETF 클릭 시 미리보기 구성 요약 뜨는지 + 일반 종목 회귀 없는지.
