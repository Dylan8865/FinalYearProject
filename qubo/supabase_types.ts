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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          audit_id: string
          created_at: string
          metadata: Json
          reason: string | null
          target_id: string | null
          target_type: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          audit_id?: string
          created_at?: string
          metadata?: Json
          reason?: string | null
          target_id?: string | null
          target_type: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          audit_id?: string
          created_at?: string
          metadata?: Json
          reason?: string | null
          target_id?: string | null
          target_type?: string
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attempt_answers: {
        Row: {
          attempt_id: string
          id: string
          is_correct: boolean
          question_id: string
          selected_answer: string | null
          time_spent_seconds: number | null
        }
        Insert: {
          attempt_id: string
          id?: string
          is_correct: boolean
          question_id: string
          selected_answer?: string | null
          time_spent_seconds?: number | null
        }
        Update: {
          attempt_id?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_answer?: string | null
          time_spent_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_items: {
        Row: {
          collection_id: string
          collection_item_id: string
          created_at: string
          item_type: string
          quiz_id: string | null
          resource_id: string | null
          sort_order: number
          video_id: string | null
        }
        Insert: {
          collection_id: string
          collection_item_id?: string
          created_at?: string
          item_type: string
          quiz_id?: string | null
          resource_id?: string | null
          sort_order?: number
          video_id?: string | null
        }
        Update: {
          collection_id?: string
          collection_item_id?: string
          created_at?: string
          item_type?: string
          quiz_id?: string | null
          resource_id?: string | null
          sort_order?: number
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["collection_id"]
          },
          {
            foreignKeyName: "collection_items_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["resource_id"]
          },
          {
            foreignKeyName: "collection_items_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["video_id"]
          },
        ]
      }
      collection_shares: {
        Row: {
          collection_id: string
          collection_share_id: string
          due_at: string | null
          message: string | null
          opened_at: string | null
          shared_at: string
          shared_by: string
          student_id: string
        }
        Insert: {
          collection_id: string
          collection_share_id?: string
          due_at?: string | null
          message?: string | null
          opened_at?: string | null
          shared_at?: string
          shared_by: string
          student_id: string
        }
        Update: {
          collection_id?: string
          collection_share_id?: string
          due_at?: string | null
          message?: string | null
          opened_at?: string | null
          shared_at?: string
          shared_by?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_shares_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["collection_id"]
          },
          {
            foreignKeyName: "collection_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_shares_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_videos: {
        Row: {
          collection_id: string
          video_id: string
        }
        Insert: {
          collection_id: string
          video_id: string
        }
        Update: {
          collection_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_videos_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["collection_id"]
          },
          {
            foreignKeyName: "collection_videos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["video_id"]
          },
        ]
      }
      collections: {
        Row: {
          archived_at: string | null
          collection_id: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          educator_id: string
          is_student_copy: boolean
          primary_subject_id: string | null
          shareable_url: string | null
          source_collection_id: string | null
          status: string
          title: string | null
          updated_at: string
          version: number
        }
        Insert: {
          archived_at?: string | null
          collection_id?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          educator_id: string
          is_student_copy?: boolean
          primary_subject_id?: string | null
          shareable_url?: string | null
          source_collection_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          archived_at?: string | null
          collection_id?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          educator_id?: string
          is_student_copy?: boolean
          primary_subject_id?: string | null
          shareable_url?: string | null
          source_collection_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "collections_educator_id_fkey"
            columns: ["educator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_primary_subject_id_fkey"
            columns: ["primary_subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_source_collection_id_fkey"
            columns: ["source_collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["collection_id"]
          },
        ]
      }
      content_shares: {
        Row: {
          dismissed_at: string | null
          message: string | null
          read_at: string | null
          recipient_id: string
          resource_id: string | null
          sender_id: string
          share_id: string
          shared_at: string
          video_id: string | null
        }
        Insert: {
          dismissed_at?: string | null
          message?: string | null
          read_at?: string | null
          recipient_id: string
          resource_id?: string | null
          sender_id: string
          share_id?: string
          shared_at?: string
          video_id?: string | null
        }
        Update: {
          dismissed_at?: string | null
          message?: string | null
          read_at?: string | null
          recipient_id?: string
          resource_id?: string | null
          sender_id?: string
          share_id?: string
          shared_at?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_shares_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["resource_id"]
          },
          {
            foreignKeyName: "video_shares_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_shares_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_shares_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["video_id"]
          },
        ]
      }
      educator_recommendations: {
        Row: {
          created_at: string
          educator_id: string
          note: string
          recommendation_id: string
          resource_id: string | null
          video_id: string | null
        }
        Insert: {
          created_at?: string
          educator_id: string
          note: string
          recommendation_id?: string
          resource_id?: string | null
          video_id?: string | null
        }
        Update: {
          created_at?: string
          educator_id?: string
          note?: string
          recommendation_id?: string
          resource_id?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "educator_recommendations_educator_id_fkey"
            columns: ["educator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "educator_recommendations_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["resource_id"]
          },
          {
            foreignKeyName: "educator_recommendations_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["video_id"]
          },
        ]
      }
      educator_students: {
        Row: {
          assigned_at: string
          educator_id: string
          id: string
          student_id: string
        }
        Insert: {
          assigned_at?: string
          educator_id: string
          id?: string
          student_id: string
        }
        Update: {
          assigned_at?: string
          educator_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "educator_students_educator_id_fkey"
            columns: ["educator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "educator_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_predictions: {
        Row: {
          alert_threshold: number
          basis_attempt_count: number
          generated_at: string
          id: string
          is_warning: boolean
          model_version: string
          predicted_score: number
          quiz_attempt_id: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          student_id: string
          subject_id: string
        }
        Insert: {
          alert_threshold?: number
          basis_attempt_count?: number
          generated_at?: string
          id?: string
          is_warning?: boolean
          model_version?: string
          predicted_score: number
          quiz_attempt_id?: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          student_id: string
          subject_id: string
        }
        Update: {
          alert_threshold?: number
          basis_attempt_count?: number
          generated_at?: string
          id?: string
          is_warning?: boolean
          model_version?: string
          predicted_score?: number
          quiz_attempt_id?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          student_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_predictions_quiz_attempt_id_fkey"
            columns: ["quiz_attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_predictions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_predictions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_events: {
        Row: {
          event_id: string
          event_type: string
          metadata: Json
          occurred_at: string
          resource_id: string | null
          session_id: string | null
          target_type: string
          user_id: string
          video_id: string | null
        }
        Insert: {
          event_id?: string
          event_type: string
          metadata?: Json
          occurred_at?: string
          resource_id?: string | null
          session_id?: string | null
          target_type: string
          user_id: string
          video_id?: string | null
        }
        Update: {
          event_id?: string
          event_type?: string
          metadata?: Json
          occurred_at?: string
          resource_id?: string | null
          session_id?: string | null
          target_type?: string
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_events_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["resource_id"]
          },
          {
            foreignKeyName: "learning_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_events_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["video_id"]
          },
        ]
      }
      learning_recommendations: {
        Row: {
          created_at: string
          id: string
          is_accepted: boolean
          priority_level: number
          recommendation_text: string
          recommendation_type: string
          resource_link: string | null
          student_id: string
          subject_id: string | null
          topic_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_accepted?: boolean
          priority_level?: number
          recommendation_text: string
          recommendation_type: string
          resource_link?: string | null
          student_id: string
          subject_id?: string | null
          topic_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_accepted?: boolean
          priority_level?: number
          recommendation_text?: string
          recommendation_type?: string
          resource_link?: string | null
          student_id?: string
          subject_id?: string | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_recommendations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_recommendations_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_recommendations_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      match_history: {
        Row: {
          acted_at: string
          action_id: string
          corrupted_id: string | null
          effect_type: string | null
          effect_value: number | null
          match_id: string
          turn_number: number
        }
        Insert: {
          acted_at?: string
          action_id?: string
          corrupted_id?: string | null
          effect_type?: string | null
          effect_value?: number | null
          match_id: string
          turn_number: number
        }
        Update: {
          acted_at?: string
          action_id?: string
          corrupted_id?: string | null
          effect_type?: string | null
          effect_value?: number | null
          match_id?: string
          turn_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_history_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
        ]
      }
      matches: {
        Row: {
          completed_at: string | null
          compounds_discovered: number | null
          enemies_defeated: number | null
          game_level: number
          highest_combo: number | null
          is_victory: boolean
          leaderboard_points: number | null
          match_date: string
          match_id: string
          score: number | null
          turns_played: number
          user_id: string
          waves_cleared: number
          winner: string | null
        }
        Insert: {
          completed_at?: string | null
          compounds_discovered?: number | null
          enemies_defeated?: number | null
          game_level?: number
          highest_combo?: number | null
          is_victory?: boolean
          leaderboard_points?: number | null
          match_date?: string
          match_id?: string
          score?: number | null
          turns_played?: number
          user_id: string
          waves_cleared?: number
          winner?: string | null
        }
        Update: {
          completed_at?: string | null
          compounds_discovered?: number | null
          enemies_defeated?: number | null
          game_level?: number
          highest_combo?: number | null
          is_victory?: boolean
          leaderboard_points?: number | null
          match_date?: string
          match_id?: string
          score?: number | null
          turns_played?: number
          user_id?: string
          waves_cleared?: number
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_records: {
        Row: {
          id: string
          last_updated: string
          score_percentage: number
          sessions_count: number
          student_id: string
          topic_id: string
        }
        Insert: {
          id?: string
          last_updated?: string
          score_percentage?: number
          sessions_count?: number
          student_id: string
          topic_id: string
        }
        Update: {
          id?: string
          last_updated?: string
          score_percentage?: number
          sessions_count?: number
          student_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_records_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auditory_score: number | null
          blacklist_reason: string | null
          blacklisted_at: string | null
          blacklisted_by: string | null
          created_at: string
          daily_flashcards_enabled: boolean
          daily_flashcards_time: string
          deactivated_at: string | null
          email: string | null
          failed_login_attempts: number
          form_level: string | null
          full_name: string | null
          id: string
          is_active: boolean
          is_blacklisted: boolean
          kinesthetic_score: number | null
          learning_style: Database["public"]["Enums"]["learning_style"] | null
          learning_style_assessed_at: string | null
          locked_until: string | null
          nightly_review_enabled: boolean
          nightly_review_time: string
          prediction_alert_threshold: number
          profile_picture_url: string | null
          reminder_timezone: string
          role: Database["public"]["Enums"]["user_role"]
          school: string | null
          session_version: number
          target_exam_date: string | null
          target_grade: string | null
          username: string
          visual_score: number | null
        }
        Insert: {
          auditory_score?: number | null
          blacklist_reason?: string | null
          blacklisted_at?: string | null
          blacklisted_by?: string | null
          created_at?: string
          daily_flashcards_enabled?: boolean
          daily_flashcards_time?: string
          deactivated_at?: string | null
          email?: string | null
          failed_login_attempts?: number
          form_level?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          is_blacklisted?: boolean
          kinesthetic_score?: number | null
          learning_style?: Database["public"]["Enums"]["learning_style"] | null
          learning_style_assessed_at?: string | null
          locked_until?: string | null
          nightly_review_enabled?: boolean
          nightly_review_time?: string
          prediction_alert_threshold?: number
          profile_picture_url?: string | null
          reminder_timezone?: string
          role?: Database["public"]["Enums"]["user_role"]
          school?: string | null
          session_version?: number
          target_exam_date?: string | null
          target_grade?: string | null
          username: string
          visual_score?: number | null
        }
        Update: {
          auditory_score?: number | null
          blacklist_reason?: string | null
          blacklisted_at?: string | null
          blacklisted_by?: string | null
          created_at?: string
          daily_flashcards_enabled?: boolean
          daily_flashcards_time?: string
          deactivated_at?: string | null
          email?: string | null
          failed_login_attempts?: number
          form_level?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_blacklisted?: boolean
          kinesthetic_score?: number | null
          learning_style?: Database["public"]["Enums"]["learning_style"] | null
          learning_style_assessed_at?: string | null
          locked_until?: string | null
          nightly_review_enabled?: boolean
          nightly_review_time?: string
          prediction_alert_threshold?: number
          profile_picture_url?: string | null
          reminder_timezone?: string
          role?: Database["public"]["Enums"]["user_role"]
          school?: string | null
          session_version?: number
          target_exam_date?: string | null
          target_grade?: string | null
          username?: string
          visual_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_blacklisted_by_fkey"
            columns: ["blacklisted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_options: {
        Row: {
          id: string
          is_correct: boolean
          option_text: string
          question_id: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          option_text: string
          question_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          option_text?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          difficulty_level: string | null
          explanation: string | null
          id: string
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          quiz_id: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          difficulty_level?: string | null
          explanation?: string | null
          id?: string
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          quiz_id: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          difficulty_level?: string | null
          explanation?: string | null
          id?: string
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          assigned_to: string
          due_date: string | null
          id: string
          quiz_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          assigned_to: string
          due_date?: string | null
          id?: string
          quiz_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          assigned_to?: string
          due_date?: string | null
          id?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_assignments_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          attempted_at: string
          id: string
          quiz_id: string
          score: number | null
          student_id: string
          time_taken_seconds: number | null
          total_questions: number
        }
        Insert: {
          attempted_at?: string
          id?: string
          quiz_id: string
          score?: number | null
          student_id: string
          time_taken_seconds?: number | null
          total_questions: number
        }
        Update: {
          attempted_at?: string
          id?: string
          quiz_id?: string
          score?: number | null
          student_id?: string
          time_taken_seconds?: number | null
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_progress: {
        Row: {
          answer_times: Json
          answers: Json
          current_index: number
          elapsed_seconds: number
          id: string
          last_updated: string
          quiz_id: string
          student_id: string
        }
        Insert: {
          answer_times?: Json
          answers?: Json
          current_index?: number
          elapsed_seconds?: number
          id?: string
          last_updated?: string
          quiz_id: string
          student_id: string
        }
        Update: {
          answer_times?: Json
          answers?: Json
          current_index?: number
          elapsed_seconds?: number
          id?: string
          last_updated?: string
          quiz_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_progress_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          is_assigned: boolean
          owner_id: string
          source_type: Database["public"]["Enums"]["quiz_source_type"]
          subject_id: string | null
          title: string
          topic_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_assigned?: boolean
          owner_id: string
          source_type?: Database["public"]["Enums"]["quiz_source_type"]
          subject_id?: string | null
          title: string
          topic_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_assigned?: boolean
          owner_id?: string
          source_type?: Database["public"]["Enums"]["quiz_source_type"]
          subject_id?: string | null
          title?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_annotations: {
        Row: {
          annotation_id: string
          created_at: string
          created_by: string
          description: string
          position_x: number
          position_y: number
          position_z: number
          resource_id: string
          title: string
          updated_at: string
        }
        Insert: {
          annotation_id?: string
          created_at?: string
          created_by: string
          description: string
          position_x: number
          position_y: number
          position_z: number
          resource_id: string
          title: string
          updated_at?: string
        }
        Update: {
          annotation_id?: string
          created_at?: string
          created_by?: string
          description?: string
          position_x?: number
          position_y?: number
          position_z?: number
          resource_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_annotations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_annotations_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["resource_id"]
          },
        ]
      }
      resources: {
        Row: {
          created_by: string | null
          learning_style_tag: string | null
          resource_id: string
          resource_type: string
          thumbnail_url: string | null
          title: string
          topic_id: string
          url: string
          visibility: string
        }
        Insert: {
          created_by?: string | null
          learning_style_tag?: string | null
          resource_id?: string
          resource_type: string
          thumbnail_url?: string | null
          title: string
          topic_id: string
          url: string
          visibility?: string
        }
        Update: {
          created_by?: string | null
          learning_style_tag?: string | null
          resource_id?: string
          resource_type?: string
          thumbnail_url?: string | null
          title?: string
          topic_id?: string
          url?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      session_topics: {
        Row: {
          id: string
          session_id: string
          time_spent_minutes: number
          topic_id: string
        }
        Insert: {
          id?: string
          session_id: string
          time_spent_minutes?: number
          topic_id: string
        }
        Update: {
          id?: string
          session_id?: string
          time_spent_minutes?: number
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_topics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "study_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      spaced_repetition_schedule: {
        Row: {
          ease_factor: number
          id: string
          interval_days: number
          last_reviewed_date: string | null
          last_score: number | null
          next_review_date: string
          repetitions: number
          student_id: string
          topic_id: string
        }
        Insert: {
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed_date?: string | null
          last_score?: number | null
          next_review_date?: string
          repetitions?: number
          student_id: string
          topic_id: string
        }
        Update: {
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed_date?: string | null
          last_score?: number | null
          next_review_date?: string
          repetitions?: number
          student_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaced_repetition_schedule_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaced_repetition_schedule_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      student_subjects: {
        Row: {
          id: string
          student_id: string
          subject_id: string
        }
        Insert: {
          id?: string
          student_id: string
          subject_id: string
        }
        Update: {
          id?: string
          student_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_subjects_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          duration_minutes: number
          id: string
          notes: string | null
          pomodoro_cycles: number
          session_date: string
          student_id: string
          subject_id: string
        }
        Insert: {
          duration_minutes: number
          id?: string
          notes?: string | null
          pomodoro_cycles?: number
          session_date?: string
          student_id: string
          subject_id: string
        }
        Update: {
          duration_minutes?: number
          id?: string
          notes?: string | null
          pomodoro_cycles?: number
          session_date?: string
          student_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          category: string | null
          id: string
          subject_name: string
        }
        Insert: {
          category?: string | null
          id?: string
          subject_name: string
        }
        Update: {
          category?: string | null
          id?: string
          subject_name?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          difficulty_level: string | null
          id: string
          subject_id: string
          topic_name: string
        }
        Insert: {
          difficulty_level?: string | null
          id?: string
          subject_id: string
          topic_name: string
        }
        Update: {
          difficulty_level?: string | null
          id?: string
          subject_id?: string
          topic_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favourites: {
        Row: {
          date_added: string
          favourite_id: string
          resource_id: string | null
          user_id: string
          video_id: string | null
        }
        Insert: {
          date_added?: string
          favourite_id?: string
          resource_id?: string | null
          user_id: string
          video_id?: string | null
        }
        Update: {
          date_added?: string
          favourite_id?: string
          resource_id?: string | null
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_favourites_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["resource_id"]
          },
          {
            foreignKeyName: "user_favourites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favourites_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["video_id"]
          },
        ]
      }
      user_resources: {
        Row: {
          completed_at: string | null
          is_completed: boolean
          is_saved: boolean
          last_viewed_at: string
          recommended_at: string
          resource_id: string | null
          user_id: string
          user_resource_id: string
          video_id: string | null
          view_count: number
        }
        Insert: {
          completed_at?: string | null
          is_completed?: boolean
          is_saved?: boolean
          last_viewed_at?: string
          recommended_at?: string
          resource_id?: string | null
          user_id: string
          user_resource_id?: string
          video_id?: string | null
          view_count?: number
        }
        Update: {
          completed_at?: string | null
          is_completed?: boolean
          is_saved?: boolean
          last_viewed_at?: string
          recommended_at?: string
          resource_id?: string | null
          user_id?: string
          user_resource_id?: string
          video_id?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["resource_id"]
          },
          {
            foreignKeyName: "user_resources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_resources_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["video_id"]
          },
        ]
      }
      videos: {
        Row: {
          subject_tag: string | null
          title: string
          uploaded_by: string
          video_id: string
          youtube_url: string
        }
        Insert: {
          subject_tag?: string | null
          title: string
          uploaded_by: string
          video_id?: string
          youtube_url: string
        }
        Update: {
          subject_tag?: string | null
          title?: string
          uploaded_by?: string
          video_id?: string
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_uploaded_by_fkey"
            columns: ["uploaded_by"]
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
      [_ in never]: never
    }
    Enums: {
      learning_style: "visual" | "auditory" | "kinesthetic"
      question_type: "mcq" | "fill_blank" | "short_answer"
      quiz_source_type: "ai_generated" | "manual"
      risk_level: "low" | "medium" | "high"
      user_role: "student" | "educator" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      learning_style: ["visual", "auditory", "kinesthetic"],
      question_type: ["mcq", "fill_blank", "short_answer"],
      quiz_source_type: ["ai_generated", "manual"],
      risk_level: ["low", "medium", "high"],
      user_role: ["student", "educator", "admin"],
    },
  },
} as const
