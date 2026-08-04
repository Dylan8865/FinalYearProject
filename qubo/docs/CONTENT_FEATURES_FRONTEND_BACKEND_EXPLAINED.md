# Qubo content features: frontend, backend and storage explained

This document explains how the current Qubo implementation handles four connected features:

1. 3D model publishing, viewing and annotations (learning hotspots)
2. Tutorial-video publishing and playback
3. The automated recommendation system and educator recommendations
4. Educator resource collections

It describes the implementation that exists in this codebase. In particular, a tutorial video is **not uploaded as a video file** to Qubo. The educator submits a YouTube URL; Qubo stores that URL and plays the video with the YouTube IFrame Player API. A 3D model, on the other hand, is uploaded as a `.glb` binary file and stored privately in Supabase Storage.

## 1. Overall architecture

```text
React frontend (Vite)
  │
  │ Axios request with Bearer access token
  ▼
FastAPI backend (/api/v1)
  │  validates identity, role and request data
  ▼
Service classes
  │
  ├── Supabase PostgreSQL: metadata, annotations, events, collections
  └── Supabase Storage: private .glb model files only

External service used by video playback
  └── YouTube IFrame Player API: streams the actual video from YouTube
```

The frontend sends requests through one shared API client, `AuthService` in `frontend/src/lib/authService.ts`. It uses `VITE_API_URL`, or `/api/v1` by default. An Axios request interceptor reads `access_token` from browser `localStorage` and adds `Authorization: Bearer <token>`. If an access token expires, the response interceptor calls the refresh endpoint once and retries the original request.

FastAPI registers the resource, video, collection and learning routers in `backend/app/main.py`. Each protected route calls `get_current_user` in `backend/app/db/deps.py`. That function verifies the JWT, reads the user profile, rejects inactive/blacklisted accounts, and then role-specific dependencies such as `get_current_educator` restrict educator-only actions. Backend service classes access Supabase through the privileged service-role client created by `get_supabase()` in `backend/app/db/supabase.py`. This is why backend authorization checks are important even when database Row Level Security (RLS) is also present.

## 2. 3D models: storing, viewing and annotating

### What is stored where

| Item                         | Storage location                             | Important fields / purpose                                                                           |
| ---------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Actual 3D asset              | Private Supabase Storage bucket`3d-models` | One GLB file at`<educator_id>/<UUID>.glb`                                                          |
| Model metadata               | `resources` table                          | `resource_id`, title, topic, type `3d_model`, owner, visibility, and the Storage path in `url` |
| Subject and topic metadata   | `subjects` and `topics` tables           | The upload service finds or creates them before saving the model                                     |
| Learning hotspots            | `resource_annotations` table               | Title, description, X/Y/Z coordinates, creator and timestamps                                        |
| View/completion summary      | `user_resources` table                     | One row per user/model: last viewed time, count, completion state                                    |
| Detailed interaction history | `learning_events` table                    | Opened/viewed/explored/saved/completed events and safe metadata                                      |

The private bucket, its 50 MB limit, and accepted GLB MIME types are created in `supabase/migrations/20260719120000_add_educator_content_and_collections.sql`. Model ownership and `public`/`private` visibility are added by `supabase/migrations/20260720014536_add_model_visibility.sql`; the following visibility migration ensures that another user cannot read a private model record through the data API.

### A. Educator uploads a 3D model

#### Frontend sequence

The educator opens the Upload Content page and selects **3D Model**.

1. `EducatorUploadContentPage` fetches selectable subjects using `authService.getSubjects()`.
2. The form collects title, selected subject, optional topic, visibility, and a local `.glb` `File`.
3. `handleSubmit()` checks that a model file is selected.
4. It calls `authService.uploadThreeDModel(...)`.
5. `uploadThreeDModel()` builds `FormData` with `title`, `subject_name`, optional `topic_name`, `visibility`, and the binary field named `model`. It deliberately clears the normal JSON `Content-Type` so the browser supplies the required multipart boundary.
6. After a successful response, the page redirects to `/models/<resource_id>?annotate=1`, immediately putting the owner into the annotation workflow.

The browser accepts `.glb`, `model/gltf-binary`, and `application/octet-stream` in the file input, but the backend remains the authoritative validator.

