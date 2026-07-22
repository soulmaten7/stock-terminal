# STEP 777 — 전역 정체성 마감: 고정폭 숫자 · 등락색 로케일 · PWA · 방향 색 · 손맛

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)
**⚠️ STEP 776 완료 후 실행**

**전제 상태**: STEP 776 커밋 이후 HEAD · 트리 클린

---

## 수정

### 1) 숫자 고정폭 (tabular-nums)

- 가격·등락%·거래대금 등 **수치 표시 전역**에 `tabular-nums`(Tailwind 유틸 또는 전역 CSS `font-variant-numeric: tabular-nums`를 수치 클래스에). 리스트 세로 정렬 안정화. 본문 텍스트엔 미적용.

### 2) 등락 색 로케일 분기 (시맨틱 토큰)

- 현재 하드코딩된 상승/하락 클래스(red/blue류)를 **유틸 하나로 일원화**: `changeColorClass(value)` — ko: 상승 빨강/하락 파랑(현행 유지) · **en: 상승 초록(#34D399급)/하락 빨강(#F87171급)**(서구 관례 — 지금 en이 한국식이면 정반대 오독). 사용처 전수 grep 교체(오늘·탐색·상세·지수 티커·관심 등).
- 색상 값은 토큰으로(임의 hex 산개 금지). 차트/스펙트럼 등 렌즈 시각물에 등락색 쓰는 곳 있으면 동일 적용.

### 3) PWA 홈 화면 설치

- `public/manifest.json`(또는 `app/manifest.ts`): name "Trillion"·short_name "Trillion"·`display: standalone`·`theme_color: #0A0A0A`·`background_color: #0A0A0A`·start_url `/`·아이콘 192/512(+maskable).
- **아이콘 생성**: 기존 브랜드 로고(민트 마크)를 배경 `#0A0A0A` 위에 얹은 192/512 PNG — 로고 SVG 소스에서 sharp 등으로 생성해 `public/icons/`에 커밋. `apple-touch-icon`(180) 포함.
- `<head>`: manifest 링크·`theme-color` 메타(`#0A0A0A`)·apple-touch-icon 링크(layout에 — 로케일 양쪽).
- 서비스워커는 **이번 스코프 아님**(설치·standalone·아이콘까지만 — 오프라인 캐시는 후속).

### 4) 전환 문구 도착 상태 색

- 변화 행 "A → B"에서 **B(도착 상태) 텍스트에 tone 색**(776의 단일 토큰: pos=민트·warn=앰버·flat=현행 muted 유지). A는 muted 유지. 오늘·탐색·풀리스트 공통.

### 5) 탭 손맛 (press 피드백)

- 리스트 행·칩·탭바 항목에 `active:bg-...`(surface 미묘 톤) — 모바일 탭 순간 피드백. 과한 트랜지션 금지(즉각 반응).

### 6) 검색 최근 검색어

- `/api/search` 결과에서 **선택한 종목** 2~3개를 localStorage에 저장 → 검색창 포커스 시(입력 전) "최근" 리스트로 표시·탭=상세 이동·X로 개별 삭제. 서버 저장 안 함(로컬 전용).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. 라이브: 숫자 열 정렬(가격 세로 라인) · `/en` 상승 초록/하락 빨강·ko 불변 · 폰에서 "홈 화면에 추가" → 아이콘·standalone 실행·상단바 색 `#0A0A0A` · 전환 문구 B 색 · 행 탭 피드백 · 최근 검색.
3. Lighthouse(선택): installable 체크 통과.
4. 커밋:
   ```bash
   git add app/ components/ lib/ public/ messages/ docs/STEP_777_COMMAND.md
   git commit -m "STEP 777: identity finish - tabular numerals, locale-aware change colors, PWA install, destination-state color, press feedback, recent searches"
   git push
   ```

## 완료 보고 → Cowork에게: 검증 결과(특히 PWA 설치 스크린 여부) + 커밋 해시. 최종 = 사용자 폰(홈 화면 추가 실물).
