<!-- 2026-06-20 -->
# 운종(雲從) · UNJONG — 새 세션 부트(BOOT) 파일 🚀

> 🔴 **2026-06-20 · V7 리딩방 검증 + 로그인까지 완성.** 네이버 클론(랭킹·차트·종목상세·상품리스트) 폐기 완료. 운종 = **검증된 중립 관문(게이트웨이) + 리딩방 검증.** **새 세션은 `docs/PRODUCT_SPEC_V7.md`를 먼저 읽을 것.**
>
> **마지막 코드 = STEP 300 (`2a0e1b2`), 빌드 ✓.**
> **이번 세션(272~300) 완성한 것:**
> - **게이트웨이 홈**: 헤더=주식/코인, 한국/미국 토글 + 카테고리 탭 13개(뉴스·증권사·유튜브·차트시세·기업재무·리포트·공시신용·ETF펀드·공모주배당·거시경제·거래소·커뮤니티·리딩방검증), max-w-7xl, 지수 티커. (link_hub 카테고리 +8 DB직접)
> - **유튜브 Top100**: 구독자순(1만↑·코인/부동산/골프 제외), 주간 크론 `/api/cron/youtube-refresh`(월9시KST). DB `youtube_channels`. env `YOUTUBE_API_KEY`(Vercel에도 추가됨).
> - **리딩방·검증**: 금감원 신고 유사투자자문 1,738건(`fss_advisors`) → 플랫폼탭(텔레그램115/카카오톡0/네이버432/기타1191, **host 정밀파싱**) · 100/페이지 · 가나다↑↓/추천순 · **리딩방명=info_name**(업체명과 다름) · 분할 미리보기(금감원 정보, **sticky top-11**, 툴박스 overflow-hidden 제거) · **좋아요**(`room_likes`,1인1회,로그인) · **신고**(`room_reports`, `/api/reports`) · **만료 자동숨김**. 집계뷰 **`advisor_directory`**.
> - **로그인**: 카카오 + **구글 OAuth**(구글 provider는 Management API로 활성화 — `.env.local`의 `SUPABASE_ACCESS_TOKEN` 사용). **🔴 핵심 수정: `middleware.ts` 부재가 로그인 루프 원인 → 표준 미들웨어 추가로 해결.** 로그인 시 헤더 이니셜 아바타.
> - (272~280은 V7 전환 전 옛 홈 버그픽스 — isKrxCode·ETF/ETN 차트·스티키·100상품·분봉.)
>
> **▶ 다음 후보**(보류·사용자 결정):
> - **자가등록**(운영자가 직접 리딩방 등록 + 사업자번호 FSS대조 → 즉시공개·배지없음(미등록 낙인 X). **✅금감원등록확인은 본인확인(대표명==인증자명) 후** = 사업자등록 필요).
> - **본인확인**(휴대폰 실명인증, **사업자등록 후 유료** ~40원/건 KG이니시스·포트원 등).
> - **푸터 V7 정리**(환불정책·통신판매업 신고번호 제거=거래 안 함, 검증 면책 추가, 이메일 운종도메인). 법적 필수 = **개인정보처리방침**(로그인 개인정보 수집).
> - **업체명(운종) 변경 검토 중** — 확정 전엔 사업자등록·도메인·이메일·푸터 법정보 보류(이름 박히는 것들). 기능(자가등록 등)은 이름 무관하니 진행 가능.
> ⚠️ **보안**: 유튜브 API키·구글 Client Secret이 스크린샷으로 노출됨 → rotate 권장(미실행). 사용자가 API키 제한은 보류 결정.
> ⚠️ **DB 직접변경(git 아님)**: youtube_channels·room_reports·room_likes 테이블, advisor_directory 뷰(platform·info_name·valid_to필터 포함), link_hub +8. fss_advisors는 기존(매일 크론).
> ⚠️ 아래 §3~§8은 **V6/STEP271 히스토리(무효 많음)**. 워크플로우(§2)·env(§6)·명령어(§7)는 유효.

---

## ⏱️ 0. 새 세션을 시작하는 법 (복붙 3단계)

1. **Cowork 새 대화**를 연다.
2. 첫 메시지로 아래 한 줄을 붙여넣는다:
   > 운종 프로젝트 이어서 할게. `docs/SESSION_BOOT.md` 읽고 현재 상태·작업 방식 파악한 뒤 오늘 할 일 P0를 제안해줘.