#### Backend sequence

The request enters `POST /api/v1/resources/models`:

1. `upload_3d_model()` in the resource routes requires `get_current_educator`, therefore a student cannot publish a model.
2. It accepts multipart form fields and an `UploadFile`.
3. It rejects unsupported files unless the MIME type is allowed or the filename ends in `.glb`.
4. It reads no more than 50 MB + 1 byte, rejecting an empty asset or a model larger than 50 MB.
5. It permits only `public` or `private` visibility.
6. The route runs `ResourceService.create_3d_model()` in FastAPI's threadpool because the Supabase client operations are synchronous.

`ResourceService.create_3d_model()` then:

1. Looks up the selected subject by name, inserting it if it does not yet exist.
2. Looks up the topic under that subject, creating the supplied topic (or `General`) if absent.
3. Generates a UUID-based object path, for example `<educator UUID>/<new UUID>.glb`.
4. Uploads the raw GLB bytes to the **private** `3d-models` bucket with `upsert: false`.
5. Inserts a `resources` record containing the metadata and Storage path. It sets `resource_type` to `3d_model`, learning style to `visual`, and `created_by` to the educator ID.
6. If database insertion fails after Storage upload, it tries to remove the new object so an orphaned model file is not left behind.
7. Calls `CollectionService.add_uploaded_item()` so the model is automatically referenced in that educator's default draft collection, **My uploaded content**.
8. Creates a temporary signed URL and returns a safe summary. The frontend does not receive the permanent Storage object path.

### B. Students and educators browse and open models

`ModelLibraryPage` uses `loadModels()` to call `authService.getThreeDModels(scope)`, which requests `GET /api/v1/resources/models`.

- The **public library** requests `scope=public`; `ResourceService.list_3d_models()` filters the `resources` table to `visibility = public`.
- The **Only mine** switch is visible only to educators. It requests `scope=private`; the API rejects non-educators and returns models where `created_by` equals the current educator.
- The page performs title/topic search and subject filtering in React after loading the permitted list.
- `ModelThumbnail` displays a lightweight preview from a signed URL, while the full page uses the signed URL to load the GLB.

When a user opens `/models/:resourceId`, `ModelDetailPage.loadModel()` calls `authService.getThreeDModel(resourceId)`, which requests `GET /api/v1/resources/models/{resource_id}`. `ResourceService.get_3d_model()` loads the model metadata and enforces visibility again: a private resource is returned only when its `created_by` equals the requester. It produces a fresh signed URL with a 900-second (15-minute) time-to-live. The response includes `can_manage_annotations`, which is true only for the uploader.

The full interactive renderer is `ModelViewer`:

- It uses `@react-three/fiber`'s `Canvas`, `@react-three/drei`'s `useGLTF`, `OrbitControls`, and `Html`.
- `LoadedModel` clones the downloaded GLTF scene before rendering it, so loading and display state are separate.
- Orbit controls let the learner drag to rotate and scroll to zoom. Buttons reset the camera and use the browser Fullscreen API.
- Each saved annotation becomes an `Html` marker at its stored `[x, y, z]` position. Selecting a marker notifies `ModelDetailPage`, which renders its title and explanation panel.

Opening and using the model also produces learning signals:

- Loading the detail page records `opened` with a session UUID.
- Leaving after at least five seconds records `model_viewed` with duration.
- `recordMeaningfulInteraction()` records `model_explored` after two OrbitControls interactions (rotate/zoom end events). The current `ModelViewer` wires this callback to `OrbitControls.onEnd`; selecting a hotspot itself only opens the annotation panel.
- `GET /models/{id}` independently records a recent-view entry using `ActivityService.record_resource_view()`.

### C. Annotation (learning hotspot) lifecycle

An annotation is not a visual change inside the GLB file. It is a separate database record whose coordinates are interpreted relative to the rendered 3D scene. This makes annotations editable without replacing or re-uploading the model.

#### Frontend lifecycle

