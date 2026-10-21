export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      data_sources: {
        Row: {
          created_at: string
          docs_url: string | null
          enabled: boolean
          id: string
          kind: Database["public"]["Enums"]["source_kind"]
          name: string
          notes: string | null
          platform: Database["public"]["Enums"]["social_platform"] | null
          secret_name: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          docs_url?: string | null
          enabled?: boolean
          id?: string
          kind: Database["public"]["Enums"]["source_kind"]
          name: string
          notes?: string | null
          platform?: Database["public"]["Enums"]["social_platform"] | null
          secret_name?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          docs_url?: string | null
          enabled?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["source_kind"]
          name?: string
          notes?: string | null
          platform?: Database["public"]["Enums"]["social_platform"] | null
          secret_name?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      ingest_runs: {
        Row: {
          created_by: string | null
          errors: Json
          file_name: string | null
          finished_at: string | null
          id: string
          method: string
          rows_failed: number
          rows_ok: number
          rows_total: number
          source_id: string | null
          started_at: string
          status: string
        }
        Insert: {
          created_by?: string | null
          errors?: Json
          file_name?: string | null
          finished_at?: string | null
          id?: string
          method: string
          rows_failed?: number
          rows_ok?: number
          rows_total?: number
          source_id?: string | null
          started_at?: string
          status?: string
        }
        Update: {
          created_by?: string | null
          errors?: Json
          file_name?: string | null
          finished_at?: string | null
          id?: string
          method?: string
          rows_failed?: number
          rows_ok?: number
          rows_total?: number
          source_id?: string | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingest_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_snapshots: {
        Row: {
          account_id: string
          approved: boolean
          avg_comments: number | null
          avg_likes: number | null
          captured_at: string
          created_at: string
          engagement_rate: number | null
          followers: number | null
          following: number | null
          id: string
          ingest_run_id: string | null
          is_estimate: boolean
          posts: number | null
          source_id: string
          total_views: number | null
        }
        Insert: {
          account_id: string
          approved?: boolean
          avg_comments?: number | null
          avg_likes?: number | null
          captured_at: string
          created_at?: string
          engagement_rate?: number | null
          followers?: number | null
          following?: number | null
          id?: string
          ingest_run_id?: string | null
          is_estimate?: boolean
          posts?: number | null
          source_id: string
          total_views?: number | null
        }
        Update: {
          account_id?: string
          approved?: boolean
          avg_comments?: number | null
          avg_likes?: number | null
          captured_at?: string
          created_at?: string
          engagement_rate?: number | null
          followers?: number | null
          following?: number | null
          id?: string
          ingest_run_id?: string | null
          is_estimate?: boolean
          posts?: number | null
          source_id?: string
          total_views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metric_snapshots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_snapshots_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country_code: string
          created_at: string
          id: string
          is_demo: boolean
          name: string
          party: string | null
          political_office: string | null
          slug: string
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country_code: string
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
          party?: string | null
          political_office?: string | null
          slug: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country_code?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
          party?: string | null
          political_office?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: []
      }
      person_categories: {
        Row: {
          category_id: string
          person_id: string
        }
        Insert: {
          category_id: string
          person_id: string
        }
        Update: {
          category_id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_categories_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          created_at: string
          external_id: string | null
          handle: string
          id: string
          person_id: string
          platform: Database["public"]["Enums"]["social_platform"]
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          handle: string
          id?: string
          person_id: string
          platform: Database["public"]["Enums"]["social_platform"]
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          external_id?: string | null
          handle?: string
          id?: string
          person_id?: string
          platform?: Database["public"]["Enums"]["social_platform"]
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_ranking: {
        Args: {
          p_category?: string
          p_country?: string
          p_limit?: number
          p_office?: string
          p_offset?: number
          p_party?: string
          p_period_days?: number
          p_platform?: string
          p_region?: string
          p_search?: string
          p_sort?: string
        }
        Returns: {
          account_id: string
          avatar_url: string
          captured_at: string
          country_code: string
          engagement_rate: number
          followers: number
          followers_prev: number
          gain: number
          growth_pct: number
          handle: string
          is_demo: boolean
          is_estimate: boolean
          name: string
          party: string
          person_id: string
          platform: Database["public"]["Enums"]["social_platform"]
          political_office: string
          prev_captured_at: string
          slug: string
          source_name: string
          total_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor"
      record_status: "draft" | "approved" | "archived"
      social_platform: "instagram" | "tiktok" | "youtube" | "facebook" | "x"
      source_kind:
        | "official_api"
        | "licensed_provider"
        | "manual"
        | "csv"
        | "demo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor"],
      record_status: ["draft", "approved", "archived"],
      social_platform: ["instagram", "tiktok", "youtube", "facebook", "x"],
      source_kind: [
        "official_api",
        "licensed_provider",
        "manual",
        "csv",
        "demo",
      ],
    },
  },
} as const