<!-- 2026-06-20 -->
# STEP 318 — [정리] 마이페이지 '알림 설정' 탭 제거

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_318_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 317(`내 신고` 추가) 직후.

---

## 🎯 목표

마이페이지에서 빈 "준비 중" 껍데기인 **알림 설정** 탭 제거. (구독 관리·관심 종목·채팅 관리·내 신고·프로필은 유지)

> 변경 1파일: `app/mypage/page.tsx` 4곳.

---

## 📄 `app/mypage/page.tsx` (수정 4곳)

### 1 — Tab 타입에서 notifications 제거

**찾기:**
```tsx
type Tab = 'profile' | 'subscription' | 'watchlist' | 'notifications' | 'chat' | 'reports';
```
**바꾸기:**
```tsx
type Tab = 'profile' | 'subscription' | 'watchlist' | 'chat' | 'reports';
```

### 2 — 안 쓰는 Bell import 제거

**찾기:**
```tsx
import { User, CreditCard, Star, Bell, MessageCircle, Trash2, Siren } from 'lucide-react';
```
**바꾸기:**
```tsx
import { User, CreditCard, Star, MessageCircle, Trash2, Siren } from 'lucide-react';
```

### 3 — 탭 목록에서 알림 설정 제거

**찾기:**
```tsx
    { key: 'watchlist', label: '관심 종목', icon: <Star className="w-4 h-4" /> },
    { key: 'notifications', label: '알림 설정', icon: <Bell className="w-4 h-4" /> },
    { key: 'chat', label: '채팅 관리', icon: <MessageCircle className="w-4 h-4" /> },
```
**바꾸기:**
```tsx
    { key: 'watchlist', label: '관심 종목', icon: <Star className="w-4 h-4" /> },
    { key: 'chat', label: '채팅 관리', icon: <MessageCircle className="w-4 h-4" /> },
```

### 4 — 알림 설정 내용 블록 제거

**찾기:**
```tsx
          {activeTab === 'notifications' && (
            <div className="bg-dark-700 rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-bold">알림 설정</h2>
              <p className="text-text-secondary text-sm">알림 기능은 준비 중입니다.</p>
            </div>
          )}

          {activeTab === 'chat' && (
```
**바꾸기:**
```tsx
          {activeTab === 'chat' && (
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러 (Bell import도 제거해서 unused 경고 없음).

개발 서버: 마이페이지 사이드바 = **프로필 / 구독 관리 / 관심 종목 / 채팅 관리 / 내 신고** (알림 설정 사라짐).

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "chore(mypage): '알림 설정' 탭 제거 (STEP 318)" && git push
```

---

> **한 줄 요약**: 마이페이지 '알림 설정' 빈 탭 제거. 나머지 메뉴 유지.
