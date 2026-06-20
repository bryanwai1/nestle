// types/database.ts
// Hand-aligned to supabase/migrations/0001_init.sql. If you have the Supabase
// CLI available, prefer regenerating this with:
//   npx supabase gen types typescript --project-id <ref> > types/database.ts
// and then re-merge the JSDoc comments back in — this file is written to be
// a drop-in match for that command's shape so the swap is painless.

export type ResponseType =
  | 'multiple_choice'
  | 'video_identify'
  | 'video_avoid'
  | 'media_upload'
  | 'hazard_canvas'
  | 'drag_sequence'
  | 'drag_matrix'
  | 'visual_sort'
  | 'subjective_select'
  | 'categorized_dropzone'
  | 'math_input'
  | 'budget_canvas'
  | 'exact_sequence'
  | 'classification_matrix';

export type SessionGroup = 'morning' | 'afternoon';
export type ModuleProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type MentalHealthBracket = 'low' | 'moderate' | 'high' | 'very_high';

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          team_number: number;
          member_1_name: string;
          member_2_name: string;
          member_3_name: string;
          session_group: SessionGroup;
          current_total_score: number;
          registration_time: string;
          updated_at: string;
        };
        Insert: never; // use the create_team() RPC instead
        Update: Partial<{
          session_group: SessionGroup;
        }>;
        Relationships: [];
      };
      game_responses: {
        Row: {
          id: string;
          team_id: string;
          module_id: string;
          question_id: string;
          response_type: ResponseType;
          response_data: Record<string, unknown>;
          media_url: string | null;
          text_response: string | null;
          is_correct: boolean | null;
          points_awarded: number;
          evaluated_by: string | null;
          evaluated_at: string | null;
          created_at: string;
        };
        Insert: {
          team_id: string;
          module_id: string;
          question_id: string;
          response_type: ResponseType;
          response_data?: Record<string, unknown>;
          media_url?: string | null;
          text_response?: string | null;
        };
        Update: Partial<{
          is_correct: boolean | null;
          points_awarded: number;
          evaluated_by: string | null;
          evaluated_at: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: 'game_responses_team_id_fkey';
            columns: ['team_id'];
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          }
        ];
      };
      session_speed_bonus: {
        Row: {
          id: string;
          team_id: string;
          module_id: string;
          points: number;
          awarded_by: string | null;
          awarded_at: string;
        };
        Insert: {
          team_id: string;
          module_id: string;
          points?: number;
          awarded_by?: string | null;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'session_speed_bonus_team_id_fkey';
            columns: ['team_id'];
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          }
        ];
      };
      team_module_progress: {
        Row: {
          team_id: string;
          module_id: string;
          status: ModuleProgressStatus;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          team_id: string;
          module_id: string;
          status?: ModuleProgressStatus;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: Partial<{
          status: ModuleProgressStatus;
          started_at: string | null;
          completed_at: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: 'team_module_progress_team_id_fkey';
            columns: ['team_id'];
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          }
        ];
      };
      anonymous_mental_health_metrics: {
        Row: {
          id: string;
          batch_session_id: string;
          raw_calculated_score: number;
          interpretation_bracket: MentalHealthBracket;
          created_at: string;
        };
        Insert: {
          batch_session_id: string;
          raw_calculated_score: number;
          interpretation_bracket: MentalHealthBracket;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      anonymous_mental_health_aggregate: {
        Row: {
          batch_session_id: string;
          submissions: number;
          avg_score: number;
          low_count: number;
          moderate_count: number;
          high_count: number;
          very_high_count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      create_team: {
        Args: {
          p_member_1: string;
          p_member_2: string;
          p_member_3: string;
          p_session_group?: SessionGroup;
        };
        Returns: Database['public']['Tables']['teams']['Row'];
      };
      apply_autograde: {
        Args: {
          p_team_id: string;
          p_module_id: string;
          p_question_id: string;
        };
        Returns: void;
      };
    };
  };
}
