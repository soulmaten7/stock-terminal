<!-- 2026-06-20 -->
# STEP 312 — [운영] 헤더 '관리자' 링크 (admin 전용)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_312_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 311(`84fab0b`) + 문서 커밋(`1d4a93d`). 빌드 ✓.

---

## 🎯 목표

매번 `/admin` 직접 안 쳐도 되게 — **헤더 프로필 드롭다운에 '관리자' 링크** 추가. `role='admin'`인 사람(=너)한테만 보임.
- 부수: `User` 타입 `role`에 **`'admin'`** 추가 (DB엔 admin인데 타입엔 빠져 있어 `user.role === 'admin'`이 타입에러 남).

> 파일 2곳.

---

## 📄 파일 1 — `types/user.ts` (role에 'admin' 추가)

**찾기:**
```tsx
  role: 'free' | 'premium' | 'pro';
```
**바꾸기:**
```tsx
  role: 'free' | 'premium' | 'pro' | 'admin';
```

---

## 📄 파일 2 — `components/layout/Header.tsx` (프로필 드롭다운에 관리자 링크)

**찾기:**
```tsx
                  <Link href="/mypage" className="block px-4 py-2.5 text-sm text-unjong-primary hover:bg-unjong-background" onClick={() => setProfileOpen(false)}>마이페이지</Link>
                  <div className="border-t border-unjong-border" />
```
**바꾸기:**
```tsx
                  <Link href="/mypage" className="block px-4 py-2.5 text-sm text-unjong-primary hover:bg-unjong-background" onClick={() => setProfileOpen(false)}>마이페이지</Link>
                  {user.role === 'admin' ? (
                    <Link href="/admin" className="block px-4 py-2.5 text-sm font-semibold text-unjong-accent hover:bg-unjong-background" onClick={() => setProfileOpen(false)}>관리자</Link>
                  ) : null}
                  <div className="border-t border-unjong-border" />
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333):
1. **soulmaten7(admin) 로그인** → 헤더 우측 프로필 아바타 클릭 → 드롭다운에 **마이페이지 / 관리자 / 로그아웃**. '관리자' 클릭 → `/admin`.
2. **일반 계정**(role≠admin) → '관리자' 링크 **안 보임**.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(admin): 헤더 프로필에 '관리자' 링크(admin 전용) + User role에 admin 추가 (STEP 312)" && git push
```

---

> **한 줄 요약**: 헤더 프로필 드롭다운에 admin 전용 '관리자' 링크(/admin) 추가, User 타입 role에 'admin' 포함.
