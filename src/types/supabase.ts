export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export interface AdminUser {
  user_id: string;
  created_at: string;
}

export interface Project {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string | null;
  client_name_ar: string | null;
  client_name_en: string | null;
  type_ar: string;
  type_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  image_bucket: string | null;
  image_path: string | null;
  image_alt_ar: string | null;
  image_alt_en: string | null;
  external_url: string | null;
  cta_label_ar: string | null;
  cta_label_en: string | null;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  metadata: JsonValue;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string | null;
  title_ar: string | null;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  price: number | null;
  old_price: number | null;
  currency: string;
  badge_ar: string | null;
  badge_en: string | null;
  image_bucket: string | null;
  image_path: string | null;
  image_alt_ar: string | null;
  image_alt_en: string | null;
  whatsapp_text_ar: string | null;
  whatsapp_text_en: string | null;
  cta_label_ar: string | null;
  cta_label_en: string | null;
  cta_url: string | null;
  features_ar: string[];
  features_en: string[];
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  metadata: JsonValue;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: AdminUser;
        Insert: Partial<AdminUser> & Pick<AdminUser, "user_id">;
        Update: Partial<AdminUser>;
        Relationships: [];
      };
      projects: {
        Row: Project;
        Insert: Partial<Project> & Pick<Project, "slug" | "title_ar" | "type_ar"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Project>;
        Relationships: [];
      };
      offers: {
        Row: Offer;
        Insert: Partial<Offer> & Pick<Offer, "slug" | "name_ar"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Offer>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
