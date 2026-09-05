<!-- 2026-06-20 -->
# STEP 302 — [V7 ④-10b] 리딩방 레이아웃: 정렬탭 카드폭 맞춤 + 등록버튼 이동

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_302_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 301(`c9b448e`). 빌드 ✓.

---

## 🎯 목표

리딩방·검증 탭 상단 정리:
1. **정렬 탭**(가나다↑/↓/추천순) → **리스트(카드) 영역 안 오른쪽 끝**에 맞춰 우측정렬 (건수 줄 오른쪽). 미리보기 패널 폭은 빼고 카드 오른쪽 끝 기준.
2. **"+ 리딩방 등록" 버튼** → **플랫폼 탭 줄 오른쪽**(정렬 탭이 있던 자리)으로 이동.
3. 버튼 이름 **"+ 내 리딩방 등록" → "+ 리딩방 등록"**.

> `AdvisorDirectory.tsx` 3곳 수정. (자가등록 목록 합류 = STEP 303)

---

## 📄 `components/toolbox/AdvisorDirectory.tsx`

### (1) 등록 버튼 행 제거 + 플랫폼 탭 주석 교체
**찾기:**
```tsx
      {/* 내 리딩방 등록 */}
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => { if (!isLoggedIn) { setLoginNotice(true); return; } setRegistering(true); }}
          className="rounded-lg border border-unjong-accent px-3 py-1.5 text-xs font-semibold text-unjong-accent transition-colors hover:bg-unjong-accent hover:text-white"
        >
          + 내 리딩방 등록
        </button>
      </div>

      {/* 플랫폼 탭(왼쪽) + 정렬 탭(오른쪽) */}
```
**바꾸기:**
```tsx
      {/* 플랫폼 탭(왼쪽) + 리딩방 등록 버튼(오른쪽) */}
```

### (2) 플랫폼 탭 줄의 정렬 탭 → 등록 버튼으로 교체
**찾기:**
```tsx
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
      </div>

      {/* 검색 */}
```
**바꾸기:**
```tsx
        <button
          type="button"
          onClick={() => { if (!isLoggedIn) { setLoginNotice(true); return; } setRegistering(true); }}
          className="shrink-0 rounded-lg border border-unjong-accent px-3 py-1.5 text-xs font-semibold text-unjong-accent transition-colors hover:bg-unjong-accent hover:text-white"
        >
          + 리딩방 등록
        </button>
      </div>

      {/* 검색 */}
```

### (3) 건수 줄 + 정렬 탭을 리스트 컬럼 안으로 (카드 폭 우측정렬)
**찾기:**
```tsx
      <p className="mb-2 px-1 text-xs text-unjong-muted">
        {searching ? `‘${q}’ 검색 결과 ${total.toLocaleString()}건` : `${platLabel} ${total.toLocaleString()}곳`}
        {totalPages > 1 ? ` · ${page}/${totalPages} 페이지` : ''}
      </p>

      {/* 본문: 리스트 + 미리보기 */}
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          {loading ? (
```
**바꾸기:**
```tsx
      {/* 본문: 리스트 + 미리보기 */}
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          {/* 건수(왼쪽) + 정렬 탭(오른쪽 = 카드 오른쪽 끝에 맞춤) */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="min-w-0 truncate px-1 text-xs text-unjong-muted">
              {searching ? `‘${q}’ 검색 결과 ${total.toLocaleString()}건` : `${platLabel} ${total.toLocaleString()}곳`}
              {totalPages > 1 ? ` · ${page}/${totalPages} 페이지` : ''}
            </p>
            <div className="flex shrink-0 gap-1">
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
          </div>
          {loading ? (
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333):
1. **플랫폼 탭 줄**: 왼쪽 = 전체·텔레그램·카카오톡·네이버·기타, 오른쪽 끝 = **"+ 리딩방 등록"**.
2. **정렬 탭**(가나다↑/↓/추천순) = 건수 줄 오른쪽, **카드 리스트의 오른쪽 끝에 정렬**(미리보기 패널 영역 침범 X).
3. 등록 버튼·정렬·검색·미리보기 기능 그대로 작동.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 리딩방 정렬탭 카드폭 우측정렬 + 등록버튼 플랫폼줄 이동/이름변경 (STEP 302)" && git push
```

---

> **한 줄 요약**: 정렬 탭을 카드 리스트 오른쪽 끝에 맞춰 우측정렬, '+ 리딩방 등록' 버튼을 플랫폼 탭 줄 오른쪽으로 이동·이름 단축.
