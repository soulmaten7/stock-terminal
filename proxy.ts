import createMiddleware from 'next-intl/middleware';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
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
  const pathname = request.nextUrl.pathname;

  // ── 버그1(STEP 800 §1): 명시 선택 로케일 지속 ──
  // 프리픽스 없는(=ko로 해석될) 페이지 요청인데 명시 선택(NEXT_LOCALE 쿠키 — switchLocale에서만 심음)이 en이면 /en으로.
  // 이 쿠키는 URL 방문으론 안 바뀌므로(routing.ts localeCookie:false), 지인의 /en 링크가 지속 선택을 뒤집지 못한다.
  if (!skipsI18n(pathname)) {
    const chosen = request.cookies.get('NEXT_LOCALE')?.value;
    const hasEnPrefix = pathname === '/en' || pathname.startsWith('/en/');
    if (chosen === 'en' && !hasEnPrefix) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === '/' ? '/en' : `/en${pathname}`;
      return NextResponse.redirect(url);
    }
  }

  // ── 버그2(STEP 800 §2): Supabase 세션 갱신을 i18n 응답 생성 '전에' ──
  // getUser가 request.cookies를 리프레시 → 그 다음 handleI18nRouting/서버컴포넌트/라우트핸들러가 '갱신된' 토큰을 본다.
  // (예전엔 i18n 응답을 먼저 만들어 헤더 스냅샷이 옛 토큰으로 굳고 getUser는 나중에 돌아 → 만료 임박 요청에서 401.)
  const refreshed: { name: string; value: string; options: CookieOptions }[] = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // downstream(i18n·RSC·라우트핸들러)이 새 토큰을 보도록 request에 먼저 반영
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // 최종 응답에 병합할 Set-Cookie 목록으로 모아둔다(응답은 아직 생성 전)
          cookiesToSet.forEach(({ name, value, options }) => refreshed.push({ name, value, options }));
        },
      },
    }
  );
  // 세션 갱신(중요). 만료 토큰 리프레시 + request.cookies 갱신.
  await supabase.auth.getUser();

  // 갱신된 request로 i18n 응답 생성(리라이트 /about → /ko/about · skipsI18n 예외 보존)
  const response = skipsI18n(pathname)
    ? NextResponse.next({ request })
    : handleI18nRouting(request);

  // 갱신된 세션 쿠키를 최종 응답에 반영
  refreshed.forEach(({ name, value, options }) => response.cookies.set(name, value, options));

  return response;
}

export const config = {
  matcher: [
    // 정적 파일·이미지 제외한 모든 경로
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