1. `ModelDetailPage` loads the annotation list via `authService.getModelAnnotations(resourceId)`.
2. Only the owning educator sees the **Add** control because `canManageAnnotations` depends on the backend response.
3. `beginNewAnnotation()` enables placement mode.
4. The educator clicks the mesh in `ModelViewer`. `LoadedModel.handleModelClick()` reads `event.point` from React Three Fiber and passes the exact 3D coordinate to `placeAnnotation()`.
5. `placeAnnotation()` creates a local draft `{ title, description, position }` and shows the form.
6. `saveAnnotation()` uses either create or update depending on whether `editingAnnotationId` exists. It updates local React state with the returned saved record.
7. A selected marker displays the explanation. Only an educator who created that annotation sees **Edit** and **Delete** controls.

#### API and database lifecycle

| User action   | HTTP request                                             | Backend route/function                                                   | Database action                                         |
| ------------- | -------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| Load markers  | `GET /resources/models/{id}/annotations`               | `list_model_annotations()` → `ResourceService.list_annotations()`   | Reads all annotations for the model in creation order   |
| Create marker | `POST /resources/models/{id}/annotations`              | `create_model_annotation()` → `ResourceService.create_annotation()` | Inserts title, description, owner and`position_x/y/z` |
| Edit marker   | `PUT /resources/models/annotations/{annotation_id}`    | `update_model_annotation()` → `ResourceService.update_annotation()` | Updates text, coordinates and`updated_at`             |
| Delete marker | `DELETE /resources/models/annotations/{annotation_id}` | `delete_model_annotation()` → `ResourceService.delete_annotation()` | Deletes the annotation record                           |

The Pydantic request schema `ModelAnnotationCreate` requires a 1–100-character title, a 1–1200-character description, and exactly three numeric position values. `ResourceService.create_annotation()` first confirms that the resource is a 3D model owned by the signed-in educator. Update/delete filter by `created_by` as well. Database RLS adds a second layer: the annotation migration allows authenticated users to read markers, but only the model-owning educator can create them; owner-only restrictions are reinforced in `20260720153638_restrict_model_annotations_to_owners.sql`.

### D. Model deletion

The model-library delete button is visible only when `model.created_by === user.id`. `ModelLibraryPage.deleteModel()` calls `authService.deleteThreeDModel()`, then removes the card from page state on success. `ResourceService.delete_3d_model()` verifies ownership, deletes related annotation/share/recommendation/favourite/activity records, deletes the `resources` record, and attempts to delete the GLB object from Storage. The model cannot be deleted by another educator or a student.

## 3. Tutorial videos: publishing, playback and learning tracking

### What is stored where

| Item                       | Storage location                 | Meaning                                                                                            |
| -------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------- |
| Video lesson record        | `videos` table                 | `video_id`, educator ID in `uploaded_by`, title, `youtube_url`, and optional `subject_tag` |
| Actual video stream        | YouTube                          | Qubo does not receive/store an MP4 or other video file                                             |
| Thumbnail                  | YouTube thumbnail URL at runtime | Built from the extracted YouTube video ID; fallback image is bundled in frontend public assets     |
| Viewing/completion summary | `user_resources`               | A user/video row records latest open and completion state                                          |
| Playback behaviour         | `learning_events`              | Played, paused, progress, rewind, quick skip and completed signals                                 |

### A. What “upload tutorial video” means in this system

On the Upload Content page, selecting **Video** shows a title, subject, and YouTube URL field. The educator uses `EducatorUploadContentPage.handleSubmit()` and calls `authService.createTutorialVideo()`. The request is JSON rather than multipart:

```json
POST /api/v1/videos
{
  "title": "Acid and Alkali Revision",
  "youtube_url": "https://youtube.com/watch?v=...",
  "subject_tag": "Chemistry"
}
```

`POST /videos` calls `create_video()` and requires `get_current_educator`. `VideoService.create_video()`:

1. Checks whether another record already has the exact trimmed YouTube URL.
2. Returns HTTP 409 if it is already present.
3. Inserts the title, URL, subject label and uploading educator ID into `videos`.
4. Calls `CollectionService.add_uploaded_item(educator_id, 'video', video_id)` to add a reference to **My uploaded content**.

There is no backend download from YouTube, transcoding, virus scan, or local media storage. This is link publication. The backend also currently stores a generic URL string; it does not validate that the URL is a live YouTube video during creation. The frontend later detects whether it can extract a usable YouTube video ID before rendering the embedded player.

