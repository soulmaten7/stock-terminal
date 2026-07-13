// Trillion "TR-AI 렌즈" 브랜드 배지 — 어두운 박스 카드(밝은 데이터 행에서 앵커) + 헤더 T 로고(민트) + 흰 글자.
// "TR-AI"·로고=고정, '렌즈'만 언어별. (arrow/pill 프롭은 하위호환용으로 받되 무시 — 룩은 박스 하나로 통일.)
type Lang = 'ko' | 'en' | 'ja' | 'zh';
const LENS_WORD: Record<Lang, string> = { ko: '렌즈', en: 'Lens', ja: 'レンズ', zh: '镜头' };
export const lensLabel = (lang: Lang = 'ko') => `TR-AI ${LENS_WORD[lang] ?? LENS_WORD.ko}`;

// 헤더 로고와 동일한 T 마크(viewBox 100). 기본 민트.
export function TLensLogo({ size = 14, color = '#2DD4BF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="shrink-0">
      <rect x="16" y="22" width="15" height="14" rx="2.5" fill={color} />
      <rect x="42.5" y="22" width="15" height="14" rx="2.5" fill={color} />
      <rect x="69" y="22" width="15" height="14" rx="2.5" fill={color} />
      <rect x="42.5" y="35" width="15" height="43" rx="2.5" fill={color} />
    </svg>
  );
}

export function AiLensBadge({ href, lang = 'ko' }: { href?: string; lang?: Lang; arrow?: boolean; pill?: boolean }) {
  const cls =
    'inline-flex items-center gap-1.5 rounded-lg bg-unjong-strong px-2.5 py-1 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 active:opacity-90';
  const inner = (
    <>
      <TLensLogo size={14} color="#2DD4BF" />
      <span>{lensLabel(lang)}</span>
    </>
  );
  return href ? <a href={href} className={cls}>{inner}</a> : <span className={cls}>{inner}</span>;
}
