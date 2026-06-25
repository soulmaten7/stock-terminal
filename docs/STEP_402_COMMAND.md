<!-- 2026-06-25 -->
# STEP 402 — P2 폴리시 묶음

작은 P2 폴리시 3건을 한 번에 처리. 모두 저위험·로컬 커밋(푸시·배포 X).

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_402_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (포함된 항목)
1. **푸터 서비스 컬럼 보강** — `components/layout/Footer.tsx` 서비스 컬럼에 "주식·상품"(→ `/`) 링크 추가. (기존엔 "서비스 소개"(`/about`) 1개뿐)
2. **마이페이지 닉네임 저장 피드백** — `app/mypage/page.tsx` 닉네임 저장이 무반응(silent) → 성공/실패 인라인 메시지 추가.
3. **RoomFavorites 비로그인 분기 통일** — `components/favorites/RoomFavoritesClient.tsx`에 WatchlistClient/FavoritesClient와 동일한 "로그인하세요" 카드 추가 (3개 즐겨찾기 섹션 일관성).

> ⚠️ 스킵 항목(아래 "스킵/보류" 참고): advisors 검색+플랫폼 동시 필터, 뉴스 og 이미지 재작성, admin 페이지네이션.

## 전제
- 최신 main. 배포 X(배치). 컴포넌트/페이지 클라이언트 변경 → 빌드 타입검증.
- 라우트는 **실제 존재하는 것만** 링크: `/`, `/about`, `/privacy`, `/terms`, `/favorites`, `/mypage`. (`/coin`은 숨김 — 링크 금지. 게이트웨이 홈 `/`의 리딩방·유튜브는 **탭**이지 별도 라우트가 아님 → 새 라우트 만들지 않음.)
- 코드 식별자 `unjong-*` 토큰은 그대로 유지.

---

## (1) `components/layout/Footer.tsx` — 서비스 컬럼에 "주식·상품"(`/`) 추가

서비스 컬럼이 "서비스 소개"(`/about`) 한 줄뿐이라 비어 보임. 게이트웨이 홈 `/`로 가는 "주식·상품" 링크를 위에 추가. (홈의 리딩방·유튜브는 탭이므로 별도 링크 만들지 않음.)

찾기:
```tsx
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-white/80 transition-colors hover:text-[#2DD4BF]">서비스 소개</Link></li>
            </ul>
```
바꾸기:
```tsx
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-white/80 transition-colors hover:text-[#2DD4BF]">주식·상품</Link></li>
              <li><Link href="/about" className="text-sm text-white/80 transition-colors hover:text-[#2DD4BF]">서비스 소개</Link></li>
            </ul>
```

---

## (2) `app/mypage/page.tsx` — 닉네임 저장 성공/실패 피드백

`updateNickname`이 `supabase.from('users').update(...)`만 호출하고 사용자에게 아무 표시도 안 함. 인라인 메시지(`saveMsg`) 상태를 추가해 성공/실패를 보여줌. 빈 닉네임 가드는 유지.

### (2-a) `saveMsg` 상태 추가
찾기:
```tsx
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
```
바꾸기:
```tsx
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
```

### (2-b) `updateNickname` 핸들러 — 성공/실패 처리
찾기:
```tsx
  const updateNickname = async () => {
    if (!user || !nickname.trim()) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('users').update({ nickname: nickname.trim() }).eq('id', user.id);
    useAuthStore.getState().setUser({ ...user, nickname: nickname.trim() });
    setSaving(false);
  };
```
바꾸기:
```tsx
  const updateNickname = async () => {
    if (!user || !nickname.trim()) return;
    setSaving(true);
    setSaveMsg(null);
    const supabase = createClient();
    const { error } = await supabase.from('users').update({ nickname: nickname.trim() }).eq('id', user.id);
    if (error) {
      setSaveMsg({ ok: false, text: '저장에 실패했어요. 잠시 후 다시 시도해주세요.' });
    } else {
      useAuthStore.getState().setUser({ ...user, nickname: nickname.trim() });
      setSaveMsg({ ok: true, text: '닉네임을 저장했어요.' });
    }
    setSaving(false);
  };
```

### (2-c) 닉네임 입력 아래에 인라인 메시지 출력
찾기:
```tsx
            <div className="flex gap-2">
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="flex-1 rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2.5 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
              <button type="button" onClick={updateNickname} disabled={saving} className="shrink-0 rounded-lg bg-unjong-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? '저장 중…' : '변경'}</button>
            </div>
          </div>
```
바꾸기:
```tsx
            <div className="flex gap-2">
              <input value={nickname} onChange={(e) => { setNickname(e.target.value); setSaveMsg(null); }} className="flex-1 rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2.5 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
              <button type="button" onClick={updateNickname} disabled={saving} className="shrink-0 rounded-lg bg-unjong-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? '저장 중…' : '변경'}</button>
            </div>
            {saveMsg ? <p className={`mt-1.5 text-xs ${saveMsg.ok ? 'text-emerald-600' : 'text-red-500'}`}>{saveMsg.text}</p> : null}
          </div>
```

---

## (3) `components/favorites/RoomFavoritesClient.tsx` — 비로그인 분기 추가 (Watchlist/Favorites와 통일)

