import Link from "next/link";

export function UnjongLogo() {
  return (
    <Link
      href="/scalper"
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      <span className="text-2xl font-bold text-unjong-primary leading-none">
        雲從
      </span>
      <div className="flex flex-col leading-none">
        <span className="text-[10px] tracking-widest text-unjong-muted font-medium">
          UNJONG
        </span>
        <span className="text-[9px] text-unjong-muted">운종</span>
      </div>
    </Link>
  );
}
