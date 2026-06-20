<!-- 2026-06-20 -->
# STEP 305 — [V7 ④-10e] 컨트롤 한 줄 통합 → 미리보기·카드 상단 정렬

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_305_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 304. 빌드 ✓.

---

## 🎯 목표

**미리보기 박스 상단이 "1번 카드" 상단과 같은 높이로 정렬**되게.
- 원인: 정렬 탭이 카드 리스트 위에 있어서 카드가 한 칸 밀림 → 미리보기와 어긋남.
- 해결: **플랫폼 탭 + 정렬 탭 + "+ 리딩방 등록"을 한 줄로** 합치고, 카드 위 정렬 탭 행 제거. → 카드 위에 아무것도 없어 미리보기 상단과 정렬.

결과 순서: 검색창(맨 위) → **[플랫폼 탭 ‧ 정렬 탭 ‧ 등록 버튼] 한 줄** → [카드 리스트 + 미리보기](상단 정렬).

> `AdvisorDirectory.tsx` 2곳.

---

## 📄 `components/toolbox/AdvisorDirectory.tsx`

### (1) 플랫폼 줄 오른쪽에 정렬 탭 다시 추가 (한 줄: 플랫폼 + 정렬 + 등록)
**찾기:**
```tsx
        <button
          type="button"
          onClick={() => { if (!isLoggedIn) { setLoginNotice(true); return; } setRegistering(true); }}
          className="shrink-0 rounded-lg border border-unjong-accent px-3 py-1.5 text-xs font-semibold text-unjong-accent transition-colors hover:bg-unjong-accent hover:text-white"
        >
          + 리딩방 등록
        </button>
      </div>
```
**바꾸기:**
```tsx
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex gap-1">
            {SORTS.map(([s, label]) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  sort === s ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => { if (!isLoggedIn) { setLoginNotice(true); return; } setRegistering(true); }}
            className="shrink-0 rounded-lg border border-unjong-accent px-3 py-1.5 text-xs font-semibold text-unjong-accent transition-colors hover:bg-unjong-accent hover:text-white"
          >
            + 리딩방 등록
          </button>
        </div>
      </div>
```

### (2) 카드 리스트 위의 정렬 탭 행 제거 (카드를 맨 위로)
**찾기:**
```tsx
      {/* 본문: 리스트 + 미리보기 */}
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          {/* 정렬 탭 (카드 오른쪽 끝에 맞춰 우측정렬) */}
          <div className="mb-2 flex justify-end gap-1">
            {SORTS.map(([s, label]) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  sort === s ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {loading ? (
```
**바꾸기:**
```tsx
      {/* 본문: 리스트 + 미리보기 */}
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          {loading ? (
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333):
1. 검색창(맨 위) 밑에 **한 줄**: 왼쪽 = 전체·텔레그램·카카오톡·네이버·기타, 오른쪽 = 가나다↑·가나다↓·추천순 · **+ 리딩방 등록**.
2. 그 밑 바로 **1번 카드** — 카드 위에 아무것도 없음.
3. **오른쪽 미리보기 박스 상단이 1번 카드 상단과 같은 높이**로 정렬.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 리딩방 컨트롤 한 줄 통합(플랫폼·정렬·등록) → 미리보기·카드 상단 정렬 (STEP 305)" && git push
```

---

> **한 줄 요약**: 플랫폼·정렬·등록을 한 줄로 합쳐 카드 위를 비움 → 미리보기 박스 상단이 1번 카드 상단과 정렬.
