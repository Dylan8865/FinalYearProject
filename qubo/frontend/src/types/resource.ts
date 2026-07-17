export interface ThreeDModelSummary {
  resource_id: string;
  title: string;
  subject_name?: string | null;
  topic_name?: string | null;
  learning_style_tag?: string | null;
  preview_model_url: string;
  popularity_count?: number;
}

export interface ThreeDModelDetail extends ThreeDModelSummary {
  signed_model_url: string;
}

export interface LearningRecommendation {
  target_type: 'model' | 'video';
  target_id: string;
  title: string;
  subject_name?: string | null;
  topic_name?: string | null;
  reason: string;
  learning_goal: string;
  estimated_minutes: number;
  preview_model_url?: string | null;
  youtube_url?: string | null;
}

export interface RecentLearningItem {
  target_id: string;
  target_type: 'model' | 'video';
  title: string;
  subject_name?: string | null;
  last_viewed_at: string;
  view_count: number;
}

export interface FavouriteItem {
  target_id: string;
  target_type: 'model' | 'video';
  title: string;
  subject_name?: string | null;
  date_added: string;
}

export interface EducatorRecommendation {
  recommendation_id: string;
  target_type: 'model' | 'video';
  target_id: string;
  title: string;
  subject_name?: string | null;
  educator_id: string;
  educator_name: string;
  note: string;
  created_at: string;
  preview_model_url?: string | null;
  youtube_url?: string | null;
}

export interface ModelAnnotation {
  annotation_id: string;
  resource_id: string;
  title: string;
  description: string;
  position: [number, number, number];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ModelAnnotationDraft {
  title: string;
  description: string;
  position: [number, number, number];
}
