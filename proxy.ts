import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

// i18n 리라이트를 적용하면 안 되는 경로 = app/[locale] 아래로 옮기지 않은 것들.
// (여기에 걸리면 /ko/... 로 리라이트돼서 404가 난다)
//   - /api/*            라우트 핸들러
//   - /auth/callback    OAuth 콜백 라우트 핸들러 (구글에 등록된 고정 URL)
//   - /apple-icon       확장자 없는 메타데이터 이미지 라우트 (실제 href: /apple-icon?<hash>)
//   - /opengraph-image  동상
//   - 정적 파일 확장자   favicon.ico · icon.svg · robots.txt · sitemap.xml · og.png ...
const NON_PAGE = /^\/(?:api|auth\/callback|_next|_vercel|apple-icon|opengraph-image)(?:\/|$)/;

// ⚠️ next-intl 기본 예제의 "점(.)이 있으면 정적파일" 휴리스틱을 쓰면 안 된다.
// 종목 심볼에 점이 들어간다: /stock/7203.T(JP) · .HK · .SS · .VN · .L(GB) · BRK.B(US).
// 점 기준으로 거르면 KR·US 일부를 뺀 모든 해외 종목 페이지가 리라이트에서 빠져 404가 난다.
// → 실제 정적 파일 확장자만 명시적으로 제외한다.
const STATIC_FILE = /\.(?:ico|svg|png|jpg|jpeg|gif|webp|avif|txt|xml|json|webmanifest|css|js|map)$/i;

function skipsI18n(pathname: string): boolean {
  return NON_PAGE.test(pathname) || STATIC_FILE.test(pathname);
}

export async function proxy(request: NextRequest) {
  // 1) i18n 라우팅 먼저 — 리라이트(/about → /ko/about)와 로케일 쿠키가 담긴 응답을 만든다.
  //    페이지가 아닌 경로는 리라이트 없이 통과시킨다.
  const response = skipsI18n(request.nextUrl.pathname)
    ? NextResponse.next({ request })
    : handleI18nRouting(request);

  // 2) 그 응답에 Supabase 세션 갱신 쿠키를 얹는다(만료 토큰 리프레시 — 기존 동작 유지).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신(중요). 이 호출이 만료 토큰을 리프레시하고 쿠키를 응답에 다시 씀.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // 정적 파일·이미지 제외한 모든 경로
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
