export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrganizationRole = "owner" | "member";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "booked"
  | "lost";

export type LeadSource = "manual" | "missed_call" | "inbound_sms" | "web_form";

export type SubscriptionStatus =
  | "inactive"
  | "on_trial"
  | "active"
  | "paused"
  | "past_due"
  | "unpaid"
  | "cancelled"
  | "expired";

export type Organization = {
  id: string;
  name: string;
  slug: string | null;
  business_type: string;
  service_area: string | null;
  business_hours: string | null;
  owner_name: string | null;
  business_phone: string | null;
  twilio_number: string | null;
  owner_phone: string | null;
  api_key: string;
  lemon_squeezy_customer_id: string | null;
  lemon_squeezy_subscription_id: string | null;
  lemon_squeezy_order_id: string | null;
  lemon_squeezy_variant_id: string | null;
  lemon_squeezy_product_id: string | null;
  subscription_status: SubscriptionStatus;
  subscription_renews_at: string | null;
  subscription_ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  organization_id: string;
  full_name: string;
  role: OrganizationRole;
  created_at: string;
  updated_at: string;
};

export type Lead = {
  id: string;
  organization_id: string;
  lead_phone: string;
  status: LeadStatus;
  source: LeadSource;
  handoff_sent: boolean;
  message_history: string;
  project_need: string | null;
  timeline: string | null;
  location: string | null;
  callback_number: string | null;
  notes: string | null;
  call_sid: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: Partial<Organization> & Pick<Organization, "name">;
        Update: Partial<Organization>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Pick<Profile, "id" | "organization_id"> & Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: Lead;
        Insert: Pick<Lead, "organization_id" | "lead_phone"> & Partial<Lead>;
        Update: Partial<Lead>;
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_organization_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_organization_member: {
        Args: { target_org: string };
        Returns: boolean;
      };
      is_organization_owner: {
        Args: { target_org: string };
        Returns: boolean;
      };
    };
    Enums: {
      organization_role: OrganizationRole;
      lead_status: LeadStatus;
      lead_source: LeadSource;
    };
  };
};
