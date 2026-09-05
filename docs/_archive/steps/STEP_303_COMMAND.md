<!-- 2026-06-20 -->
# STEP 303 — [V7 ④-10c] 정렬탭 플랫폼줄로 + 카운트줄 제거

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_303_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 302. 빌드 ✓.

---

## 🎯 목표

1. **정렬 탭**(가나다↑/↓/추천순)을 **플랫폼 탭과 같은 줄(위)** 오른쪽으로 올림 — "+ 리딩방 등록" 버튼 왼쪽에 나란히.
2. **"전체 N곳 · n/N 페이지" 건수 줄 제거** (하단 페이지네이션으로 충분).

> `AdvisorDirectory.tsx` 2곳.

---

## 📄 `components/toolbox/AdvisorDirectory.tsx`

### (1) 플랫폼 줄 오른쪽 = 정렬 탭 + 등록 버튼 (정렬 탭 추가)
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

      {/* 검색 */}
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

      {/* 검색 */}
```

### (2) 리스트 컬럼의 건수/정렬 행 제거
**찾기:**
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
**바꾸기:**
```tsx
      {/* 본문: 리스트 + 미리보기 */}
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          {loading ? (
```

### (3) 안 쓰게 된 `platLabel` 선언 제거 (건수 줄에서만 쓰였음)
**찾기:**
```tsx
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const platLabel = PLATFORMS.find(([p]) => p === platform)?.[1] ?? '';
```
**바꾸기:**
```tsx
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러 (미사용 변수 `platLabel`까지 제거했으므로 깨끗).

개발 서버(`npm run dev`, 포트 3333):
1. **한 줄에**: 왼쪽 = 전체·텔레그램·카카오톡·네이버·기타, 오른쪽 = 가나다↑·가나다↓·추천순 + **"+ 리딩방 등록"**.
2. 그 밑 검색창 → 바로 **카드 리스트**(건수 줄 없음).
3. 정렬·등록·검색·미리보기 기능 그대로.

> 참고: `const platLabel = ...` 줄이 이제 안 쓰일 수 있음. 빌드가 미사용 변수로 **에러**나면 그 줄만 삭제. (경고면 그대로 둬도 됨.)

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 리딩방 정렬탭 플랫폼줄로 통합 + 건수줄 제거 (STEP 303)" && git push
```

---

> **한 줄 요약**: 정렬 탭을 플랫폼 탭 같은 줄 오른쪽(등록 버튼 옆)으로, '전체 N곳·페이지' 건수 줄 제거.
