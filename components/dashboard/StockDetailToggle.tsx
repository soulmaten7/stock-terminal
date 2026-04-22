'use client';

import { useState } from 'react';
import { Info, X } from 'lucide-react';
import StockDetailPanel from './StockDetailPanel';

export default function StockDetailToggle() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="종목 상세 열기"
        className="lg:hidden fixed bottom-24 right-6 z-30 w-12 h-12 rounded-full bg-[#0ABAB5] text-white shadow-lg flex items-center justify-center hover:bg-[#089693]"
      >
        <Info className="w-5 h-5" />
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm h-full bg-white shadow-xl flex flex-col">
            <button
              onClick={() => setOpen(false)}
              aria-label="닫기"
              className="absolute top-3 right-3 z-10 text-[#666] hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>
            <StockDetailPanel />
          </div>
        </div>
      )}
    </>
  );
}