3. Cowork가 이 파일(+필요시 PLAYBOOK)을 읽고 상태를 요약 → 오늘 할 일을 제안 → 결정되면 **STEP 명령서**를 만들어 준다. 너는 그걸 **Claude Code 터미널**에 붙여넣어 실행한다.

> 💡 멈춤(freeze)·"모델 사용 불가" 같은 게 뜨면 새 세션 시작이 제일 빠르다. 코드·문서는 git에 있으니 안전하다.

---

## 🧭 1. 운종이 뭐냐 (정체성 — LOCK, 안 바뀜)

> **운종 = "투자상품에 속지 않게 돕는 곳"** — 정확한 정보 + 솔직한 토론 + 검증된 신뢰. **중심축 = 신뢰.**

- 구조 = 네이버 증권 레이아웃 + 토스 증권 카드 + Trustpilot 평가 모델. 마스터 비전 = `docs/PRODUCT_SPEC_V6.md`.
- **거래 X** (증권사 라이선스 없음 — 정보·대화·허브·신뢰만), **영어판 X**, **코인 X**, **정밀 스크리너 X**, **별점 X**(추천/비추천+신고로 대체).
- 한자 雲從 코드 표기 X — **UNJONG + 운종 한글만**.
- **수익 모델**: MVP 1.0(정보+채팅·토론) → **MVP 2.0(상품·리딩방 평가 디렉토리 = 진짜 차별화)** → Tier 인증 광고(추후, Sponsored↔평가 분리). **광고는 사용자가 지시할 때만.**

---

## 🤝 2. 작업 방식 (가장 중요 — 절대 혼용 금지)

| 역할 | 누구 | 하는 일 |
|------|------|---------|
| **두뇌** | **Cowork (이 챗)** | 대화로 무엇을 만들지 결정, 리서치, 설계, 문서 갱신, **STEP 명령서 작성**. **실행은 안 함.** |
| **손** | **Claude Code (터미널 CLI)** | Cowork가 만든 명령서/코드를 **실제로 실행** — 파일 수정·`npm run build`·git commit/push. |

- 흐름: ① 사용자가 Cowork에 원하는 것 말함 → ② Cowork가 STEP 명령서 작성 → ③ 사용자가 Claude Code에 붙여넣어 실행 → ④ 결과를 Cowork에 공유 → 다음 단계.
- **Claude Code 실행 명령** (기본 = Sonnet, 빠르고 저렴):
  ```bash
  cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
  ```
  그다음 터미널에: `@docs/STEP_N_COMMAND.md 파일 내용대로 실행해줘`
- **Opus는 Cowork가 🔴 표시한 경우만** (원인불명 디버깅·대형 리팩토링): `--model opus`
- 명령서 전달: 3단계+/빌드+커밋 포함 → **파일 방식**(`docs/STEP_N_COMMAND.md`). 1~2파일·디버깅 → **인라인**.
- 사용자는 **코딩 초보자** → 기술 설명 간결하게, 명령어는 복붙 가능하게.

---

## 📍 3. 지금 어디까지 했나 (STEP 271 · 2026-06-18)

- **마지막 코드 = STEP 271 (`8670ba2`), 빌드 ✓.** 그 위에 문서 커밋.
- **이번 세션(265~271)** = 사용자 클릭 QA로 발견한 UX·버그 정리 + **종목 상세 점검**:
  - 265~266 헤더 홈/로고 클릭 시 홈 **완전 리셋**(주식·국내·전체·1일, zustand 리셋 카운터+리마운트) + avatarBg 크래시 가드.
  - 267~270 랭킹 표 UI 통일(순위 줄바꿈·ETF/ETN/리츠 ♡ 추가·종목명 `w-full`로 현재가·대비 우측 고정·미리보기 **hover→행 클릭**).
  - 271 종목 상세 **미국 차트** yahoo 연결(placeholder 제거).
- **종목 상세 점검 결론**: 주식·ETF·ETN·리츠·미국 **5종 전부 정상**. (미국 호가·체결은 국내전용 KIS라 카드 미표시 = 정상 / 미국 정보패널은 `/api/yahoo/quote-detail`로 동작.)
- **데이터 현황**: 주식·ETF·ETN·리츠·미국 = 기간 수익률(1일~1년) ✅. **펀드 = 제거**(무료 수익률 소스 없음 = 유료 데이터 영역).

