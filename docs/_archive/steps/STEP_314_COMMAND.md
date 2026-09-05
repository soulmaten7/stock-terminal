<!-- 2026-06-20 -->
# STEP 314 — [디자인 통일] 리딩방 행도 표형으로 (다른 탭과 골격 일치)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_314_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 313 (리딩방 외 통일 완료) 직후. 빌드 ✓.

---

## 🎯 목표 (왜)

리딩방(AdvisorDirectory)만 아직 따로 놈:
- 행마다 **테두리 박스**(`rounded-lg border`) → 다른 탭은 표형(밑줄)
- 파비콘 **16px** → 다른 탭은 24px
- 번호 **text-xs** → 다른 탭 text-sm
- 상단 **헤더 없음** → 다른 탭은 SectionHeader

→ **행의 기본 골격만 다른 탭과 일치**시킴. 리딩방 고유 기능(검색·필터·좋아요·신고·미리보기·페이지네이션)은 **그대로 유지**.

> **정당한 차이(의도)**: ① 좋아요·신고·바로가기 아이콘 유지(검증 기능), ② 번호 색강조 안 함(리딩방은 가나다순=랭킹 아님). 수정 1파일.

---

## 📄 파일 — `components/toolbox/AdvisorDirectory.tsx` (수정 3곳)

### 수정 1 — import 추가

**찾기:**
```tsx
import RoomSubmitModal from './RoomSubmitModal';
import SelectDropdown from './SelectDropdown';
```
**바꾸기:**
```tsx
import RoomSubmitModal from './RoomSubmitModal';
import SelectDropdown from './SelectDropdown';
import SectionHeader from './SectionHeader';
```

### 수정 2 — 상단에 SectionHeader 추가 (다른 탭과 동일한 제목+부제)

**찾기:**
```tsx
    <section className="min-w-0">
      <p className="mb-3 rounded-lg border border-unjong-border bg-unjong-background px-3 py-2 text-[11px] leading-relaxed text-unjong-muted">
```
**바꾸기:**
```tsx
    <section className="min-w-0">
      <SectionHeader title="리딩방·검증" subtitle="금융감독원 신고 유사투자자문 조회" />
      <p className="mb-3 rounded-lg border border-unjong-border bg-unjong-background px-3 py-2 text-[11px] leading-relaxed text-unjong-muted">
```

### 수정 3 — 리스트·행: 카드테두리 → 표형(밑줄), 파비콘 24px, 번호·이름 통일

**찾기:**
```tsx
            <ul className="space-y-1">
              {results.map((a, i) => {
                const n = (page - 1) * PAGE_SIZE + i + 1;
                const icon = faviconFor(a.platform, a.homepage);
                const isSel = selected?.biz_no === a.biz_no;
                return (
                  <li
                    key={a.biz_no}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                      isSel ? 'border-unjong-accent bg-unjong-background' : 'border-unjong-border'
                    }`}
                  >
                    <button type="button" onClick={() => setSelected(a)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                      <span className="w-6 shrink-0 text-center text-xs font-bold text-unjong-muted">{n}</span>
                      {icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={icon} alt="" width={16} height={16} className="h-4 w-4 shrink-0 rounded" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
                      ) : <Globe size={14} className="shrink-0 text-unjong-muted" />}
                      <span className="truncate text-sm font-semibold text-unjong-primary">{roomNameOf(a)}</span>
                      {a.source === 'fss' ? <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="금감원 등록" /> : null}
                    </button>
```
**바꾸기:**
```tsx
            <ul>
              {results.map((a, i) => {
                const n = (page - 1) * PAGE_SIZE + i + 1;
                const icon = faviconFor(a.platform, a.homepage);
                const isSel = selected?.biz_no === a.biz_no;
                return (
                  <li
                    key={a.biz_no}
                    className={`group flex items-center gap-3 border-b border-b-unjong-border border-l-2 px-2 py-2.5 transition-colors hover:bg-unjong-background ${
                      isSel ? 'border-l-unjong-accent bg-unjong-background' : 'border-l-transparent'
                    }`}
                  >
                    <button type="button" onClick={() => setSelected(a)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className="w-6 shrink-0 text-center text-sm font-bold text-unjong-muted">{n}</span>
                      {icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={icon} alt="" width={24} height={24} className="h-6 w-6 shrink-0 rounded" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
                      ) : <Globe size={18} className="shrink-0 text-unjong-muted" />}
                      <span className="truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{roomNameOf(a)}</span>
                      {a.source === 'fss' ? <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="금감원 등록" /> : null}
                    </button>
```

> ⚠️ 우측 좋아요·신고·바로가기 버튼 3개(`toggleLike`·`openReport`·homepage 링크)는 **건드리지 마** — 그대로 유지.

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333) → 리딩방·검증 탭:
1. 행마다 있던 **테두리 박스 사라지고 밑줄(표형)** — 증권사·유튜브와 같은 골격.
2. **파비콘 커짐(24px)**, 번호·이름 크기 동일, 호버 시 행 배경 + 이름 민트.
3. **선택한 행** = 왼쪽에 민트 세로바 + 옅은 배경 (미리보기 연동 그대로).
4. 좋아요·신고·바로가기 + 미리보기 + 페이지네이션 **정상 작동**.
5. 상단에 "**리딩방·검증 / 금융감독원 신고 유사투자자문 조회**" 헤더 생김.
6. 탭을 증권사↔유튜브↔리딩방 번갈아 봤을 때 **행 모양이 한 식구**로 보이면 성공.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "refactor(ui): 리딩방 행 표형 통일(카드→밑줄)·파비콘 24px·SectionHeader 추가, 다른 탭과 골격 일치 (STEP 314)" && git push
```

---

> **한 줄 요약**: 리딩방 행을 카드테두리→표형(밑줄)로 바꿔 다른 탭과 골격 일치, 파비콘 24px·SectionHeader 추가. 좋아요·신고·미리보기 등 고유 기능은 유지.
