export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      automation_logs: {
        Row: {
          created_at: string;
          details: Json;
          event_type: string;
          generated_content_id: string | null;
          generated_image_id: string | null;
          id: string;
          level: string;
          message: string;
          pinterest_post_id: string | null;
          product_id: string | null;
          run_id: string | null;
          source_system: string;
        };
        Insert: {
          created_at?: string;
          details?: Json;
          event_type: string;
          generated_content_id?: string | null;
          generated_image_id?: string | null;
          id?: string;
          level?: string;
          message: string;
          pinterest_post_id?: string | null;
          product_id?: string | null;
          run_id?: string | null;
          source_system?: string;
        };
        Update: {
          created_at?: string;
          details?: Json;
          event_type?: string;
          generated_content_id?: string | null;
          generated_image_id?: string | null;
          id?: string;
          level?: string;
          message?: string;
          pinterest_post_id?: string | null;
          product_id?: string | null;
          run_id?: string | null;
          source_system?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automation_logs_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      campaign_products: {
        Row: {
          campaign_id: string;
          created_at: string;
          id: string;
          position: number;
          product_name: string;
          source_url: string | null;
          trend_note: string | null;
          updated_at: string;
        };
        Insert: {
          campaign_id: string;
          created_at?: string;
          id?: string;
          position?: number;
          product_name: string;
          source_url?: string | null;
          trend_note?: string | null;
          updated_at?: string;
        };
        Update: {
          campaign_id?: string;
          created_at?: string;
          id?: string;
          position?: number;
          product_name?: string;
          source_url?: string | null;
          trend_note?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_products_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      campaigns: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          niche: string | null;
          owner_id: string;
          scheduled_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          niche?: string | null;
          owner_id: string;
          scheduled_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          niche?: string | null;
          owner_id?: string;
          scheduled_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      generated_content: {
        Row: {
          affiliate_cta: string | null;
          affiliate_link: string | null;
          alt_text: string | null;
          campaign_product_id: string | null;
          created_at: string;
          description: string | null;
          hashtags: string[] | null;
          headline: string | null;
          id: string;
          image_prompt: string | null;
          image_url: string | null;
          model_name: string | null;
          pin_description: string | null;
          pinterest_description: string | null;
          pinterest_title: string | null;
          product_id: string | null;
          prompt_payload: Json;
          prompt_version: string | null;
          response_payload: Json;
          seo_keywords: string[] | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          affiliate_cta?: string | null;
          affiliate_link?: string | null;
          alt_text?: string | null;
          campaign_product_id?: string | null;
          created_at?: string;
          description?: string | null;
          hashtags?: string[] | null;
          headline?: string | null;
          id?: string;
          image_prompt?: string | null;
          image_url?: string | null;
          model_name?: string | null;
          pin_description?: string | null;
          pinterest_description?: string | null;
          pinterest_title?: string | null;
          product_id?: string | null;
          prompt_payload?: Json;
          prompt_version?: string | null;
          response_payload?: Json;
          seo_keywords?: string[] | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          affiliate_cta?: string | null;
          affiliate_link?: string | null;
          alt_text?: string | null;
          campaign_product_id?: string | null;
          created_at?: string;
          description?: string | null;
          hashtags?: string[] | null;
          headline?: string | null;
          id?: string;
          image_prompt?: string | null;
          image_url?: string | null;
          model_name?: string | null;
          pin_description?: string | null;
          pinterest_description?: string | null;
          pinterest_title?: string | null;
          product_id?: string | null;
          prompt_payload?: Json;
          prompt_version?: string | null;
          response_payload?: Json;
          seo_keywords?: string[] | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generated_content_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generated_content_campaign_product_id_fkey";
            columns: ["campaign_product_id"];
            isOneToOne: true;
            referencedRelation: "campaign_products";
            referencedColumns: ["id"];
          },
        ];
      };
      generated_images: {
        Row: {
          alt_text: string | null;
          created_at: string;
          generated_content_id: string | null;
          height: number | null;
          id: string;
          image_prompt: string;
          image_storage_path: string | null;
          image_url: string | null;
          is_primary: boolean;
          model_name: string | null;
          product_id: string;
          prompt_payload: Json;
          response_payload: Json;
          retry_count: number;
          status: string;
          updated_at: string;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: string;
          generated_content_id?: string | null;
          height?: number | null;
          id?: string;
          image_prompt: string;
          image_storage_path?: string | null;
          image_url?: string | null;
          is_primary?: boolean;
          model_name?: string | null;
          product_id: string;
          prompt_payload?: Json;
          response_payload?: Json;
          retry_count?: number;
          status?: string;
          updated_at?: string;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string;
          generated_content_id?: string | null;
          height?: number | null;
          id?: string;
          image_prompt?: string;
          image_storage_path?: string | null;
          image_url?: string | null;
          is_primary?: boolean;
          model_name?: string | null;
          product_id?: string;
          prompt_payload?: Json;
          response_payload?: Json;
          retry_count?: number;
          status?: string;
          updated_at?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "generated_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      pinterest_posts: {
        Row: {
          board_id: string | null;
          board_name: string | null;
          created_at: string;
          error_message: string | null;
          generated_content_id: string | null;
          generated_image_id: string | null;
          id: string;
          pin_url: string | null;
          pinterest_pin_id: string | null;
          product_id: string;
          published_at: string | null;
          request_payload: Json;
          response_payload: Json;
          scheduled_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          board_id?: string | null;
          board_name?: string | null;
          created_at?: string;
          error_message?: string | null;
          generated_content_id?: string | null;
          generated_image_id?: string | null;
          id?: string;
          pin_url?: string | null;
          pinterest_pin_id?: string | null;
          product_id: string;
          published_at?: string | null;
          request_payload?: Json;
          response_payload?: Json;
          scheduled_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          board_id?: string | null;
          board_name?: string | null;
          created_at?: string;
          error_message?: string | null;
          generated_content_id?: string | null;
          generated_image_id?: string | null;
          id?: string;
          pin_url?: string | null;
          pinterest_pin_id?: string | null;
          product_id?: string;
          published_at?: string | null;
          request_payload?: Json;
          response_payload?: Json;
          scheduled_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pinterest_posts_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          campaign_id: string | null;
          created_at: string;
          id: string;
          last_error: string | null;
          locked_at: string | null;
          locked_by: string | null;
          owner_id: string;
          processed_at: string | null;
          product_category: string;
          product_name: string;
          source_hash: string;
          source_row_number: number;
          source_sheet_name: string;
          source_spreadsheet_id: string;
          source_system: string;
          source_url: string | null;
          status: string;
          trend_note: string | null;
          updated_at: string;
        };
        Insert: {
          campaign_id?: string | null;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          owner_id: string;
          processed_at?: string | null;
          product_category: string;
          product_name: string;
          source_hash: string;
          source_row_number: number;
          source_sheet_name: string;
          source_spreadsheet_id: string;
          source_system?: string;
          source_url?: string | null;
          status?: string;
          trend_note?: string | null;
          updated_at?: string;
        };
        Update: {
          campaign_id?: string | null;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          owner_id?: string;
          processed_at?: string | null;
          product_category?: string;
          product_name?: string;
          source_hash?: string;
          source_row_number?: number;
          source_sheet_name?: string;
          source_spreadsheet_id?: string;
          source_system?: string;
          source_url?: string | null;
          status?: string;
          trend_note?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          affiliate_link_template: string | null;
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          affiliate_link_template?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          affiliate_link_template?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      pinterest_accounts: {
        Row: {
          id: string;
          user_id: string;
          pinterest_user_id: string | null;
          username: string | null;
          access_token: string;
          refresh_token: string | null;
          expires_at: string | null;
          scope: string | null;
          connected_at: string;
          disconnected_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pinterest_user_id?: string | null;
          username?: string | null;
          access_token: string;
          refresh_token?: string | null;
          expires_at?: string | null;
          scope?: string | null;
          connected_at?: string;
          disconnected_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          pinterest_user_id?: string | null;
          username?: string | null;
          access_token?: string;
          refresh_token?: string | null;
          expires_at?: string | null;
          scope?: string | null;
          connected_at?: string;
          disconnected_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      board_cache: {
        Row: {
          id: string;
          user_id: string;
          board_id: string;
          board_name: string;
          board_description: string | null;
          pin_count: number;
          cached_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          board_id: string;
          board_name: string;
          board_description?: string | null;
          pin_count?: number;
          cached_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          board_id?: string;
          board_name?: string;
          board_description?: string | null;
          pin_count?: number;
          cached_at?: string;
        };
        Relationships: [];
      };
      pin_jobs: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          board_id: string | null;
          board_name: string | null;
          title: string | null;
          description: string | null;
          image_url: string | null;
          link: string | null;
          status: string;
          scheduled_at: string | null;
          attempted_at: string | null;
          completed_at: string | null;
          attempt_count: number;
          max_attempts: number;
          last_error: string | null;
          pinterest_pin_id: string | null;
          pin_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          board_id?: string | null;
          board_name?: string | null;
          title?: string | null;
          description?: string | null;
          image_url?: string | null;
          link?: string | null;
          status?: string;
          scheduled_at?: string | null;
          attempted_at?: string | null;
          completed_at?: string | null;
          attempt_count?: number;
          max_attempts?: number;
          last_error?: string | null;
          pinterest_pin_id?: string | null;
          pin_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          board_id?: string | null;
          board_name?: string | null;
          title?: string | null;
          description?: string | null;
          image_url?: string | null;
          link?: string | null;
          status?: string;
          scheduled_at?: string | null;
          attempted_at?: string | null;
          completed_at?: string | null;
          attempt_count?: number;
          max_attempts?: number;
          last_error?: string | null;
          pinterest_pin_id?: string | null;
          pin_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      published_pins: {
        Row: {
          board_id: string | null;
          board_name: string | null;
          created_at: string;
          error_message: string | null;
          id: string;
          pin_url: string | null;
          pinterest_pin_id: string | null;
          product_id: string;
          published_at: string | null;
          request_payload: Json;
          response_payload: Json;
          scheduled_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          board_id?: string | null;
          board_name?: string | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          pin_url?: string | null;
          pinterest_pin_id?: string | null;
          product_id: string;
          published_at?: string | null;
          request_payload?: Json;
          response_payload?: Json;
          scheduled_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          board_id?: string | null;
          board_name?: string | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          pin_url?: string | null;
          pinterest_pin_id?: string | null;
          product_id?: string;
          published_at?: string | null;
          request_payload?: Json;
          response_payload?: Json;
          scheduled_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "published_pins_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "campaign_products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      claim_pending_products: {
        Args: {
          p_owner_id: string;
          p_limit?: number;
        };
        Returns: Database["public"]["Tables"]["products"]["Row"][];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
