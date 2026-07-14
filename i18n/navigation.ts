import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// 라우팅 설정을 인지하는 next/navigation 래퍼.
// ko 단독 + as-needed인 지금은 기존 next/link와 동작이 같아서 전면 교체하지 않는다(710B/C에서 스왑).
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
