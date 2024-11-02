export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      conversations: {
        Row: {
          conversation_data: Json
          created_at: string
          id: string
          initial_prompt: string | null
          notion_page_id: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          conversation_data: Json
          created_at?: string
          id?: string
          initial_prompt?: string | null
          notion_page_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          conversation_data?: Json
          created_at?: string
          id?: string
          initial_prompt?: string | null
          notion_page_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          api_calls_count: number | null
          api_calls_reset_at: string | null
          avatar_url: string | null
          created_at: string
          current_month_templates: number | null
          email: string
          full_name: string | null
          id: string
          last_login: string | null
          monthly_template_limit: number | null
          notion_access_token: string | null
          notion_default_page_id: string | null
          notion_template_db_id: string | null
          notion_workspace_id: string | null
          openai_api_key: string | null
          openai_model: string | null
          openai_temperature: number | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          template_db_installed: boolean | null
          template_db_installed_at: string | null
          updated_at: string
        }
        Insert: {
          api_calls_count?: number | null
          api_calls_reset_at?: string | null
          avatar_url?: string | null
          created_at?: string
          current_month_templates?: number | null
          email: string
          full_name?: string | null
          id: string
          last_login?: string | null
          monthly_template_limit?: number | null
          notion_access_token?: string | null
          notion_default_page_id?: string | null
          notion_template_db_id?: string | null
          notion_workspace_id?: string | null
          openai_api_key?: string | null
          openai_model?: string | null
          openai_temperature?: number | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          template_db_installed?: boolean | null
          template_db_installed_at?: string | null
          updated_at?: string
        }
        Update: {
          api_calls_count?: number | null
          api_calls_reset_at?: string | null
          avatar_url?: string | null
          created_at?: string
          current_month_templates?: number | null
          email?: string
          full_name?: string | null
          id?: string
          last_login?: string | null
          monthly_template_limit?: number | null
          notion_access_token?: string | null
          notion_default_page_id?: string | null
          notion_template_db_id?: string | null
          notion_workspace_id?: string | null
          openai_api_key?: string | null
          openai_model?: string | null
          openai_temperature?: number | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          template_db_installed?: boolean | null
          template_db_installed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      template_feedback: {
        Row: {
          created_at: string
          feedback_text: string | null
          id: string
          notion_page_id: string
          rating: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          notion_page_id: string
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          notion_page_id?: string
          rating?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      template_generations: {
        Row: {
          ai_settings: Json | null
          created_at: string
          description: string | null
          id: string
          name: string
          notion_page_id: string | null
          notion_template_id: string | null
          prompt_text: string | null
          published_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_settings?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          notion_page_id?: string | null
          notion_template_id?: string | null
          prompt_text?: string | null
          published_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_settings?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          notion_page_id?: string | null
          notion_template_id?: string | null
          prompt_text?: string | null
          published_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_template_usage: {
        Args: {
          template_id: string
        }
        Returns: undefined
      }
      reset_api_calls: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reset_monthly_template_counters: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      track_template_creation: {
        Args: {
          user_id: string
          template_name: string
          template_cat: Database["public"]["Enums"]["template_category"]
          page_id: string
          prompt: string
          ai_config?: Json
        }
        Returns: string
      }
      track_template_db_installation: {
        Args: {
          user_id: string
          db_id: string
        }
        Returns: undefined
      }
      update_template_rating: {
        Args: {
          template_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      notion_block_type:
        | "page"
        | "database"
        | "todo"
        | "calendar"
        | "gallery"
        | "board"
      subscription_tier: "free" | "pro" | "enterprise"
      template_category:
        | "project_management"
        | "personal_organization"
        | "content_planning"
        | "knowledge_base"
        | "custom"
      template_status: "draft" | "published" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
