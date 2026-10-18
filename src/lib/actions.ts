"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createServerClient, createAdminClient } from "@/lib/supabase/server";
import type { PaymentMethod, ProjectStatus, VideoStatus } from "@/lib/database.types";

type Result = { error?: string; success?: boolean; id?: string };

// Never show raw database/internal errors to normal users.
function friendly(message: string | undefined): string {
  if (!message) return "Something went wrong. Please try again.";
  if (/not authorized|admins only|permission denied|row-level security/i.test(message)) {
    return "You don't have permission to do that.";
  }
  if (/not currently waiting|not waiting/i.test(message)) {
    return "This video isn't waiting for your review right now.";
  }
  if (/duplicate key|already registered|already been registered/i.test(message)) {
    return "That already exists.";
  }
  if (/password/i.test(message)) return message; // e.g. "Password should be at least 6 characters"
  return "Something went wrong. Please try again.";
}

async function requireAdmin() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Your session has expired. Please sign in again.");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Admins only.");

  return { supabase, user, name: (profile.full_name as string | null) ?? "Admin" };
}

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function num(formData: FormData, key: string) {
  const v = formData.get(key);
  const n = typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
}

async function logActivity(
  supabase: ReturnType<typeof createServerClient>,
  actor: { id: string; name: string },
  text: string,
  refs: { client_id?: string | null; project_id?: string | null; video_id?: string | null }
) {
  await supabase.from("activity_logs").insert({
    actor_id: actor.id,
    actor_name: actor.name,
    action_text: text,
    client_id: refs.client_id ?? null,
    project_id: refs.project_id ?? null,
    video_id: refs.video_id ?? null,
  });
}

// ---------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------

export async function signIn(formData: FormData): Promise<Result> {
  const email = str(formData, "email");
  const password = str(formData, "password");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Wrong email or password, or this account has been disabled." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();

  redirect(profile?.role === "admin" ? "/admin" : "/client");
}

export async function createFirstAdmin(formData: FormData): Promise<Result> {
  const fullName = str(formData, "full_name");
  const email = str(formData, "email");
  const password = str(formData, "password");
  if (!email || !password) return { error: "Enter an email and password." };

  const supabase = createServerClient();
  const { data: exists } = await supabase.rpc("admin_exists");
  if (exists) return { error: "An admin account already exists. Please sign in instead." };

  // Created through the admin API so no confirmation email is needed.
  // The database trigger makes the very first account an admin.
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) {
    // Setup-time only (no admin exists yet), so showing the real reason is safe and saves a lot of guessing.
    return { error: "Could not create the account: " + (error.message || "unknown error") };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) return { error: "Account created, please sign in. (" + signInError.message + ")" };

  redirect("/admin");
}

export async function signOut() {
  const supabase = createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------------------------------------------------------------------
// CLIENTS
// ---------------------------------------------------------------------

export async function createClientCompany(formData: FormData): Promise<Result> {
  try {
    const { supabase, user, name } = await requireAdmin();
    const company_name = str(formData, "company_name");
    if (!company_name) return { error: "Company name is required." };

    const { data, error } = await supabase
      .from("clients")
      .insert({
        company_name,
        logo_url: str(formData, "logo_url"),
        contact_person: str(formData, "contact_person"),
        email: str(formData, "email"),
        phone: str(formData, "phone"),
        currency: str(formData, "currency") ?? "USD",
        notes: str(formData, "notes"),
      })
      .select("id")
      .single();
    if (error) return { error: friendly(error.message) };

    await logActivity(supabase, { id: user.id, name }, `Created client "${company_name}"`, { client_id: data.id });
    revalidatePath("/admin", "layout");
    return { success: true, id: data.id };
  } catch (e) {
    return { error: friendly((e as Error).message) };
  }
}

export async function updateClientCompany(clientId: string, formData: FormData): Promise<Result> {
  try {
    const { supabase, user, name } = await requireAdmin();
    const company_name = str(formData, "company_name");
    if (!company_name) return { error: "Company name is required." };

    const { error } = await supabase
      .from("clients")
      .update({
        company_name,
        logo_url: str(formData, "logo_url"),
        contact_person: str(formData, "contact_person"),
        email: str(formData, "email"),
        phone: str(formData, "phone"),
        currency: str(formData, "currency") ?? "USD",
        notes: str(formData, "notes"),
        status: str(formData, "status") === "archived" ? "archived" : "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId);
    if (error) return { error: friendly(error.message) };

    await logActivity(supabase, { id: user.id, name }, `Updated client "${company_name}"`, { client_id: clientId });
    revalidatePath("/admin", "layout");
    return { success: true };
  } catch (e) {
    return { error: friendly((e as Error).message) };
  }
}

export async function deleteClientCompany(clientId: string): Promise<Result> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("clients").delete().eq("id", clientId);
    if (error) return { error: friendly(error.message) };
  } catch (e) {
    return { error: friendly((e as Error).message) };
  }
  revalidatePath("/admin", "layout");
  redirect("/admin/clients");
}

export async function createClientAccount(clientId: string, formData: FormData): Promise<Result> {
  try {
    const { supabase, user, name } = await requireAdmin();
    const email = str(formData, "email");
    const fullName = str(formData, "full_name");
    const password = str(formData, "password");
    if (!email || !password) return { error: "Email and a temporary password are required." };

    const admin = createAdminClient();
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) return { error: friendly(error.message) };

    const { error: linkError } = await supabase
      .from("client_users")
      .insert({ client_id: clientId, user_id: created.user.id });
    if (linkError) return { error: friendly(linkError.message) };

    await logActivity(supabase, { id: user.id, name }, `Created a portal login for ${email}`, { client_id: clientId });
    revalidatePath(`/admin/clients/${clientId}`);
    return { success: true };
  } catch (e) {
    return { error: friendly((e as Error).message) };
  }
}

