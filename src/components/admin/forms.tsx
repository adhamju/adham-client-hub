"use client";

import * as React from "react";
import { FieldGroup, Input, Label, Select, Textarea } from "@/components/ui/field";
import { CURRENCIES, PAYMENT_METHODS, PROJECT_STATUS_LABEL, VIDEO_STATUS_LABEL } from "@/lib/constants";
import type { Client, Payment, Project, Video, ProjectStatus, VideoStatus } from "@/lib/database.types";

type ClientOption = Pick<Client, "id" | "company_name">;

function ClientSelect({
  clients,
  value,
  onChange,
  locked,
}: {
  clients: ClientOption[];
  value: string;
  onChange: (v: string) => void;
  locked?: boolean;
}) {
  return (
    <FieldGroup>
      <Label htmlFor="client_id">Client</Label>
      <Select
        id="client_id"
        name={locked ? undefined : "client_id"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        disabled={locked}
      >
        <option value="">Select a client…</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.company_name}
          </option>
        ))}
      </Select>
      {/* A disabled select isn't submitted, so locked forms send the id this way. */}
      {locked && <input type="hidden" name="client_id" value={value} />}
    </FieldGroup>
  );
}

export function ClientFormFields({ client }: { client?: Client }) {
  return (
    <>
      <FieldGroup>
        <Label htmlFor="company_name">Company name</Label>
        <Input id="company_name" name="company_name" defaultValue={client?.company_name} required />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="contact_person">Contact person</Label>
          <Input id="contact_person" name="contact_person" defaultValue={client?.contact_person ?? ""} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="currency">Currency</Label>
          <Select id="currency" name="currency" defaultValue={client?.currency ?? "USD"}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </FieldGroup>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={client?.email ?? ""} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={client?.phone ?? ""} />
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="logo_url">Logo link (optional)</Label>
        <Input id="logo_url" name="logo_url" type="url" placeholder="https://" defaultValue={client?.logo_url ?? ""} />
      </FieldGroup>
      {client && (
        <FieldGroup>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={client.status}>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </Select>
        </FieldGroup>
      )}
      <FieldGroup>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={client?.notes ?? ""} />
      </FieldGroup>
    </>
  );
}

export function ProjectFormFields({
  clients,
  project,
  lockClientId,
}: {
  clients: ClientOption[];
  project?: Project;
  lockClientId?: string;
}) {
  const [clientId, setClientId] = React.useState(lockClientId ?? project?.client_id ?? "");
  return (
    <>
      <ClientSelect clients={clients} value={clientId} onChange={setClientId} locked={!!lockClientId} />
      <FieldGroup>
        <Label htmlFor="name">Project name</Label>
        <Input id="name" name="name" defaultValue={project?.name} required />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={project?.description ?? ""} />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="start_date">Start date</Label>
          <Input id="start_date" name="start_date" type="date" defaultValue={project?.start_date ?? ""} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="end_date">End date</Label>
          <Input id="end_date" name="end_date" type="date" defaultValue={project?.end_date ?? ""} />
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" defaultValue={project?.status ?? "PLANNED"}>
          {(Object.keys(PROJECT_STATUS_LABEL) as ProjectStatus[]).map((s) => (
            <option key={s} value={s}>
              {PROJECT_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={project?.notes ?? ""} />
      </FieldGroup>
    </>
  );
}

export function VideoFormFields({
  clients,
  projects,
  video,
  lockClientId,
}: {
  clients: ClientOption[];
  projects: (Pick<Project, "id" | "name"> & { client_id: string })[];
  video?: Video;
  lockClientId?: string;
}) {
  const [clientId, setClientId] = React.useState(lockClientId ?? video?.client_id ?? "");
  const filteredProjects = projects.filter((p) => p.client_id === clientId);

  return (
    <>
      <ClientSelect clients={clients} value={clientId} onChange={setClientId} locked={!!lockClientId} />
      <FieldGroup>
        <Label htmlFor="project_id">Project (optional)</Label>
        <Select id="project_id" name="project_id" defaultValue={video?.project_id ?? ""}>
          <option value="">No project</option>
          {filteredProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="title">Video title</Label>
        <Input id="title" name="title" defaultValue={video?.title} required />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={video?.description ?? ""} />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="price">Price</Label>
          <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={video?.price ?? 0} required />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="currency">Currency</Label>
          <Select id="currency" name="currency" defaultValue={video?.currency ?? "USD"}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </FieldGroup>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={video?.status ?? "NOT_STARTED"}>
            {(Object.keys(VIDEO_STATUS_LABEL) as VideoStatus[]).map((s) => (
              <option key={s} value={s}>
                {VIDEO_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="due_date">Due date</Label>
          <Input id="due_date" name="due_date" type="date" defaultValue={video?.due_date ?? ""} />
        </FieldGroup>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="review_url">Review link</Label>
          <Input id="review_url" name="review_url" type="url" placeholder="https://" defaultValue={video?.review_url ?? ""} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="delivery_url">Final delivery link</Label>
          <Input id="delivery_url" name="delivery_url" type="url" placeholder="https://" defaultValue={video?.delivery_url ?? ""} />
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="client_notes">Client-visible notes</Label>
        <Textarea id="client_notes" name="client_notes" defaultValue={video?.client_notes ?? ""} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="admin_notes">Internal notes (never shown to the client)</Label>
        <Textarea id="admin_notes" name="admin_notes" defaultValue={video?.admin_notes ?? ""} />
      </FieldGroup>
    </>
  );
}

export function PaymentFormFields({
  clients,
  videos,
  payment,
  lockClientId,
  lockVideoId,
}: {
  clients: ClientOption[];
  videos: (Pick<Video, "id" | "title"> & { client_id: string })[];
  payment?: Payment;
  lockClientId?: string;
  lockVideoId?: string;
}) {
  const [clientId, setClientId] = React.useState(lockClientId ?? payment?.client_id ?? "");
  const [method, setMethod] = React.useState<string>(payment?.method ?? "Cash");
  const filteredVideos = videos.filter((v) => v.client_id === clientId);

  return (
    <>
      <ClientSelect clients={clients} value={clientId} onChange={setClientId} locked={!!lockClientId || !!payment} />
      <FieldGroup>
        <Label htmlFor="video_id">Video (optional)</Label>
        <Select id="video_id" name="video_id" defaultValue={lockVideoId ?? payment?.video_id ?? ""}>
          <option value="">General payment (not tied to one video)</option>
          {filteredVideos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title}
            </option>
          ))}
        </Select>
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" defaultValue={payment?.amount} required />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="payment_date">Date</Label>
          <Input
            id="payment_date"
            name="payment_date"
            type="date"
            defaultValue={payment?.payment_date ?? new Date().toISOString().slice(0, 10)}
          />
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="method">Payment method</Label>
        <Select id="method" name="method" value={method} onChange={(e) => setMethod(e.target.value)}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </FieldGroup>
      {method === "Other" && (
        <FieldGroup>
          <Label htmlFor="method_other">Describe the method</Label>
          <Input id="method_other" name="method_other" defaultValue={payment?.method_other ?? ""} />
        </FieldGroup>
      )}
      <FieldGroup>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={payment?.notes ?? ""} />
      </FieldGroup>
    </>
  );
}
