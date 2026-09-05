<!-- 2026-06-20 -->
# STEP 304 — [V7 ④-10d] 검색창 위로 + 정렬탭 카드 우측정렬

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_304_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 303(`dd86a9b`). 빌드 ✓.

---

## 🎯 목표

리딩방·검증 탭 상단 순서:
1. **맨 위 = 검색창** (한 줄).
2. 그 밑 = **플랫폼 탭**(왼쪽) + **"+ 리딩방 등록"**(오른쪽). 정렬 탭은 여기서 뺌.
3. **정렬 탭**(가나다↑/↓/추천순) = 카드 리스트 바로 위, **카드 오른쪽 끝에 맞춰 우측정렬**.

> `AdvisorDirectory.tsx` 2곳.

---

## 📄 `components/toolbox/AdvisorDirectory.tsx`

### (1) 검색창을 플랫폼 탭 위로 + 플랫폼 줄에서 정렬 탭 제거(등록 버튼만)
**찾기:**
```tsx
      {/* 플랫폼 탭(왼쪽) + 리딩방 등록 버튼(오른쪽) */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 overflow-x-auto">
          {PLATFORMS.map(([p, label]) => (
            <button
              key={p}
              type="button"
              onClick={() => { setQ(''); setPlatform(p); }}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                platform === p && !searching ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
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
      <div className="relative mb-2">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-unjong-muted" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="리딩방명·업체명·대표자 전체 검색"
          className="w-full rounded-lg border border-unjong-border bg-unjong-surface py-2.5 pl-9 pr-3 text-sm text-unjong-primary outline-none focus:border-unjong-accent"
        />
      </div>
```
**바꾸기:**
```tsx
      {/* 검색 (맨 위) */}
      <div className="relative mb-2">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-unjong-muted" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="리딩방명·업체명·대표자 전체 검색"
          className="w-full rounded-lg border border-unjong-border bg-unjong-surface py-2.5 pl-9 pr-3 text-sm text-unjong-primary outline-none focus:border-unjong-accent"
        />
      </div>

      {/* 플랫폼 탭(왼쪽) + 리딩방 등록 버튼(오른쪽) */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 overflow-x-auto">
          {PLATFORMS.map(([p, label]) => (
            <button
              key={p}
              type="button"
              onClick={() => { setQ(''); setPlatform(p); }}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                platform === p && !searching ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
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
```

### (2) 정렬 탭을 리스트 컬럼 상단에 우측정렬로 추가
**찾기:**
```tsx
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

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333):
1. 면책 밑 **맨 위 = 검색창**.
2. 그 밑 = **플랫폼 탭(왼쪽) + "+ 리딩방 등록"(오른쪽)**.
3. **정렬 탭** = 카드 리스트 바로 위, **카드 오른쪽 끝 우측정렬**(미리보기 패널 영역 침범 X).

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 리딩방 검색창 위로 + 정렬탭 카드 우측정렬 (STEP 304)" && git push
```

---

> **한 줄 요약**: 검색창을 맨 위로, 플랫폼 줄엔 등록 버튼만, 정렬 탭을 카드 리스트 오른쪽 끝에 우측정렬.
