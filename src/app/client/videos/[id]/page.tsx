import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getVideoDetail, getMyClientId } from "@/lib/queries";
import { Card, SectionHeading, EmptyState, StatCard } from "@/components/ui/surfaces";
import { StatusBadge } from "@/components/admin/video-status";
import { WorkflowStepper } from "@/components/admin/workflow-stepper";
import { ApproveButton, RequestRevisionForm, LeaveFeedbackForm } from "@/components/client-portal/video-actions";
import { formatDate, formatDateTime, formatMoney, one } from "@/lib/utils";

export default async function ClientVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const myClientId = await getMyClientId();
  const { video, financials, feedback } = await getVideoDetail(id);

  // The database (Row Level Security) already returns nothing for another
  // client's video, so changing the ID in the URL gives a 404. We also check
  // explicitly here as a second lock.
  if (!video || !myClientId || video.client_id !== myClientId) notFound();

  const project = one<{ name: string }>(video.project);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/client" className="text-[13px] text-ink-dim hover:text-ink">
          ← All videos
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-ink">{video.title}</h1>
        {project && <p className="mt-1 text-[13px] text-ink-dim">{project.name}</p>}
        <div className="mt-2">
          <StatusBadge status={video.status} />
        </div>
      </div>

      {video.status === "SENT_FOR_REVIEW" && (
        <Card className="space-y-4 border-signal-waiting/40 p-4">
          <p className="text-sm font-medium text-ink">Please review this video.</p>
          <div className="flex flex-wrap items-center gap-3">
            {video.review_url ? (
              <a
                href={video.review_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-sm border border-base-border bg-base-raised px-4 text-sm font-medium text-ink hover:bg-base-border/60"
              >
                Open video <ExternalLink size={14} />
              </a>
            ) : (
              <span className="text-[13px] text-ink-faint">The review link isn't ready yet.</span>
            )}
            <ApproveButton videoId={video.id} />
          </div>
          <div>
            <RequestRevisionForm videoId={video.id} />
          </div>
        </Card>
      )}

      <Card className="p-5">
        <WorkflowStepper status={video.status} />
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="Due date" value={formatDate(video.due_date)} />
        <StatCard label="Price" value={formatMoney(video.price, video.currency)} />
        <StatCard label="Outstanding" value={formatMoney(financials?.amount_remaining ?? video.price, video.currency)} />
      </div>

      <div>
        <SectionHeading title="Links" />
        <Card className="divide-y divide-base-border p-1">
          <LinkRow label="Review video" url={video.review_url} />
          <LinkRow label="Final delivery" url={video.delivery_url} />
        </Card>
      </div>

      {video.client_notes && (
        <div>
          <SectionHeading title="Notes from the team" />
          <Card className="whitespace-pre-wrap p-4 text-[13px] text-ink-dim">{video.client_notes}</Card>
        </div>
      )}

      <div>
        <SectionHeading title="Feedback" />
        {feedback.length === 0 ? (
          <div className="mb-4">
            <EmptyState title="No feedback yet." />
          </div>
        ) : (
          <Card className="mb-4 divide-y divide-base-border">
            {feedback.map((f) => (
              <div key={f.id} className="px-4 py-3">
                <p className="whitespace-pre-wrap text-[13px] text-ink">{f.message}</p>
                {f.link && (
                  <a href={f.link} target="_blank" rel="noreferrer" className="text-[12px] text-signal-waiting hover:underline">
                    {f.link}
                  </a>
                )}
                <p className="mt-1 text-[11px] text-ink-faint">{formatDateTime(f.created_at)}</p>
              </div>
            ))}
          </Card>
        )}
        <Card className="p-4">
          <LeaveFeedbackForm videoId={video.id} />
        </Card>
      </div>
    </div>
  );
}

function LinkRow({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <span className="text-[13px] text-ink-dim">{label}</span>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[13px] text-signal-waiting hover:underline">
          Open <ExternalLink size={12} />
        </a>
      ) : (
        <span className="text-[13px] text-ink-faint">Not available yet</span>
      )}
    </div>
  );
}
