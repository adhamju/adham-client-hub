import { Card, EmptyState } from "@/components/ui/surfaces";
import { formatDateTime } from "@/lib/utils";
import type { ActivityLog } from "@/lib/database.types";

export function ActivityList({ items }: { items: ActivityLog[] }) {
  if (items.length === 0) return <EmptyState title="No activity yet." />;
  return (
    <Card className="divide-y divide-base-border">
      {items.map((a) => (
        <div key={a.id} className="px-4 py-2.5 text-[13px] text-ink-dim">
          {a.actor_name && <span className="text-ink">{a.actor_name} · </span>}
          {a.action_text}
          <span className="ml-2 text-[11px] text-ink-faint">{formatDateTime(a.created_at)}</span>
        </div>
      ))}
    </Card>
  );
}
