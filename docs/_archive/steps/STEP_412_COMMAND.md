<!-- 2026-06-25 -->
# STEP 412 — 헤더를 언어 선택기로 (시장 선택과 분리)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_412_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
헤더 우측 국기 버튼은 지금 `useCountryStore`를 써서 **시장(한국/미국)** 을 바꾼다(페이지 토글과 동기화). 이를 **언어 선택기**(한국어 🇰🇷 / English 🇺🇸)로 교체하고 **시장과 분리**한다. 시장 선택은 페이지의 한국/미국 토글이 그대로 담당. 영어 번역은 아직 없으므로 English는 "준비 중"(비활성).

## 전제
- 최신 main. 배포 X(배치). 컴포넌트 1개(`components/layout/Header.tsx`)만 변경 → HMR 반영.
- `useCountryStore`는 페이지(게이트웨이) 한국/미국 토글에서 계속 사용 — Header에서만 분리.

---

## `components/layout/Header.tsx` — 5곳 수정

### (1) useCountryStore import 제거
찾기:
```tsx
import { useCountryStore, type Country } from '@/stores/countryStore';
import { createClient } from '@/lib/supabase/client';
```
바꾸기:
```tsx
import { createClient } from '@/lib/supabase/client';
```

### (2) COUNTRIES → LANGS
찾기:
```tsx
const COUNTRIES: { code: Country; name: string; flag: string }[] = [
  { code: 'KR', name: '한국', flag: '🇰🇷' },
  { code: 'US', name: '미국', flag: '🇺🇸' },
];
```
바꾸기:
```tsx
// 헤더 = 언어 선택(시장 선택 아님 — 시장은 페이지의 한국/미국 토글이 담당).
const LANGS: { code: 'ko' | 'en'; name: string; flag: string; ready: boolean }[] = [
  { code: 'ko', name: '한국어', flag: '🇰🇷', ready: true },
  { code: 'en', name: 'English', flag: '🇺🇸', ready: false }, // 영어 번역 준비 중(i18n)
];
```

### (3) 상태 — country → lang
찾기:
```tsx
  const { country, setCountry } = useCountryStore();
  const [countryOpen, setCountryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const currentCountry = COUNTRIES.find((c) => c.code === country)!;
```
바꾸기:
```tsx
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const currentLang = LANGS[0]; // 현재 한국어(번역 추가 전까지 고정 표시)
```

### (4) 바깥 클릭 핸들러 — countryRef → langRef
찾기:
```tsx
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setCountryOpen(false);
```
바꾸기:
```tsx
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
```

### (5) 국가 선택기 JSX → 언어 선택기
찾기:
```tsx
          <div ref={countryRef} className="relative">
            <button type="button" onClick={() => setCountryOpen(!countryOpen)} className="p-1 text-base transition-opacity hover:opacity-70" aria-label="국가 선택" title={currentCountry.name}>
              {currentCountry.flag}
            </button>
            {countryOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 min-w-[140px] overflow-hidden border border-unjong-border bg-unjong-surface shadow-lg">
                {COUNTRIES.map((c) => (
                  <button key={c.code} onClick={() => { setCountry(c.code); setCountryOpen(false); }} className={`flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-unjong-background ${country === c.code ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`}>
                    <span className="text-lg">{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
```
바꾸기:
```tsx
          {/* 언어 선택 (시장 선택 아님 — 시장은 페이지의 한국/미국 토글) */}
          <div ref={langRef} className="relative">
            <button type="button" onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-1.5 p-1 text-sm text-white/80 transition-opacity hover:opacity-70" aria-label="언어 선택" title="언어 선택">
              <span className="hidden font-medium sm:inline">{currentLang.name}</span>
              <span className="text-base">{currentLang.flag}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 min-w-[170px] overflow-hidden border border-unjong-border bg-unjong-surface shadow-lg">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLangOpen(false)}
                    disabled={!l.ready}
                    className={`flex w-full items-center gap-2 px-4 py-3 text-sm ${
                      l.ready
                        ? `hover:bg-unjong-background ${l.code === currentLang.code ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`
                        : 'cursor-not-allowed text-unjong-muted'
                    }`}
                  >
                    <span>{l.name}</span>
                    <span className="text-base">{l.flag}</span>
                    {!l.ready && <span className="ml-auto text-[11px] text-unjong-muted">준비 중</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
```

## 빌드 + 로컬 커밋 (푸시·배포 X)
```bash
pkill -f "next dev" 2>/dev/null; npm run build
git add components/layout/Header.tsx
git commit -m "feat(STEP 412): 헤더를 언어 선택기로 — 시장(한국/미국 토글)과 분리, 한국어/English(준비중)"
```

## 확인
- 헤더 우측에 **"한국어 🇰🇷"**(모바일은 🇰🇷만) 표시. 드롭다운 = 한국어 🇰🇷(활성) + English 🇺🇸(준비 중·비활성).
- **페이지 한국/미국 시장 토글을 바꿔도 헤더는 "한국어 🇰🇷" 그대로.**
- 페이지 한국/미국 토글은 정상(시장 데이터 전환) — `useCountryStore` 그대로 사용.

## 스킵/보류
- 영어 실제 전환(전체 UI i18n 번역) — 별도 작업. 지금은 English "준비 중" 표시만.
