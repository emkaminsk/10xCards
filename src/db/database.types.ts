export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      cards: {
        Row: {
          back: string
          context: string | null
          created_at: string
          deleted_at: string | null
          front: string
          id: string
          import_session_id: string | null
          status: Database["public"]["Enums"]["card_status"]
          tags: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          back: string
          context?: string | null
          created_at?: string
          deleted_at?: string | null
          front: string
          id?: string
          import_session_id?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          tags?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          context?: string | null
          created_at?: string
          deleted_at?: string | null
          front?: string
          id?: string
          import_session_id?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          tags?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_import_session_id_fkey"
            columns: ["import_session_id"]
            isOneToOne: false
            referencedRelation: "import_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      import_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          source_content: string | null
          source_url: string | null
          total_accepted: number | null
          total_generated: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          source_content?: string | null
          source_url?: string | null
          total_accepted?: number | null
          total_generated?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          source_content?: string | null
          source_url?: string | null
          total_accepted?: number | null
          total_generated?: number | null
          user_id?: string
        }
        Relationships: []
      }
      leitner_boxes: {
        Row: {
          box_level: number
          card_id: string
          created_at: string
          id: string
          next_review_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          box_level?: number
          card_id: string
          created_at?: string
          id?: string
          next_review_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          box_level?: number
          card_id?: string
          created_at?: string
          id?: string
          next_review_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leitner_boxes_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      proposed_cards: {
        Row: {
          back: string
          context: string | null
          created_at: string
          expires_at: string
          front: string
          id: string
          import_session_id: string
          is_selected: boolean
          tags: Json | null
          user_id: string
        }
        Insert: {
          back: string
          context?: string | null
          created_at?: string
          expires_at?: string
          front: string
          id?: string
          import_session_id: string
          is_selected?: boolean
          tags?: Json | null
          user_id: string
        }
        Update: {
          back?: string
          context?: string | null
          created_at?: string
          expires_at?: string
          front?: string
          id?: string
          import_session_id?: string
          is_selected?: boolean
          tags?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposed_cards_import_session_id_fkey"
            columns: ["import_session_id"]
            isOneToOne: false
            referencedRelation: "import_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          box_level_after: number
          box_level_before: number
          card_id: string
          created_at: string
          id: string
          rating: Database["public"]["Enums"]["review_rating"]
          response_time_ms: number | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          box_level_after: number
          box_level_before: number
          card_id: string
          created_at?: string
          id?: string
          rating: Database["public"]["Enums"]["review_rating"]
          response_time_ms?: number | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          box_level_after?: number
          box_level_before?: number
          card_id?: string
          created_at?: string
          id?: string
          rating?: Database["public"]["Enums"]["review_rating"]
          response_time_ms?: number | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          proficiency_level: Database["public"]["Enums"]["proficiency_level"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          proficiency_level?: Database["public"]["Enums"]["proficiency_level"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          proficiency_level?: Database["public"]["Enums"]["proficiency_level"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_proposals: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      card_status: "active" | "archived"
      proficiency_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
      review_rating: "again" | "hard" | "good" | "easy"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      card_status: ["active", "archived"],
      proficiency_level: ["A1", "A2", "B1", "B2", "C1", "C2"],
      review_rating: ["again", "hard", "good", "easy"],
    },
  },
} as const