export async function setClientAccountDisabled(userId: string, clientId: string, disabled: boolean): Promise<Result> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: disabled ? "876000h" : "none",
    });
    if (error) return { error: friendly(error.message) };
    revalidatePath(`/admin/clients/${clientId}`);
    return { success: true };
  } catch (e) {
    return { error: friendly((e as Error).message) };
  }
}

// ---------------------------------------------------------------------
// PROJECTS
// ---------------------------------------------------------------------

export async function createProject(formData: FormData): Promise<Result> {
  try {
    const { supabase, user, name } = await requireAdmin();
    const client_id = str(formData, "client_id");
    const projectName = str(formData, "name");
    if (!client_id || !projectName) return { error: "Client and project name are required." };

    const { data, error } = await supabase
      .from("projects")
      .insert({
        client_id,
        name: projectName,
        description: str(formData, "description"),
        start_date: str(formData, "start_date"),
        end_date: str(formData, "end_date"),
        status: (str(formData, "status") as ProjectStatus) ?? "PLANNED",
        notes: str(formData, "notes"),
      })
      .select("id")
      .single();
    if (error) return { error: friendly(error.message) };

    await logActivity(supabase, { id: user.id, name }, `Created project "${projectName}"`, {
      client_id,
      project_id: data.id,
    });
    revalidatePath("/admin", "layout");
    return { success: true };
  } catch (e) {
    return { error: friendly((e as Error).message) };
  }
}

export async function updateProject(projectId: string, formData: FormData): Promise<Result> {
  try {
    const { supabase } = await requireAdmin();
    const projectName = str(formData, "name");
    if (!projectName) return { error: "Project name is required." };

    const { error } = await supabase
      .from("projects")
      .update({
        name: projectName,
        description: str(formData, "description"),
        start_date: str(formData, "start_date"),
        end_date: str(formData, "end_date"),
        status: (str(formData, "status") as ProjectStatus) ?? "PLANNED",
        notes: str(formData, "notes"),
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
    if (error) return { error: friendly(error.message) };
    revalidatePath("/admin", "layout");
    return { success: true };
  } catch (e) {
    return { error: friendly((e as Error).message) };
  }
}

export async function deleteProject(projectId: string): Promise<Result> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("projects").delete().eq("id", projectId);
    if (error) return { error: friendly(error.message) };
    revalidatePath("/admin", "layout");
    return { success: true };
  } catch (e) {
    return { error: friendly((e as Error).message) };
  }
}

// ---------------------------------------------------------------------
// VIDEOS
// ---------------------------------------------------------------------

