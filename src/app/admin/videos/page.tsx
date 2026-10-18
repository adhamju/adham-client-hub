import Link from "next/link";
import { Plus } from "lucide-react";
import { getVideosWithRelations, getClients, getProjectsWithClients } from "@/lib/queries";
import { createVideo } from "@/lib/actions";
import { Card, EmptyState } from "@/components/ui/surfaces";
import { Button } from "@/components/ui/button";
import { Select, Input } from "@/components/ui/field";
import { ModalForm } from "@/components/ui/modal-form";
import { VideoFormFields } from "@/components/admin/forms";
import { StatusBadge, BallIndicator } from "@/components/admin/video-status";
import { formatDate, formatMoney, one } from "@/lib/utils";
import { PAYMENT_STATUS_LABEL, VIDEO_STATUS_LABEL } from "@/lib/constants";
import type { PaymentStatus, VideoStatus } from "@/lib/database.types";

type SearchParams = {
  q?: string;
  client?: string;
  project?: string;
  status?: string;
  payment?: string;
  due?: string;
  sort?: string;
};

export default async function VideosPage({ searchParams: searchParamsPromise }: { searchParams: Promise<SearchParams> }) {
  const searchParams = await searchParamsPromise;
  const [{ videos, financialsByVideo }, clients, projects] = await Promise.all([
    getVideosWithRelations(),
    getClients(),
    getProjectsWithClients(),
  ]);

  const q = (searchParams.q ?? "").toLowerCase();
  const clientFilter = searchParams.client ?? "";
  const projectFilter = searchParams.project ?? "";
  const statusFilter = searchParams.status ?? "";
  const paymentFilter = searchParams.payment ?? "";
  const dueFilter = searchParams.due ?? "";
  const sort = searchParams.sort ?? "due_date";

  const today = new Date().toISOString().slice(0, 10);
  const weekAhead = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  let filtered = videos.filter((v) => {
    const clientName = one<{ company_name: string }>(v.client)?.company_name ?? "";
    const projectName = one<{ name: string }>(v.project)?.name ?? "";
    const matchesQuery =
      !q ||
      v.title.toLowerCase().includes(q) ||
      clientName.toLowerCase().includes(q) ||
      projectName.toLowerCase().includes(q) ||
      VIDEO_STATUS_LABEL[v.status as VideoStatus].toLowerCase().includes(q);
    const matchesClient = !clientFilter || v.client_id === clientFilter;
    const matchesProject = !projectFilter || v.project_id === projectFilter;
    const matchesStatus = !statusFilter || v.status === statusFilter;
    const matchesPayment = !paymentFilter || financialsByVideo.get(v.id)?.payment_status === paymentFilter;
    const open = v.status !== "APPROVED" && v.status !== "DELIVERED";
    const matchesDue =
      !dueFilter ||
      (dueFilter === "overdue" && !!v.due_date && v.due_date < today && open) ||
      (dueFilter === "week" && !!v.due_date && v.due_date >= today && v.due_date <= weekAhead) ||
      (dueFilter === "none" && !v.due_date);
    return matchesQuery && matchesClient && matchesProject && matchesStatus && matchesPayment && matchesDue;
  });

  filtered = [...filtered].sort((a, b) => {
    switch (sort) {
      case "price":
        return Number(b.price) - Number(a.price);
      case "created":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "status":
        return a.status.localeCompare(b.status);
      case "client":
        return (one<{ company_name: string }>(a.client)?.company_name ?? "").localeCompare(
          one<{ company_name: string }>(b.client)?.company_name ?? ""
        );
      default:
        return (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999");
    }
  });

  const activeClients = clients.filter((c) => c.status === "active");
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name, client_id: p.client_id }));

  const addButton = (
    <ModalForm
      trigger={<Button size="sm"><Plus size={14} /> Add video</Button>}
      title="Add video"
      size="lg"
      action={createVideo}
    >
      <VideoFormFields clients={activeClients} projects={projectOptions} />
    </ModalForm>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">Videos</h1>
        {addButton}
      </div>

      <form method="get" className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Input name="q" placeholder="Search title, client, project, status…" defaultValue={searchParams.q} className="col-span-2 md:col-span-4" />
        <Select name="client" defaultValue={clientFilter}>
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company_name}
            </option>
          ))}
        </Select>
        <Select name="project" defaultValue={projectFilter}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={statusFilter}>
          <option value="">All statuses</option>
          {(Object.keys(VIDEO_STATUS_LABEL) as VideoStatus[]).map((s) => (
            <option key={s} value={s}>
              {VIDEO_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <Select name="payment" defaultValue={paymentFilter}>
          <option value="">All payment statuses</option>
          {(Object.keys(PAYMENT_STATUS_LABEL) as PaymentStatus[]).map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <Select name="due" defaultValue={dueFilter}>
          <option value="">Any due date</option>
          <option value="overdue">Overdue</option>
          <option value="week">Due in the next 7 days</option>
          <option value="none">No due date</option>
        </Select>
        <Select name="sort" defaultValue={sort}>
          <option value="due_date">Sort: due date</option>
          <option value="price">Sort: price</option>
          <option value="created">Sort: created date</option>
          <option value="status">Sort: status</option>
          <option value="client">Sort: client</option>
        </Select>
        <Button type="submit" variant="secondary" size="sm" className="h-10">
          Apply
        </Button>
        <Link href="/admin/videos" className="flex h-10 items-center justify-center text-[13px] text-ink-dim hover:text-ink">
          Clear filters
        </Link>
      </form>

      {videos.length === 0 ? (
        <EmptyState title="No videos yet." action={addButton} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No videos match these filters." />
      ) : (
        <Card className="divide-y divide-base-border">
          {filtered.map((v) => (
            <Link
              key={v.id}
              href={`/admin/videos/${v.id}`}
              className="flex flex-col gap-2 px-4 py-3.5 hover:bg-base-raised sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm text-ink">{v.title}</p>
                <p className="text-[12px] text-ink-dim">
                  {one<{ company_name: string }>(v.client)?.company_name}
                  {one<{ name: string }>(v.project)?.name && ` · ${one<{ name: string }>(v.project)?.name}`}
                  {" · Due "}
                  {formatDate(v.due_date)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[13px] text-ink-dim">{formatMoney(v.price, v.currency)}</span>
                <BallIndicator status={v.status} />
                <StatusBadge status={v.status} />
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
