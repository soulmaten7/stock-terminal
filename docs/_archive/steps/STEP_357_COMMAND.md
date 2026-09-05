<!-- 2026-06-23 -->
# STEP 357 — [로그인 유도] 링크 즐겨찾기도 별 표시 + 클릭 시 로그인

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_357_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
링크 즐겨찾기(`LinkCard`)도 리딩방 즐겨찾기·리뷰처럼 **비로그인에게 별을 보여주고, 누르면 로그인 페이지로 유도**. (지금은 비로그인이면 별이 아예 안 보임 → 통일.)

> 변경 1파일: `components/toolbox/LinkCard.tsx` (4곳). 컴포넌트만 → **새로고침이면 충분**(재시작 불필요).
> 서버는 이미 `401`+RLS로 막혀 있어 보안은 그대로. 이건 UX 통일.

---

## 📄 `components/toolbox/LinkCard.tsx`

### 1) useRouter import
**찾기:**
```tsx
import { useState } from 'react';
import { Star } from 'lucide-react';
import ListRow from './ListRow';
```
**바꾸기:**
```tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import ListRow from './ListRow';
```

### 2) router 선언
**찾기:**
```tsx
  const [fav, setFav] = useState(link.isFavorite ?? false);
  const [favLoading, setFavLoading] = useState(false);
```
**바꾸기:**
```tsx
  const router = useRouter();
  const [fav, setFav] = useState(link.isFavorite ?? false);
  const [favLoading, setFavLoading] = useState(false);
```

### 3) 비로그인 클릭 → 로그인 유도
**찾기:**
```tsx
  const handleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favLoading) return;
```
**바꾸기:**
```tsx
  const handleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { router.push('/auth/login'); return; }
    if (favLoading) return;
```

### 4) 별 항상 표시 (비로그인에도)
**찾기:**
```tsx
      trailing={
        isLoggedIn ? (
          <button
            type="button"
            onClick={handleFav}
            aria-label={fav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            className={`transition-colors ${fav ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
          >
            <Star size={16} fill={fav ? 'currentColor' : 'none'} />
          </button>
        ) : undefined
      }
```
**바꾸기:**
```tsx
      trailing={
        <button
          type="button"
          onClick={handleFav}
          aria-label={fav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          className={`transition-colors ${fav ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
        >
          <Star size={16} fill={fav ? 'currentColor' : 'none'} />
        </button>
      }
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

개발 서버(컴포넌트 → HMR/새로고침):
1. **로그아웃 상태**로 뉴스·공시 등 링크 탭 → 각 링크 우측에 **별이 보임**.
2. 그 별 클릭 → **로그인 페이지로 이동**(저장 안 됨).
3. 로그인 상태 → 기존처럼 별 토글로 즐겨찾기 저장.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add components/toolbox/LinkCard.tsx && git commit -m "feat(ux): 링크 즐겨찾기 비로그인도 별 표시 + 클릭 시 로그인 유도 (STEP 357)" && git push
```

---

> **한 줄 요약**: 링크 즐겨찾기 별을 비로그인에도 노출 + 클릭 시 로그인 유도 → 리딩방·리뷰와 게이팅 패턴 통일. 보안(서버 401+RLS)은 그대로.
