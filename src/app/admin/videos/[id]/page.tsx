import { notFound } from "next/navigation";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import {
  getVideoDetail,
  getVideoAdminNotes,
  getClients,
  getProjectsWithClients,
  getRecentActivity,
} from "@/lib/queries";
import { updateVideo, deleteVideo, recordPayment, deleteFeedback } from "@/lib/actions";
import { Card, StatCard, SectionHeading, EmptyState, Badge } from "@/components/ui/surfaces";
import { Button } from "@/components/ui/button";
import { ModalForm, ConfirmButton } from "@/components/ui/modal-form";
import { VideoFormFields, PaymentFormFields } from "@/components/admin/forms";
import { StatusBadge, BallIndicator } from "@/components/admin/video-status";
import { WorkflowStepper } from "@/components/admin/workflow-stepper";
import { ActivityList } from "@/components/admin/activity-list";
import { formatDate, formatDateTime, formatMoney, one } from "@/lib/utils";
import { PAYMENT_BADGE_TONE, PAYMENT_STATUS_LABEL } from "@/lib/constants";
import type { PaymentStatus } from "@/lib/database.types";

export default async function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ video, financials, payments, feedback }, adminNotes, clients, projects, activity] = await Promise.all([
    getVideoDetail(id),
    getVideoAdminNotes(id),
    getClients(),
    getProjectsWithClients(),
    getRecentActivity({ videoId: id, limit: 30 }),
  ]);
  if (!video) notFound();

  const client = one<{ id: string; company_name: string }>(video.client);
  const project = one<{ id: string; name: string }>(video.project);
  const activeClients = clients.filter((c) => c.status === "active" || c.id === video.client_id);
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name, client_id: p.client_id }));
  const videoOptions = [{ id: video.id, title: video.title, client_id: video.client_id }];
  const paymentStatus = (financials?.payment_status ?? "UNPAID") as PaymentStatus;
  const videoWithNotes = { ...video, admin_notes: adminNotes };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">{video.title}</h1>
          <p className="mt-1 text-[13px] text-ink-dim">
            {client?.company_name}
            {project && ` · ${project.name}`}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={video.status} />
            <BallIndicator status={video.status} />
          </div>
        </div>
        <div className="flex gap-2">
          <ModalForm
            trigger={<Button size="sm" variant="secondary"><Pencil size={14} /> Edit video</Button>}
            title="Edit video"
            size="lg"
            action={updateVideo.bind(null, video.id)}
          >
            <VideoFormFields clients={activeClients} projects={projectOptions} video={videoWithNotes} />
          </ModalForm>
          <ConfirmButton
            label="Delete"
            confirmText={`Permanently delete "${video.title}"? This also removes its feedback. (Payments are kept as general payments.)`}
            action={deleteVideo.bind(null, video.id)}
          />
        </div>
      </div>

      <Card className="p-5">
        <WorkflowStepper status={video.status} />
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Price" value={formatMoney(video.price, video.currency)} />
        <StatCard label="Paid" value={formatMoney(financials?.amount_paid ?? 0, video.currency)} />
        <StatCard label="Remaining" value={formatMoney(financials?.amount_remaining ?? video.price, video.currency)} />
        <StatCard label="Due date" value={formatDate(video.due_date)} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <SectionHeading title="Links" />
          <Card className="divide-y divide-base-border p-1">
            <LinkRow label="Review link" url={video.review_url} />
            <LinkRow label="Final delivery" url={video.delivery_url} />
          </Card>
        </div>
        <div>
          <SectionHeading title="Details" />
          <Card className="space-y-2 p-4 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-ink-dim">Payment status</span>
              <Badge tone={PAYMENT_BADGE_TONE[paymentStatus]}>{PAYMENT_STATUS_LABEL[paymentStatus]}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-dim">Revisions requested</span>
              <span className="font-mono text-ink">{video.revision_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-dim">Created</span>
              <span className="text-ink">{formatDate(video.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-dim">Submitted for review</span>
              <span className="text-ink">{formatDate(video.submitted_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-dim">Approved</span>
              <span className="text-ink">{formatDate(video.approved_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-dim">Delivered</span>
              <span className="text-ink">{formatDate(video.delivered_at)}</span>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <SectionHeading title="Client-visible notes" />
          <Card className="whitespace-pre-wrap p-4 text-[13px] text-ink-dim">{video.client_notes || "—"}</Card>
        </div>
        <div>
          <SectionHeading title="Internal notes (only you)" />
          <Card className="whitespace-pre-wrap p-4 text-[13px] text-ink-dim">{adminNotes || "—"}</Card>
        </div>
      </div>

      <div>
        <SectionHeading
          title="Payments"
          action={
            <ModalForm
              trigger={<Button size="sm"><Plus size={14} /> Record payment</Button>}
              title="Record payment"
              action={recordPayment}
            >
              <PaymentFormFields
                clients={activeClients}
                videos={videoOptions}
                lockClientId={video.client_id}
                lockVideoId={video.id}
              />
            </ModalForm>
          }
        />
        {payments.length === 0 ? (
          <EmptyState title="No payments recorded yet." />
        ) : (
          <Card className="divide-y divide-base-border">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 text-[13px]">
                <div>
                  <p className="font-mono text-ink">{formatMoney(p.amount, video.currency)}</p>
                  <p className="text-ink-dim">
                    {formatDate(p.payment_date)} · {p.method === "Other" ? p.method_other : p.method}
                    {p.notes && ` · ${p.notes}`}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>

      <div>
        <SectionHeading title="Feedback" />
        {feedback.length === 0 ? (
          <EmptyState title="No feedback from the client yet." />
        ) : (
          <Card className="divide-y divide-base-border">
            {feedback.map((f) => (
              <div key={f.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div>
                  <p className="whitespace-pre-wrap text-[13px] text-ink">{f.message}</p>
                  {f.link && (
                    <a href={f.link} target="_blank" rel="noreferrer" className="text-[12px] text-signal-waiting hover:underline">
                      {f.link}
                    </a>
                  )}
                  <p className="mt-1 text-[11px] text-ink-faint">{formatDateTime(f.created_at)}</p>
                </div>
                <ConfirmButton
                  label={<Trash2 size={14} />}
                  confirmText="Delete this feedback message?"
                  action={deleteFeedback.bind(null, f.id)}
                />
              </div>
            ))}
          </Card>
        )}
      </div>

      <div>
        <SectionHeading title="Activity history" />
        <ActivityList items={activity} />
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
        <span className="text-[13px] text-ink-faint">Not set</span>
      )}
    </div>
  );
}
