export default function PlaceholderCard({ title, note }: { title: string; note?: string }) {
  return (
    <section className="bg-unjong-surface rounded-2xl border border-dashed border-unjong-border p-5">
      <h2 className="text-base font-bold text-unjong-primary mb-1">{title}</h2>
      <p className="text-sm text-unjong-muted">{note ?? "준비 중 — 트릴리언 데이터 연동 예정"}</p>
      <div className="mt-3 h-24 rounded-xl bg-unjong-background flex items-center justify-center text-xs text-unjong-muted">
        섹션 자리 (placeholder)
      </div>
    </section>
  );
}
