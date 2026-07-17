export type LearningTargetType = 'model' | 'video' | 'quiz';
export type LearningEventType =
  | 'opened' | 'saved' | 'unsaved' | 'shared' | 'completed'
  | 'model_explored' | 'model_viewed' | 'video_played' | 'video_paused' | 'video_progress'
  | 'skipped_quickly' | 'rewound' | 'quiz_attempted' | 'quiz_completed';

export interface LearningEventInput {
  target_type: LearningTargetType;
  target_id?: string;
  event_type: LearningEventType;
  session_id?: string;
  metadata?: Record<string, string | number>;
}

export interface EducatorAnalytics {
  active_learners: number;
  total_learning_events: number;
  completions: number;
  model_explorations: number;
  video_learning_actions: number;
  top_subjects: { subject_name: string; event_count: number }[];
  daily_activity: { date: string; event_count: number }[];
}