export async function createVideo(formData: FormData): Promise<Result> {
  try {
    const { supabase, user, name } = await requireAdmin();
    const client_id = str(formData, "client_id");
    const title = str(formData, "title");
    if (!client_id || !title) return { error: "Client and video title are required." };

    const status = (str(formData, "status") as VideoStatus) ?? "NOT_STARTED";
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("videos")
      .insert({
        client_id,
        project_id: str(formData, "project_id"),
        title,
        description: str(formData, "description"),
        price: num(formData, "price"),
        currency: str(formData, "currency") ?? "USD",
        status,
        due_date: str(formData, "due_date"),
        review_url: str(formData, "review_url"),
        delivery_url: str(formData, "delivery_url"),
        client_notes: str(formData, "client_notes"),
        admin_notes: str(formData, "admin_notes"),
        submitted_at: status === "SENT_FOR_REVIEW" ? now : null,
        approved_at: status === "APPROVED" ? now : null,
        delivered_at: status === "DELIVERED" ? now : null,
      })
      .select("id")
      .single();
    if (error) return { error: friendly(error.message) };

    await logActivity(supabase, { id: user.id, name }, `Created video "${title}"`, {
      client_id,
      project_id: str(formData, "project_id"),
      video_id: data.id,
    });
    revalidatePath("/admin", "layout");
    return { success: true, id: data.id };
  } catch (e) {
    return { error: friendly((e as Error).message) };
  }
}

export async function updateVideo(videoId: string, formData: FormData): Promise<Result> {
  try {
    const { supabase, user, name } = await requireAdmin();
    const title = str(formData, "title");
    if (!title) return { error: "Video title is required." };

    const { data: existing } = await supabase
      .from("videos")
      .select("status, title, client_id")
      .eq("id", videoId)
      .single();
    const nextStatus = (str(formData, "status") as VideoStatus) ?? existing?.status ?? "NOT_STARTED";

    const patch: Record<string, unknown> = {
      title,
      project_id: str(formData, "project_id"),
      description: str(formData, "description"),
      price: num(formData, "price"),
      currency: str(formData, "currency") ?? "USD",
      status: nextStatus,
      due_date: str(formData, "due_date"),
      review_url: str(formData, "review_url"),
      delivery_url: str(formData, "delivery_url"),
      client_notes: str(formData, "client_notes"),
      admin_notes: str(formData, "admin_notes"),
      updated_at: new Date().toISOString(),
    };

    if (existing && existing.status !== nextStatus) {
      if (nextStatus === "SENT_FOR_REVIEW") patch.submitted_at = new Date().toISOString();
      if (nextStatus === "APPROVED") patch.approved_at = new Date().toISOString();
      if (nextStatus === "DELIVERED") patch.delivered_at = new Date().toISOString();
    }

    const { error } = await supabase.from("videos").update(patch).eq("id", videoId);
    if (error) return { error: friendly(error.message) };

    if (existing && existing.status !== nextStatus) {
      await logActivity(
        supabase,
        { id: user.id, name },
        `Changed status from ${existing.status} to ${nextStatus} on "${title}"`,
        { client_id: existing.client_id, video_id: videoId }
      );
    } else {
      await logActivity(supabase, { id: user.id, name }, `Edited video "${title}"`, {
        client_id: existing?.client_id,
        video_id: videoId,
      });
    }

    revalidatePath("/admin", "layout");
    return { success: true };
  } catch (e) {
    return { error: friendly((e as Error).message) };
  }
}

export async function deleteVideo(videoId: string): Promise<Result> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("videos").delete().eq("id", videoId);
    if (error) return { error: friendly(error.message) };
  } catch (e) {
    return { error: friendly((e as Error).message) };
  }
  revalidatePath("/admin", "layout");
  redirect("/admin/videos");
}

// ---------------------------------------------------------------------
// PAYMENTS
// ---------------------------------------------------------------------

export async function recordPayment(formData: FormData): Promise<Result> {
  try {
    const { supabase, user, name } = await requireAdmin();
    const client_id = str(formData, "client_id");
    const amount = num(formData, "amount");
    if (!client_id || amount <= 0) return { error: "Client and a positive amount are required." };

    const video_id = str(formData, "video_id");
    const { error } = await supabase.from("payments").insert({
      client_id,
      video_id,
      amount,
      payment_date: str(formData, "payment_date") ?? new Date().toISOString().slice(0, 10),
      method: (str(formData, "method") as PaymentMethod) ?? "Cash",
      method_other: str(formData, "method_other"),
      notes: str(formData, "notes"),
      created_by: user.id,
    });
    if (error) return { error: friendly(error.message) };

    await logActivity(supabase, { id: user.id, name }, `Payment of ${amount} recorded`, { client_id, video_id });
    revalidatePath("/admin", "layout");
    return { success: true };
  } catch (e) {
    return { error: friendly((e as Error).message) };
  }
}

