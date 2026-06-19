<!-- 2026-06-19 -->
# STEP 283 — [V7 ②-b] 세로 리스트 + 폭 통일(max-w-7xl) + 종목검색 제거

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_283_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 282. 빌드 ✓.
- **설계 근거**: `docs/PRODUCT_SPEC_V7.md`. V7 ② 마무리(레이아웃).

---

## 🎯 목표

1. 카테고리 내용 = **증권사처럼 세로 단일 컬럼** (모바일 반응형에 유리).
2. **폭 통일 max-w-7xl** — 본문·헤더·푸터 안쪽을 같은 max-width로 가운데 정렬(배경 바는 풀폭).
3. 헤더 **종목 검색 박스 제거** (V7엔 종목 상세/랭킹 없음 → 갈 곳 없는 기능).

---

## 📄 파일 1 — `components/toolbox/ToolboxClient.tsx` (카테고리 = 세로 리스트)

**찾기:**
```tsx
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {catLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                isLoggedIn={isLoggedIn}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
```
**바꾸기:**
```tsx
          <div className="space-y-1">
            {catLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                isLoggedIn={isLoggedIn}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
```

---

## 📄 파일 2 — `app/page.tsx` (본문 폭 max-w-7xl)

**찾기:** `    <div className="mx-auto max-w-5xl px-6 py-6">`
**바꾸기:** `    <div className="mx-auto max-w-7xl px-6 py-6">`

---

## 📄 파일 3 — `components/layout/Header.tsx` (폭통일 + 검색 제거)

### (3-A) HeaderSearch import 제거
**찾기:**
```tsx
import { HeaderSearch } from '@/components/header/HeaderSearch';
import { useHomeReset } from '@/stores/homeResetStore';
```
**바꾸기:**
```tsx
import { useHomeReset } from '@/stores/homeResetStore';
```

### (3-B) 헤더 안쪽 가운데 정렬(max-w-7xl)
**찾기:** `      <div className="px-6 h-[60px] flex items-center gap-5">`
**바꾸기:** `      <div className="mx-auto max-w-7xl px-6 h-[60px] flex items-center gap-5">`

### (3-C) 종목검색 박스 → 빈 스페이서(우측 아이콘 오른쪽 정렬 유지)
**찾기:**
```tsx
        {/* ── 검색 (남은 폭 전부 채움 → 우측 아이콘 오른쪽 정렬) ── */}
        <div className="flex-1 min-w-0">
          <HeaderSearch />
        </div>
```
**바꾸기:**
```tsx
        {/* ── 남은 폭 (우측 아이콘 오른쪽 정렬) ── */}
        <div className="flex-1" />
```

---

## 📄 파일 4 (전체 교체) — `components/layout/Footer.tsx` (폭통일 max-w-7xl, 옛 사이드바미러 제거)

```tsx
import Link from 'next/link';

const FOOTER_SECTIONS = [
  {
    title: '서비스 안내',
    links: [
      { label: '서비스 소개', href: '/about' },
      { label: '이용가이드', href: '/guide' },
      { label: '자주 묻는 질문', href: '/faq' },
      { label: '공지사항', href: '/notice' },
    ],
  },
  {
    title: '약관/정책',
    links: [
      { label: '이용약관', href: '/terms' },
      { label: '개인정보처리방침', href: '/privacy' },
      { label: '광고 게재 약관', href: '/ad-terms' },
      { label: '환불 정책', href: '/refund-policy' },
    ],
  },
  {
    title: '광고/제휴',
    links: [
      { label: '광고 문의', href: 'mailto:ad@stockterminal.com' },
      { label: '제휴 문의', href: 'mailto:partner@stockterminal.com' },
      { label: '데이터 제공 문의', href: 'mailto:data@stockterminal.com' },
      { label: '미디어/언론 문의', href: 'mailto:press@stockterminal.com' },
    ],
  },
  {
    title: '고객지원',
    items: [
      '이메일: support@stockterminal.com',
      '카카오톡: @운종',
      '운영시간: 평일 09:00 ~ 18:00',
      '문의 응답: 영업일 기준 1~2일 이내',
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#0ABAB5] border-t border-[#088F8C] mt-auto">
      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="mb-4 font-bold text-white">{section.title}</h4>
              <ul className="space-y-2">
                {'links' in section && section.links
                  ? section.links.map((link) => (
                      <li key={link.label}>
                        <Link href={link.href} className="text-sm text-white transition-colors hover:text-[#C9A96E]">
                          {link.label}
                        </Link>
                      </li>
                    ))
                  : section.items?.map((item) => (
                      <li key={item} className="text-sm text-white">
                        {item}
                      </li>
                    ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-[#088F8C] bg-[#088F8C]">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <p className="mb-3 text-sm leading-relaxed text-white">
            본 사이트는 공개된 금융 데이터를 정리하여 제공하며, 투자 권유 또는 투자 자문이 아닙니다.
            모든 투자 판단과 그에 따른 결과의 책임은 투자자 본인에게 있습니다.
            본 사이트에서 제공하는 정보의 정확성, 완전성을 보장하지 않으며, 이를 기반으로 한 투자 손실에 대해 어떠한 책임도 지지 않습니다.
          </p>
          <p className="mb-6 text-sm leading-relaxed text-white">
            광고 배너는 광고주가 직접 등록한 것이며, 본 사이트는 광고 내용에 대한 책임을 지지 않습니다.
            인증업체 마크는 사업자등록 확인을 의미하며, 상품의 품질이나 수익을 보증하지 않습니다.
          </p>
          <div className="space-y-1 text-sm text-white">
            <p>상호명: [추후 입력] | 대표자: [추후 입력] | 사업자등록번호: [추후 입력]</p>
            <p>통신판매업 신고번호: [추후 입력] | 주소: [추후 입력]</p>
          </div>
          <div className="mt-6 border-t border-[#077D7A] pt-4 text-center text-sm text-white">
            &copy; 2026 운종. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러 (HeaderSearch 미사용 import 없는지 확인).

개발 서버(`npm run dev`, 포트 3333):
1. 카테고리 탭 클릭 → 링크가 **세로로 한 줄씩** 쭉.
2. **헤더·본문·푸터 폭이 같게(max-w-7xl) 가운데 정렬** — 어긋남 없는지.
3. 헤더에 **종목 검색 박스 사라짐** (로고·주식/코인·우측 아이콘만).

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 카테고리 세로리스트 + 폭통일 max-w-7xl(헤더·본문·푸터) + 종목검색 제거 (V7 ②-b, STEP 283)" && git push
```

---

> **한 줄 요약**: 카테고리를 세로 단일컬럼으로, 헤더·본문·푸터를 max-w-7xl로 폭 통일, V7에서 쓸모없어진 종목 검색 박스 제거.
