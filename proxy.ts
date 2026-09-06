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

// ── 2026-09-06(채팅 지시): 첫 방문 자동 언어 감지 ──
// routing.ts는 여전히 localeDetection:false(next-intl 자체 감지 끔) — 자동감지는 이 파일이
// 직접, 아래 규칙으로만 한다: ①명시 선택(locale_choice)이 최우선 ②그것도 없을 때만, 이미
// 자동감지를 해본 적이 있는지(locale_auto 쿠키)를 보고 없으면 **딱 한 번만** Accept-Language를
// 본다 ③봇에는 절대 적용하지 않는다(크롤러가 리다이렉트에 갇히면 안 됨 — 기본 ko 그대로 크롤).
const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|embedly|quora link preview|vkshare|pinterest|linkedinbot|redditbot|applebot|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot|bytespider|yeti|daumoa/i;

function isBot(userAgent: string | null): boolean {
  return !!userAgent && BOT_UA.test(userAgent);
}

// "en-US,en;q=0.9,ko;q=0.8" → q값 내림차순 정렬 후 ko/en 중 먼저 나오는 쪽. 헤더가 없거나
// 둘 다 없으면 기본값 ko(KR 우선 제품 — routing.ts defaultLocale과 동일한 안전한 폴백).
function detectLocaleFromAcceptLanguage(header: string | null): 'ko' | 'en' {
  if (!header) return 'ko';
  const entries = header
    .split(',')
    .map((part) => {
      const [langPart, qPart] = part.trim().split(';q=');
      const q = qPart ? parseFloat(qPart) : 1;
      const primary = langPart.trim().split('-')[0].toLowerCase();
      return { primary, q: Number.isNaN(q) ? 1 : q };
    })
    .sort((a, b) => b.q - a.q);
  for (const { primary } of entries) {
    if (primary === 'en') return 'en';
    if (primary === 'ko') return 'ko';
  }
  return 'ko';
}

const LOCALE_AUTO_COOKIE = 'locale_auto';
const LOCALE_AUTO_MAX_AGE = 60 * 60 * 24 * 365; // 1년 — locale_choice(Header.switchLocale)와 동일 수명

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── STEP 806 §5: 레거시 NEXT_LOCALE 쿠키 마이그레이션 ──
  // 800 이전엔 next-intl이 URL 방문마다 NEXT_LOCALE을 덮어썼다 → /en을 한 번 밟은 한국 사용자는 쿠키가 en으로 굳어
  //   프리픽스 없는 경로가 영구 /en으로 리다이렉트됐다. 새 키(locale_choice·명시 선택만 심음)로 갈아타고 레거시는 읽지 않고 삭제한다.
  const hasLegacy = request.cookies.has('NEXT_LOCALE');
  const clearLegacy = (res: NextResponse) => {
    if (hasLegacy) res.cookies.set('NEXT_LOCALE', '', { maxAge: 0, path: '/' });
    return res;
  };

  // locale_auto 쿠키 값 — 자동감지를 새로 했으면 여기 담아서, 이 함수 끝에서 만드는
  // '최종 응답'(조기 리다이렉트든 handleI18nRouting 결과든) 어디에 실려 나가든 항상 반영되게 한다.
  let pendingAutoCookie: 'ko' | 'en' | null = null;
  const applyAutoCookie = (res: NextResponse) => {
    if (pendingAutoCookie) {
      res.cookies.set(LOCALE_AUTO_COOKIE, pendingAutoCookie, {
        maxAge: LOCALE_AUTO_MAX_AGE,
        path: '/',
        sameSite: 'lax',
        secure: request.nextUrl.protocol === 'https:',
      });
    }
    return res;
  };

  // 명시 선택(locale_choice — Header.switchLocale에서만 심음)이 en이면 프리픽스 없는 요청을 /en으로.
  // URL 방문으론 안 바뀌므로(routing.ts localeCookie:false) 지인의 /en 링크가 지속 선택을 뒤집지 못한다. 레거시 NEXT_LOCALE은 무시.
  //
  // 2026-09-06: 명시 선택이 없을 때만 자동감지가 끼어든다 — locale_auto 쿠키가 이미 있으면(과거에
  // 한 번 감지했다는 뜻) 그 값을 그대로 쓰고 다시 감지하지 않는다. 둘 다 없는 **진짜 첫 방문**에만,
  // 봇이 아닌 경우에 한해 Accept-Language를 딱 한 번 보고 결과를 locale_auto에 못박는다.
  if (!skipsI18n(pathname)) {
    const hasEnPrefix = pathname === '/en' || pathname.startsWith('/en/');
    const chosen = request.cookies.get('locale_choice')?.value;
    let effective: string | undefined = chosen;

    if (!effective) {
      const autoSeen = request.cookies.get(LOCALE_AUTO_COOKIE)?.value;
      if (autoSeen) {
        effective = autoSeen;
      } else if (!isBot(request.headers.get('user-agent'))) {
        const detected = detectLocaleFromAcceptLanguage(request.headers.get('accept-language'));
        pendingAutoCookie = detected; // 첫 감지 결과를 이번 응답에 못박는다(재감지 방지)
        effective = detected;
      }
      // 봇이면 effective는 그대로 undefined — 리다이렉트도, 쿠키 기록도 하지 않는다(항상 기본 ko로 크롤).
    }

    if (effective === 'en' && !hasEnPrefix) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === '/' ? '/en' : `/en${pathname}`;
      return applyAutoCookie(clearLegacy(NextResponse.redirect(url)));
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

  return applyAutoCookie(clearLegacy(response)); // 레거시 NEXT_LOCALE 삭제(§5) + 자동감지 결과 못박기
}

export const config = {
  matcher: [
    // 정적 파일·이미지 제외한 모든 경로
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
