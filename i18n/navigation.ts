import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// 라우팅 설정을 인지하는 next/navigation 래퍼(710C에서 전면 스왑 완료).
// 내부 이동은 전부 여기서 import → /en 에서 눌러도 로케일이 유지된다.
// 단, useSearchParams·useParams·notFound는 로케일과 무관하므로 next/navigation 그대로 쓴다(여기서 안 내보냄).
const navigation = createNavigation(routing);

export const { Link, usePathname, useRouter, getPathname } = navigation;

// redirect만 따로 — 명시적 타입 주석이 있어야 TS가 "never 반환"으로 보고
// `if (!user) redirect(...)` 뒤에서 user를 non-null로 좁힌다.
// (구조분해로 받으면 추론 타입이라 좁혀주지 않아 admin/business 페이지가 TS18047로 깨진다.)
export const redirect: typeof navigation.redirect = navigation.redirect;
