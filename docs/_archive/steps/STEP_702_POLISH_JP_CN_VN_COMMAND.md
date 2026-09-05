<!-- 2026-07-11 -->
# STEP 702 — ✨ 1차 폴리시 묶음: JP TOPIX · CN 홍콩만 · VN 뉴스표기

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**목표:** 5개국 감사에서 나온 소소 결손 3건 정리(1차 유료급 마감). **없는 걸 있는 척 안 한다** 원칙.
**전제:** HEAD `b3d69cf`(STEP701 후).

**정리 먼저:** `rm -f _topixprobe.mjs _probe_tmp.mjs _probe_lens.ts /tmp/*.mjs` (Cowork 샌드박스가 남긴 프로브 잔재 제거·커밋 대상 아님).

---

## 1) JP TOPIX 지수카드 — 깨진 소스 → 대체 or 숨김
- 증상: `/api/yahoo/indices`가 TOPIX를 `^TPX`로 가져오는데 **quote 105.18(실제 TOPIX ~2900과 전혀 다름)·spark 빈값** = 깨진 카드.
- 처리(둘 중 되는 쪽):
  - (a) **대체 심볼 시도** — `^TOPX` → `998405.T` 순으로 `yf.quote/chart` (`{ validateResult: false }`로 yahoo-finance2 스키마 throw 우회). **정상 범위(대략 1000~5000)** 값이 나오면 그 심볼로 교체.
  - (b) 둘 다 실패면 **TOPIX를 지수 응답에서 제외**(카드 미표시). 니케이는 정상이라 JP 지수바는 니케이만 깔끔히 뜸.
- 원칙: **깨진 값(105.18·빈 spark)을 그대로 노출 금지.** value가 비정상(예 <500)이거나 spark 비면 드롭.

## 2) CN 종목보드 — 1차엔 홍콩만 (A주 서브탭 숨김·배선 보존)
- `components/toolbox/CnMarketBoard.tsx`: 서브탭(홍콩/상해A/심천A/ETF) 중 **상해A·심천A 숨김**(본토 A주 시세 파이프라인 미완 — 2차 편입).
- **삭제 말고 스위치 OFF**(§보류 기능 프로토콜): `const SHOW_CN_ASHARES = false;`로 게이트 → 2차에 true로 켜면 복원. 배선·코드 보존.
- **홍콩 유지**(시세 완전). ETF 서브탭은 데이터 있으면 유지, 비면 함께 숨김(확인).
- 기본 선택 서브탭이 상해A였다면 **홍콩으로** 변경.

## 3) VN 공시 → "뉴스" 정직 표기
- VN은 공식 공시 소스(TCBS·HNX 등) 전부 차단 → `vn-events`가 **구글 뉴스 RSS**. "공시"라 부르면 오해.
- VN 종목의 공시/이벤트 섹션 **제목·라벨을 "뉴스"로**(예: "공시" → "뉴스", 소제목 "공식 공시 대신 관련 뉴스"). **VN에만** 적용, 타국(US EDGAR·JP EDINET·CN cninfo/HKEX)은 "공시" 유지.
- 렌더 지점: 이벤트/공시 피드 컴포넌트에서 country/locale가 VN이면 라벨 분기. `LENS_COPY`/해당 컴포넌트 문구 확인.

## 4) 빌드·확인
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && (npm run dev &) ; sleep 7 ; echo "확인"
```
- JP: TOPIX 카드가 **정상값으로 뜨거나 아예 안 뜸**(105.18 같은 깨진 값 없음). 니케이 정상.
- CN: 종목 탭 서브탭이 **홍콩(+ETF)만**, 상해A·심천A 없음. 홍콩 종목·렌즈 정상.
- VN: 종목 상세의 공시 자리가 **"뉴스"**로 표기. 타국은 "공시" 유지.
- 회귀 없음·console.log 없음·tsc 0.

## 5) CHANGELOG
```
- **702**: ✨ 1차 폴리시 — JP TOPIX 깨진 소스(^TPX 105.18) **대체 or 카드 숨김** · CN 종목보드 **홍콩만**(A주 서브탭 스위치 OFF·배선 보존, 2차 편입) · VN 공시 **"뉴스"로 정직 표기**(구글뉴스라). 5개국 감사 결손 마감.
```

## 6) 커밋
```bash
git add app/api/yahoo/indices/route.ts components/toolbox/CnMarketBoard.tsx components/ lib/lensCopy.ts docs/CHANGELOG.md docs/STEP_702_POLISH_JP_CN_VN_COMMAND.md
git commit -m "polish(1차): JP TOPIX 깨진소스 대체/숨김 + CN 홍콩만(A주 OFF·배선보존) + VN 공시→뉴스 정직표기"
git push
```
*(git add에 실제 수정한 파일만 넣도록 조정 — 위는 후보. `git status`로 확인 후.)*

## Cowork에게 보고
- JP TOPIX 결과(대체 심볼? or 숨김) · CN 홍콩만 확인 · VN "뉴스" 표기 확인 · tsc 0·CI 초록.
