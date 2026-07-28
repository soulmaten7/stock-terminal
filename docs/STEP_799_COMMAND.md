# STEP 799 — 제품 표면을 KR+US로 축소 (JP·CN/HK·VN·GB 파킹)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)

**전제 상태**: 문서 커밋 `5256e30` 이후 HEAD · 트리 클린

---

## 배경 — 이 STEP이 필요한 이유

**전략 원칙(ROADMAP §2-1)**: 한 언어권·한 국가탭을 완전히 완성한 뒤 다음으로 간다. 현재 완성 대상은 **KR(한국어)**, 다음이 **US(영어)**. JP/CN/VN/GB는 그 이후다.

그런데 감사 결과, 이 4개국이 **제품 표면에는 살아 있으면서 데이터 품질은 방치**된 상태였다:
- STEP 794에서 `jp/cn/vn/gb-perf` 크론을 중지했는데, `/api/watchlist/quotes`가 그 테이블을 계속 읽어 **동결된 옛 가격을 현재가로** 표시(같은 종목이 상세 페이지에선 야후 실시간 값 → 한 앱에서 두 가격). 헬스체크 감시도 794에서 제거되어 아무도 모름.
- `.HK`는 `countryOf()`가 `'HK'`를 반환하는데 `SNAPSHOT` 맵에 `HK` 키가 없어 **관심목록 가격이 영구 결측**.
- GB는 야후가 펜스로 주는 가격을 파운드 재무와 섞어 **PER 100배** → "이익 대비 비싼 편" 확정 판정.
- `formatTradeValue`가 KR 외 전부 `$` 하드코딩 → JP ETF에 `$2.3B`(실제 23억엔·약 150배 과대), VN은 약 25,000배.

**이 결함들은 개별로 고칠 게 아니라, 완성하지 않은 시장을 노출한 것 자체가 원인**이다. 표면을 닫으면 결함군이 통째로 사라지고 KR·US 검증에 집중할 수 있다.

**원칙**: 삭제가 아니라 **파킹**(코드·데이터·라우트 보존, 진입로만 차단). 복원 절차를 문서에 남긴다.

---

## 수정

### 1) 검색 인덱스 — KR·US만

- `app/api/search/route.ts` — 6개국 인메모리 인덱스에서 **JP/CN/HK/VN/GB 심볼 제외**. 심볼 번들 파일(`data/*_symbols.json`)은 **삭제하지 말 것**(파킹).
- 제외는 **상수 1곳**(예: `ACTIVE_MARKETS = ['KR','US']`)에서 제어되게 하고, 그 상수를 아래 2·3·4가 공유할 것. **하드코딩 산발 금지** — 나중에 JP를 열 때 이 배열에 한 줄 추가로 끝나야 함.

### 2) 관심목록 — KR·US만

- `app/api/watchlist/quotes/route.ts` — `SNAPSHOT` 맵을 KR·US만 남김. 비대상 국가 심볼이 이미 담겨 있는 사용자를 위해 **행을 지우지 말고**, 가격 대신 **"현재 지원하지 않는 시장"** 안내를 표시(정직 결측 — 조용히 `—`로 두지 말 것). i18n ko/en.
- `POST /api/watchlist`(등록) — 비대상 시장 심볼은 **등록 거부**(400 + 사유). 클라 별 버튼도 비활성 또는 안내.

### 3) 종목 상세 — 비대상 시장 진입 처리

- `app/[locale]/stock/[symbol]/page.tsx` — 심볼이 비대상 시장이면 **"아직 지원하지 않는 시장입니다"** 안내 페이지(200) + `robots: { index: false }`. 렌즈·공시·브리핑 호출 자체를 하지 않음(비용·오표시 동시 차단).
- 기존 URL이 검색엔진에 남아 있을 수 있으므로 404가 아닌 안내로 처리.

### 4) 사이트맵·robots

- `app/sitemap.ts` — KR·US 심볼만 등재(현재 JP/CN/VN/GB 번들 전량 등재 중). 비대상 시장 경로는 제외.

### 5) 헬스체크 정합

- 794에서 감시를 제거한 4개국 perf 테이블은 이제 **소비처가 없으므로** 그대로 두되, `docs/PARKED_FIELD_SURFACES.md`에 "크론 중지 + 표면 차단 = 완전 파킹" 상태와 **복원 절차**(크론 재등록 → `ACTIVE_MARKETS`에 추가 → 데이터 신선도 확인)를 명시.

### 6) 문서

- `docs/ROADMAP.md` §2-1에 "KR 완성 → US 확장" 원칙과 이번 축소 결정을 1블록으로 기록.
- `docs/STATE.md` "지금 상태"에 활성 시장 = KR·US 명시.

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. 라이브: 검색창에 "도요타"·"텐센트"·"BP" 입력 → **결과 없음**(또는 안내). "삼성전자"·"애플" → 정상.
3. `/stock/7203.T` 직접 진입 → 안내 페이지 + 렌즈/공시 API 호출 0회(네트워크 확인).
4. 비대상 심볼 관심 등록 시도 → 거부. 이미 담긴 사용자 화면에 안내 표시.
5. `sitemap.xml`에 `.T`·`.HK`·`.VN`·`.L` 심볼 0건.
6. 커밋:
   ```bash
   git add app/ components/ lib/ messages/ docs/
   git commit -m "STEP 799: narrow product surface to KR+US, park other markets behind ACTIVE_MARKETS"
   git push
   ```

## 완료 보고 → Cowork에게: `ACTIVE_MARKETS` 위치 + 차단 확인 4종 + 커밋 해시. (직후 800.)
