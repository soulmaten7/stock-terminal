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
