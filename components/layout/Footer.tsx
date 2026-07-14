import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';

export default function Footer() {
  const t = useTranslations('Footer');
  const locale = useLocale();
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#0E1116]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-4 sm:gap-8 md:grid-cols-4">
          {/* 브랜드 */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-lg font-bold text-white">
              Trillion {locale === 'ko' && <span className="text-sm font-medium text-white/45">트릴리언</span>}
            </p>
            <p className="mt-2 text-sm text-white/70">{t('tagline')}</p>
          </div>

          {/* 서비스 */}
          <div>
            <h4 className="mb-4 font-bold text-white">{t('serviceHeading')}</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-white/80 transition-colors hover:text-[#2DD4BF]">{t('stocksProducts')}</Link></li>
              <li><Link href="/about" className="text-sm text-white/80 transition-colors hover:text-[#2DD4BF]">{t('aboutService')}</Link></li>
            </ul>
          </div>

          {/* 약관·정책 */}
          <div>
            <h4 className="mb-4 font-bold text-white">{t('legalHeading')}</h4>
            <ul className="space-y-2">
              <li><Link href="/terms" className="text-sm text-white/80 transition-colors hover:text-[#2DD4BF]">{t('terms')}</Link></li>
              <li><Link href="/privacy" className="text-sm text-white/80 transition-colors hover:text-[#2DD4BF]">{t('privacy')}</Link></li>
            </ul>
          </div>

          {/* 문의 */}
          <div>
            <h4 className="mb-4 font-bold text-white">{t('contactHeading')}</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link href="/advertise" className="transition-colors hover:text-[#2DD4BF]">{t('adInquiry')}</Link></li>
              <li>{t('emailLabel')}<a href="mailto:contact@onetrillion.app" className="transition-colors hover:text-[#2DD4BF]">contact@onetrillion.app</a></li>
              <li>{t('hoursLabel')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-white/10 bg-[#15191F]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <p className="mb-3 text-sm leading-relaxed text-white/80">
            {t('disclaimer1')}
          </p>
          <p className="mb-6 text-sm leading-relaxed text-white/80">
            {t('disclaimer2')}
          </p>
          <div className="text-sm text-white/60">
            <p>{t('businessInfo')}</p>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-white/10 pt-4 text-center text-sm text-white/70">
            <span>&copy; 2026 Trillion. All rights reserved.</span>
            <Link href="/admin/login" className="text-white/40 transition-colors hover:text-white/70">{t('admin')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
