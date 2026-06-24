<!-- 2026-06-24 -->
# STEP 389 — [P2 중복] 국가 상태 통합 (헤더 플래그 ↔ 게이트웨이 토글)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_389_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
국가 선택 상태가 **2개로 분리**돼 있음:
- `stores/countryStore.ts`(`useCountryStore`) — 헤더 🇰🇷/🇺🇸 플래그가 사용(388에서 TickerBar 삭제 후 **이거 읽는 곳이 헤더뿐 = 사실상 무동작**).
- `components/toolbox/ToolboxClient.tsx` — **로컬 `useState('KR')` + localStorage 'unjong_country'** (게이트웨이 한국/미국 토글 = 실제 동작).

→ **ToolboxClient도 `useCountryStore`를 쓰게 통합** + 스토어에 **persist**(새로고침 유지) 추가. 그러면 헤더 플래그와 게이트웨이 토글이 **하나의 상태로 동기화**됨.

변경 2파일: `stores/countryStore.ts`, `components/toolbox/ToolboxClient.tsx`.

---

## ① `stores/countryStore.ts` — persist 추가 (전체 교체)
**찾기:**
```ts
import { create } from 'zustand';

export type Country = 'KR' | 'US';

interface CountryState {
  country: Country;
  setCountry: (country: Country) => void;
}

export const useCountryStore = create<CountryState>((set) => ({
  country: 'KR',
  setCountry: (country) => set({ country }),
}));
```
**바꾸기:**
```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Country = 'KR' | 'US';

interface CountryState {
  country: Country;
  setCountry: (country: Country) => void;
}

export const useCountryStore = create<CountryState>()(
  persist(
    (set) => ({
      country: 'KR',
      setCountry: (country) => set({ country }),
    }),
    { name: 'trillion-country' }
  )
);
```

## ② `components/toolbox/ToolboxClient.tsx`

**②-A 임포트 추가** — 찾기:
```tsx
import OfferingsFeed from './OfferingsFeed';
```
바꾸기:
```tsx
import OfferingsFeed from './OfferingsFeed';
import { useCountryStore, type Country } from '@/stores/countryStore';
```

**②-B COUNTRIES 타입** — 찾기:
```tsx
const COUNTRIES = [
  { code: 'KR', label: '🇰🇷 한국' },
  { code: 'US', label: '🇺🇸 미국' },
];
```
바꾸기:
```tsx
const COUNTRIES: { code: Country; label: string }[] = [
  { code: 'KR', label: '🇰🇷 한국' },
  { code: 'US', label: '🇺🇸 미국' },
];
```

**②-C 로컬 상태 → 스토어** — 찾기:
```tsx
  const [country, setCountry] = useState('KR');
```
바꾸기:
```tsx
  const { country, setCountry } = useCountryStore();
```

**②-D useEffect에서 국가 localStorage 제거(탭은 유지)** — 찾기:
```tsx
  // 새로고침해도 마지막 탭/국가 유지
  useEffect(() => {
    const t = localStorage.getItem('unjong_tab');
    if (t && TAB_ORDER.includes(t)) setActiveTab(t);
    const c = localStorage.getItem('unjong_country');
    if (c === 'KR' || c === 'US') setCountry(c);
  }, []);
  useEffect(() => { localStorage.setItem('unjong_tab', activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem('unjong_country', country); }, [country]);
```
바꾸기:
```tsx
  // 새로고침해도 마지막 탭 유지 (국가는 useCountryStore persist가 담당)
  useEffect(() => {
    const t = localStorage.getItem('unjong_tab');
    if (t && TAB_ORDER.includes(t)) setActiveTab(t);
  }, []);
  useEffect(() => { localStorage.setItem('unjong_tab', activeTab); }, [activeTab]);
```

---

## ✅ 빌드 검증
```bash
cd ~/stock-terminal && npm run build
```
- ✅ 무에러 → 다음. (zustand persist·Country 타입 확인.)
- ❌ 에러 → 메시지 출력 후 멈춤.

## ✅ 런타임 (컴포넌트만 → 새로고침)
1. 홈 게이트웨이 **한국/미국 토글** 정상 동작(미국=준비중 플레이스홀더).
2. **헤더 🇰🇷/🇺🇸 플래그**를 바꾸면 게이트웨이 토글도 같이 바뀜(동기화), 반대도.
3. 국가 선택 후 새로고침 → 유지.

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add -A && git commit -m "refactor(state): 국가 상태 useCountryStore로 통합 + persist — 헤더 플래그↔게이트웨이 동기화 (STEP 389)" && git push
```

---

> **한 줄 요약**: 분리됐던 국가 상태 2개 → `useCountryStore` 하나로 통합 + persist. 헤더 플래그와 게이트웨이 토글 동기화.
