import HomeClient from '@/components/home/HomeClient';

export const metadata = {
  title: 'V3 대시보드 (보존)',
  description: '기존 V3 5섹션 대시보드. 운종 3창으로 진화하기 전 버전 보존.',
};

export default function DashboardPage() {
  return (
    <>
      <div className="rounded-lg border-2 border-dashed border-unjong-accent bg-unjong-surface p-4 mb-6 mx-2 mt-2">
        <p className="text-sm font-semibold text-unjong-primary">
          📦 V3 대시보드 (보존 페이지)
        </p>
        <p className="text-xs text-unjong-muted mt-1">
          운종이 3창 구조로 진화했어요. 새 메인은{' '}
          <a href="/scalper" className="text-unjong-accent underline font-medium">
            단타창
          </a>{' '}
          ·{' '}
          <a href="/longterm" className="text-unjong-accent underline font-medium">
            장타창
          </a>{' '}
          ·{' '}
          <a href="/us" className="text-unjong-accent underline font-medium">
            미국주식창
          </a>
          {' '}으로 진입하세요.
        </p>
      </div>
      <div id="top" />
      <HomeClient />
    </>
  );
}
