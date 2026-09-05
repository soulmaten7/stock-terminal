# STEP 82 — 통합 QA + 최종 점검 + V3 1차 완료 선언

**실행 명령어 (Sonnet 기본, 복잡 디버깅 필요 시 🔴 Opus):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** STEP 81 완료 — Section 1~5 전 구간 UI + 체결/호가 폴리싱 완료.

**목표:**
V3 대시보드 1차 릴리즈 직전 통합 QA.
1. 5개 섹션 전체 **빌드 + 린트** 클린
2. **console.log / console.warn 잔존 확인** 및 제거
3. **TODO 카탈로그** 작성 — 남은 스텁/미구현 정리
4. **반응형 수동 테스트** — 1920 / 1440 / 1280 / 1024 폭
5. **selectedSymbolStore 연동 검증** — 모든 리스트 종목 클릭 → Section 1 상세 패널 갱신
6. **성능 측정** — Lighthouse 로컬 + 대시보드 초기 로드 시간

**범위 제한:**
- 실제 버그 수정은 Critical(빌드 실패/런타임 크래시) 만 이번 STEP.
- 디자인 미세 조정, 추가 기능 개발은 별도 STEP.

---

## 작업 1 — 린트 + 빌드 클린

```bash
npm run lint
npm run build
```

### 처리 원칙

- **Error**: 무조건 수정. 실패 시 빌드 막힘.
- **Warning** (any 타입, 미사용 import 등): 이번 STEP 에서 **프로덕션 성능/보안에 영향 있는 항목만** 수정. 스타일 경고는 TODO 로 이관.

### 자주 나오는 경고 처리 예시

```bash
# any 타입 경고 확인
grep -rn ": any" components/ app/ --include="*.tsx" --include="*.ts" | wc -l

# 미사용 import
grep -rn "^import" components/ --include="*.tsx" | head
```

---

## 작업 2 — console 잔존 제거

```bash
# console.log / console.warn / console.error 잔존 확인
grep -rn "console\." components/ app/ lib/ --include="*.tsx" --include="*.ts" | grep -v "node_modules"
```

### 제거 원칙

- **제거**: 디버깅용 `console.log('[DEBUG]...')`, 개발 확인용 출력
- **유지**: `console.error` 로 에러 리포팅 보내는 라인, `try/catch` 의 에러 로깅
- 유지하는 경우 최소한 주석으로 의도 명시:
  ```ts
  // 프로덕션 에러 로깅 — Sentry 연동 전 임시
  console.error('KIS API failed:', err);
  ```

---

## 작업 3 — TODO 카탈로그

프로젝트 전체 TODO 수집:

```bash
grep -rn "TODO\|FIXME\|XXX" components/ app/ lib/ --include="*.tsx" --include="*.ts" | grep -v "node_modules"
```

### `docs/V3_TODO_CATALOG.md` 신규 작성

```markdown
# V3 TODO 카탈로그 (STEP 82 기준, 2026-04-23)

## Critical (릴리즈 전 필수)
- 없음 ← 이상이면 이번 STEP 내 처리

## High (다음 STEP 우선순위)
- [ ] <파일:라인> — <내용>
- ...

## Medium
- ...

## Low (장기 과제)
- ...

## 외부 API 미연동
- [ ] <해당되는 데이터 소스 나열>
```

### 분류 기준

- Critical: 화면 깨짐/런타임 에러 유발 가능
- High: 주요 기능 누락 (예: SEC 공시 mock 상태 등)
- Medium: UX 개선 (정렬/필터/검색 등)
- Low: 완성도 향상 (애니메이션, 마이크로인터랙션)

---

## 작업 4 — 반응형 수동 테스트 체크리스트

`npm run dev` 후 브라우저에서 4개 해상도 확인:

### 1920px (xl)
- [ ] Section 1: 280/1fr/360 3컬럼 정상
- [ ] Section 2: 4/8 비율 정상
- [ ] Section 3: 12col 풀폭 + 6/3/3 정상
- [ ] Section 4: 9/3 정상
- [ ] Section 5: 5/4/3 정상

### 1440px (lg)
- [ ] Section 1: 240/1fr/320 3컬럼 (축소)
- [ ] 나머지 섹션 레이아웃 유지

### 1280px (경계값)
- [ ] Section 1: 2컬럼 + StockDetailToggle FAB 표시
- [ ] FloatingChat FAB 과 겹치지 않음

### 1024px (tablet 가로)
- [ ] 중앙 컬럼 min-w-[480px] 로 가로 스크롤 허용
- [ ] FAB 2개(Toggle + Chat) z-index 정상

---

## 작업 5 — `selectedSymbolStore` 연동 검증 체크리스트

각 위치에서 종목 클릭 시 Section 1 상세 패널이 즉시 갱신되는지:

- [ ] Section 1 좌측 Watchlist 클릭
- [ ] Section 3 ScreenerExpanded 결과 리스트 클릭
- [ ] Section 3 MoversPair 상승/하락 클릭
- [ ] Section 3 VolumeTop10 클릭
- [ ] Section 3 NetBuyTop 클릭
- [ ] Section 4 SectorHeatmap 개별 종목 타일 클릭
- [ ] Section 4 ThemeTop10 → (테마 상세는 이번 STEP 제외. TODO 유지)

각 클릭이 `useSelectedSymbolStore.setSelected({ code, name, market })` 를 호출하는지 grep 확인:

```bash
grep -rn "setSelected" components/ --include="*.tsx"
```

---

## 작업 6 — 성능 기초 측정

### 6-1. Lighthouse 로컬 실행

