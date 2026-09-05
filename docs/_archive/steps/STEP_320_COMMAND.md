<!-- 2026-06-20 -->
# STEP 320 — [정리] 마이페이지 채팅탭 제거 + 너비 V7 정렬

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_320_COMMAND.md 파일 내용대로 실행해줘
```

> ⚠️ **선행**: STEP 319(로그인 데드락 수정, `components/auth/AuthProvider.tsx`)가 아직 커밋 안 됐으면 먼저 커밋하고 진행할 것.

---

## 🎯 목표
1. 마이페이지 **'채팅 관리' 탭 제거** (빈 '준비 중' 껍데기)
2. 마이페이지 **너비를 홈과 동일하게** — `max-w-7xl mx-auto` (지금은 max-width가 없어 화면 끝까지 퍼짐)

> 변경 1파일: `app/mypage/page.tsx` 5곳.

---

## 📄 `app/mypage/page.tsx` (수정 5곳)

### 1 — Tab 타입에서 chat 제거
**찾기:**
```tsx
type Tab = 'profile' | 'subscription' | 'watchlist' | 'chat' | 'reports';
```
**바꾸기:**
```tsx
type Tab = 'profile' | 'subscription' | 'watchlist' | 'reports';
```

### 2 — 안 쓰는 MessageCircle import 제거
**찾기:**
```tsx
import { User, CreditCard, Star, MessageCircle, Trash2, Siren } from 'lucide-react';
```
**바꾸기:**
```tsx
import { User, CreditCard, Star, Trash2, Siren } from 'lucide-react';
```

### 3 — 탭 목록에서 채팅 관리 제거
**찾기:**
```tsx
    { key: 'watchlist', label: '관심 종목', icon: <Star className="w-4 h-4" /> },
    { key: 'chat', label: '채팅 관리', icon: <MessageCircle className="w-4 h-4" /> },
    { key: 'reports', label: '내 신고', icon: <Siren className="w-4 h-4" /> },
```
**바꾸기:**
```tsx
    { key: 'watchlist', label: '관심 종목', icon: <Star className="w-4 h-4" /> },
    { key: 'reports', label: '내 신고', icon: <Siren className="w-4 h-4" /> },
```

### 4 — 채팅 관리 내용 블록 제거
**찾기:**
```tsx
          {activeTab === 'chat' && (
            <div className="bg-dark-700 rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-bold">채팅 관리</h2>
              <p className="text-text-secondary text-sm">채팅 기록 및 제재 이력 확인은 준비 중입니다.</p>
            </div>
          )}

          {activeTab === 'reports' && (
```
**바꾸기:**
```tsx
          {activeTab === 'reports' && (
```

### 5 — 페이지 너비를 홈과 동일하게 (max-w-7xl 중앙정렬)
**찾기:**
```tsx
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">마이페이지</h1>
```
**바꾸기:**
```tsx
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">마이페이지</h1>
```

---

## ✅ 검증
```bash
npm run build
```
- 빌드 무에러 (MessageCircle import도 제거해 unused 경고 없음).

개발 서버: 마이페이지 사이드바 = **프로필 / 구독 관리 / 관심 종목 / 내 신고** (채팅 관리 사라짐). 콘텐츠 폭이 **홈과 동일하게** 1280px 중앙정렬 → 화면 끝까지 안 퍼짐.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/mypage/page.tsx && git commit -m "chore(mypage): '채팅 관리' 탭 제거 + 너비 max-w-7xl 홈과 정렬 (STEP 320)" && git push
```

---

> **한 줄 요약**: 마이페이지 채팅탭 제거 + 너비를 홈과 같은 max-w-7xl로 정렬.
