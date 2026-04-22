'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

interface DetailDrawerProps {
  title: string;
  children: ReactNode;
}

export default function DetailDrawer({ title, children }: DetailDrawerProps) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.back();
    };
    window.addEventListener('keydown', onKey);

    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [router]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={() => router.back()}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        className="fixed right-0 top-0 bottom-0 w-full max-w-[920px] bg-white z-50 shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] shrink-0">
          <h2 id="drawer-title" className="text-lg font-bold text-black">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="닫기"
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-[#666666]" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </aside>
    </>
  );
}