### B. Browsing video records

`TutorialVideoPage.loadVideos()` requests `GET /api/v1/videos`, with `scope=public` or `scope=private` for an educator's own uploads. The backend `list_videos()` protects private scope with `get_current_user` plus a role check, then passes the viewer's ID as `uploader_id` when required. `VideoService.list_videos()` loads rows from `videos`, can filter with `subject_tag` and title search, and returns them alphabetically.

The React page builds subject buttons and title search locally. `getYouTubeVideoId()` supports normal `watch?v=...`, short `youtu.be/...`, and `/embed/...` URLs. `getThumbnailUrl()` derives `https://img.youtube.com/vi/<id>/hqdefault.jpg`; invalid links use `/images/resource-video-preview.png`.

### C. Playback inside Qubo

Clicking a card runs `TutorialVideoPage.openVideo(video)`:

1. It opens the player modal and creates a `crypto.randomUUID()` session ID.
2. It calls `recordTutorialVideoView(video_id)`, which sends `POST /videos/{video_id}/view`. The backend verifies that the video exists and updates/inserts the summary entry in `user_resources`.
3. It sends a learning event of type `opened`, tagged with source `tutorial_player`.
4. If the YouTube ID is valid, the modal renders `YouTubeLearningPlayer`.

`YouTubeLearningPlayer` does not embed a simple `<iframe>` directly. Its `loadYouTubeIframeApi()` lazily inserts the official `https://www.youtube.com/iframe_api` script once and shares the resulting Promise between component instances. The player is then created with the YouTube ID, no autoplay, related videos disabled, and the browser origin.

Every five seconds during playback, `sampleProgress()` reads current time and duration from YouTube. It:

- Adds forward progress to `watchedSeconds`, capping a single sample at 15 seconds.
- Detects a jump backwards of at least eight seconds as `rewound`.
- Emits `video_progress` at 25% progress buckets (and at 100%) rather than on every five-second tick.
- Emits `video_played` only once per session, and emits `video_paused` when YouTube reports pause.
- Calls `onWatchedEnough()` at 90% progress or when YouTube reports playback ended.

`TutorialVideoPage.markVideoCompleted()` receives that callback and sends `POST /learning/completion`. The backend marks the user/video row as completed only once, stores `completed_at`, and records a `completed` event. If the modal closes before 15 watched seconds and before 10% progress, `closeVideoSummary()` sends `skipped_quickly` instead.

The event endpoint is `POST /learning/events`. `LearningService.record()` checks that the event is valid for the target type, confirms that the video exists, infers a subject tag, keeps only allowed metadata fields, bounds numerical values, and inserts the immutable event row. This data feeds recommendations and analytics.

### D. Video deletion

`TutorialVideoPage.deleteVideo()` offers deletion only if the current educator is the `uploaded_by` owner. `DELETE /videos/{id}` calls `VideoService.delete_video()`, which verifies ownership, removes dependent sharing/recommendation/favourite/activity rows, and deletes the `videos` record. It does **not** delete anything on YouTube, since the actual video is not hosted by Qubo.

## 4. Recommendation system

Qubo has two different features that may both look like “recommendations” in the interface. They should be described separately.

### A. Automated “next step” recommendation

The personalised card in `ResourceHubPage` is loaded with `authService.getModelRecommendation()`, which calls `GET /api/v1/resources/recommendation`. Despite the older method name, the endpoint can return either a 3D model **or a video**.

The selection algorithm lives in `ResourceService.recommend_3d_model()` and is rule-based, not a machine-learning model:

1. Load the public 3D models and all video records. If neither exists, return `null`.
2. Read the user's `user_resources` rows to identify previously opened model and video IDs.
3. Read the latest 120 `learning_events`, newest first.
4. Convert meaningful subject-related events into a score using these current weights:

| Event                                                    | Subject-interest weight |
| -------------------------------------------------------- | ----------------------: |
| `saved`                                                |                      +4 |
| `completed`                                            |                      +3 |
| `quiz_completed`                                       |                      +3 |
| `model_explored`, `model_viewed`, `video_progress` |                      +2 |
| `opened`, `video_played`                             |                      +1 |
| `skipped_quickly`                                      |                      -2 |

