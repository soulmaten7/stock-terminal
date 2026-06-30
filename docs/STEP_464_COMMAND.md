<!-- 2026-06-30 -->
# STEP 464 — /admin 레이아웃 정리 (금감원 조회=상단 상시 / 탭=처리 큐 3개 / 부제목 제거)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_464_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
관리자 페이지 어색함 정리:
- **금감원 조회**(검색 도구) → 탭에서 빼서 **제목 밑 상시 검색**으로(클레임 심사하며 바로 조회).
- **탭은 처리 큐 3개만** → `[업체 클레임 | 신고 | 광고 문의]` (전부 카운트 있는 작업함).
- 탭 이름을 그대로 반복하던 **부제목 제거**.

## 전제
- 최신 main + 463. `app/admin/page.tsx` 1곳. `AdminFssLookup` import는 이미 있음. 서버 컴포넌트 → HMR.

---

## `app/admin/page.tsx` — 제목·부제목·탭 블록 교체
찾기:
```tsx
      <h1 className="text-xl font-bold text-unjong-primary">트릴리언 관리자</h1>
      <p className="mb-6 mt-1 text-sm text-unjong-muted">업체 클레임 · 신고 · 광고 문의 · 금감원 조회</p>
      <AdminTabs
        tabs={[
          { key: 'claims', label: `업체 클레임 (${claims.length})`, node: <AdminBusinessClaims initial={claims} /> },
          { key: 'reports', label: `신고 (${reports.length})`, node: <AdminReports initial={reports} /> },
          { key: 'inquiries', label: `광고 문의 (${inquiries.length})`, node: <AdminAdInquiries initial={inquiries} /> },
          { key: 'fss', label: '금감원 조회', node: <AdminFssLookup /> },
        ]}
      />
```
바꾸기:
```tsx
      <h1 className="text-xl font-bold text-unjong-primary">트릴리언 관리자</h1>

      {/* 금감원 조회 — 상시 검색 도구(탭 밖, 맨 위). 클레임 심사하며 바로 조회. */}
      <section className="mb-6 mt-4">
        <h2 className="mb-1.5 text-xs font-medium text-unjong-muted">🔎 금감원 신고 조회 (사업자번호·업체명)</h2>
        <AdminFssLookup />
      </section>

      {/* 처리 큐 — 쌓이면 처리하는 작업함 */}
      <AdminTabs
        tabs={[
          { key: 'claims', label: `업체 클레임 (${claims.length})`, node: <AdminBusinessClaims initial={claims} /> },
          { key: 'reports', label: `신고 (${reports.length})`, node: <AdminReports initial={reports} /> },
          { key: 'inquiries', label: `광고 문의 (${inquiries.length})`, node: <AdminAdInquiries initial={inquiries} /> },
        ]}
      />
```

---

## 확인 (HMR — 새로고침)
- `/admin`: 제목 밑에 **금감원 조회 검색창이 상시** 보임(탭 아님).
- 탭은 **3개** `[업체 클레임 (0) | 신고 (0) | 광고 문의 (0)]` — 금감원 조회 탭 사라짐.
- 탭 이름 반복하던 부제목 사라짐.
- 금감원 조회·클레임·신고·광고문의 기능 다 정상.
- 빌드 에러 없음.

## 빌드·커밋
- 보류. 파이널라이즈 묶어 커밋.