export async function updatePayment(paymentId: string, formData: FormData): Promise<Result> {
  try {
    const { supabase } = await requireAdmin();
    const amount = num(formData, "amount");
    if (amount <= 0) return { error: "Enter a positive amount." };

    const { error } = await supabase
      .from("payments")
      .update({
        video_id: str(formData, "video_id"),
        amount,
        payment_date: str(formData, "payment_date") ?? new Date().toISOString().slice(0, 10),
        method: (str(formData, "method") as PaymentMethod) ?? "Cash",
        method_other: str(formData, "method_other"),
        notes: str(formData, "notes"),
      })
      .eq("id", paymentId);
    if (error) return { error: friendly(error.message) };
    revalidatePath("/admin", "layout");
    return { success: true };
  } catch (e) {
    return { error: friendly((e as Error).message) };
  }
}

export async function deletePayment(paymentId: string): Promise<Result> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("payments").delete().eq("id", paymentId);
    if (error) return { error: friendly(error.message) };
    revalidatePath("/admin", "layout");
    return { success: true };
  } catch (e) {
    return { error: friendly((e as Error).message) };
  }
}

// ---------------------------------------------------------------------
// FEEDBACK (admin side)
// ---------------------------------------------------------------------

export async function deleteFeedback(feedbackId: string): Promise<Result> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("feedback").delete().eq("id", feedbackId);
    if (error) return { error: friendly(error.message) };
    revalidatePath("/admin", "layout");
    return { success: true };
  } catch (e) {
    return { error: friendly((e as Error).message) };
  }
}

// ---------------------------------------------------------------------
// SETTINGS
// ---------------------------------------------------------------------

export async function updateSettings(formData: FormData): Promise<Result> {
  try {
    const { supabase, user } = await requireAdmin();

    const displayName = str(formData, "admin_display_name");
    if (displayName) {
      await supabase.from("profiles").update({ full_name: displayName }).eq("id", user.id);
    }

    const color = str(formData, "primary_color") ?? "#E4432B";
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { error: "Primary color must look like #E4432B." };

    const { error } = await supabase
      .from("settings")
      .update({
        business_name: str(formData, "business_name") ?? "Adham Client Hub",
        logo_url: str(formData, "logo_url"),
        primary_color: color,
        default_currency: str(formData, "default_currency") ?? "USD",
        timezone: str(formData, "timezone") ?? "Asia/Damascus",
        date_format: str(formData, "date_format") ?? "DD/MM/YYYY",
        updated_at: new Date().toISOString(),
      })
      .eq("id", "00000000-0000-0000-0000-000000000001");
    if (error) return { error: friendly(error.message) };
    revalidatePath("/", "layout");
    return { success: true };
  } catch (e) {
    return { error: friendly((e as Error).message) };
  }
}

// ---------------------------------------------------------------------
// CLIENT PORTAL ACTIONS  (each one is enforced again inside the database)
// ---------------------------------------------------------------------

export async function approveVideo(videoId: string): Promise<Result> {
  const supabase = createServerClient();
  const { error } = await supabase.rpc("approve_video", { p_video_id: videoId });
  if (error) return { error: friendly(error.message) };
  revalidatePath("/client", "layout");
  revalidatePath("/admin", "layout");
  return { success: true };
}

export async function requestRevision(videoId: string, formData: FormData): Promise<Result> {
  const supabase = createServerClient();
  const message = str(formData, "message");
  if (!message) return { error: "Describe what needs to change." };

  const { error } = await supabase.rpc("request_revision", {
    p_video_id: videoId,
    p_message: message,
    p_link: str(formData, "link"),
  });
  if (error) return { error: friendly(error.message) };
  revalidatePath("/client", "layout");
  revalidatePath("/admin", "layout");
  return { success: true };
}

export async function submitFeedback(videoId: string, formData: FormData): Promise<Result> {
  const supabase = createServerClient();
  const message = str(formData, "message");
  if (!message) return { error: "Write a message first." };

  const { error } = await supabase.rpc("submit_feedback", {
    p_video_id: videoId,
    p_message: message,
    p_link: str(formData, "link"),
  });
  if (error) return { error: friendly(error.message) };
  revalidatePath("/client", "layout");
  revalidatePath("/admin", "layout");
  return { success: true };
}
