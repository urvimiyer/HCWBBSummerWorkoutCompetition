export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      seasons: {
        Row: { id: string; year: number; start_date: string; end_date: string; is_active: boolean; created_at: string }
        Insert: { id?: string; year: number; start_date: string; end_date: string; is_active?: boolean; created_at?: string }
        Update: { id?: string; year?: number; start_date?: string; end_date?: string; is_active?: boolean; created_at?: string }
        Relationships: []
      }
      groups: {
        Row: { id: string; season_id: string; name: string; created_at: string }
        Insert: { id?: string; season_id: string; name: string; created_at?: string }
        Update: { id?: string; season_id?: string; name?: string; created_at?: string }
        Relationships: []
      }
      profiles: {
        Row: { id: string; name: string; email: string; role: 'player' | 'coach' | 'admin'; group_id: string | null; invited_by: string | null; created_at: string }
        Insert: { id: string; name: string; email: string; role?: 'player' | 'coach' | 'admin'; group_id?: string | null; invited_by?: string | null; created_at?: string }
        Update: { id?: string; name?: string; email?: string; role?: 'player' | 'coach' | 'admin'; group_id?: string | null; invited_by?: string | null; created_at?: string }
        Relationships: []
      }
      workout_types: {
        Row: { id: string; name: string; point_value: number; active: boolean; created_at: string }
        Insert: { id?: string; name: string; point_value?: number; active?: boolean; created_at?: string }
        Update: { id?: string; name?: string; point_value?: number; active?: boolean; created_at?: string }
        Relationships: []
      }
      entries: {
        Row: { id: string; user_id: string; group_id: string; season_id: string; workout_type_id: string; points: number; date: string; note: string | null; photo_url: string | null; created_at: string; edited_at: string | null }
        Insert: { id?: string; user_id: string; group_id: string; season_id: string; workout_type_id: string; points?: number; date: string; note?: string | null; photo_url?: string | null; created_at?: string; edited_at?: string | null }
        Update: { id?: string; user_id?: string; group_id?: string; season_id?: string; workout_type_id?: string; points?: number; date?: string; note?: string | null; photo_url?: string | null; created_at?: string; edited_at?: string | null }
        Relationships: []
      }
      reactions: {
        Row: { id: string; entry_id: string; user_id: string; emoji: string; created_at: string }
        Insert: { id?: string; entry_id: string; user_id: string; emoji: string; created_at?: string }
        Update: { id?: string; entry_id?: string; user_id?: string; emoji?: string; created_at?: string }
        Relationships: []
      }
      comments: {
        Row: { id: string; entry_id: string; user_id: string; text: string; created_at: string }
        Insert: { id?: string; entry_id: string; user_id: string; text: string; created_at?: string }
        Update: { id?: string; entry_id?: string; user_id?: string; text?: string; created_at?: string }
        Relationships: []
      }
      monthly_results: {
        Row: { id: string; season_id: string; month: number; year: number; group_totals: Json; winner_group_id: string | null; closed_at: string | null }
        Insert: { id?: string; season_id: string; month: number; year: number; group_totals?: Json; winner_group_id?: string | null; closed_at?: string | null }
        Update: { id?: string; season_id?: string; month?: number; year?: number; group_totals?: Json; winner_group_id?: string | null; closed_at?: string | null }
        Relationships: []
      }
      invites: {
        Row: { id: string; token: string; email: string | null; created_by: string | null; used_at: string | null; expires_at: string; created_at: string }
        Insert: { id?: string; token?: string; email?: string | null; created_by?: string | null; used_at?: string | null; expires_at?: string; created_at?: string }
        Update: { id?: string; token?: string; email?: string | null; created_by?: string | null; used_at?: string | null; expires_at?: string; created_at?: string }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Group = Database['public']['Tables']['groups']['Row']
export type Season = Database['public']['Tables']['seasons']['Row']
export type WorkoutType = Database['public']['Tables']['workout_types']['Row']
export type Entry = Database['public']['Tables']['entries']['Row']
export type Reaction = Database['public']['Tables']['reactions']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type MonthlyResult = Database['public']['Tables']['monthly_results']['Row']
export type Invite = Database['public']['Tables']['invites']['Row']
