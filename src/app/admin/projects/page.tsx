import { Plus, Pencil, Trash2 } from "lucide-react";
import { getProjectsWithClients, getClients } from "@/lib/queries";
import { createProject, updateProject, deleteProject } from "@/lib/actions";
import { Card, EmptyState, Badge } from "@/components/ui/surfaces";
import { Button } from "@/components/ui/button";
import { ModalForm, ConfirmButton } from "@/components/ui/modal-form";
import { ProjectFormFields } from "@/components/admin/forms";
import { formatDate } from "@/lib/utils";
import { PROJECT_STATUS_LABEL } from "@/lib/constants";

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([getProjectsWithClients(), getClients()]);
  const activeClients = clients.filter((c) => c.status === "active");

  const addButton = (
    <ModalForm
      trigger={<Button size="sm"><Plus size={14} /> Add project</Button>}
      title="Add project"
      action={createProject}
    >
      <ProjectFormFields clients={activeClients} />
    </ModalForm>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">Projects</h1>
        {addButton}
      </div>

      {projects.length === 0 ? (
        <EmptyState title="No projects yet." action={addButton} />
      ) : (
        <Card className="divide-y divide-base-border">
          {projects.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
              <div>
                <p className="text-sm text-ink">{p.name}</p>
                <p className="text-[12px] text-ink-dim">
                  {(p.client as { company_name: string } | null)?.company_name} · {formatDate(p.start_date)} –{" "}
                  {formatDate(p.end_date)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{PROJECT_STATUS_LABEL[p.status as keyof typeof PROJECT_STATUS_LABEL]}</Badge>
                <ModalForm
                  trigger={<Button size="sm" variant="ghost" aria-label="Edit project"><Pencil size={14} /></Button>}
                  title={`Edit ${p.name}`}
                  action={(fd) => updateProject(p.id, fd)}
                >
                  <ProjectFormFields clients={activeClients} project={p} lockClientId={p.client_id} />
                </ModalForm>
                <ConfirmButton
                  label={<Trash2 size={14} />}
                  confirmText={`Delete project "${p.name}"? Its videos are kept, just no longer grouped under a project.`}
                  action={() => deleteProject(p.id)}
                />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
