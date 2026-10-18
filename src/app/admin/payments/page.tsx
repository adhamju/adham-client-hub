import { Plus, Pencil, Trash2 } from "lucide-react";
import { getPaymentsWithRelations, getClients, getVideosWithRelations } from "@/lib/queries";
import { recordPayment, updatePayment, deletePayment } from "@/lib/actions";
import { Card, EmptyState, StatCard } from "@/components/ui/surfaces";
import { Button } from "@/components/ui/button";
import { ModalForm, ConfirmButton } from "@/components/ui/modal-form";
import { PaymentFormFields } from "@/components/admin/forms";
import { formatDate, formatMoney } from "@/lib/utils";
import type { Payment } from "@/lib/database.types";

export default async function PaymentsPage() {
  const [payments, clients, { videos }] = await Promise.all([
    getPaymentsWithRelations(),
    getClients(),
    getVideosWithRelations(),
  ]);

  const activeClients = clients.filter((c) => c.status === "active");
  const videoOptions = videos.map((v) => ({ id: v.id, title: v.title, client_id: v.client_id }));
  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  const addButton = (
    <ModalForm
      trigger={<Button size="sm"><Plus size={14} /> Record payment</Button>}
      title="Record payment"
      action={recordPayment}
    >
      <PaymentFormFields clients={activeClients} videos={videoOptions} />
    </ModalForm>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">Payments</h1>
        {addButton}
      </div>

      <StatCard label="Total recorded" value={formatMoney(total)} className="max-w-xs" />

      {payments.length === 0 ? (
        <EmptyState title="No payments recorded yet." action={addButton} />
      ) : (
        <Card className="divide-y divide-base-border">
          {payments.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
              <div>
                <p className="text-sm text-ink">{(p.client as { company_name: string } | null)?.company_name}</p>
                <p className="text-[12px] text-ink-dim">
                  {(p.video as { title: string } | null)?.title ?? "General payment"} · {formatDate(p.payment_date)} ·{" "}
                  {p.method === "Other" ? p.method_other : p.method}
                  {p.notes && ` · ${p.notes}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-ink">{formatMoney(p.amount)}</span>
                <ModalForm
                  trigger={<Button size="sm" variant="ghost" aria-label="Edit payment"><Pencil size={14} /></Button>}
                  title="Edit payment"
                  action={updatePayment.bind(null, p.id)}
                >
                  <PaymentFormFields clients={clients} videos={videoOptions} payment={p as Payment} />
                </ModalForm>
                <ConfirmButton
                  label={<Trash2 size={14} />}
                  confirmText="Delete this payment record?"
                  action={deletePayment.bind(null, p.id)}
                />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
