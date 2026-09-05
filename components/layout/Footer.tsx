import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';

export default function Footer() {
  const t = useTranslations('Footer');
  const locale = useLocale();
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#0E1116]">
      {/* PC 레이아웃 정렬(2026-09-05): 배경은 <footer>가 전폭, 안쪽 내용은 본문(PageShell 등)과
          같은 max-w-[1040px]로 감싸 링크·각주 좌우 끝이 본문 좌우 끝과 맞도록 한다. */}
      <div className="mx-auto max-w-[1040px] px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-4 sm:gap-8 md:grid-cols-4">
          {/* 브랜드 */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-lg font-bold text-white">
              EarthTicker {locale === 'ko' && <span className="text-sm font-medium text-white/65">어스티커</span>}
            </p>
            <p className="mt-2 text-sm text-white/70">{t('tagline')}</p>
            {/* ORDER_트릴리언채널카드_0905 STEP2: 홈 카드와 별개로 상시 접근 가능한 텍스트 링크 */}
            <p className="mt-3 text-sm text-white/70">
              {t('channelsLabel')}{' '}
              <a href="https://www.youtube.com/channel/UC81WH6o_AKDN2NVqBSs3mlg" target="_blank" rel="noopener noreferrer" className="text-white/80 transition-colors hover:text-[#FFD65A]">스톡스카우터</a>
              {' · '}
              <a href="https://www.youtube.com/channel/UC0BirFox7u4vg2iMMwBZZ-Q" target="_blank" rel="noopener noreferrer" className="text-white/80 transition-colors hover:text-[#FFD65A]">WeTheTicker</a>
            </p>
          </div>

          {/* 서비스 — 2026-09-05(ORDER_트릴리언모델잔재정리_0905): /explore(탐색) 폐지로 링크 제거 */}
          <div>
            <h4 className="mb-4 font-bold text-white">{t('serviceHeading')}</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-white/80 transition-colors hover:text-[#FFD65A]">{t('aboutService')}</Link></li>
            </ul>
          </div>

          {/* 약관·정책 */}
          <div>
            <h4 className="mb-4 font-bold text-white">{t('legalHeading')}</h4>
            <ul className="space-y-2">
              <li><Link href="/terms" className="text-sm text-white/80 transition-colors hover:text-[#FFD65A]">{t('terms')}</Link></li>
              <li><Link href="/privacy" className="text-sm text-white/80 transition-colors hover:text-[#FFD65A]">{t('privacy')}</Link></li>
            </ul>
          </div>

          {/* 문의 */}
          <div>
            <h4 className="mb-4 font-bold text-white">{t('contactHeading')}</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link href="/advertise" className="transition-colors hover:text-[#FFD65A]">{t('adInquiry')}</Link></li>
              <li>{t('emailLabel')}<a href="mailto:contact@earthticker.app" className="transition-colors hover:text-[#FFD65A]">contact@earthticker.app</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-white/10 bg-[#15191F]">
        <div className="mx-auto max-w-[1040px] px-4 py-6 sm:px-6">
          <p className="mb-6 text-sm leading-relaxed text-white/80">
            {t('disclaimer1')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-2 text-center text-sm text-white/70">
            <span>&copy; 2026 EarthTicker. All rights reserved.</span>
            <Link href="/admin/login" className="text-white/65 transition-colors hover:text-white/80">{t('admin')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
