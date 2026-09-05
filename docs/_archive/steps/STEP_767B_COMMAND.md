# STEP 767b — 필드 대전환: 랜딩=오늘 · 탐색 연결 · 구 표면 파킹 (TR-AI 전면화 완결)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet — 라우팅 대수술이라 신중히·막히면 🔴 Opus)
**⚠️ 사용자 폰 검수(767a `/explore`) 통과 후 실행**

**전제 상태**: 코드 HEAD `9c7679d`(STEP 767a) · 트리 클린

**결정(07-21 · 장은태 최종)**: 필드 = **오늘(/) · 탐색(/explore) · 종목상세 · 관심 · 마이 — 5면뿐.** 구 보드(6개국 터미널)·정보 탭(링크허브·피드)·유튜브·검증(유사투자자문) = **필드에서 제거·파킹**(코드·데이터·크론 전부 보존 — §11 파킹 프로토콜). 백그라운드 파이프라인은 TR-AI 원료라 전부 계속 돈다.

---

## 수정

### 1) 라우팅 전환

- **`/` = 오늘 콘텐츠**: `app/[locale]/today/`의 콘텐츠를 루트 `app/[locale]/page.tsx`로 이동(구 보드 렌더 대체). 루트 메타는 기존 브랜드 타이틀·OG **유지**(콘텐츠만 교체 — SEO 연속성). `/today`는 `/`로 redirect(기존 링크 보호).
- 탭바·PC 헤더: 오늘→`/` · 탐색→`/explore`(766의 `/` 지정 갱신). 로고 클릭→`/`(뷰 리셋 스토어 homeReset는 보드 전용이었으므로 호출 제거 — 코드 파일은 보존).

### 2) 구 표면 파킹 (삭제 아님 — 렌더 경로만 제거)

- **구 보드+정보 탭**(`ToolboxClient` 및 보드/피드/링크 UI): 루트에서 렌더 제거 → 어떤 라우트에서도 안 불림. **컴포넌트·API 라우트·크론 전부 보존**(krx/ranking·us-list 등은 탐색 목록이 계속 사용 — 사용처 남는 API는 당연히 유지).
- **유튜브 랭킹**: 렌더 경로 제거(컴포넌트·크론 보존).
- **검증(유사투자자문)**: 탭 렌더 제거 + **`/favorites`의 리딩방 섹션 제거**(관심 = 종목만) + `/advertise`의 리딩방 슬롯 문구를 보류 표기로 정리. `fss_advisors` 크론·데이터·클레임 파이프라인 보존. 푸터 법무 디스클레이머 유지.
- **신규 `docs/PARKED_FIELD_SURFACES.md`**: 파킹 목록(보드 터미널·정보탭·유튜브·검증 표면)·보존된 코드/크론/데이터 위치·복원 절차(어느 라우트에 다시 꽂으면 되는지)·파킹 사유(07-21 TR-AI 전면화). §11 프로토콜 형식.

### 3) 정합 청소

- 온보딩/문구에서 구 보드를 가리키던 링크(예: 탐색 안내 "탐색에서 담으러 가기" → `/explore`) 전수 grep·갱신.
- 사이트맵/robots에 구 표면 전용 URL 있으면 정리. `/stock/*` SEO 무변 확인.
- 미들웨어·리다이렉트 충돌 확인(`/today`→`/`가 로케일 라우팅과 안 싸우게 — as-needed 프리픽스 주의).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(패리티) · `npm run build`
2. 로컬: `/` = 오늘 렌더(메타 브랜드 유지) · `/today` → `/` redirect · 탭바 4면 순환(오늘/탐색/관심/마이) · `/favorites`에 리딩방 없음 · 구 보드 UI 어디서도 접근 불가 · `/en` 전 동선.
3. **크론 생존 확인**: vercel.json 13개 크론 무변(전부 백그라운드 원료) — diff 0.
4. 미사용 경고 grep: 파킹 컴포넌트가 import 잔존으로 빌드 경고 내지 않는지(필요시 파킹 컴포넌트는 export 유지·호출부만 제거).
5. 라이브(배포 후): 루트=오늘·탐색·상세·관심 순환 — Cowork 크롬 + 사용자 폰 최종.
6. 커밋:
   ```bash
   git add app/ components/ messages/ docs/PARKED_FIELD_SURFACES.md docs/STEP_767B_COMMAND.md
   git commit -m "STEP 767b: field transition complete - landing=Today, Explore wired, terminal/info/youtube/advisory surfaces parked (code+data preserved)"
   git push
   ```

## 완료 보고 → Cowork에게
- tsc/vitest/build · 크론 diff 0 · 라이브 순환 확인 · 커밋 해시. (문서 STATE/CHANGELOG/ROADMAP/SYSTEM_MAP 대개편은 Cowork이 직후 일괄.)
