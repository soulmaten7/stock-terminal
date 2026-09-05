<!-- 2026-07-10 -->
# STEP 692 — 🐞 ETF/ETN 페이지 너비·뒤로가기 + 검증 탭 행 클릭 미리보기 — 빌드·커밋만

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**상태:** 코드는 **Cowork(Opus)가 직접 작성·`tsc`=0.** 이 STEP은 **빌드 + 눈 검증 + 커밋/푸시**만.
**사용자 발견 버그 3:**
1. ETF/ETN 상세 화면 너비가 디폴트(종목 상세)와 다르게 임의로 좁게(`max-w-3xl` 중앙) 잡혀 있었음.
2. ETF/ETN 상세의 "← 목록으로"가 이전 화면이 아니라 홈으로 감(`Link href="/"` 탓).
3. 검증 탭 리스트에서 **업체명만** 눌러야 미리보기가 떴고(행 전체 아님), **채널명(홈페이지/텔레그램)은 직접 외부링크**로 바로 열렸음.

**바뀐 것:**
- `app/stock/[symbol]/EtfLensClient.tsx` — 컨테이너를 **종목 상세(StockLensClient)와 동일**하게: `mx-auto max-w-7xl px-4 py-6 sm:px-6` + 콘텐츠 `max-w-4xl`. "← 목록으로"를 **`router.back()`**(히스토리 있으면 뒤로, 없으면 홈)로. (재발 방지 주석 추가: "종목 상세와 동일하게".)
- `components/toolbox/AdvisorDirectory.tsx` — 리스트 **행 전체 클릭 → 미리보기**(`<li onClick={setSelected}>` + `cursor-pointer`). 업체명 버튼→span, **채널명(pub) 직접 외부링크 제거→span**(클릭 시 행 선택=미리보기). **즐겨찾기(Star)만 `stopPropagation`**으로 제외. 미리보기 안 "바로가기"로 실제 링크 이동(기존 유지). 모바일 동일(같은 리스트).

---

## 1. 빌드 → 눈 확인
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && (npm run dev &) ; sleep 7 ; echo "확인"
```
- **ETF/ETN 상세**(예: `/stock/069500.KS`·`/stock/530107`): 너비가 종목 상세(`/stock/005930`)와 **동일**. "← 목록으로" 누르면 **직전 목록 화면으로**(홈 아님). PC·모바일 동일.
- **검증 탭**: 리스트에서 **행 아무 곳(번호·업체명·채널명)** 터치 → 미리보기. **채널명(홈페이지/텔레그램) 터치도 미리보기**(바로 외부로 안 감) → 미리보기의 **바로가기**로 링크 이동. **즐겨찾기(별) 터치는 미리보기 안 뜸**(즐겨찾기만). 모바일 동일.
- 일반 종목 상세 회귀 없음. console.log 없음. tsc 0.

## 2. CHANGELOG (오늘 블록에 추가)
```
- **692**: 🐞 ETF/ETN 상세 **너비를 종목 상세와 동일**(max-w-7xl+max-w-4xl)·**뒤로가기 router.back()**(홈 아님). 검증 탭 **행 전체 클릭=미리보기**(채널명도 미리보기→바로가기로 링크, 즐겨찾기만 제외). 모바일 동일.
```

## 3. 커밋 → 푸시
```bash
git add "app/stock/[symbol]/EtfLensClient.tsx" components/toolbox/AdvisorDirectory.tsx docs/CHANGELOG.md docs/STEP_692_ETF_WIDTH_BACK_ROOM_ROWCLICK_COMMAND.md
git commit -m "fix(ui): ETF/ETN 상세 너비·뒤로가기 종목상세와 통일 + 검증탭 행 전체 클릭=미리보기(채널명 직접링크 제거)"
git push
```

## Cowork에게 보고
- ETF/ETN 너비·뒤로가기 정상 + 검증탭 행/채널명 클릭 미리보기 + 즐겨찾기 제외 확인.
