# STEP 69 — Dashboard Spec V3.2: Section 1 우측 컬럼 확정

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** 직전 커밋 `f27752b` (STEP 68 완료 + 스펙 V3.1 Section 1 레이아웃 결정 — 3컬럼 + 60/25/15, 우측 내부는 TBD).

**목표:**
Section 1 우측 "종목 상세" 컬럼의 TBD 부분을 확정 사양으로 교체. 코드 수정 없음, 문서만.

---

## 작업 1 — `docs/DASHBOARD_SPEC_V3.md` Section 1 블록 업데이트

Section 1 블록 안에서 기존 "우측 종목 상세 내부 스택 = TBD" 관련 줄/블록을 찾아서 **아래 내용으로 교체**. 전체 리라이트 금지, 해당 섹션만 부분 수정.

### 우측 "종목 상세" 컬럼 구성

**레이아웃:**
- 스냅샷 헤더 고정 약 100px (상단)
- 탭 네비 바 (4개)
- 탭 콘텐츠 영역 (내부 스크롤)

**스냅샷 헤더 콘텐츠:**
- 종목명 · 코드
- 현재가 · 등락률
- 시 / 고 / 저 / 거래량 / 시총 / PER / 배당수익률

**탭 4개 (좌→우, 조회 빈도 순):**
1. **종합** (기본 선택)
2. **뉴스**
3. **공시**
4. **재무**

**"종합" 탭 콘텐츠 (위→아래, 조회 빈도 순):**
1. 핵심 투자지표 — PER · PBR · 시총 · 배당수익률 · 52주 신고·신저가
2. 투자자 수급 미니 🇰🇷 — 외인 / 기관 / 개인 당일·5일 순매수 (US 티커 선택 시 블록 숨김)
3. 뉴스 하이라이트 3건 (제목 + 시간 + 출처)
4. 공시 하이라이트 3건 (제목 + 시간)
5. 재무 미니 — 매출·영업이익 4분기 막대 (클릭 시 재무 탭으로 딥링크)

**"뉴스" 탭:** 해당 종목 전체 뉴스 리스트 (제목 / 시간 / 출처, 클릭 시 원문)
**"공시" 탭:** DART(KR) / SEC(US) 전체 공시 리스트
**"재무" 탭:** 손익 / 재무상태 / 현금흐름 상세 테이블

**설계 근거 (참고용, 스펙 본문에 포함):**
- 탭 4개 순서 = 한국 개인투자자 조회 빈도 순 (네이버 증권 패턴 준거)
- "종합" 탭 블록 내부 순서도 동일 원칙
- 수급 미니를 종합 탭에 노출 = `/net-buy` 페이지 외에도 종목 상세에서 즉시 확인 수요 매우 높음
- 탭 구조 채택 = 단일 컬럼 내부 정보밀도 확보용. 컬럼 간(좌·중·우) "한 화면 다층 관찰" 원칙은 그대로 유지.

---

## 작업 2 — 문서 4개 날짜 갱신 + 엔트리 추가

**날짜 갱신 (상단 날짜를 `2026-04-22`로):**
- `CLAUDE.md`
- `docs/CHANGELOG.md`
- `session-context.md`
- `docs/NEXT_SESSION_START.md`

**`docs/CHANGELOG.md` 상단에 엔트리 추가:**
```
- docs: Dashboard Spec V3.2 — Section 1 우측 컬럼 확정 (스냅샷 헤더 + 탭 4개, 종합 블록 5개)
```

**`session-context.md` TODO 업데이트:**
- "STEP 69 — 우측 컬럼 스펙 확정" → 완료 블록으로 이동
- "STEP 70 — Section 1 3컬럼 레이아웃 + 우측 컬럼 스켈레톤 구현" 신설

**`docs/NEXT_SESSION_START.md` 업데이트:**
- 다음 할 일 = "STEP 70 — Section 1 3컬럼 + 중앙 60/25/15 + 우측 컬럼 스켈레톤 구현"
- 최신 커밋 해시/상태 반영

---

## 작업 3 — Git commit & push

```bash
git add -A && git commit -m "$(cat <<'EOF'
docs: Dashboard Spec V3.2 — Section 1 우측 컬럼 확정 (STEP 69)

- 우측 "종목 상세" 컬럼 = 스냅샷 헤더(~100px) + 탭 4개
- 탭: 종합 / 뉴스 / 공시 / 재무 (조회 빈도 순)
- 종합 탭 블록: 투자지표 → 수급미니(KR) → 뉴스3 → 공시3 → 재무미니
- 수급 미니는 US 티커 선택 시 블록 숨김

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)" && git push
```

---

## 완료 보고 양식

```
✅ STEP 69 완료
- docs/DASHBOARD_SPEC_V3.md Section 1 우측 컬럼 블록 확정
- 4개 문서 날짜 2026-04-22 갱신
- CHANGELOG 엔트리 추가
- session-context TODO 업데이트 (STEP 69 완료, STEP 70 신설)
- NEXT_SESSION_START 다음 할 일 반영
- git commit: <hash>
- git push: success
```

---

## 주의사항

- **코드 수정 없음** — 이번 STEP은 문서만. Section 1 실제 구현은 STEP 70부터.
- **부분 수정 원칙** — DASHBOARD_SPEC_V3.md 전체 리라이트 금지, Section 1 블록 내 TBD 영역만 교체.
- **이전 결정 보존** — 3컬럼 레이아웃(🅐)과 중앙 60/25/15 비율은 그대로 유지.
