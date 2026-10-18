import Link from "next/link";
import { redirect } from "next/navigation";
import { getMyClientId, getClientDetail } from "@/lib/queries";
import { StatCard, Card, SectionHeading, EmptyState } from "@/components/ui/surfaces";
import { StatusBadge, BallIndicator } from "@/components/admin/video-status";
import { formatDate, formatMoney } from "@/lib/utils";

export default async function ClientPortalPage() {
  const clientId = await getMyClientId();
  if (!clientId) redirect("/login");

  const { client, videos, stats } = await getClientDetail(clientId);
  if (!client) redirect("/login");

  const needsReview = videos.filter((v) => v.status === "SENT_FOR_REVIEW").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-ink">Video production portal</h1>
        {needsReview > 0 && (
          <p className="mt-1 text-[13px] text-signal-waiting">
            {needsReview} {needsReview === 1 ? "video is" : "videos are"} waiting for your review.
          </p>
        )}
      </div>

      <div>
        <SectionHeading title="Overview" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard label="Videos" value={stats.total} />
          <StatCard label="Approved" value={stats.completed} />
          <StatCard label="In editing" value={stats.inEditing} />
          <StatCard label="Waiting for feedback" value={stats.waitingForFeedback} />
          <StatCard label="Not started" value={stats.notStarted} />
        </div>
      </div>

      <div>
        <SectionHeading title="Financial" />
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total" value={formatMoney(stats.totalBilled, client.currency)} />
          <StatCard label="Paid" value={formatMoney(stats.totalPaid, client.currency)} />
          <StatCard label="Outstanding" value={formatMoney(stats.totalOutstanding, client.currency)} />
        </div>
      </div>

      <div>
        <SectionHeading title="Videos" />
        {videos.length === 0 ? (
          <EmptyState title="No videos yet." />
        ) : (
          <Card className="divide-y divide-base-border">
            {videos.map((v) => (
              <Link
                key={v.id}
                href={`/client/videos/${v.id}`}
                className="flex flex-col gap-2 px-4 py-3.5 hover:bg-base-raised sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm text-ink">{v.title}</p>
                  <p className="text-[12px] text-ink-dim">Due {formatDate(v.due_date)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <BallIndicator status={v.status} clientView />
                  <StatusBadge status={v.status} />
                </div>
              </Link>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
