<!-- 2026-07-10 -->
# STEP 691 — 📄 ETN 상품 정보(구성 아닌 정보 + 주의) — 빌드·커밋 + 배포 실측

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**상태:** 코드는 **Cowork(Opus)가 직접 작성·`tsc`=0·네이버 프로브로 검증.** 이 STEP은 **빌드 + 눈 검증 + 커밋/푸시 + 배포 실측**.
**배경:** ETN은 발행사 신용으로 지수를 추종하는 **전략 노트라 바스켓(구성종목)이 없음**(네이버 `etfAnalysis` 빈 응답 확인). 그래서 "구성 준비 중"으로 비어 보였음 → **ETN은 "상품 구성"이 아니라 "상품 정보"**(ETN 설명 + 발행사 신용·레버리지 주의)로.
**바뀐 것:**
- `app/api/etf-holdings/route.ts` — `fundType`('etf'|'etn'|'stock') 추가. KR: etfAnalysis에 구성 있으면 `etf`, 비면 `integration` stockEndType으로 **ETN 판별**(`etn`). (구성 있는 ETF=네이버 1콜, ETN/종목=2콜.)
  - 🐞 **404 가드**(Claude Code 검증서 발견·수정): ETN·일반종목은 etfAnalysis가 **404+빈바디**라 `r.json()`이 예외→바깥 catch로 빠져 2단계 미도달(ETN이 stock으로 오분류)됐음. **1단계 fetch를 자체 try/catch로 감싸고 `if(r.ok)`만 파싱** → 구성없음으로 넘겨 2단계 정상 도달. 실측: 530107 etfAnalysis=404·integration=etn.
- `app/stock/[symbol]/EtfLensClient.tsx` — `fundType==='etn'`이면 **ETN 상품 정보 패널**(전략형·바스켓 없음 설명 + ⚠️ 발행사 신용위험·레버리지/인버스 decay 주의). 배지 "ETN · 상품 정보". 이름에 레버리지/인버스/N X면 주의 문구 강화.
- `components/toolbox/LensPreview.tsx` — ETN이면 미리보기에 "ETN(전략형·구성종목 없음)" 안내 + CTA "상품 정보 자세히 보기".

---

## 1. 빌드 → 로컬 확인
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && (npm run dev &) ; sleep 7
curl -s "http://localhost:3333/api/etf-holdings?symbol=530107" | head -c 200 ; echo
```
- 응답 `"fundType":"etn"`·`"isFund":true`·holdings:[].

## 2. 눈으로 확인
- 한국 탭 → **ETN** → 아무 ETN 클릭(예: 삼성 인버스 2X 코스닥150) → 미리보기 "ETN(전략형…)" + "상품 정보 자세히 보기" → 상세 = **"ETN · 상품 정보"** 패널(설명 + ⚠️ 주의). "구성 준비 중" 아님.
- ETF(KODEX200·SK하이닉스단일종목레버리지) → 여전히 "상품 구성"(보유종목). 일반 종목 → TR-AI 렌즈.
- console.log 없음. tsc 0.

## 3. 커밋 → 푸시 (+ CHANGELOG)
`docs/CHANGELOG.md` 오늘 블록에 추가:
```
- **691**: 📄 ETN **상품 정보** 처리 — 바스켓 없는 전략노트라 "구성" 대신 ETN 설명 + 발행사 신용·레버리지 주의(`etf-holdings.fundType`·`EtfLensClient` ETN 패널·미리보기 안내). ETF/종목과 분기.
```
```bash
git add "app/api/etf-holdings/route.ts" "app/stock/[symbol]/EtfLensClient.tsx" components/toolbox/LensPreview.tsx docs/CHANGELOG.md docs/STEP_691_ETN_PRODUCT_INFO_COMMAND.md
git commit -m "feat(etn): ETN 상품 정보 패널(바스켓 없는 전략노트 설명+주의) — 구성과 분기"
git push
```

## 4. 배포 실측
```bash
curl -s "https://onetrillion.app/api/etf-holdings?symbol=530107" | head -c 200 ; echo
```
- `fundType:etn` → 라이브 ✅.

## Cowork에게 보고
- ETN이 "상품 정보"(설명+주의)로 뜨는지 + ETF는 "상품 구성" 유지 + 종목 회귀 없는지.
