'use client';

import ThemeTop10Widget from '@/components/widgets/ThemeTop10Widget';

export default function ThemesClient() {
  return (
    <div className="max-w-[1600px] min-w-[1280px] mx-auto px-4 py-4 flex flex-col gap-4">
      <div className="bg-white border border-[#E5E7EB] h-[640px] overflow-hidden">
        <ThemeTop10Widget />
      </div>
    </div>
  );
}
