<!-- 2026-06-23 -->
# STEP 376 — [정리] 마이페이지 즐겨찾기 탭 제거 (중복 해소)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_376_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
헤더 ⭐ → `/favorites`가 **정식 즐겨찾기 페이지**(링크·리딩방 섹션 + 드래그 순서변경). 마이페이지 '내 즐겨찾기' 탭은 같은 즐겨찾기를 **또 보여주는 중복** → 제거. 마이페이지 = **프로필 + 내 신고** 2탭. 즐겨찾기는 헤더 ⭐로 1클릭 접근(일원화).

변경 **1파일**: `app/mypage/page.tsx`. (미사용 import·타입·state·fetch까지 정리해 빌드 깨짐 방지.)

---

## ① import — 미사용 제거
**찾기:**
```tsx
import { User, Star, Siren, Trash2, ExternalLink, Globe } from 'lucide-react';
```
**바꾸기:**
```tsx
import { User, Siren, Trash2 } from 'lucide-react';
```

## ② Tab 타입
**찾기:**
```tsx
type Tab = 'profile' | 'favorites' | 'reports';
```
**바꾸기:**
```tsx
type Tab = 'profile' | 'reports';
```

## ③ 미사용 타입·상수 제거 (MyReport는 유지)
**찾기:**
```tsx
type MyReport = { id: number; target_name: string; reason: string; status: string; created_at: string };
type LinkFav = { id: number; name: string; url: string; category: string };

const LINK_CAT_LABELS: Record<string, string> = {
  news: '뉴스', chart: '차트·시세', analysis: '기업·재무', disclosure: '공시·신용',
  research: '리포트', etf: 'ETF·펀드', ipo: '공모주·배당', macro: '거시경제',
  community: '커뮤니티', exchange: '거래소',
};
const LINK_CAT_ORDER = ['news', 'chart', 'analysis', 'disclosure', 'research', 'etf', 'ipo', 'macro', 'community', 'exchange'];
type RoomFav = { biz_no: string; name: string; homepage: string | null; platform: string };
```
**바꾸기:**
```tsx
type MyReport = { id: number; target_name: string; reason: string; status: string; created_at: string };
```

## ④ state 제거 (linkFavs·roomFavs)
**찾기:**
```tsx
  const [linkFavs, setLinkFavs] = useState<LinkFav[]>([]);
  const [roomFavs, setRoomFavs] = useState<RoomFav[]>([]);
  const [myReports, setMyReports] = useState<MyReport[]>([]);
```
**바꾸기:**
```tsx
  const [myReports, setMyReports] = useState<MyReport[]>([]);
```

## ⑤ loadData — 신고만 fetch
**찾기:**
```tsx
  const loadData = async () => {
    try {
      const [lf, rf, rep] = await Promise.all([
        fetch('/api/toolbox/favorite').then((r) => r.json()).catch(() => ({})),
        fetch('/api/rooms/favorite').then((r) => r.json()).catch(() => ({})),
        fetch('/api/reports').then((r) => r.json()).catch(() => ({})),
      ]);
      setLinkFavs(lf.favorites ?? []);
      setRoomFavs(rf.favorites ?? []);
      setMyReports(rep.reports ?? []);
    } catch { /* ignore */ }
  };
```
**바꾸기:**
```tsx
  const loadData = async () => {
    try {
      const rep = await fetch('/api/reports').then((r) => r.json()).catch(() => ({}));
      setMyReports(rep.reports ?? []);
    } catch { /* ignore */ }
  };
```

## ⑥ tabs 배열 — 즐겨찾기 항목 제거
**찾기:**
```tsx
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: '프로필', icon: <User size={16} /> },
    { key: 'favorites', label: '내 즐겨찾기', icon: <Star size={16} /> },
    { key: 'reports', label: '내 신고', icon: <Siren size={16} /> },
  ];
```
**바꾸기:**
```tsx
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: '프로필', icon: <User size={16} /> },
    { key: 'reports', label: '내 신고', icon: <Siren size={16} /> },
  ];
```

## ⑦ 즐겨찾기 콘텐츠 블록 통째 삭제
`{activeTab === 'favorites' && (` 로 시작하는 JSX 블록 **전체**를 삭제하라. 그 짝의 닫는 `)}` 까지(바로 다음 줄이 `{activeTab === 'reports' && (` 가 되도록). 즉 리딩방·링크 즐겨찾기 목록 + "순서 변경·정리는 즐겨찾기 페이지에서…" 안내 문단 전부 제거. (블록은 `<div className="space-y-6">` … `</div>` 한 덩어리.)

> 삭제 후 `{activeTab === 'profile' && (...)}` 다음에 곧바로 `{activeTab === 'reports' && (...)}` 가 오면 정상.

---

## ✅ 빌드 검증 (필수 — 미사용 변수 잡힘)
```bash
cd ~/stock-terminal && npm run build
```
- ✅ 무에러 → 다음.
- ❌ `'X' is defined but never used` 등 → 해당 import/변수 추가 제거 후 재빌드. 통과 전 커밋 금지.

## ✅ 런타임 검증 (새로고침)
1. **마이페이지** = 탭 **프로필 / 내 신고** 2개만(즐겨찾기 탭 없음).
2. 헤더 **⭐** → `/favorites` 그대로 동작(링크·리딩방 섹션 + 드래그).
3. 즐겨찾기 추가/해제 정상(게이트웨이·리딩방에서).

## 📦 커밋·푸시 (빌드 통과 시에만)
```bash
cd ~/stock-terminal && git add -A && git commit -m "refactor(mypage): 즐겨찾기 탭 제거 — /favorites로 일원화(중복 해소) (STEP 376)" && git push
```

---

> **한 줄 요약**: 마이페이지 즐겨찾기 탭(=/favorites 중복) 제거 → 즐겨찾기는 헤더 ⭐ → /favorites 단일 페이지로. 미사용 import·state 정리, 빌드 통과 시 커밋.
