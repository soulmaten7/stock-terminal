<!-- 2026-06-20 -->
# STEP 300 — [V7 ⑤-d] 로그인 시 헤더 아이콘 → 이니셜 아바타

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_300_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 299(미들웨어). 빌드 ✓.

---

## 🎯 목표

로그인 전후 헤더 아이콘이 똑같아 구분이 안 됨. **로그인하면** 회색 사람 아이콘 대신 **이니셜이 든 색깔 원(아바타)** 로 바꿔 한눈에 로그인 상태가 보이게.
- 로그아웃 상태: 기존 회색 `User` 아이콘 (그대로).
- 로그인 상태: 닉네임/이메일 첫 글자가 들어간 **원형 아바타**.

> `Header.tsx` 프로필 버튼 한 곳만 수정.

---

## 📄 `components/layout/Header.tsx`

**찾기:**
```tsx
            <div ref={profileRef} className="relative">
              <button type="button" onClick={() => setProfileOpen(!profileOpen)} className="p-1 text-unjong-muted hover:text-unjong-primary transition-colors">
                <User size={18} />
              </button>
```
**바꾸기:**
```tsx
            <div ref={profileRef} className="relative">
              <button type="button" onClick={() => setProfileOpen(!profileOpen)} className="flex h-7 w-7 items-center justify-center rounded-full bg-unjong-primary text-xs font-bold text-white transition-opacity hover:opacity-90" aria-label="프로필 메뉴" title={user.nickname || user.email || ''}>
                {(user.nickname || user.email || 'U').charAt(0).toUpperCase()}
              </button>
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러 (`User` import은 로그아웃 상태에서 계속 쓰이니 그대로 둠).

개발 서버(`npm run dev`, 포트 3333):
1. **로그아웃 상태** → 헤더 우측 = 기존 회색 사람 아이콘.
2. **로그인 상태** → 헤더 우측 = **이니셜이 든 색깔 원**(예: soulmaten7 → "S"). 클릭하면 기존 드롭다운(닉네임·이메일·마이페이지·로그아웃) 그대로.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(auth): 로그인 시 헤더에 이니셜 아바타 표시 (로그인 상태 가시화) (STEP 300)" && git push
```

---

> **한 줄 요약**: 로그인 상태를 헤더에서 바로 알 수 있게, 로그인 시 프로필 아이콘을 이니셜 원형 아바타로 교체.
