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
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          title?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
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
          receipt_url: string | null
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
          receipt_url?: string | null
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
          receipt_url?: string | null
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
      message_reads: {
        Row: {
          conversation_id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
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
      pricing_settings: {
        Row: {
          base_fare: number
          created_at: string
          id: string
          is_active: boolean
          minimum_fare: number
          price_per_km: number
          price_per_minute: number
          rate_multiplier: number
          tier: string
          updated_at: string
        }
        Insert: {
          base_fare?: number
          created_at?: string
          id?: string
          is_active?: boolean
          minimum_fare?: number
          price_per_km?: number
          price_per_minute?: number
          rate_multiplier?: number
          tier?: string
          updated_at?: string
        }
        Update: {
          base_fare?: number
          created_at?: string
          id?: string
          is_active?: boolean
          minimum_fare?: number
          price_per_km?: number
          price_per_minute?: number
          rate_multiplier?: number
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          home_address: string | null
          id: string
          phone_number: string | null
          requested_role: string | null
          theme_preference: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          home_address?: string | null
          id?: string
          phone_number?: string | null
          requested_role?: string | null
          theme_preference?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          home_address?: string | null
          id?: string
          phone_number?: string | null
          requested_role?: string | null
          theme_preference?: string
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
      rider_locations: {
        Row: {
          accuracy: number | null
          current_trip_id: string | null
          heading: number | null
          last_seen_at: string
          lat: number
          lng: number
          rider_id: string
          speed: number | null
          status: string
          updated_at: string
        }
        Insert: {
          accuracy?: number | null
          current_trip_id?: string | null
          heading?: number | null
          last_seen_at?: string
          lat: number
          lng: number
          rider_id: string
          speed?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          accuracy?: number | null
          current_trip_id?: string | null
          heading?: number | null
          last_seen_at?: string
          lat?: number
          lng?: number
          rider_id?: string
          speed?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
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
          kyc_note: string | null
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
          kyc_note?: string | null
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
          kyc_note?: string | null
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
      trip_extras: {
        Row: {
          amount: number
          created_at: string
          id: string
          label: string
          trip_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          label: string
          trip_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          label?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_extras_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_points: {
        Row: {
          id: string
          lat: number
          lng: number
          recorded_at: string
          trip_id: string
        }
        Insert: {
          id?: string
          lat: number
          lng: number
          recorded_at?: string
          trip_id: string
        }
        Update: {
          id?: string
          lat?: number
          lng?: number
          recorded_at?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_points_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          active_duration_seconds: number
          base_fare: number
          created_at: string
          distance_cost: number
          distance_km: number
          end_address: string | null
          end_lat: number | null
          end_lng: number | null
          ended_at: string | null
          extras_total: number
          id: string
          minimum_fare: number
          motorcycle_id: string | null
          notes: string | null
          paused_duration_seconds: number
          pricing_snapshot: Json | null
          pricing_tier: string | null
          rate_multiplier: number
          rider_id: string
          start_address: string | null
          start_lat: number | null
          start_lng: number | null
          started_at: string
          started_by: string | null
          status: string
          time_cost: number
          total_fare: number
          updated_at: string
        }
        Insert: {
          active_duration_seconds?: number
          base_fare?: number
          created_at?: string
          distance_cost?: number
          distance_km?: number
          end_address?: string | null
          end_lat?: number | null
          end_lng?: number | null
          ended_at?: string | null
          extras_total?: number
          id?: string
          minimum_fare?: number
          motorcycle_id?: string | null
          notes?: string | null
          paused_duration_seconds?: number
          pricing_snapshot?: Json | null
          pricing_tier?: string | null
          rate_multiplier?: number
          rider_id: string
          start_address?: string | null
          start_lat?: number | null
          start_lng?: number | null
          started_at?: string
          started_by?: string | null
          status?: string
          time_cost?: number
          total_fare?: number
          updated_at?: string
        }
        Update: {
          active_duration_seconds?: number
          base_fare?: number
          created_at?: string
          distance_cost?: number
          distance_km?: number
          end_address?: string | null
          end_lat?: number | null
          end_lng?: number | null
          ended_at?: string | null
          extras_total?: number
          id?: string
          minimum_fare?: number
          motorcycle_id?: string | null
          notes?: string | null
          paused_duration_seconds?: number
          pricing_snapshot?: Json | null
          pricing_tier?: string | null
          rate_multiplier?: number
          rider_id?: string
          start_address?: string | null
          start_lat?: number | null
          start_lng?: number | null
          started_at?: string
          started_by?: string | null
          status?: string
          time_cost?: number
          total_fare?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_motorcycle_id_fkey"
            columns: ["motorcycle_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "rider_financial_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
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
      calc_rider_compliance_score: {
        Args: { p_rider_id: string }
        Returns: number
      }
      get_founding_admin_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_manager: { Args: { _user_id: string }; Returns: boolean }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
      is_conversation_member: {
        Args: { _conv: string; _user: string }
        Returns: boolean
      }
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
      recalc_bike_maintenance: {
        Args: { p_bike_id: string }
        Returns: undefined
      }
      recalc_bike_revenue: { Args: { p_bike_id: string }; Returns: undefined }
      refresh_rider_compliance_score: {
        Args: { p_rider_id: string }
        Returns: undefined
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
