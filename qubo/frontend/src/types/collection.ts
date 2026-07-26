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

// ---------------------------------------------------------------------------
// Student-facing shared collection types
// ---------------------------------------------------------------------------

export interface SharedCollection {
  collection_share_id: string;
  collection_id: string;
  title: string;
  description?: string | null;
  educator_name: string;
  educator_email?: string | null;
  message?: string | null;
  due_at?: string | null;
  shared_at: string;
  opened_at?: string | null;
  item_count: number;
  content_types: CollectionItemType[];
}

export interface SharedCollectionItem {
  collection_item_id: string;
  item_type: CollectionItemType;
  target_id: string;
  title: string;
  subject_name?: string | null;
  sort_order: number;
  youtube_url?: string | null;
  model_url?: string | null;
}

export interface SharedCollectionDetail {
  collection_id: string;
  title: string;
  description?: string | null;
  educator_name: string;
  educator_email?: string | null;
  message?: string | null;
  due_at?: string | null;
  shared_at: string;
  items: SharedCollectionItem[];
}