5. Limit each `(subject, event type)` combination to three contributions. This prevents repeated page refreshes or playback-progress reports from overwhelming the result.
6. Check quiz-completion events. If the most recent/lowest recorded quiz score for a subject is below 60%, choose an unseen video in that subject when possible. The response explains that a focused video is being offered before another quiz, uses an estimated six minutes, and prioritises unseen content.
7. If there is no weak quiz score, choose a 3D model. Prefer models not yet viewed; rank candidates by the user's accumulated score for the model subject, with title as deterministic tie-breaking. The response says whether it follows observed subject interest, broadens existing learning, or is a starting point.
8. If an unexpected database/service problem happens, safely return the first model, or the first video if no model exists, with a generic reason.

The returned object includes target type/ID, title, subject/topic, reason, learning goal, estimate, and either `preview_model_url` or `youtube_url`. `ResourceHubPage` displays it and routes the user to the appropriate model or tutorial page. The **Not now** button only hides the recommendation in that browser for the current day by writing `qubo-recommendation-dismissed` to `localStorage`; it does not alter the backend ranking.

`RecommendationExplanationService.explain()` is optional. Its selection is never delegated to AI. If both `GEMINI_API_KEY` and `ENABLE_LLM_RECOMMENDATION_EXPLANATIONS` are enabled, it sends only the selected title, subject, and rule-based reason to Gemini to rewrite the explanation as one short sentence. It falls back to the original rule text on any missing setting or request failure; it does not send student PII or choose a resource.

### B. Popular models

The separate `GET /resources/models/popular` endpoint is not personalised. `ResourceService.list_popular_3d_models()` counts distinct `(model, learner)` pairs with meaningful model events in the past 14 days and returns the top three, ordered by count then title. If `learning_events` is unavailable, it falls back to recent `user_resources` rows; if that fails too, it returns the first models with count zero.

### C. Educator's picks

Educator picks are curated recommendations, not generated by the automatic ranking algorithm.

- In `ModelDetailPage`, the owner/educator can select **Recommend** and enter a note.
- In `TutorialVideoPage`, educators can click the star button on a video and enter a note.
- Both call `authService.createEducatorPick()` → `POST /resources/educator-picks` with target type (`model` or `video`), target UUID, and a 1–300-character reason.
- `ResourceService.create_educator_recommendation()` confirms the target exists, prevents the same educator from recommending the same target twice, and inserts `educator_recommendations`.
- `ResourceHubPage` loads `GET /resources/educator-picks` and renders the newest picks, including educator display name, note, model preview/video thumbnail, and navigation link.

The `educator_recommendations` migration stores exactly one target per row (either `resource_id` or `video_id`) and enforces unique model/video picks per educator. Only the educator who owns the pick can delete it; authenticated users can read it.

## 5. Educator resources inside collections

### Key design: collections store links, not duplicate assets

The same model/video/quiz can appear in a collection without being copied. A collection item stores exactly one foreign key:

```text
collections (one educator-owned learning pack)
      │ 1-to-many
      ▼
collection_items
  ├── video_id    → videos.video_id
  ├── resource_id → resources.resource_id (3D model)
  └── quiz_id     → quizzes.id
```

This means editing the collection changes membership and order, but does not create another GLB object, YouTube record, or quiz record. Database constraints ensure the item type and populated foreign key agree. Deleting an original content row cascades to references that depend on it. Deleting a collection cascades to its items and shares, but does not delete the original uploaded resources.

The `collections` table owns the pack's educator, title, description, optional primary subject, status (`draft`, `shared`, or `archived`), version, source collection, timestamps, and optional cover image. `collection_items` has an explicit `sort_order` for item order. `collection_shares` records each student recipient, educator sender, optional message/due date, and when the recipient opened it.

### A. Automatic storage after publishing

Both publishing services call the same helper after their main asset record is successfully created:

- `ResourceService.create_3d_model()` calls `CollectionService.add_uploaded_item(educator_id, 'model', resource_id)`.
- `VideoService.create_video()` calls `CollectionService.add_uploaded_item(educator_id, 'video', video_id)`.

