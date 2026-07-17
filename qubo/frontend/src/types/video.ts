export interface TutorialVideo {
  video_id: string;
  youtube_url: string;
  title: string;
  subject_tag?: string | null;
}

export interface SharedTutorialVideo extends TutorialVideo {
  share_id: string;
  sender_username: string;
  message?: string | null;
  shared_at: string;
}