```bash
# 새 터미널에서
npm run build && npm run start &

# Chrome DevTools → Lighthouse → Performance, Desktop 모드
# 또는 CLI
npx lighthouse http://localhost:3000 --view --preset=desktop
```

### 6-2. 기록할 지표

- Performance 점수 (목표: 80+ / Critical: 60 미만)
- First Contentful Paint (목표: 1.5s 이하)
- Largest Contentful Paint (목표: 2.5s 이하)
- Total Blocking Time (목표: 200ms 이하)
- Cumulative Layout Shift (목표: 0.1 이하)

### 6-3. 결과가 나쁘면

- 이번 STEP 에서 **측정만** 하고, 개선은 별도 STEP (83+).
- 단, LCP > 4s 또는 TBT > 1s 면 Critical — 원인 후보 (이미지 최적화, 무거운 컴포넌트 lazy load, API 병렬화) 를 TODO 카탈로그에 즉시 추가.

---

## 작업 7 — 문서 4개 + V3 릴리즈 노트

### 7-1. 일반 문서 4개 갱신
- `CLAUDE.md` 날짜
- `docs/CHANGELOG.md`:
  ```
  - chore(v3): 통합 QA + 1차 릴리즈 준비 — 린트/console/TODO 카탈로그/반응형/성능 측정 (STEP 82)
  ```
- `session-context.md`: STEP 82 완료 블록
- `docs/NEXT_SESSION_START.md`: 다음 = STEP 83 (남은 High TODO 해소)

### 7-2. `docs/V3_RELEASE_NOTES.md` 신규

```markdown
# Stock Terminal V3 — 1차 릴리즈 노트 (2026-04-23)

## 완료된 영역
- Section 1 Active Trading: 3컬럼 레이아웃 + 종목 선택 지속성 + 우측 4탭(종합/뉴스/공시/재무)
- Section 2 Pre-Market & Global: 장전 브리핑 + 5그룹 17지표 글로벌 지수 + SVG 스파크라인
- Section 3 Discovery: 종목 발굴(6프리셋) + 급등락 좌우 분리 + 거래량/수급 Top10
- Section 4 Market Structure: 섹터 히트맵 + 인기 테마 Top10
- Section 5 Information Streams: 최신 뉴스/공시/이번 주 경제 캘린더
- 전역 FloatingChat (3상태 토글)
- 체결창/호가창 폴리싱

## 아키텍처
- Next.js App Router
- Zustand + persist (selectedSymbolStore, floating-chat-state)
- Tailwind CSS
- 외부 API: KIS (KR 시세), DART (KR 공시/재무), SEC EDGAR (US 공시), Yahoo Finance/FRED/CoinGecko (글로벌)

## 알려진 제약
- V3 범위 외: 구독/결제/Pro/AI 리포트/CSV 전면 제외
- 모바일 세로뷰 최적화 제외
- 실시간 WebSocket 연결 일부 구간은 폴링 유지

## 성능 (Lighthouse Desktop)
- Performance: <측정값>
- FCP: <값>s / LCP: <값>s / TBT: <값>ms / CLS: <값>

## 남은 TODO
`docs/V3_TODO_CATALOG.md` 참조.
```

---

## 작업 8 — Git commit & push

```bash
git add -A && git commit -m "$(cat <<'EOF'
chore(v3): 통합 QA + 1차 릴리즈 준비 (STEP 82)

- lint/build 클린
- console.log 잔존 제거 (프로덕션 로깅만 유지)
- docs/V3_TODO_CATALOG.md 신규 — Critical/High/Medium/Low 분류
- 반응형 수동 테스트 완료 (1920/1440/1280/1024)
- selectedSymbolStore 연동 전 구간 검증
- Lighthouse 기초 측정
- docs/V3_RELEASE_NOTES.md 신규

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)" && git push
```

---

## 완료 보고 양식

```
✅ STEP 82 완료 — V3 1차 릴리즈 준비 완료

1. 린트/빌드
   - npm run lint: <통과/경고 N건>
   - npm run build: 성공

2. Console 제거
   - 제거: N건
   - 유지(에러 로깅): N건

3. TODO 카탈로그
   - Critical: 0건
   - High: N건
   - Medium: N건
   - Low: N건

4. 반응형 테스트
   - 1920: OK
   - 1440: OK
   - 1280: OK
   - 1024: OK (또는 이슈)

5. selectedSymbolStore 연동
   - 7개 지점 중 N개 정상, M개 이슈 → TODO 등록

6. Lighthouse Desktop
   - Performance: XX
   - FCP: X.Xs / LCP: X.Xs / TBT: XXXms / CLS: 0.0X

7. 릴리즈 노트
   - docs/V3_RELEASE_NOTES.md 생성
   - docs/V3_TODO_CATALOG.md 생성

- git commit: <hash>
- git push: success

다음 STEP 83: 남은 High TODO 해소 (우선순위 카탈로그 참조)
```

---

## 주의사항

- **console.error 는 남겨도 됨** — 실제 에러 리포팅이 붙기 전 임시 로그는 주석으로 의도 명시.
- **TODO 카탈로그 작성 시 절대 누락 금지** — grep 결과 전부 포함. 분류 애매하면 일단 Medium 배치.
- **Lighthouse 점수가 낮아도 본 STEP 은 완료 처리** — 원인 분석과 개선은 별도 STEP 로 분리.
- **V3_RELEASE_NOTES 의 "알려진 제약"** — 숨기지 말고 솔직하게 기록. 투자자/사용자 신뢰에 직결.
- **릴리즈 태그는 이번 STEP 에서 만들지 않음** — 사용자(Jang Eun) 최종 확인 후 별도 명령으로 `git tag v3.0.0-rc1` 실행.