`CollectionService.add_uploaded_item()` finds the educator's draft collection titled **My uploaded content**. If it does not exist, it creates it with a standard description. It checks whether the target is already referenced, counts existing items to choose the next `sort_order`, inserts the `collection_items` row, and refreshes the collection `updated_at` timestamp.

Therefore, an educator's just-published model or video is automatically stored as a collection reference. The original data stays in `resources` or `videos`; the default collection is an editable organiser/view of those uploads.

### B. Frontend collection management

`MyCollectionsPage` is educator-only and shows collections by draft/shared/archived status. It provides these flows:

| Frontend action   | Frontend function                  | API call                                                               | Result                                                              |
| ----------------- | ---------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Load list         | `loadCollections()`              | `GET /collections/mine`                                              | Fetches only the signed-in educator's collection cards and previews |
| Create empty pack | `createCollection()`             | `POST /collections`                                                  | Saves title/description as a draft                                  |
| Edit content      | Opens`CollectionEditorModal`     | `GET /collections/{id}/editor`, `GET /collections/content-options` | Shows included items and the educator's owned content library       |
| Add resource      | `CollectionEditorModal.add()`    | `POST /collections/{id}/items`                                       | Adds one reference at current end order                             |
| Remove resource   | `CollectionEditorModal.remove()` | `DELETE /collections/{id}/items/{itemId}`                            | Deletes only the linking row                                        |
| Share             | `share()`                        | `POST /collections/{id}/share`                                       | Shares the frozen draft with selected student accounts              |
| Archive           | `archive()`                      | `POST /collections/{id}/archive`                                     | Moves pack to archived status                                       |
| Duplicate         | `duplicate()`                    | `POST /collections/{id}/duplicate`                                   | Makes a new editable version with copied linking rows               |
| Delete            | `deleteCollection()`             | `DELETE /collections/{id}`                                           | Deletes a non-shared collection and its references/shares           |

`CollectionEditorModal.load()` requests editor data and content options in parallel. The content-options endpoint returns only assets owned by the current educator: their 3D models, their videos, and their quizzes. The modal calculates a `type:id` set to disable options already included and lets the educator filter by model/video/quiz. When adding, the frontend sends `sort_order: items.length`; then it reloads both editor data and its parent list.

Collection cards request their preview items through `CollectionService._preview_items()`. For model previews, the backend generates a fresh signed Storage URL. For video previews, it returns the YouTube URL. The browser's `CollectionPreview` then renders a model thumbnail, YouTube thumbnail, or quiz placeholder.

### C. Backend ownership rules and state transitions

All collection routes require `get_current_educator` and call `_owner_collection(collection_id, educator_id)`, which ensures an educator can only read or change their own packs.

Only `draft` collections are editable or shareable:

- `add_item()`, `remove_item()` and `update()` reject a non-draft collection with HTTP 409.
- `add_item()` checks `_owned_target()` first, so an educator can add only their own models, videos, and quizzes.
- A shared collection is intentionally immutable. The educator must duplicate it to create a new editable version.
- `duplicate()` creates a draft with incremented version/title and copies the collection-item reference rows in their existing order.
- A shared collection must be archived before it can be permanently deleted.

When `share()` is called, the backend validates that every selected recipient is a registered student. It also creates missing `educator_students` links, so educator analytics may be scoped to the students the educator has deliberately shared with. It upserts each `(collection_id, student_id)` record into `collection_shares`, then changes the collection status to `shared`.

Students receive the collection through the learning routes handled by `CollectionInboxService` (`backend/app/services/collection_inbox.py`):

- `GET /learning/shared-collections` lists the recipient's shares.
- `GET /learning/shared-collections/{collection_id}` returns the shared pack's details.
- `POST /learning/shared-collections/{collection_share_id}/open` marks it opened.
- A student can copy a shared quiz into their personal quiz library via the save-quiz route.

## 6. Function-to-code-file reference

### Shared frontend and API infrastructure

