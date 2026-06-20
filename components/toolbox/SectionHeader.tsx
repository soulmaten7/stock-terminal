export default function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3 border-b border-unjong-border pb-2">
      <h2 className="text-lg font-bold text-unjong-primary">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-xs text-unjong-muted">{subtitle}</p> : null}
    </div>
  );
}
