// ─────────────────────────────────────────────────────────────
// Nestlé SHE Day — Supabase Database Types
// Run `npx supabase gen types typescript` to regenerate from live DB
// ─────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          name: string;
          color: string;
          initials: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          initials: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          initials?: string;
        };
      };
      scores: {
        Row: {
          id: string;
          team_id: string;
          module_id: number;
          game_id: number;
          points: number;
          time_seconds: number;
          game_cards: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          module_id: number;
          game_id: number;
          points: number;
          time_seconds: number;
          game_cards?: number;
          created_at?: string;
        };
        Update: {
          points?: number;
          time_seconds?: number;
          game_cards?: number;
        };
      };
      module_progress: {
        Row: {
          id: string;
          team_id: string;
          module_id: number;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          module_id: number;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
        };
      };
      quiz_responses: {
        Row: {
          id: string;
          team_id: string;
          module_id: number;
          game_id: number;
          response_data: Json;
          score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          module_id: number;
          game_id: number;
          response_data: Json;
          score: number;
          created_at?: string;
        };
        Update: never;
      };
      photo_submissions: {
        Row: {
          id: string;
          team_id: string;
          module_id: number;
          game_id: number;
          storage_path: string;
          caption: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          module_id: number;
          game_id: number;
          storage_path: string;
          caption: string;
          created_at?: string;
        };
        Update: never;
      };
    };
    Views: {
      team_leaderboard: {
        Row: {
          team_id: string;
          team_name: string;
          team_color: string;
          team_initials: string;
          total_points: number;
          total_game_cards: number;
          modules_completed: number;
        };
      };
    };
    Functions: {};
    Enums: {};
  };
}

// ── Convenience types ────────────────────────────────────────
export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type Score = Database["public"]["Tables"]["scores"]["Row"];
export type ModuleProgress = Database["public"]["Tables"]["module_progress"]["Row"];
export type QuizResponse = Database["public"]["Tables"]["quiz_responses"]["Row"];
export type PhotoSubmission = Database["public"]["Tables"]["photo_submissions"]["Row"];
export type TeamLeaderboard = Database["public"]["Views"]["team_leaderboard"]["Row"];
