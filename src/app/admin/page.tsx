import Link from "next/link";
import { Plus } from "lucide-react";
import {
  getAdminDashboard,
  getActionQueues,
  getClients,
  getProjectsWithClients,
  getVideosWithRelations,
  getRecentActivity,
} from "@/lib/queries";
import { createClientCompany, createProject, createVideo, recordPayment } from "@/lib/actions";
import { StatCard, Card, SectionHeading, EmptyState } from "@/components/ui/surfaces";
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/ui/modal-form";
import { ClientFormFields, ProjectFormFields, VideoFormFields, PaymentFormFields } from "@/components/admin/forms";
import { StatusBadge } from "@/components/admin/video-status";
import { ActivityList } from "@/components/admin/activity-list";
import { formatDate, formatMoney } from "@/lib/utils";
import type { VideoStatus } from "@/lib/database.types";

type QueueVideo = { id: string; title: string; status: string; due_date: string | null; client: unknown };

function QueueList({ videos, emptyText }: { videos: QueueVideo[]; emptyText: string }) {
  if (videos.length === 0) return <EmptyState title={emptyText} />;
  return (
    <Card className="divide-y divide-base-border">
      {videos.slice(0, 8).map((v) => (
        <Link
          key={v.id}
          href={`/admin/videos/${v.id}`}
          className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-base-raised"
        >
          <div className="min-w-0">
            <p className="truncate text-sm text-ink">{v.title}</p>
            <p className="text-[12px] text-ink-dim">
              {(v.client as { company_name: string } | null)?.company_name} · Due {formatDate(v.due_date)}
            </p>
          </div>
          <StatusBadge status={v.status as VideoStatus} />
        </Link>
      ))}
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const [stats, { myActions, waitingForClient }, clients, projects, { videos }, activity] = await Promise.all([
    getAdminDashboard(),
    getActionQueues(),
    getClients(),
    getProjectsWithClients(),
    getVideosWithRelations(),
    getRecentActivity({ limit: 10 }),
  ]);

  const activeClients = clients.filter((c) => c.status === "active");
  const videoOptions = videos.map((v) => ({ id: v.id, title: v.title, client_id: v.client_id }));
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name, client_id: p.client_id }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-ink">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <ModalForm
            trigger={<Button size="sm" variant="secondary"><Plus size={14} /> Add client</Button>}
            title="Add client"
            action={createClientCompany}
          >
            <ClientFormFields />
          </ModalForm>
          <ModalForm
            trigger={<Button size="sm" variant="secondary"><Plus size={14} /> Add project</Button>}
            title="Add project"
            action={createProject}
          >
            <ProjectFormFields clients={activeClients} />
          </ModalForm>
          <ModalForm
            trigger={<Button size="sm" variant="secondary"><Plus size={14} /> Add video</Button>}
            title="Add video"
            size="lg"
            action={createVideo}
          >
            <VideoFormFields clients={activeClients} projects={projectOptions} />
          </ModalForm>
          <ModalForm
            trigger={<Button size="sm"><Plus size={14} /> Record payment</Button>}
            title="Record payment"
            action={recordPayment}
          >
            <PaymentFormFields clients={activeClients} videos={videoOptions} />
          </ModalForm>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionHeading title={`My Actions (${myActions.length})`} />
          <QueueList videos={myActions} emptyText="Nothing needs your attention right now." />
        </div>
        <div>
          <SectionHeading title={`Waiting for Client (${waitingForClient.length})`} />
          <QueueList videos={waitingForClient} emptyText="No videos waiting on a client right now." />
        </div>
      </div>

      <div>
        <SectionHeading title="Overview" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total clients" value={stats.totalClients} />
          <StatCard label="Active clients" value={stats.activeClients} />
          <StatCard label="Total videos" value={stats.totalVideos} />
          <StatCard label="In progress" value={stats.videosInProgress} />
          <StatCard label="Waiting for client" value={stats.waitingForClient} />
          <StatCard label="Revision required" value={stats.revisionRequired} />
          <StatCard label="Approved / delivered" value={stats.approvedVideos} />
        </div>
      </div>

      <div>
        <SectionHeading title="Financial summary" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard label="Total billed" value={formatMoney(stats.totalBilled)} />
          <StatCard label="Total paid" value={formatMoney(stats.totalPaid)} />
          <StatCard label="Outstanding" value={formatMoney(stats.totalOutstanding)} />
        </div>
      </div>

      <div>
        <SectionHeading title="This month" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard label="Revenue (videos delivered)" value={formatMoney(stats.revenueThisMonth)} />
          <StatCard label="Videos completed" value={stats.videosCompletedThisMonth} />
          <StatCard label="Payments received" value={formatMoney(stats.paymentsThisMonth)} />
        </div>
        <p className="mt-2 text-[12px] text-ink-faint">
          Money totals add up amounts as numbers, regardless of currency — best used when most work is in one currency.
        </p>
      </div>

      <div>
        <SectionHeading title="Recent activity" />
        <ActivityList items={activity} />
      </div>
    </div>
  );
}