| Responsibility                                           | File                                | Main function/class                                                                                                |
| -------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| HTTP client, bearer token, refresh, frontend API methods | `frontend/src/lib/authService.ts` | `AuthService`; `uploadThreeDModel`, `createTutorialVideo`, annotation, recommendation and collection methods |
| API application and route registration                   | `backend/app/main.py`             | `app.include_router(...)`                                                                                        |
| JWT/profile/role checks                                  | `backend/app/db/deps.py`          | `get_current_user`, `get_current_educator`                                                                     |
| Privileged Supabase connection                           | `backend/app/db/supabase.py`      | `get_supabase()`                                                                                                 |

### 3D model and annotation functions

| Responsibility                                          | File                                                             | Function/class                                                                                                                                                               |
| ------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upload form and redirect to annotation mode             | `frontend/src/features/educator/EducatorUploadContentPage.tsx` | `handleSubmit()`                                                                                                                                                           |
| Model library/list/search/saved/delete                  | `frontend/src/features/resources/ModelLibraryPage.tsx`         | `loadModels`, `toggleFavourite`, `deleteModel`, `submitShare`                                                                                                        |
| Model page, session events, hotspot form                | `frontend/src/features/resources/ModelDetailPage.tsx`          | `loadModel`, `recordMeaningfulInteraction`, `beginNewAnnotation`, `placeAnnotation`, `saveAnnotation`, `deleteAnnotation`                                        |
| Three.js rendering and clicking hotspot position        | `frontend/src/features/resources/ModelViewer.tsx`              | `LoadedModel`, `handleModelClick`, `ModelViewer`                                                                                                                       |
| Model/annotation frontend types                         | `frontend/src/types/resource.ts`                               | `ThreeDModelDetail`, `ModelAnnotation`, `ModelAnnotationDraft`                                                                                                         |
| Model upload/list/detail/annotation endpoints           | `backend/app/api/v1/resources/routes.py`                       | `upload_3d_model`, `list_3d_models`, `get_3d_model`, `list_model_annotations`, `create_model_annotation`, `update_model_annotation`, `delete_model_annotation` |
| Model storage, signed URL and annotation database logic | `backend/app/services/resource.py`                             | `ResourceService.create_3d_model`, `list_3d_models`, `get_3d_model`, `list_annotations`, `create_annotation`, `update_annotation`, `delete_annotation`         |
| Payload/response validation                             | `backend/app/schemas/resource.py`                              | `ModelAnnotationCreate`, `ModelAnnotationResponse`, `ThreeDModelDetailResponse`                                                                                        |
| Annotation table/RLS                                    | `supabase/migrations/20260715124728_resource_annotations.sql`  | `resource_annotations` schema and policies                                                                                                                                 |

### Tutorial-video functions

| Responsibility                                        | File                                                             | Function/class                                                                                |
| ----------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Video URL form submission                             | `frontend/src/features/educator/EducatorUploadContentPage.tsx` | `handleSubmit()`                                                                            |
| Browse, modal open, completion and save/share actions | `frontend/src/features/videos/TutorialVideoPage.tsx`           | `loadVideos`, `openVideo`, `markVideoCompleted`, `closeVideoSummary`, `deleteVideo` |
| YouTube script/player and playback event tracking     | `frontend/src/features/videos/YouTubeLearningPlayer.tsx`       | `loadYouTubeIframeApi`, `YouTubeLearningPlayer`, internal `sampleProgress`              |
| Video frontend data type                              | `frontend/src/types/video.ts`                                  | `TutorialVideo`                                                                             |
| Video API endpoints                                   | `backend/app/api/v1/videos/routes.py`                          | `create_video`, `list_videos`, `record_video_view`, `delete_video`                    |
| Video database operations                             | `backend/app/services/video.py`                                | `VideoService.create_video`, `list_videos`, `ensure_video_exists`, `delete_video`     |
| Video schema                                          | `backend/app/schemas/video.py`                                 | `VideoResponse`                                                                             |
| Learning event/completion routes                      | `backend/app/api/v1/learning/routes.py`                        | `record_learning_event`, `mark_completed`                                                 |
| Event validation and storage                          | `backend/app/services/learning.py`                             | `LearningService.record`, `mark_completed`                                                |
| Latest-view tracking                                  | `backend/app/services/activity.py`                             | `ActivityService.record_video_view`, `_record_view`                                       |

