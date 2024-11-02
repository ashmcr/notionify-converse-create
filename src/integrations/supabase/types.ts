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
          requirements_gathered: boolean | null
          template_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          conversation_data: Json
          created_at?: string
          id?: string
          requirements_gathered?: boolean | null
          template_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          conversation_data?: Json
          created_at?: string
          id?: string
          requirements_gathered?: boolean | null
          template_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
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
          notion_workspace_id: string | null
          openai_api_key: string | null
          openai_model: string | null
          openai_temperature: number | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at: string
        }
        Insert: {
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
          notion_workspace_id?: string | null
          openai_api_key?: string | null
          openai_model?: string | null
          openai_temperature?: number | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string
        }
        Update: {
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
          notion_workspace_id?: string | null
          openai_api_key?: string | null
          openai_model?: string | null
          openai_temperature?: number | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string
        }
        Relationships: []
      }
      shared_templates: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          permission_level: string | null
          shared_by: string | null
          shared_with: string | null
          template_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          permission_level?: string | null
          shared_by?: string | null
          shared_with?: string | null
          template_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          permission_level?: string | null
          shared_by?: string | null
          shared_with?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_templates_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_templates_shared_with_fkey"
            columns: ["shared_with"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_templates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_analytics: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_analytics_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      template_components: {
        Row: {
          component_data: Json
          component_type: Database["public"]["Enums"]["notion_block_type"]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          component_data: Json
          component_type: Database["public"]["Enums"]["notion_block_type"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          component_data?: Json
          component_type?: Database["public"]["Enums"]["notion_block_type"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_components_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      template_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number | null
          template_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          template_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          template_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_feedback_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      template_versions: {
        Row: {
          changes_description: string | null
          created_at: string
          created_by: string | null
          id: string
          template_data: Json
          template_id: string | null
          version_number: number
        }
        Insert: {
          changes_description?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          template_data: Json
          template_id?: string | null
          version_number: number
        }
        Update: {
          changes_description?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          template_data?: Json
          template_id?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: Database["public"]["Enums"]["template_category"]
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          notion_template_id: string | null
          preview_image_url: string | null
          published_at: string | null
          rating_avg: number | null
          rating_count: number | null
          status: Database["public"]["Enums"]["template_status"] | null
          template_data: Json
          updated_at: string
          usage_count: number | null
          user_id: string | null
          version: number | null
        }
        Insert: {
          category: Database["public"]["Enums"]["template_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          notion_template_id?: string | null
          preview_image_url?: string | null
          published_at?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          status?: Database["public"]["Enums"]["template_status"] | null
          template_data: Json
          updated_at?: string
          usage_count?: number | null
          user_id?: string | null
          version?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["template_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          notion_template_id?: string | null
          preview_image_url?: string | null
          published_at?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          status?: Database["public"]["Enums"]["template_status"] | null
          template_data?: Json
          updated_at?: string
          usage_count?: number | null
          user_id?: string | null
          version?: number | null
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
      reset_monthly_template_counters: {
        Args: Record<PropertyKey, never>
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
