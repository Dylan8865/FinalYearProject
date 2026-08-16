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

export interface ExamPrediction {
  id: string;
  subject_id: string;
  subject_name: string;
  predicted_score: number;
  risk_level: 'low' | 'medium' | 'high';
  threshold: number;
  is_warning: boolean;
  basis_attempt_count: number;
  generated_at: string;
}

export interface SubjectAnalytics {
  id: string;
  subject_name: string;
  category: string | null;
  overall_mastery: number | null;
  topics_total: number;
  topics_measured: number;
  study_minutes: number;
  study_sessions: number;
  quizzes_completed: number;
  learning_velocity: number | null;
  topic_performance: TopicPerformance[];
  recent_quiz_scores: QuizScorePoint[];
  latest_prediction: ExamPrediction | null;
}

export interface StudySessionCreate {
  subject_id: string;
  topic_name: string;
  duration_minutes: number;
  pomodoro_cycles: number;
  session_date?: string;
  notes?: string;
}

export interface StudySession extends StudySessionCreate {
  id: string;
  subject_name: string;
  topic_id: string;
  session_date: string;
}

export interface ReviewSchedule {
  id: string;
  subject_id: string;
  subject_name: string;
  topic_id: string;
  topic_name: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
  last_reviewed_date: string | null;
  last_score: number | null;
  is_due: boolean;
  quiz_id: string | null;
}

export interface AnalyticsFilters {
  subject_id?: string;
  topic_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface EducatorStudentSummary {
  id: string;
  username: string;
  full_name: string;
  school: string | null;
  form_level: string | null;
  target_grade: string | null;
  profile_picture_url: string | null;
  subject_count: number;
  study_minutes: number;
  quizzes_completed: number;
  average_mastery: number | null;
  latest_prediction: number | null;
  at_risk: boolean;
  subjects: SubjectAnalytics[];
}

export interface EducatorDashboard {
  summary: {
    linked_students: number;
    students_at_risk: number;
    average_prediction: number | null;
    total_study_minutes: number;
    completed_quizzes: number;
  };
  students: EducatorStudentSummary[];
}

export interface StudyPlanRecommendation {
  id: string;
  student_id: string;
  recommendation_type: string;
  subject_id: string | null;
  subject_name: string | null;
  topic_id: string | null;
  topic_name: string | null;
  recommendation_text: string;
  priority_level: number;
  resource_link: string | null;
  is_accepted: boolean;
  created_at: string;
}

export interface StudyPlanResponse {
  message: string;
  recommendations: StudyPlanRecommendation[];
}