### Recommendation functions

| Responsibility                                    | File                                                                             | Function/class                                                                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Resource hub, recommendations and daily dismissal | `frontend/src/features/resources/ResourceHubPage.tsx`                          | `ResourceHubPage`, `dismissRecommendation`, `openTarget`                                                            |
| Create/remove educator picks on a model           | `frontend/src/features/resources/ModelDetailPage.tsx`                          | `saveEducatorPick`, `removeEducatorPick`                                                                              |
| Create/remove educator picks on a video           | `frontend/src/features/videos/TutorialVideoPage.tsx`                           | `submitEducatorPick`, `toggleEducatorPick`                                                                            |
| Automated ranking and educator-pick retrieval     | `backend/app/services/resource.py`                                             | `recommend_3d_model`, `list_popular_3d_models`, `list_educator_recommendations`, `create_educator_recommendation` |
| Optional AI explanation rewrite only              | `backend/app/services/recommendation.py`                                       | `RecommendationExplanationService.explain`                                                                              |
| Recommendation API endpoints                      | `backend/app/api/v1/resources/routes.py`                                       | `get_recommendation`, `list_educator_picks`, `create_educator_pick`, `delete_educator_pick`                       |
| Event table supporting ranking                    | `supabase/migrations/20260716043147_add_learning_events_and_progress.sql`      | `learning_events` schema                                                                                                |
| Curated educator-pick table                       | `supabase/migrations/20260716084654_add_educator_resource_recommendations.sql` | `educator_recommendations` schema and policies                                                                          |

### Collection functions

| Responsibility                                        | File                                                                            | Function/class                                                                                                                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Collection list/create/share/version controls         | `frontend/src/features/educator/MyCollectionsPage.tsx`                        | `loadCollections`, `createCollection`, `openShare`, `share`, `archive`, `deleteCollection`, `duplicate`                                                         |
| Add/remove owned content in modal                     | `frontend/src/features/educator/CollectionEditorModal.tsx`                    | `load`, `add`, `remove`                                                                                                                                                 |
| Collection API endpoints                              | `backend/app/api/v1/collections/routes.py`                                    | `list_collections`, `create_collection`, `content_options`, `collection_editor`, `add_item`, `share_collection`, `archive_collection`, `duplicate_collection` |
| Collection ownership, item links, sharing, versioning | `backend/app/services/collection.py`                                          | `CollectionService.add_uploaded_item`, `create`, `content_options`, `add_item`, `remove_item`, `share`, `archive`, `delete`, `duplicate`                    |
| Student-facing shared collection access               | `backend/app/api/v1/learning/routes.py`                                       | `list_shared_collections`, `get_shared_collection_detail`, `open_shared_collection`, `save_shared_quiz`                                                               |
| Student inbox service                                 | `backend/app/services/collection_inbox.py`                                    | `CollectionInboxService`                                                                                                                                                    |
| Collection request schemas                            | `backend/app/schemas/collection.py`                                           | `CollectionCreate`, `CollectionItemCreate`, `CollectionShareCreate`                                                                                                     |
| Collection tables, constraints and RLS                | `supabase/migrations/20260719120000_add_educator_content_and_collections.sql` | `collection_items`, `collection_shares`, relevant policies                                                                                                                |

## 7. Important implementation facts and limits

- A model's permanent Storage path is not exposed to normal frontend responses. The backend creates signed URLs valid for 15 minutes.
- `private` 3D models are available only to their uploader. Videos have a private-scope library view based on uploader identity, but the current `videos` record does not have a matching visibility column.
- An annotation stays tied to the current model coordinate system. Replacing/reorienting the GLB later can make old coordinates no longer match the intended feature.
- The first automatic recommendation falls back to an alphabetical/public content choice when a learner has no usable events. It becomes more personalised as model/video/quiz events accumulate.
- Recommendation rules use the subject inferred by the backend from the target record; arbitrary frontend-provided subject values are not trusted.
- Collections preserve references and order. They do not make copies of models/videos; deleting a source resource can remove its linked collection entries through database cascades.
- A shared collection is intentionally frozen. Duplicate it to make a revised draft without altering what students were originally assigned.
