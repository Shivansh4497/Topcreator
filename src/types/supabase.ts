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
      channels: {
        Row: {
          access_token: string | null
          avg_engagement_rate: number | null
          avg_saves_rate: number | null
          created_at: string
          fetched_at: string | null
          follower_count: number | null
          id: string
          instagram_user_id: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          access_token?: string | null
          avg_engagement_rate?: number | null
          avg_saves_rate?: number | null
          created_at?: string
          fetched_at?: string | null
          follower_count?: number | null
          id?: string
          instagram_user_id?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          access_token?: string | null
          avg_engagement_rate?: number | null
          avg_saves_rate?: number | null
          created_at?: string
          fetched_at?: string | null
          follower_count?: number | null
          id?: string
          instagram_user_id?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          caption_angle: string | null
          comparable_creator: string | null
          comparable_engagement: string | null
          created_at: string
          hook: string | null
          id: string
          reasoning: string | null
          recommended_format:
            | Database["public"]["Enums"]["media_type_enum"]
            | null
          recommended_topic: string | null
          risk: string | null
          status: Database["public"]["Enums"]["decision_status_enum"] | null
          user_id: string | null
          week_of: string | null
        }
        Insert: {
          caption_angle?: string | null
          comparable_creator?: string | null
          comparable_engagement?: string | null
          created_at?: string
          hook?: string | null
          id?: string
          reasoning?: string | null
          recommended_format?:
            | Database["public"]["Enums"]["media_type_enum"]
            | null
          recommended_topic?: string | null
          risk?: string | null
          status?: Database["public"]["Enums"]["decision_status_enum"] | null
          user_id?: string | null
          week_of?: string | null
        }
        Update: {
          caption_angle?: string | null
          comparable_creator?: string | null
          comparable_engagement?: string | null
          created_at?: string
          hook?: string | null
          id?: string
          reasoning?: string | null
          recommended_format?:
            | Database["public"]["Enums"]["media_type_enum"]
            | null
          recommended_topic?: string | null
          risk?: string | null
          status?: Database["public"]["Enums"]["decision_status_enum"] | null
          user_id?: string | null
          week_of?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          caption: string | null
          channel_id: string | null
          comment_sentiment:
            | Database["public"]["Enums"]["comment_sentiment_enum"]
            | null
          comment_top_theme: string | null
          comments_count: number | null
          engagement_rate: number | null
          fetched_at: string
          hashtags: string[] | null
          id: string
          impressions: number | null
          instagram_media_id: string | null
          media_type: Database["public"]["Enums"]["media_type_enum"] | null
          plays: number | null
          published_at: string | null
          reach: number | null
          saves: number | null
          saves_rate: number | null
          shares: number | null
        }
        Insert: {
          caption?: string | null
          channel_id?: string | null
          comment_sentiment?:
            | Database["public"]["Enums"]["comment_sentiment_enum"]
            | null
          comment_top_theme?: string | null
          comments_count?: number | null
          engagement_rate?: number | null
          fetched_at?: string
          hashtags?: string[] | null
          id?: string
          impressions?: number | null
          instagram_media_id?: string | null
          media_type?: Database["public"]["Enums"]["media_type_enum"] | null
          plays?: number | null
          published_at?: string | null
          reach?: number | null
          saves?: number | null
          saves_rate?: number | null
          shares?: number | null
        }
        Update: {
          caption?: string | null
          channel_id?: string | null
          comment_sentiment?:
            | Database["public"]["Enums"]["comment_sentiment_enum"]
            | null
          comment_top_theme?: string | null
          comments_count?: number | null
          engagement_rate?: number | null
          fetched_at?: string
          hashtags?: string[] | null
          id?: string
          impressions?: number | null
          instagram_media_id?: string | null
          media_type?: Database["public"]["Enums"]["media_type_enum"] | null
          plays?: number | null
          published_at?: string | null
          reach?: number | null
          saves?: number | null
          saves_rate?: number | null
          shares?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_scores: {
        Row: {
          alternative_angle: string | null
          authority_score: number | null
          competition_score: number | null
          created_at: string
          demand_score: number | null
          id: string
          score: number | null
          topic_input: string | null
          trend_score: number | null
          user_id: string | null
          verdict: Database["public"]["Enums"]["verdict_enum"] | null
        }
        Insert: {
          alternative_angle?: string | null
          authority_score?: number | null
          competition_score?: number | null
          created_at?: string
          demand_score?: number | null
          id?: string
          score?: number | null
          topic_input?: string | null
          trend_score?: number | null
          user_id?: string | null
          verdict?: Database["public"]["Enums"]["verdict_enum"] | null
        }
        Update: {
          alternative_angle?: string | null
          authority_score?: number | null
          competition_score?: number | null
          created_at?: string
          demand_score?: number | null
          id?: string
          score?: number | null
          topic_input?: string | null
          trend_score?: number | null
          user_id?: string | null
          verdict?: Database["public"]["Enums"]["verdict_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          goal: string | null
          id: string
          niche: Database["public"]["Enums"]["niche_enum"] | null
        }
        Insert: {
          created_at?: string
          email: string
          goal?: string | null
          id?: string
          niche?: Database["public"]["Enums"]["niche_enum"] | null
        }
        Update: {
          created_at?: string
          email?: string
          goal?: string | null
          id?: string
          niche?: Database["public"]["Enums"]["niche_enum"] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      comment_sentiment_enum: "positive" | "negative" | "mixed"
      decision_status_enum: "pending" | "made_it" | "skipped"
      media_type_enum: "REEL" | "IMAGE" | "CAROUSEL"
      niche_enum:
        | "Education"
        | "Finance"
        | "Technology"
        | "Lifestyle"
        | "Fitness"
        | "Other"
      verdict_enum: "go" | "caution" | "avoid"
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
      comment_sentiment_enum: ["positive", "negative", "mixed"],
      decision_status_enum: ["pending", "made_it", "skipped"],
      media_type_enum: ["REEL", "IMAGE", "CAROUSEL"],
      niche_enum: [
        "Education",
        "Finance",
        "Technology",
        "Lifestyle",
        "Fitness",
        "Other",
      ],
      verdict_enum: ["go", "caution", "avoid"],
    },
  },
} as const

