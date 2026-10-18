import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { VideoFinancials, VideoStatus } from "@/lib/database.types";

// `admin_notes` is deliberately NOT in this list. The database blocks every
// logged-in user from reading that column directly; admins fetch it through
// a separate protected function (see getVideoAdminNotes below).
const VIDEO_COLS =
  "id,title,client_id,project_id,description,price,currency,status,due_date,submitted_at,approved_at,approved_by,delivered_at,review_url,delivery_url,revision_count,client_notes,created_at,updated_at";

export async function getCurrentProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return profile;
}

export async function getSettings() {
  const supabase = createClient();
  const { data } = await supabase.from("settings").select("*").maybeSingle();
  return data;
}

// ---------------------------------------------------------------------
// ADMIN
// ---------------------------------------------------------------------

export async function getAdminDashboard() {
  const supabase = createClient();

  const [clientsRes, videosRes, paymentsRes] = await Promise.all([
    supabase.from("clients").select("id, status"),
    supabase.from("videos").select("id, status, price, delivered_at"),
    supabase.from("payments").select("amount, payment_date"),
  ]);

  const clients = clientsRes.data ?? [];
  const videos = videosRes.data ?? [];
  const payments = paymentsRes.data ?? [];

  const totalBilled = videos.reduce((sum, v) => sum + Number(v.price), 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthStartDate = monthStart.slice(0, 10);

  const deliveredThisMonth = videos.filter((v) => v.delivered_at && v.delivered_at >= monthStart);
  const paymentsThisMonth = payments
    .filter((p) => p.payment_date >= monthStartDate)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const countByStatus = (status: VideoStatus) => videos.filter((v) => v.status === status).length;

  return {
    totalClients: clients.length,
    activeClients: clients.filter((c) => c.status === "active").length,
    totalVideos: videos.length,
    videosInProgress: countByStatus("EDITING") + countByStatus("NOT_STARTED"),
    waitingForClient: countByStatus("SENT_FOR_REVIEW"),
    revisionRequired: countByStatus("REVISION_REQUESTED"),
    approvedVideos: countByStatus("APPROVED") + countByStatus("DELIVERED"),
    totalBilled,
    totalPaid,
    totalOutstanding: totalBilled - totalPaid,
    paymentsThisMonth,
    videosCompletedThisMonth: deliveredThisMonth.length,
    revenueThisMonth: deliveredThisMonth.reduce((sum, v) => sum + Number(v.price), 0),
  };
}

export async function getActionQueues() {
  const supabase = createClient();
  const { data } = await supabase
    .from("videos")
    .select("id, title, status, due_date, client:clients(id, company_name)")
    .order("due_date", { ascending: true, nullsFirst: false });

  const videos = data ?? [];
  return {
    myActions: videos.filter((v) =>
      (["NOT_STARTED", "EDITING", "REVISION_REQUESTED"] as VideoStatus[]).includes(v.status as VideoStatus)
    ),
    waitingForClient: videos.filter((v) => v.status === "SENT_FOR_REVIEW"),
  };
}

export async function getRecentActivity(opts: { clientId?: string; videoId?: string; limit?: number } = {}) {
  const supabase = createClient();
  let q = supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(opts.limit ?? 15);
  if (opts.clientId) q = q.eq("client_id", opts.clientId);
  if (opts.videoId) q = q.eq("video_id", opts.videoId);
  const { data } = await q;
  return data ?? [];
}

export async function getClients() {
  const supabase = createClient();
  const { data } = await supabase.from("clients").select("*").order("company_name");
  return data ?? [];
}

export async function getClientDetail(clientId: string) {
  const supabase = createClient();

  const [clientRes, projectsRes, videosRes, paymentsRes] = await Promise.all([
    supabase.from("clients").select("*").eq("id", clientId).maybeSingle(),
    supabase.from("projects").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
    supabase
      .from("videos")
      .select(`${VIDEO_COLS}, project:projects(name)`)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase.from("payments").select("amount").eq("client_id", clientId),
  ]);

  const videos = videosRes.data ?? [];
  const totalBilled = videos.reduce((sum, v) => sum + Number(v.price), 0);
  const totalPaid = (paymentsRes.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    client: clientRes.data,
    projects: projectsRes.data ?? [],
    videos,
    stats: {
      total: videos.length,
      completed: videos.filter((v) => v.status === "APPROVED" || v.status === "DELIVERED").length,
      inEditing: videos.filter((v) => v.status === "EDITING").length,
      waitingForFeedback: videos.filter((v) => v.status === "SENT_FOR_REVIEW").length,
      revisionRequired: videos.filter((v) => v.status === "REVISION_REQUESTED").length,
      notStarted: videos.filter((v) => v.status === "NOT_STARTED").length,
      totalBilled,
      totalPaid,
      totalOutstanding: totalBilled - totalPaid,
    },
  };
}

export async function getProjectsWithClients() {
  const supabase = createClient();
  const { data } = await supabase
    .from("projects")
    .select("*, client:clients(id, company_name)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getVideosWithRelations() {
  const supabase = createClient();
  const [videosRes, financialsRes] = await Promise.all([
    supabase
      .from("videos")
      .select(`${VIDEO_COLS}, client:clients(id, company_name), project:projects(id, name)`)
      .order("created_at", { ascending: false }),
    supabase.from("video_financials").select("*"),
  ]);

  const financialsByVideo = new Map<string, VideoFinancials>(
    (financialsRes.data ?? []).map((f: VideoFinancials) => [f.video_id, f])
  );
  return { videos: videosRes.data ?? [], financialsByVideo };
}

export async function getVideoAdminNotes(videoId: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.rpc("get_video_admin_notes", { p_video_id: videoId });
  return (data as string | null) ?? null;
}

export async function getVideoDetail(videoId: string) {
  const supabase = createClient();

  const [videoRes, financialsRes, paymentsRes, feedbackRes] = await Promise.all([
    supabase
      .from("videos")
      .select(`${VIDEO_COLS}, client:clients(id, company_name), project:projects(id, name)`)
      .eq("id", videoId)
      .maybeSingle(),
    supabase.from("video_financials").select("*").eq("video_id", videoId).maybeSingle(),
    supabase.from("payments").select("*").eq("video_id", videoId).order("payment_date", { ascending: false }),
    supabase.from("feedback").select("*").eq("video_id", videoId).order("created_at", { ascending: false }),
  ]);

  return {
    video: videoRes.data,
    financials: financialsRes.data as VideoFinancials | null,
    payments: paymentsRes.data ?? [],
    feedback: feedbackRes.data ?? [],
  };
}

export async function getPaymentsWithRelations() {
  const supabase = createClient();
  const { data } = await supabase
    .from("payments")
    .select("*, client:clients(id, company_name), video:videos(id, title)")
    .order("payment_date", { ascending: false });
  return data ?? [];
}

// Requires an authenticated admin caller — only invoke from pages already
// gated by AdminLayout. Enriches each portal login with its email and
// whether it's currently disabled (banned), which lives in auth.users and
// isn't visible through the regular RLS-scoped client.
export async function getClientAccounts(clientId: string) {
  const supabase = createClient();
  const { data: clientUsers } = await supabase
    .from("client_users")
    .select("*, profile:profiles(id, full_name)")
    .eq("client_id", clientId);

  if (!clientUsers || clientUsers.length === 0) return [];

  const admin = createAdminClient();
  return Promise.all(
    clientUsers.map(async (cu) => {
      const { data } = await admin.auth.admin.getUserById(cu.user_id);
      return {
        ...cu,
        email: data.user?.email ?? null,
        disabled: !!data.user?.banned_until && new Date(data.user.banned_until) > new Date(),
      };
    })
  );
}

// ---------------------------------------------------------------------
// CLIENT PORTAL
// ---------------------------------------------------------------------

export async function getMyClientId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("client_users").select("client_id").eq("user_id", user.id).limit(1).maybeSingle();
  return data?.client_id ?? null;
}
