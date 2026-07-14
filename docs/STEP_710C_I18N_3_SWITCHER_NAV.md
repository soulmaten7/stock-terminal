<!-- 2026-07-14 -->
# STEP 710C — i18n 3/3단계 (c: 언어 스위처 + 내부 링크 로케일 유지)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(내부 링크 대량 스왑 = 이번 최대 리스크. next-intl navigation API 버전 대조 필요. `/clear` 후 시작.)
**목표:** 영어를 "쓸 수 있게" — 헤더 **언어 스위처(한국어⇄English)** + 내부 링크/네비게이션을 `@/i18n/navigation`으로 스왑해 **`/en`에서 이동해도 로케일 유지**. **시장 디폴트·metadata·youtube 수정은 710D**(이번 X).
**전제:** STEP 710B 완료(`c8a69b5`).

---

## ⚠️ 최대 리스크 = 내부 링크 스왑 (여기만 조심하면 됨)
지금은 대부분 `next/link`·`next/navigation`을 씀 → `/en`에서 `href="/about"` 누르면 **한국어로 떨어짐**(로케일 소실). next-intl의 navigation으로 바꿔야 로케일이 붙어감. 단, **무엇을 바꾸고 무엇을 두는지 정확히**:

**바꾼다 → `@/i18n/navigation`에서 import:**
- `import Link from 'next/link'` → `import { Link } from '@/i18n/navigation'`
- `next/navigation`의 `useRouter` · `usePathname` · `redirect` · `getPathname` → `@/i18n/navigation` 버전으로.

**절대 그대로 둔다(로케일 무관):**
- `next/navigation`의 `useSearchParams` · `useParams` · `notFound` 등은 **navigation.ts가 안 내보냄** → `next/navigation` 그대로.
- 외부 링크 `<a href="https://…">` · `mailto:` 등은 **손대지 말 것**.

**⚠️ 스왑하며 깨지기 쉬운 곳:**
- `usePathname()`(next-intl 버전)은 **로케일 프리픽스가 벗겨진** 경로 반환(`/en/about`→`/about`). 활성 탭 하이라이트 등 pathname 비교 로직은 대개 그대로 맞지만 **전부 재확인**(active nav, breadcrumb).
- `router.push/replace`가 **쿼리스트링·동적 경로**를 넘기는 곳: navigation router 시그니처(`push(pathname, {locale})` 또는 `{pathname, query}`)에 맞는지 확인. 쿼리 유실 없게.
- 먼저 공식 문서로 `createNavigation`이 실제 내보내는 것과 `router.replace(pathname, { locale })` 시그니처 확인 후 적용.

## 언어 스위처 (헤더)
- 위치: 헤더(데스크톱 + 모바일 메뉴 둘 다 접근 가능). 미니멀하게 **KO / EN** 또는 **한국어 / English** 토글.
- 동작: 현재 페이지 그대로 로케일만 전환 — `const pathname = usePathname()`(로케일 벗겨진) → `router.replace(pathname, { locale: next })`. 쿼리 있으면 보존.
- 라벨은 **각 언어 고유 표기로 하드코딩**("한국어"·"English") — `t()`로 감싸지 말 것(언어명은 항상 자기 언어로 표기).
- `as-needed`라 ko 선택 시 프리픽스 없음(`/about`), en 선택 시 `/en/about`. 정상.

## 제외 (710D로)
- en→US 시장 탭 디폴트 정렬 · `generateMetadata`(title/OG 로컬라이즈)·JSON-LD · youtube `만` 나눗셈 로케일화. **이번엔 건드리지 말 것.**

## 작업 순서
1. `/clear` 후 시작. next-intl navigation 공식 문서 + `i18n/navigation.ts` 실제 export 확인.
2. `grep -rn "from 'next/link'\\|from \"next/link\"" app components` / `grep -rn "next/navigation" app components` 로 전 사용처 파악.
3. 규칙대로 스왑(Link / useRouter / usePathname / redirect만, useSearchParams·notFound·외부링크 제외).
4. 헤더에 언어 스위처 추가.
5. 빌드+검증(양쪽 로케일 전수):
   - `npm run build` + tsc 0 + vitest.
   - dev(3333) **ko**: `/`에서 여기저기 클릭 → URL에 `/ko` 안 붙고 한국어, 활성 탭/검색/페이지네이션/쿼리 정상.
   - dev(3333) **en**: `/en`에서 여기저기 클릭 → **`/en` 프리픽스 유지**, 영어, 동일 인터랙션 정상.
   - 스위처: 한↔영 전환 시 **같은 페이지 유지**(쿼리 포함), 헤더/보드/렌즈/정보탭 다 확인. `IntlError`·MISSING 0.
6. 커밋:
```bash
git add -A && git commit -m "i18n(3/3c): 헤더 언어 스위처 + 내부 네비게이션 @/i18n/navigation 스왑 (로케일 유지·useSearchParams/외부링크 제외·양쪽 전수 검증)" && git push
```

## ⚠️ 실패 시
링크 스왑은 넓게 퍼져서 한 곳만 틀려도 이동이 샘. 이상하면 **바로 롤백**(`git reset --hard c8a69b5`) 후 좁혀서 재시도. 반쯤 스왑된 상태로 두지 말 것.

## 다음 = 710D (i18n 완결)
en→US 시장 탭 디폴트 정렬 + `generateMetadata`/JSON-LD 로케일화 + youtube 조회수 로케일 나눗셈(만↔K/M). 이거까지면 i18n 3/3 종료 → 세션 닫으며 문서 4개 동기화(Cowork).
