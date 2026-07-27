# STEP 795 — 베타 전 UX 필수 12건 (로그인 동선 · 정직한 결측 · 문구 통일 · 모바일 잘림)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)
**⚠️ STEP 794 완료 후 실행**

**전제 상태**: STEP 794 커밋 이후 HEAD · 트리 클린

**배경(07-22 · Cowork 3중 검수)**: 베타 사용자가 첫 5분에 부딪힐 문제들. 각 항목은 독립적이므로 **하나씩 확실히** 처리할 것.

---

## 수정

### 1) 🔴 `/en` 홈 중복 섹션

- `components/today/TodayClient.tsx` — en 로케일은 `homeMarketFor('en')='US'`라 **"간밤 미국" 섹션과 "United States · Lens state changed" 섹션이 완전히 같은 5행**을 보여줌(더보기 링크도 동일). `/en` 첫 화면 절반이 중복.
- 조치: **홈마켓과 "간밤 미국"이 같은 시장이면 한 섹션만 렌더**(en은 "간밤 미국"을 생략하고 시장 변화 섹션만, 또는 그 반대 — 어느 쪽이 en 사용자에게 자연스러운지 판단해 하나로. ko는 현행 2섹션 **불변**).

### 2) 🔴 로그인 동선 3건

- **`next` 유실**: `app/[locale]/auth/login/page.tsx`의 **구글 로그인이 `next`를 안 실음**(같은 파일의 이메일 경로는 `getNext()` 사용). 렌즈 게이트(`/auth/login?next=/stock/XXX`)로 온 사용자가 로그인 후 홈으로 떨어짐 → 구글 경로도 `next`를 왕복시킬 것.
  - ⚠️ **710D 사망 전례 준수**: `redirectTo` URL 자체는 **byte 불변**(Supabase 허용목록). `next`는 **쿠키로 왕복**(`post_login_locale` 패턴 그대로 — `lib/authRedirect.ts`의 `safeNextPath` 가드 재사용).
- **로케일 유실**: 비로그인 별 클릭 시 `window.location.href = '/auth/login'` 하드코딩이 4곳(`TodayClient`·`ExploreClient`·`StockLensClient`·`EtfLensClient`) → `@/i18n/navigation` 라우터 사용 + 현재 경로를 `next`로 전달.

### 3) 🔴 모바일 관심등록 경로 불일치

- 별 버튼이 `<640px`에서 숨김(771 의도)인데, 안내 문구는 전부 "탐색에서 ⭐를 눌러 추가하세요"(`Favorites.emptyWatchlist`·`Today.onboardingCta`) → 모바일 신규 사용자가 별을 못 찾음.
- 조치: **문구를 실제 경로에 맞게 수정**("종목을 열고 ⭐를 누르면 담깁니다" 계열·ko/en). 별 자체는 현행 유지(763 밀도 결정 존중).

### 4) 🔴 "7가지" 하드코딩 → 동적화

- 788 닫는 카드 제목이 `"7가지 방법을 종합하면"` 고정인데 파트 헤더는 791에서 동적(`{n}`)이 됨 → F-Score 미지원 종목에서 **"6가지로 따로 보기" 아래 "7가지를 종합하면"** 자기모순.
- 조치: 닫는 카드도 **같은 `partHeaderCount` 재사용**해 `{n}가지`(en 동일). 791과 **같은 변수**를 써야 함(별도 계산 금지).

### 5) 🔴 KR/JP/CN/VN/GB 공시 0건 = 무음 → 정직한 결측

- 현재 US(`EventLayer`)만 "중대 공시 없음" 카드를 표시하고 나머지 5개국은 `if (!events.length) return null`로 **섹션이 통째로 사라짐**. "데이터 없으면 없다고 말한다"(3기둥 §직시) 위반이며 베타 게이트 시장(KR)이 포함됨.
- 조치: 792에서 만든 공용 컴포넌트에 **빈 상태 표시** 추가(US 문구·스타일 재사용). 로딩 실패와 "공시 0건"은 구분(실패는 현행처럼 숨김).

### 6) 🔴 어미 혼용 정리

