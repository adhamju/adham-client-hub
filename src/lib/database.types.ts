export type Role = "admin" | "client";
export type ClientStatus = "active" | "archived";
export type ProjectStatus = "PLANNED" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type VideoStatus =
  | "NOT_STARTED"
  | "EDITING"
  | "SENT_FOR_REVIEW"
  | "REVISION_REQUESTED"
  | "APPROVED"
  | "DELIVERED";
export type PaymentMethod = "Cash" | "Bank Transfer" | "Wise" | "PayPal" | "Other";
export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";

export interface Profile {
  id: string;
  full_name: string | null;
  role: Role;
  created_at: string;
}

export interface Settings {
  id: string;
  business_name: string;
  logo_url: string | null;
  primary_color: string;
  default_currency: string;
  timezone: string;
  date_format: string;
  updated_at: string;
}

export interface Client {
  id: string;
  company_name: string;
  logo_url: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  currency: string;
  notes: string | null;
  status: ClientStatus;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  title: string;
  client_id: string;
  project_id: string | null;
  description: string | null;
  price: number;
  currency: string;
  status: VideoStatus;
  due_date: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  delivered_at: string | null;
  review_url: string | null;
  delivery_url: string | null;
  revision_count: number;
  client_notes: string | null;
  /** Only ever present for admins (fetched through a protected function). */
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VideoFinancials {
  video_id: string;
  price: number;
  amount_paid: number;
  amount_remaining: number;
  payment_status: PaymentStatus;
}

export interface Payment {
  id: string;
  client_id: string;
  video_id: string | null;
  amount: number;
  payment_date: string;
  method: PaymentMethod;
  method_other: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  video_id: string;
  client_id: string;
  user_id: string | null;
  message: string;
  link: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action_text: string;
  client_id: string | null;
  project_id: string | null;
  video_id: string | null;
  created_at: string;
}
