export interface TutorialVideo {
  video_id: string;
  youtube_url: string;
  title: string;
  subject_tag?: string | null;
  uploaded_by?: string | null;
  is_locked?: boolean;
  is_deleted?: boolean;
}

export interface SharedLearningItem {
  share_id: string;
  target_type: 'model' | 'video';
  target_id: string;
  title: string;
  subject_name?: string | null;
  sender_email: string;
  message?: string | null;
  shared_at: string;
}
