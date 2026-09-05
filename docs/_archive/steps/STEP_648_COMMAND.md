<!-- 2026-07-07 -->
# STEP 648 — 헤더 로고→홈 리셋 픽스 + 세션 문서 갱신(645~648)

> **버그**: 헤더 로고/'주식' 클릭 시 무조건 홈으로 가야 하는데(언어권 기본 뷰 = 한국어→**한국탭·종목·상품·주식**) 마지막 국가/탭에 남음.
> **원인**: `useHomeReset`(n++)이 **아무 컴포넌트에서도 소비 안 됨**(주석의 "랭킹 key 리마운트"가 실재 안 함) + 국가(`countryStore` persist)·탭(localStorage `unjong_tab`) 유지.
>
> **Cowork이 이미 함** (tsc EXIT=0):
> - `stores/homeResetStore.ts`: `reset`이 **국가→KR** + **localStorage 탭→market** 리셋 후 n++ (다른 페이지에서 로고로 홈 이동 시 새 마운트가 이 값을 읽음).
> - `components/toolbox/ToolboxClient.tsx`: `n` 구독 → 탭=**종목·상품(market)**·서브=모아보기 리셋 + 콘텐츠 div를 `key={content-n}`로 **리마운트**(보드 서브필터 주식/ETF… → **주식** 초기화). (Header는 이미 `resetHome` 호출 중이라 변경 없음.)
> - 세션 문서 5종 갱신(645 매매처 DB·646~647 JP공시 EDINET·648 헤더픽스). **3번 검수 완료**(날짜 07-07·STEP 반영·수치/커밋 일관·(최신) 1개).
>
> **전제**: STEP 647(`5d9e90a`) 이후. **빌드 + 커밋만**.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error" | head -8
```

## 1) 변경 확인
```bash
cd ~/stock-terminal && git status --short | grep -E "homeResetStore|ToolboxClient|CHANGELOG|session-context|SESSION_BOOT|NEXT_SESSION_START|NEW_SESSION_HANDOFF"
```

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add stores/homeResetStore.ts components/toolbox/ToolboxClient.tsx docs/CHANGELOG.md session-context.md docs/SESSION_BOOT.md docs/NEXT_SESSION_START.md docs/NEW_SESSION_HANDOFF.md docs/STEP_648_COMMAND.md && git commit -m "fix(header): 로고→홈 완전 리셋(국가 KR·탭 종목·상품·주식) + 세션 문서 645~648 갱신" && git push
```

## 3) (배포 후) Cowork 검증
- 미국탭/다른 카테고리/ETF 상태에서 로고 클릭 → **한국탭·종목·상품·주식**으로 리셋되는지. 종목 페이지에서 로고 클릭 → 홈 기본 뷰.

## ✅ 완료 시 → 다음: JP STEP 649(JpEventLayer + R1 요약 UI) · 완전성 GB(RNS)→VN→CN · 광고. (얘기 나눌 주제도 대기 중.)