- 787~792에서 추가된 `StockLens.closing*`·`closingFooter` 등이 **합니다체**인데 앱 전체는 **해요체** → 같은 화면에 같은 문장이 두 어미로 공존(`StockLens.intro` "재료입니다" vs `LensPreview.material` "재료예요").
- 조치: **해요체로 통일**(브랜드 보이스 = 건조하되 해요체가 현행 기준). 대상: 788 닫는 카드 5문장 + `closingFooter` + 791 파트 헤더 부제 + 787 서사 문장들 중 합니다체. **금칙(예측·추천) 재확인**하며 다듬을 것.

### 7) 🔴 모바일 375px 잘림 2건

- **오늘/탐색 리스트 둘째 줄**(`TodayClient`·`ExploreClient`의 `truncate text-[15px]`): "모멘텀 하락 추세 → 상승 추세"에서 **도착 상태가 잘림**(그 줄이 유일한 콘텐츠인데 결론이 사라짐).
  - 조치: 모바일에서 **2줄 허용**(`line-clamp-2`) 또는 렌즈명 생략 등으로 **도착 상태가 항상 보이게**. 어느 쪽이 밀도·가독성에 나은지 판단해 적용(도착 상태 보존이 최우선).
- **관심 삭제 버튼 15px**(`WatchlistClient`): 히트영역 44px로 확대(아이콘 크기는 유지·패딩으로).

### 8) 🔴 터치 타깃 2건

- 헤더 언어 전환 버튼(≈24px), 탐색 최근검색 삭제(≈26px) → 44px.

### 9) 🔴 화면 이름 통일 — 관심

- 같은 화면이 "즐겨찾기"(메타·h1·헤더 aria) / "관심종목"(h2·오늘 링크) / "관심"(탭바)로 3~4가지. → **"관심종목"으로 통일**(탭바만 공간상 "관심" 유지 허용). en도 동일 원칙(`Watchlist`).

### 10) 🔴 푸터·ETF 라벨 잔재

- `Footer` "주식·상품"(구 보드 이름) → 현행 화면 이름("탐색"/"Explore")으로.
- `EtfLens.back` "목록으로" → 주식 상세와 동일하게 "뒤로"(en "Back").

### 11) 🔴 `/advertise` 파킹 지면 정리

- 광고 상품 설명이 **파킹된 화면**(종목·상품 탭 리스트, 정보 피드, 리딩방 슬롯)을 팔고 있음. 푸터·프로필 메뉴에서 전 화면 도달 가능 → 신뢰 리스크.
- 조치: **현행 5면에서 실제 판매 가능한 지면만 남기고**(현재 없으면 "지면 준비 중 — 문의는 받습니다" 톤으로 전면 축소), 파킹 지면 문구 제거. 문의 폼 자체는 유지. ko/en 동시.

### 12) 사이트맵 정합

- `app/sitemap.ts` — `/explore`·`/favorites` 미등재인데 `/coin`(숨김)·`/business`는 등재. → 현행 5면 기준으로 재작성(`/coin` 제거·`/explore` 추가). `/en` 대체 URL(hreflang) 포함 여부는 기존 메타 패턴에 맞춰 판단.

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(ko/en 패리티) · `npm run build`
2. 라이브 **모바일 375px**: 오늘/탐색 둘째 줄에서 도착 상태 항상 보임 · 관심 삭제·언어 전환·최근검색 삭제 44px · 안내 문구가 실제 경로와 일치.
3. 라이브 **`/en`**: 홈 중복 섹션 소멸 · 로그인 후 `/en`으로 복귀 + 보던 종목 복귀(구글 로그인 실측) · 문구 영어 패리티.
4. **로그인 동선 실측(핵심)**: `/en` 종목상세에서 렌즈 클릭 → 로그인 → **그 종목으로 복귀**. ko도 동일. (710D 전례: 로그인 자체가 죽지 않는지 반드시 실제 구글 로그인으로 확인)
5. F-Score 미지원 종목에서 파트 헤더와 닫는 카드 숫자 일치 · KR 공시 0건 종목에서 "중대 공시 없음" 표시.
6. `/advertise` ko/en 확인 · 푸터 라벨 · 사이트맵 XML 확인.
7. 커밋:
   ```bash
   git add app/ components/ lib/ messages/ docs/STEP_795_COMMAND.md
   git commit -m "STEP 795: beta ux essentials - login redirect, honest empties, dynamic counts, wording unification, mobile targets"
   git push
   ```

## 완료 보고 → Cowork에게: 항목별 처리 결과(12건) + 로그인 실측 + 커밋 해시. (직후 Cowork 재검수 3중 감사.)
