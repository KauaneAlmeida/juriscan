// Types for Supabase Database
// These types will be auto-generated from Supabase once connected

export type UserRole = "USER" | "ADMIN" | "SUPPORT";
export type UserStatus = "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DELETED";

export interface User {
  id: string;
  email: string;
  email_verified_at: string | null;
  name: string;
  oab: string | null;
  phone: string | null;
  avatar_url: string | null;
  law_firm: string | null;
  practice_areas: string[];
  role: UserRole;
  status: UserStatus;
  terms_accepted_at: string | null;
  privacy_accepted_at: string | null;
  marketing_consent: boolean;
  analytics_consent: boolean;
  share_data_improvements: boolean;
  usage_analytics: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  last_login_at: string | null;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  oab: string | null;
  oab_verified: boolean;
  oab_verified_at: string | null;
  phone: string | null;
  avatar_url: string | null;
  law_firm: string | null;
  practice_areas: string[];
  role: UserRole;
  status: UserStatus;
  terms_accepted_at: string | null;
  privacy_accepted_at: string | null;
  marketing_consent: boolean;
  analytics_consent: boolean;
  share_data_improvements: boolean;
  usage_analytics: boolean;
  email_normalized: string | null;
  welcome_credits_granted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  last_login_at: string | null;
}

export interface Session {
  id: string;
  user_id: string;
  device_info: string | null;
  device_type: "DESKTOP" | "MOBILE" | "TABLET";
  ip_address: string | null;
  location: string | null;
  last_active_at: string;
  expires_at: string;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  monthly_credits: number;
  features: string[];
  pagarme_plan_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  pagarme_subscription_id: string | null;
  pagarme_customer_id: string | null;
  payment_method: string;
  status: "active" | "past_due" | "canceled" | "paused" | "trialing" | "incomplete";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditBalance {
  id: string;
  user_id: string;
  balance: number;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  type: "purchase" | "subscription" | "usage" | "bonus" | "refund";
  amount: number;
  description: string;
  created_at: string;
}

export interface Analysis {
  id: string;
  user_id: string;
  conversation_id: string | null;
  process_number: string | null;
  case_type: string | null;
  tribunal: string | null;
  court: string | null;
  judge: string | null;
  relator: string | null;
  prediction: number | null;
  confidence: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  summary: string | null;
  key_points: string[] | null;
  recommendations: string[] | null;
  risks: string[] | null;
  credits_used: number;
  processing_time: number | null;
  ai_model: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  status: "ACTIVE" | "ARCHIVED" | "DELETED";
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  analysis_id: string | null;
  title: string;
  type: "PREDICTIVE_ANALYSIS" | "JURIMETRICS" | "EXECUTIVE_SUMMARY" | "RELATOR_PROFILE" | "CUSTOM";
  version: string;
  content: Record<string, unknown>;
  file_url: string | null;
  file_size: number | null;
  page_count: number | null;
  credits_used: number;
  status: "DRAFT" | "GENERATING" | "COMPLETED" | "FAILED";
  created_at: string;
  updated_at: string;
  generated_at: string | null;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  analysis_completed: boolean;
  report_generated: boolean;
  deadline_alerts: boolean;
  low_credits: boolean;
  product_updates: boolean;
  marketing_emails: boolean;
  push_enabled: boolean;
  updated_at: string;
}

export type NotificationType =
  | "analysis_completed"
  | "report_generated"
  | "deadline_alert"
  | "low_credits"
  | "product_update"
  | "system";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ProcessedWebhookEvent {
  id: string;
  event_id: string;
  event_type: string;
  processed_at: string;
}

export interface PaymentHistory {
  id: string;
  user_id: string;
  pagarme_charge_id: string | null;
  amount_cents: number;
  status: string;
  payment_method: string | null;
  type: string;
  metadata: Record<string, unknown>;
  paid_at: string | null;
  created_at: string;
}

export interface SignupAttempt {
  id: string;
  ip_address: string;
  email: string;
  email_normalized: string;
  fingerprint: string | null;
  blocked: boolean;
  block_reason: string | null;
  created_at: string;
}

// Database type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
        Relationships: [];
      };
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<User, "id" | "created_at">>;
        Relationships: [];
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, "id" | "created_at">;
        Update: Partial<Omit<Session, "id" | "created_at">>;
        Relationships: [];
      };
      plans: {
        Row: Plan;
        Insert: Omit<Plan, "id" | "created_at">;
        Update: Partial<Omit<Plan, "id" | "created_at">>;
        Relationships: [];
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Subscription, "id" | "created_at">>;
        Relationships: [];
      };
      credit_balances: {
        Row: CreditBalance;
        Insert: Omit<CreditBalance, "id">;
        Update: Partial<Omit<CreditBalance, "id">>;
        Relationships: [];
      };
      credit_transactions: {
        Row: CreditTransaction;
        Insert: Omit<CreditTransaction, "id" | "created_at">;
        Update: never;
        Relationships: [];
      };
      analyses: {
        Row: Analysis;
        Insert: Omit<Analysis, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Analysis, "id" | "created_at">>;
        Relationships: [];
      };
      conversations: {
        Row: Conversation;
        Insert: Omit<Conversation, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Conversation, "id" | "created_at">>;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, "id" | "created_at">;
        Update: never;
        Relationships: [];
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Report, "id" | "created_at">>;
        Relationships: [];
      };
      notification_preferences: {
        Row: NotificationPreference;
        Insert: Omit<NotificationPreference, "id">;
        Update: Partial<Omit<NotificationPreference, "id">>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at">;
        Update: Partial<Omit<Notification, "id" | "created_at">>;
        Relationships: [];
      };
      processed_webhook_events: {
        Row: ProcessedWebhookEvent;
        Insert: Omit<ProcessedWebhookEvent, "id">;
        Update: never;
        Relationships: [];
      };
      payment_history: {
        Row: PaymentHistory;
        Insert: Omit<PaymentHistory, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<PaymentHistory, "id" | "created_at">>;
        Relationships: [];
      };
      signup_attempts: {
        Row: SignupAttempt;
        Insert: Omit<SignupAttempt, "id" | "created_at" | "blocked" | "block_reason" | "fingerprint"> & {
          blocked?: boolean;
          block_reason?: string | null;
          fingerprint?: string | null;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      send_notification: {
        Args: {
          p_user_id: string;
          p_type: string;
          p_title: string;
          p_message: string;
          p_data?: Record<string, unknown>;
        };
        Returns: string | null;
      };
      grant_welcome_credits: {
        Args: {
          p_user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
