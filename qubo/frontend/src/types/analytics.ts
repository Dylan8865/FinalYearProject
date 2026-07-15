export interface TopicPerformance {
  topic_id: string;
  topic_name: string;
  difficulty_level: string | null;
  score_percentage: number | null;
  sessions_count: number;
  last_updated: string | null;
}

export interface QuizScorePoint {
  score: number;
  attempted_at: string;
}

export interface SubjectAnalytics {
  id: string;
  subject_name: string;
  category: string | null;
  overall_mastery: number | null;
  topics_total: number;
  topics_measured: number;
  study_minutes: number;
  quizzes_completed: number;
  topic_performance: TopicPerformance[];
  recent_quiz_scores: QuizScorePoint[];
}
