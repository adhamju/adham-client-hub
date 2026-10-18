import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { getClientDetail, getClientAccounts, getRecentActivity } from "@/lib/queries";
import { updateClientCompany, deleteClientCompany, createProject, createVideo } from "@/lib/actions";
import { Card, StatCard, SectionHeading, EmptyState, Badge } from "@/components/ui/surfaces";
import { Button } from "@/components/ui/button";
import { ModalForm, ConfirmButton } from "@/components/ui/modal-form";
import { ClientFormFields, ProjectFormFields, VideoFormFields } from "@/components/admin/forms";
import { CreateClientAccountModal, DisableAccountButton } from "@/components/admin/client-account";
import { ActivityList } from "@/components/admin/activity-list";
import { CopyButton } from "@/components/ui/copy-button";
import { StatusBadge } from "@/components/admin/video-status";
import { formatDate, formatMoney, initials, one } from "@/lib/utils";
import { PROJECT_STATUS_LABEL } from "@/lib/constants";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ client, projects, videos, stats }, accounts, activity] = await Promise.all([
    getClientDetail(id),
    getClientAccounts(id),
    getRecentActivity({ clientId: id, limit: 15 }),
  ]);
  if (!client) notFound();

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name, client_id: p.client_id }));
  const clientOption = [{ id: client.id, company_name: client.company_name }];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {client.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={client.logo_url} alt="" className="h-12 w-12 rounded-sm border border-base-border object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-base-border bg-base-raised text-sm font-medium text-ink-dim">
              {initials(client.company_name)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-ink">{client.company_name}</h1>
              <Badge tone={client.status === "active" ? "done" : "neutral"}>
                {client.status === "active" ? "Active" : "Archived"}
              </Badge>
            </div>
            <p className="text-[13px] text-ink-dim">
              {[client.contact_person, client.email, client.phone].filter(Boolean).join(" · ") || "No contact details yet"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <ModalForm
            trigger={<Button size="sm" variant="secondary"><Pencil size={14} /> Edit / archive</Button>}
            title="Edit client"
            action={(fd) => updateClientCompany(client.id, fd)}
          >
            <ClientFormFields client={client} />
          </ModalForm>
          <ConfirmButton
            label="Delete client"
            confirmText={`Permanently delete ${client.company_name} and everything under it (projects, videos, payments, feedback)? This can't be undone. (To just hide them, use Edit → Archived instead.)`}
            action={() => deleteClientCompany(client.id)}
          />
        </div>
      </div>

      {client.notes && <Card className="p-4 text-[13px] text-ink-dim">{client.notes}</Card>}

      <div>
        <SectionHeading title="Statistics" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard label="Total videos" value={stats.total} />
          <StatCard label="Completed" value={stats.completed} />
          <StatCard label="In editing" value={stats.inEditing} />
          <StatCard label="Waiting for feedback" value={stats.waitingForFeedback} />
          <StatCard label="Revision required" value={stats.revisionRequired} />
          <StatCard label="Not started" value={stats.notStarted} />
        </div>
      </div>

      <div>
        <SectionHeading title="Financial" />
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total billed" value={formatMoney(stats.totalBilled, client.currency)} />
          <StatCard label="Total paid" value={formatMoney(stats.totalPaid, client.currency)} />
          <StatCard label="Outstanding" value={formatMoney(stats.totalOutstanding, client.currency)} />
        </div>
      </div>

      <div>
        <SectionHeading title="Portal logins" action={<CreateClientAccountModal clientId={client.id} />} />
        <Card className="divide-y divide-base-border">
          {accounts.length === 0 && (
            <EmptyState title="No portal login yet — this client can't sign in until you create one." />
          )}
          {accounts.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="text-sm text-ink">
                  {(a.profile as { full_name: string | null } | null)?.full_name ?? a.email}
                </p>
                <p className="text-[12px] text-ink-dim">{a.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={a.disabled ? "action" : "done"}>{a.disabled ? "Disabled" : "Active"}</Badge>
                <DisableAccountButton userId={a.user_id} clientId={client.id} disabled={a.disabled} />
              </div>
            </div>
          ))}
          <div className="px-4 py-3">
            <CopyButton path="/login" label="Copy portal link" />
          </div>
        </Card>
      </div>

      <div>
        <SectionHeading
          title="Projects"
          action={
            <ModalForm
              trigger={<Button size="sm" variant="secondary"><Plus size={14} /> Add project</Button>}
              title="Add project"
              action={createProject}
            >
              <ProjectFormFields clients={clientOption} lockClientId={client.id} />
            </ModalForm>
          }
        />
        {projects.length === 0 ? (
          <EmptyState title="No projects yet." />
        ) : (
          <Card className="divide-y divide-base-border">
            {projects.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-ink">{p.name}</p>
                  <p className="text-[12px] text-ink-dim">
                    {formatDate(p.start_date)} – {formatDate(p.end_date)}
                  </p>
                </div>
                <Badge>{PROJECT_STATUS_LABEL[p.status as keyof typeof PROJECT_STATUS_LABEL]}</Badge>
              </div>
            ))}
          </Card>
        )}
      </div>

      <div>
        <SectionHeading
          title="Videos"
          action={
            <ModalForm
              trigger={<Button size="sm"><Plus size={14} /> Add video</Button>}
              title="Add video"
              size="lg"
              action={createVideo}
            >
              <VideoFormFields clients={clientOption} projects={projectOptions} lockClientId={client.id} />
            </ModalForm>
          }
        />
        {videos.length === 0 ? (
          <EmptyState title="No videos yet." />
        ) : (
          <Card className="divide-y divide-base-border">
            {videos.map((v) => (
              <Link
                key={v.id}
                href={`/admin/videos/${v.id}`}
                className="flex flex-col gap-2 px-4 py-3 hover:bg-base-raised sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm text-ink">{v.title}</p>
                  <p className="text-[12px] text-ink-dim">
                    {one<{ name: string }>(v.project)?.name ?? "No project"} · Due {formatDate(v.due_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[13px] text-ink-dim">{formatMoney(v.price, v.currency)}</span>
                  <StatusBadge status={v.status} />
                </div>
              </Link>
            ))}
          </Card>
        )}
      </div>

      <div>
        <SectionHeading title="Activity" />
        <ActivityList items={activity} />
      </div>
    </div>
  );
}