---

## 🗺️ 4. 페이지·아키텍처

**홈(`/`)** = 지수 티커 → **랭킹 탭** 5개: `stock`(주식)·`etf`·`etn`·`reit`(리츠) ｜ `room`(리딩방 리스트). 탭은 URL `?tab=`로 새로고침 유지. 행 **클릭** 시 우측 미리보기 표시(hover 아님), 미리보기 안 '종목 상세·토론 보기 →'로 상세 이동. 우측 레일 = 실시간채팅 + 관심종목(♡).

**페이지 라우트**:

| 라우트 | 역할 |
|--------|------|
| `/` | 포털형 홈 (`components/home-v6/HomeClientV6`) |
| `/market` | **상품 리스트 = 전 타입 통합 디렉토리**(주식·ETF·리츠·미국·ETN 한 표에서 같은 기간 수익률로 비교, `MarketDirectoryClient`) |
| `/stock/[code]` | 종목 상세 — 좌 `StockInfoPanel`+증권사링크 / 중 탭5(차트·시세/토론/뉴스/공시/인사이트) / 우 실시간채팅. 국내=KIS, 미국=yahoo |
| `/toolbox` | 주식 관련 링크모음(증권사 거래대금 순위 + 카테고리 링크) |
| `/rooms`·`/room/[id]` | 리딩방·채널 디렉토리/평가 |
| `/products`·`/product/[id]` | 상품 디렉토리/평가 |
| `/discussion`·`/news`·`/calendar`·`/global`·`/mypage`·`/auth/login` | 토론·뉴스·캘린더(외부링크)·글로벌·마이·로그인 |
| `/(windows)/kr`·`/us` | (레거시 — `/market`으로 리다이렉트) |

**헤더 메뉴** = 홈 · 상품 리스트(`/market`) · 주식 관련 링크모음(`/toolbox`).

---

## 🔌 5. 데이터 소스 / 주요 API 라우트 (`app/api/...`)

- **KRX 공식 OpenAPI** (`data-dbg.krx.co.kr`, `AUTH_KEY` 헤더, env `KRX_API_KEY`): 국내 랭킹 100·일별.
  - `krx/ranking`(주식 100, 5분 캐시) · `krx/etn`(ETN 1일, 엔드포인트 `/etp/etn_bydd_trd`) · `krx/etn-performance`(ETN 기간 수익률 — 6개 날짜 종가 비교)
- **Yahoo** (`yahoo-finance2`): `yahoo/chart`(차트 일봉) · `yahoo/kr|etf|reit|us-performance`(기간 수익률) · `yahoo/quote-detail`(미국 종목 상세) · `yahoo/indices`·`m7`·`us-movers` 등
- **KIS (국내 전용)**: `kis/price`·`chart`·`orderbook`·`execution`·`investor`·`market-cap` 등 — **미국 종목엔 안 씀**(미국은 yahoo).
- **DART**(국내 공시)·**SEC**(미국 공시)·**RSS 뉴스**(`news/*`)·**ECOS/FRED**(거시).
- **Supabase**: 채팅·토론·평가·관심종목·FSS 신고 원장(1,738건 적재).

---

## 🔐 6. 환경변수 · 보안 (절대 규칙)

- `.env.local` **변수 이름만** (값은 절대 채팅/문서에 평문으로 X): `KRX_API_KEY`, `KIS_APP_KEY`/`KIS_APP_SECRET`/`KIS_*`, `DART_API_KEY`, `SEC_USER_AGENT`, `ECOS_API_KEY`/`FRED_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_ACCESS_TOKEN`/`SUPABASE_PROJECT_REF`/`DATABASE_URL`, `NEXT_PUBLIC_LOGODEV_TOKEN`, `OPENAI_API_KEY`, `KAKAO_CLIENT_ID`/`KAKAO_CLIENT_SECRET`, `DATA_GO_KR_KEY`, `TOSS_*`.
- **`.env.local` 커밋 절대 금지** (현재 git 미추적 = 정상).
- **Supabase 프로젝트**: 운종 전용 ref **`qxkmwlkchyxfzxbonhtj`** (대시보드 표시명 "OT-Marketing"). ⚠️ POTAL ref **`zyurflkhiregundhisky`**는 **절대 사용 금지**(혼동 주의).
- 키 값이 화면/스크린샷에 노출되면 재발급 권장. Cowork는 키 값을 직접 다루지 않는다(이름만).