`/api/rooms/favorite` GET은 비로그인 시 `{ favorites: [], auth: false }`를 반환하지만, 현재 컴포넌트는 `auth`를 무시하고 빈 목록 안내만 보여줌. WatchlistClient/FavoritesClient와 **동일한 방식**(API 응답의 `auth` 플래그를 읽어 "로그인하세요" 카드 표시)으로 통일. (세 컴포넌트 모두 부모에서 prop을 받지 않고 각자 API 응답으로 판단함 — 동일 패턴 유지.)

### (3-a) `auth` 상태 추가
찾기:
```tsx
  const [items, setItems] = useState<RoomFav[]>([]);
  const [loading, setLoading] = useState(true);
  const dragIdx = useRef<number | null>(null);
```
바꾸기:
```tsx
  const [items, setItems] = useState<RoomFav[]>([]);
  const [auth, setAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const dragIdx = useRef<number | null>(null);
```

### (3-b) fetch에서 `auth` 플래그 읽기
찾기:
```tsx
      .then((j) => { if (!cancelled) { setItems(j.favorites ?? []); setLoading(false); } })
```
바꾸기:
```tsx
      .then((j) => { if (!cancelled) { setItems(j.favorites ?? []); setAuth(j.auth !== false); setLoading(false); } })
```

### (3-c) 비로그인 카드 분기 (loading 직후, 빈 목록 분기 앞)
찾기:
```tsx
  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">불러오는 중…</p>;
  if (items.length === 0) {
    return <p className="rounded-2xl border border-unjong-border bg-unjong-surface py-10 text-center text-sm text-unjong-muted">리딩방·검증에서 ⭐를 누르면 여기 모여요.</p>;
  }
```
바꾸기:
```tsx
  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">불러오는 중…</p>;
  if (!auth) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface py-10 text-center">
        <p className="text-sm text-unjong-muted">로그인하면 리딩방을 모아볼 수 있어요.</p>
        <Link href="/auth/login" className="mt-2 inline-block text-sm font-semibold text-unjong-accent">로그인 →</Link>
      </div>
    );
  }
  if (items.length === 0) {
    return <p className="rounded-2xl border border-unjong-border bg-unjong-surface py-10 text-center text-sm text-unjong-muted">리딩방·검증에서 ⭐를 누르면 여기 모여요.</p>;
  }
```

### (3-d) `Link` import 추가 (현재 파일에 next/link import 없음)
찾기:
```tsx
import { useEffect, useRef, useState } from 'react';
import { GripVertical, X, ExternalLink, Globe } from 'lucide-react';
```
바꾸기:
```tsx
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { GripVertical, X, ExternalLink, Globe } from 'lucide-react';
```

---

## 빌드 + 로컬 커밋 (푸시·배포 X)
```bash
pkill -f "next dev" 2>/dev/null; npm run build
git add components/layout/Footer.tsx app/mypage/page.tsx components/favorites/RoomFavoritesClient.tsx
git commit -m "polish(STEP 402): P2 묶음 — 푸터 서비스 링크·닉네임 저장 피드백·리딩방 즐겨찾기 비로그인 분기 통일"
```

## 확인 체크리스트
- [ ] `npm run build` 타입/빌드 통과.
- [ ] 푸터 "서비스" 컬럼에 "주식·상품"(→ `/`) + "서비스 소개"(→ `/about`) 두 줄 표시.
- [ ] 마이페이지 → 프로필 → 닉네임 변경 시 입력 아래에 "닉네임을 저장했어요."(성공) 또는 실패 메시지 표시. 입력을 다시 고치면 메시지 사라짐. 빈 닉네임이면 저장 안 됨(기존 가드 유지).
- [ ] 비로그인 상태로 `/favorites` 접속 시 "리딩방·검증" 섹션에도 관심종목·링크 섹션과 동일한 "로그인하세요" 카드 표시.
- [ ] 푸시·배포는 하지 않음(로컬 커밋까지만).

---

## 스킵/보류 (이번 STEP에서 처리하지 않음)

- **advisors 검색+플랫폼 동시 필터** — `app/api/advisors/route.ts`의 `else if (platform !== "all")`를 `if`로 바꿔 검색과 플랫폼을 AND할 수 있지만, `components/toolbox/AdvisorDirectory.tsx` UI가 의도적으로 둘을 **상호 배타**로 설계됨: 플랫폼 버튼 클릭이 `setQ('')`로 검색을 비우고(약 262행), 플랫폼 활성 하이라이트가 `platform === p && !searching`로 검색 중엔 꺼지며(264행), 플레이스홀더도 "리딩방명·업체명·대표자 **전체** 검색". API 한 줄만 바꾸면 UI 상태와 불일치가 생기고, 동시 필터를 제대로 살리려면 검색 중 플랫폼 유지/선택 가능하게 UX를 재설계해야 함(비자명·리스크). → **보류**.
- **뉴스 og 이미지 스크래핑 재작성** — 리스크 큼(외부 마크업 의존, 회귀 위험). → **보류**(지시상 제외).
- **admin 페이지네이션** — 변경 범위가 크고 데이터 누락 위험 대비 이득 낮음. → **보류**(지시상 제외).
