<!-- 2026-06-23 -->
# STEP 366 — [출시준비] robots + sitemap + 브랜드 404

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_366_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
배포 후 구글 검색에 잡히고, 잘못된 주소도 브랜드 페이지로:
- **robots.txt** — 크롤 허용(+ `/admin`·`/mypage`·`/auth` 색인 차단) + sitemap 위치.
- **sitemap.xml** — 공개 페이지 목록(홈·코인·소개·약관·개인정보).
- **404(not-found)** — 기본 Next 404 대신 브랜드 페이지 + 홈 버튼.

> 모두 `onetrillion.app` 기준(STEP 364 metadataBase와 동일 env). 신규 3파일.
> ⚠️ robots·sitemap은 생성 라우트라 dev 서버 클린 재시작 권장.

---

## 📄 1) 신규 `app/robots.ts`

```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onetrillion.app';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/mypage', '/auth'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
```

---

## 📄 2) 신규 `app/sitemap.ts`

```ts
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onetrillion.app';
  const now = new Date();
  const routes: { path: string; priority: number; freq: 'daily' | 'weekly' | 'monthly' }[] = [
    { path: '', priority: 1, freq: 'daily' },
    { path: '/coin', priority: 0.6, freq: 'weekly' },
    { path: '/about', priority: 0.5, freq: 'monthly' },
    { path: '/terms', priority: 0.3, freq: 'monthly' },
    { path: '/privacy', priority: 0.3, freq: 'monthly' },
  ];
  return routes.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }));
}
```

---

## 📄 3) 신규 `app/not-found.tsx`

```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="text-5xl font-bold text-unjong-primary">404</p>
      <p className="mt-3 text-lg font-semibold text-unjong-primary">페이지를 찾을 수 없어요</p>
      <p className="mt-2 text-sm leading-relaxed text-unjong-muted">주소가 바뀌었거나 삭제된 페이지일 수 있어요.<br />홈에서 다시 찾아보세요.</p>
      <Link href="/" className="mt-6 rounded-lg bg-unjong-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">홈으로</Link>
    </div>
  );
}
```

---

## ✅ 검증 (생성 라우트 → 클린 재시작 권장)
```bash
npm run build
```
빌드 무에러.

dev 서버 클린 재시작:
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```
브라우저:
1. `localhost:3333/robots.txt` → `Allow: /` + `Disallow: /admin …` + `Sitemap: https://onetrillion.app/sitemap.xml`.
2. `localhost:3333/sitemap.xml` → 홈·코인·소개·약관·개인정보 URL 목록(onetrillion.app 기준).
3. 아무 없는 주소 `localhost:3333/zzz` → **브랜드 404**(404 + "페이지를 찾을 수 없어요" + 홈으로 버튼). ⚠️ `/market` 같은 옛 라우트는 404 아니라 홈 리다이렉트(STEP 362)라 정상.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/robots.ts app/sitemap.ts app/not-found.tsx && git commit -m "feat(launch): robots + sitemap + 브랜드 404 (onetrillion.app) (STEP 366)" && git push
```

---

> **한 줄 요약**: robots·sitemap(검색 색인) + 브랜드 404. onetrillion.app 기준. 생성 라우트라 클린 재시작 권장.