---

## 🧰 7. 자주 쓰는 명령어 (복붙용)

```bash
# 개발 서버 (포트 3333)
cd ~/stock-terminal && npm run dev

# 빌드 검증
cd ~/stock-terminal && npm run build

# Claude Code 실행 (STEP 명령서 돌릴 때)
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
#  → 그다음: @docs/STEP_N_COMMAND.md 파일 내용대로 실행해줘

# 커밋·푸시 (작업/문서 저장)
cd ~/stock-terminal && git add -A && git commit -m "메시지" && git push

# 현재 상태 확인
cd ~/stock-terminal && git log --oneline -5 && git status -sb
```

---

## ▶️ 8. 다음 할 일 후보 (전부 보류 — 사용자 결정 필요)

- **리딩방·채널 검증 빌드** — 설계 = `docs/ROOM_VERIFICATION_SPEC.md`. (전체 리스트화 + 신고 **사실** 라벨 + 신고/광고 상위·분리. 데이터 확보·구현은 **플랫폼 완성 후**.)
- **모바일 반응형** (현재 데스크톱 폭 기준).
- **카카오 OAuth 활성화** (사용자 작업) — 추천/비추천 투표 실동작 전제.
- **AI 해설 빌드 여부** — 설계 = `docs/AI_LENS_SPEC.md` (해설만, 추천·단타 X).
- `/market`에 ♡·클릭 미리보기 일관화(홈과 동일하게).
- 평가·검증 MVP 2.0 / (펀드 수익률은 유료 데이터 도입 시) / **광고는 사용자 지시 시에만.**

> ⚖️ 새 기능 판단 필터: **"이거 보려고 운종에 올 이유가 있나?"** 없으면 안 만든다. 리딩방·채널 검증이 진짜 차별점.

---

## ✅ 9. 세션 종료 체크리스트 (Cowork이 매 코드 세션마다)

1. **4개 문서 헤더 날짜를 오늘로**: `CLAUDE.md` · `docs/CHANGELOG.md` · `session-context.md` · `docs/NEXT_SESSION_START.md`.
2. `CHANGELOG.md`에 이번 세션 변경 + 커밋 해시 추가.
3. `session-context.md`에 완료 블록 추가(+ TODO 가비지 컬렉션).
4. `docs/NEXT_SESSION_START.md`·`docs/NEXT_SESSION_PLAYBOOK.md`·`docs/SESSION_KICKOFF.md`·**이 BOOT 파일** 최신화(HEAD·STEP·다음 후보).
5. **교차검증**: ①6개 문서 날짜 동일 ②STEP 번호·커밋 해시 git log와 일치 ③옛 상태가 '현재'로 오인될 표기 없는지.
6. Claude Code용 `git add -A && git commit && git push` 명령 제공 → 사용자 실행.
7. 빌드 에러 없는지(`npm run build`).

---

## 📚 10. 더 깊은 문서 (필요할 때만)

| 파일 | 용도 |
|------|------|
| `docs/NEXT_SESSION_PLAYBOOK.md` | 심화 인수인계 — 디자인 시스템·페이지별 컴포넌트 매핑·STEP 이력 |
| `docs/CHANGELOG.md` | 세션별 전체 변경 이력(STEP별 커밋 해시) |
| `session-context.md` | 누적 결정사항 + STEP 블록 + TODO |
| `CLAUDE.md` | Cowork↔Claude Code 워크플로우 원본(절대 규칙) |
| `docs/PRODUCT_SPEC_V6.md` | 운종 마스터 비전(정체성 축 = "안 속는 곳") |
| `docs/ROOM_VERIFICATION_SPEC.md` | 리딩방 검증 설계(법지형 포함) |
| `docs/AI_LENS_SPEC.md` | AI 해설 설계 |

---

> **한 줄 요약**: 운종 = "안 속는 곳". Cowork=설계, Claude Code=실행. 지금 STEP 271(`8670ba2`)까지 빌드 ✓ — 주식·ETF·ETN·리츠·미국 수익률 + 종목 상세 5종 정상. 다음은 사용자가 고른다.
