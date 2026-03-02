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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      expenses: {
        Row: {
          amount: number
          bike_id: string | null
          category: string
          created_at: string
          date: string
          description: string
          id: string
          rider_name: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          bike_id?: string | null
          category: string
          created_at?: string
          date?: string
          description: string
          id?: string
          rider_name?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bike_id?: string | null
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          rider_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_bike_id_fkey"
            columns: ["bike_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          },
        ]
      }
      motorcycles: {
        Row: {
          assigned_rider_id: string | null
          color: string
          created_at: string
          id: string
          insurance_expiry: string
          last_maintenance: string | null
          maintenance_cost: number
          make: string
          model: string
          registration_number: string
          status: string
          total_revenue: number
          updated_at: string
          year: number
        }
        Insert: {
          assigned_rider_id?: string | null
          color: string
          created_at?: string
          id?: string
          insurance_expiry: string
          last_maintenance?: string | null
          maintenance_cost?: number
          make: string
          model: string
          registration_number: string
          status?: string
          total_revenue?: number
          updated_at?: string
          year: number
        }
        Update: {
          assigned_rider_id?: string | null
          color?: string
          created_at?: string
          id?: string
          insurance_expiry?: string
          last_maintenance?: string | null
          maintenance_cost?: number
          make?: string
          model?: string
          registration_number?: string
          status?: string
          total_revenue?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "motorcycles_assigned_rider_id_fkey"
            columns: ["assigned_rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      remittances: {
        Row: {
          amount: number
          bike_id: string
          created_at: string
          date: string
          id: string
          method: string
          rider_id: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          bike_id: string
          created_at?: string
          date?: string
          id?: string
          method?: string
          rider_id: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bike_id?: string
          created_at?: string
          date?: string
          id?: string
          method?: string
          rider_id?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "remittances_bike_id_fkey"
            columns: ["bike_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remittances_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      riders: {
        Row: {
          assigned_bike_id: string | null
          compliance_score: number
          created_at: string
          email: string | null
          id: string
          join_date: string
          kyc_status: string
          license_number: string
          name: string
          national_id: string
          outstanding_balance: number
          phone: string
          photo_url: string | null
          police_clearance: boolean
          status: string
          test_approved: boolean
          total_remittance: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_bike_id?: string | null
          compliance_score?: number
          created_at?: string
          email?: string | null
          id?: string
          join_date?: string
          kyc_status?: string
          license_number: string
          name: string
          national_id: string
          outstanding_balance?: number
          phone: string
          photo_url?: string | null
          police_clearance?: boolean
          status?: string
          test_approved?: boolean
          total_remittance?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_bike_id?: string | null
          compliance_score?: number
          created_at?: string
          email?: string | null
          id?: string
          join_date?: string
          kyc_status?: string
          license_number?: string
          name?: string
          national_id?: string
          outstanding_balance?: number
          phone?: string
          photo_url?: string | null
          police_clearance?: boolean
          status?: string
          test_approved?: boolean
          total_remittance?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_riders_assigned_bike"
            columns: ["assigned_bike_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_manager: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "operations_manager" | "accountant" | "rider"
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
  public: {
    Enums: {
      app_role: ["admin", "operations_manager", "accountant", "rider"],
    },
  },
} as const
