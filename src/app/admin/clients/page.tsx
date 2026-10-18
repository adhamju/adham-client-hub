import Link from "next/link";
import { Plus } from "lucide-react";
import { getClients } from "@/lib/queries";
import { createClientCompany } from "@/lib/actions";
import { Card, EmptyState, Badge } from "@/components/ui/surfaces";
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/ui/modal-form";
import { ClientFormFields } from "@/components/admin/forms";
import { initials } from "@/lib/utils";

function AddClient({ size }: { size?: "sm" }) {
  return (
    <ModalForm
      trigger={<Button size={size ?? "sm"}><Plus size={14} /> Add client</Button>}
      title="Add client"
      action={createClientCompany}
    >
      <ClientFormFields />
    </ModalForm>
  );
}

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">Clients</h1>
        <AddClient />
      </div>

      {clients.length === 0 ? (
        <EmptyState title="No clients yet." action={<AddClient />} />
      ) : (
        <Card className="divide-y divide-base-border">
          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/admin/clients/${c.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-base-raised"
            >
              <div className="flex min-w-0 items-center gap-3">
                {c.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.logo_url} alt="" className="h-9 w-9 rounded-sm border border-base-border object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-base-border bg-base-raised text-[12px] font-medium text-ink-dim">
                    {initials(c.company_name)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{c.company_name}</p>
                  <p className="truncate text-[12px] text-ink-dim">{c.contact_person || c.email || "No contact set"}</p>
                </div>
              </div>
              <Badge tone={c.status === "active" ? "done" : "neutral"}>
                {c.status === "active" ? "Active" : "Archived"}
              </Badge>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
