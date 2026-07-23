export type CollectionStatus = "draft" | "shared" | "archived";
export type CollectionPreviewItem = {
  item_type: CollectionItemType;
  title: string;
  youtube_url?: string | null;
  preview_model_url?: string | null;
};

export interface EducatorCollection {
  collection_id: string;
  title: string;
  description: string;
  primary_subject_id?: string | null;
  primary_subject_name?: string | null;
  status: CollectionStatus;
  version: number;
  created_at: string;
  updated_at: string;
  preview_items?: CollectionPreviewItem[];
}

export interface LinkedStudent {
  id: string;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
}

export type CollectionItemType = "model" | "video" | "quiz";

export interface CollectionItem {
  collection_item_id: string;
  item_type: CollectionItemType;
  target_id: string;
  title: string;
  subject_name?: string | null;
  sort_order: number;
}

export interface CollectionContentOption {
  item_type: CollectionItemType;
  target_id: string;
  title: string;
  subject_name?: string | null;
}

export interface CollectionEditorData {
  collection: EducatorCollection;
  items: CollectionItem[];
}
