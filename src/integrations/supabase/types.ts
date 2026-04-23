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
      compliance_records: {
        Row: {
          compliance_type: string
          created_at: string
          document_url: string | null
          id: string
          motorcycle_id: string | null
          notes: string | null
          rider_id: string
          status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          compliance_type: string
          created_at?: string
          document_url?: string | null
          id?: string
          motorcycle_id?: string | null
          notes?: string | null
          rider_id: string
          status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          compliance_type?: string
          created_at?: string
          document_url?: string | null
          id?: string
          motorcycle_id?: string | null
          notes?: string | null
          rider_id?: string
          status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_records_motorcycle_id_fkey"
            columns: ["motorcycle_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_records_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "rider_financial_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_records_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          expense_date: string
          id: string
          motorcycle_id: string | null
          recorded_by: string | null
          rider_id: string | null
          rider_name: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          motorcycle_id?: string | null
          recorded_by?: string | null
          rider_id?: string | null
          rider_name?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          motorcycle_id?: string | null
          recorded_by?: string | null
          rider_id?: string | null
          rider_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_bike_id_fkey"
            columns: ["motorcycle_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "rider_financial_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string | null
          file_size: number | null
          file_url: string
          government_id_type: string | null
          id: string
          mime_type: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rider_id: string
          status: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name?: string | null
          file_size?: number | null
          file_url: string
          government_id_type?: string | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rider_id: string
          status?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          government_id_type?: string | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rider_id?: string
          status?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "rider_financial_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kyc_documents_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      motorcycles: {
        Row: {
          chassis_number: string | null
          color: string
          created_at: string
          engine_number: string | null
          id: string
          insurance_expiry_date: string
          last_maintenance: string | null
          maintenance_cost: number
          make: string
          model: string
          plate_number: string
          registration_expiry_date: string | null
          rider_id: string | null
          status: string
          total_revenue: number
          updated_at: string
          year: number
        }
        Insert: {
          chassis_number?: string | null
          color: string
          created_at?: string
          engine_number?: string | null
          id?: string
          insurance_expiry_date: string
          last_maintenance?: string | null
          maintenance_cost?: number
          make: string
          model: string
          plate_number: string
          registration_expiry_date?: string | null
          rider_id?: string | null
          status?: string
          total_revenue?: number
          updated_at?: string
          year: number
        }
        Update: {
          chassis_number?: string | null
          color?: string
          created_at?: string
          engine_number?: string | null
          id?: string
          insurance_expiry_date?: string
          last_maintenance?: string | null
          maintenance_cost?: number
          make?: string
          model?: string
          plate_number?: string
          registration_expiry_date?: string | null
          rider_id?: string | null
          status?: string
          total_revenue?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "motorcycles_assigned_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "rider_financial_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "motorcycles_assigned_rider_id_fkey"
            columns: ["rider_id"]
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
          home_address: string | null
          id: string
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          home_address?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          home_address?: string | null
          id?: string
          phone_number?: string | null
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
          id: string
          payment_method: string
          recorded_by: string | null
          reference_note: string | null
          remittance_date: string
          rider_id: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          bike_id: string
          created_at?: string
          id?: string
          payment_method?: string
          recorded_by?: string | null
          reference_note?: string | null
          remittance_date?: string
          rider_id: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bike_id?: string
          created_at?: string
          id?: string
          payment_method?: string
          recorded_by?: string | null
          reference_note?: string | null
          remittance_date?: string
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
            referencedRelation: "rider_financial_view"
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
          full_name: string
          home_address: string | null
          id: string
          is_with_police: boolean
          join_date: string
          kyc_status: string
          license_expiry_date: string | null
          national_id: string
          outstanding_balance: number
          phone_number: string
          police_case_reference: string | null
          police_station_name: string | null
          profile_image_url: string | null
          rider_license_image_url: string | null
          rider_license_number: string
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
          full_name: string
          home_address?: string | null
          id?: string
          is_with_police?: boolean
          join_date?: string
          kyc_status?: string
          license_expiry_date?: string | null
          national_id: string
          outstanding_balance?: number
          phone_number: string
          police_case_reference?: string | null
          police_station_name?: string | null
          profile_image_url?: string | null
          rider_license_image_url?: string | null
          rider_license_number: string
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
          full_name?: string
          home_address?: string | null
          id?: string
          is_with_police?: boolean
          join_date?: string
          kyc_status?: string
          license_expiry_date?: string | null
          national_id?: string
          outstanding_balance?: number
          phone_number?: string
          police_case_reference?: string | null
          police_station_name?: string | null
          profile_image_url?: string | null
          rider_license_image_url?: string | null
          rider_license_number?: string
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
      rider_financial_view: {
        Row: {
          assigned_bike_id: string | null
          compliance_score: number | null
          full_name: string | null
          id: string | null
          join_date: string | null
          outstanding_balance: number | null
          status: string | null
          total_remittance: number | null
        }
        Insert: {
          assigned_bike_id?: string | null
          compliance_score?: number | null
          full_name?: string | null
          id?: string | null
          join_date?: string | null
          outstanding_balance?: number | null
          status?: string | null
          total_remittance?: number | null
        }
        Update: {
          assigned_bike_id?: string | null
          compliance_score?: number | null
          full_name?: string | null
          id?: string | null
          join_date?: string | null
          outstanding_balance?: number | null
          status?: string | null
          total_remittance?: number | null
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
      process_remittance_with_overdue: {
        Args: {
          p_amount: number
          p_bike_id: string
          p_payment_method: string
          p_reference_note: string
          p_remittance_date: string
          p_rider_id: string
          p_type: string
        }
        Returns: Json
      }
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
