/** Shown when the profile has no line items yet. */
export function EmptyState() {
  return (
    <div className="rounded-card border border-dashed border-outline bg-surface px-6 py-12 text-center">
      <p className="text-base text-ink-muted">ยังไม่มีข้อมูล — เริ่มกรอก Cash Flow ของคุณ</p>
    </div>
  );
}
