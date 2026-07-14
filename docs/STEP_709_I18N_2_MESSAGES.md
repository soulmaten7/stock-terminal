<!-- 2026-07-14 -->
# STEP 709 — i18n 2/3단계: 문자열 이관 (1군 — 공유 크롬: Header·Footer)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**목표:** 하드코딩 한국어 문자열을 `messages/ko.json`으로 이관 시작. 첫 그룹 = **공유 크롬(Header·Footer)** — 패턴·네임스페이스 확립. **여전히 한국어·화면 0 변화.**
**전제:** STEP 708 완료(`d2620a8`, next-intl 기반 배선됨).

> 문자열 이관은 큰 작업이라 **그룹별로 쪼갠다.** 이번=크롬. 다음(709B~)=보드/렌즈·페이지들. 그 후 STEP 710=[locale] 라우팅+영어+시장 디폴트.

---

## 작업

### 1. 대상 파일 읽기
`components/layout/Header.tsx`, `components/layout/Footer.tsx`.

### 2. `messages/ko.json`에 네임스페이스 추가 (실제 문자열 **그대로**)
두 파일의 **사용자에게 보이는 한국어 문자열 전부**를 키로:
```json
{
  "Common": { "appName": "트릴리언" },
  "Header": {
    "tagline": "종목을 보는 눈을, 누구에게나",
    "stocks": "주식",
    "coin": "코인",
    "about": "소개",
    "comingSoon": "준비 중이에요",
    "language": "언어 선택",
    "favorites": "즐겨찾기",
    "login": "로그인",
    "mypage": "마이페이지",
    "adInquiry": "광고 문의",
    "logout": "로그아웃"
  },
  "Footer": {
    "...": "...(푸터의 모든 문자열)"
  }
}
```
> 키 이름은 자유(의미 기반). **값은 코드의 한국어와 오타·띄어쓰기까지 100% 동일**하게. 실제 Header/Footer에 있는 문자열을 빠짐없이(못 넣으면 다음 그룹으로 미루지 말고 이번에).

### 3. 컴포넌트에서 `useTranslations`로 교체
Header·Footer는 `'use client'`라 `NextIntlClientProvider`(708에서 루트 배선) 아래에서 훅 사용 가능:
```tsx
import {useTranslations} from 'next-intl';
// ...
const t = useTranslations('Header'); // Footer는 'Footer'
// 하드코딩 "주식" → {t('stocks')}
```
- **aria-label·title·placeholder** 같은 속성 문자열도 `t()`로.
- 단 브랜드 고유명사 **"Trillion"·"트릴리언"** 은 그대로(이관 불필요). 언어 메뉴의 "한국어/English" 같은 언어명도 그대로 둬도 됨(로케일명).
- 텍스트가 **한 글자도** 안 바뀌게.

### 4. 빌드 + 검증 (화면 0 변화)
```bash
npm run build
grep -rn 'MISSING_MESSAGE' .next 2>/dev/null | head   # 참고(런타임 에러는 렌더에서)
```
- 빌드 성공 + 렌더가 이전과 **100% 동일**(같은 한국어). 헤더·푸터 텍스트 그대로.

### 5. 커밋
```bash
git add -A && git commit -m "i18n(2/3·크롬): Header·Footer 문자열 → messages/ko.json + useTranslations (한국어 동일·화면 0 변화)" && git push
```

## 다음
- **709B:** 보드/렌즈(`ToolboxClient`·6개 보드·`LensPreview`·`StockLensClient`) 문자열 이관 — 공유 UI라 우선.
- 이후 페이지 그룹(about·terms·feedback 등).
- 그 후 **STEP 710(3/3, 집중 세션):** `app/[locale]` 라우팅 + `en.json` + 언어 스위처 + 로케일→기본 시장 매핑.
