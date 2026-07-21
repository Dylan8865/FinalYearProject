# My Collections — Product and Figma Specification

## Purpose

My Collections is an educator workspace for creating private teaching packs, adding learning content, sharing a selected pack with selected linked students, and managing its versions.

It follows the existing Qubo visual language: light slate background, white rounded panels, bold dark headings, Qubo blue primary actions, soft shadows, and compact educator data tables.

Reference Figma file: [FYP System design](https://www.figma.com/design/wwLIL2rJ82IkVQRwgwEvwj/FYP---System-design)

- Educator Upload Content: node `1277:1712`
- Educator Profile & Settings: node `1277:1941`
- Dashboard: node `1202:1128`

## Confirmed Decisions

| Area | Decision |
| --- | --- |
| Ownership | Educators create teaching packs; students can copy a shared pack into a private collection. |
| Sharing | Educators manually select linked students only. No public collection link or automatic sharing to all linked students. |
| Tracking | Educators only see whether each recipient opened the collection. |
| Supported items | Video, 3D Model, and Quiz; educator manually sets the order. |
| Quiz editing | Unpublished quizzes are editable. Published quizzes are locked and must be copied before editing. |
| Quiz lifecycle | Quiz publishing is independent from collection sharing. |
| Collection fields | Title and description are required. Subject/topic/form are inferred when possible; mixed-subject collections need an educator-selected primary subject. |
| Share options | Optional message/instruction and due date. |
| Student actions | Open items, complete learning activities, favourite individual items, and copy the whole collection privately. |
| Shared lifecycle | Shared collections are immutable. They can be archived; changes require a duplicated new version. Archived collections remain available to existing recipients. |

## Navigation

- Do **not** add My Collections to the student sidebar.
- Add an educator-only **My Collections** entry or tab in the Educator Upload Content area.
- Educator Profile & Settings can include a shortcut, but is not the main management screen.
- Student collection copies belong in the student personal resource area.

## Screen 1 — Educator My Collections List

### Header

```text
EDUCATOR WORKSPACE
My Collections                                      + New collection
Create, share, and manage focused learning packs.
```

### Controls

- Status tabs: **All**, **Draft**, **Shared**, **Archived**.
- Search by title or description.
- Optional subject filter.
- Primary action: **+ New collection**.

### Collection Cards

Use a responsive card grid. Each card shows:

- Auto-generated cover collage from its first few resource thumbnails.
- Title and first description line.
- Primary subject and optional form level.
- Item summary, for example: `2 Videos · 1 Model · 1 Quiz`.
- Status chip: Draft, Shared, or Archived.
- Shared status: `Opened 4/12 students`.
- Last updated date and context menu.

| Status | Main action | Secondary actions |
| --- | --- | --- |
| Draft | Continue editing | Preview, Delete |
| Shared | View details | Duplicate as new version, Archive |
| Archived | View details | Duplicate as new version |

### Empty State

```text
No collections yet
Turn videos, 3D models, and quizzes into a focused learning pack.
[ Create your first collection ]
```

## Screen 2 — Collection Builder

```text
← Back to My Collections                     Save draft   Share to students

Title [_______________________________________]
Description [_________________________________]
Primary subject [Auto-detected / Select when mixed]

Available resources                           Collection outline
[ Search resources ]                          1. Video — Acid and Alkali
[ Video | 3D Model | Quiz ]                   2. 3D Model — pH Scale
[ Subject filter ]                            3. Quiz — Acid Revision
                                                ↕ Drag to reorder

[ + Add selected resource ]                   [Preview] [Remove]
```

### Resource Library

- Search field.
- Video, 3D Model, Quiz filters.
- Subject filter.
- Each row/card has thumbnail, title, subject, and Add action.

### Collection Outline

- Ordered vertical list with drag handles.
- Each item has type icon, title, metadata, preview, and remove.
- Quiz states:
  - **Draft — Edit questions**
  - **Published — Locked**, with **Duplicate quiz to edit**

### Rules

- Draft collections are editable.
- Sharing creates an immutable shared version.
- Editing a shared collection requires **Duplicate as new version**.
- Mixed items require a primary subject; otherwise it is inferred automatically.

## Screen 3 — Share to Students Modal

```text
Share “Chemistry Revision Pack”                             [×]

[ Search linked students ]
☑ Aiman Ahmad              ☑ Siti Nur
☐ Benjamin Lee             ☐ Mei Ling

Message / instruction
[ Complete this before our revision session.              ]

Due date
[ 30 Aug 2026 ]

[ Cancel ]                                    [ Share collection ]
```

Requirements:

- Only the educator's linked students are selectable.
- Allow multi-select.
- Message and due date are optional.
- Show recipient count after success.

## Screen 4 — Shared Collection Detail

A read-only management view for shared collections. Show:

- Cover, title, description, primary subject, and item count.
- Shared date and version number.
- Recipient table: student name, shared date, opened/not opened, opened date when available.
- **Duplicate as new version** primary action.
- **Archive collection** secondary/danger action.

Do not display per-item completion progress; the agreed tracking is collection open status only.

## Screen 5 — Student Shared Collection View

Students see a read-only collection containing:

- Cover, title, description, educator name, primary subject, and due date.
- Educator message/instruction.
- Ordered Video, 3D Model, and Quiz item cards.
- Item actions: Open, Start quiz, and save individual item to favourites.
- **Copy to My Collections** action.

Rules:

- Opening this page updates the recipient share's `opened_at`.
- A student cannot edit the educator's original collection.
- A student copy is private and does not change the original.

## Visual Direction

- Keep the current Qubo desktop shell.
- Light slate/blue-grey page background.
- White 20–28px rounded panels with soft shadows and subtle slate borders.
- Qubo blue filled primary buttons.
- Status chips: Draft (slate/blue), Shared (emerald/blue), Archived (neutral grey).
- Video, 3D Model, and Quiz type chips/icons.
- Auto thumbnail collage cover; use a dark/blue gradient fallback.
- Use cards for collection overview and readable tables for management data.
- Avoid a marketing-page appearance.

## Recommended Data Model

The existing `collections` and `collection_videos` tables support video playlists only. Use generic collection items and explicit sharing/version state.

### collections

```text
collection_id
owner_id                 -> profiles.id
title
description
primary_subject_id       -> subjects.id, nullable
status                   -> draft | shared | archived
source_collection_id     -> collections.collection_id, nullable
version                  -> integer, default 1
is_student_copy          -> boolean, default false
cover_image_url          -> nullable
created_at
updated_at
archived_at              -> nullable
```

Use `owner_id` rather than educator-only ownership so student copies use the same table. Backfill existing `educator_id` into `owner_id`.

### collection_items

Progressively replace `collection_videos` with:

```text
collection_item_id
collection_id            -> collections.collection_id
item_type                -> video | model | quiz
video_id                 -> videos.video_id, nullable
resource_id              -> resources.resource_id, nullable
quiz_id                  -> quizzes.id, nullable
sort_order               -> integer
created_at
```

Enforce exactly one target ID that matches `item_type`.

### collection_shares

```text
collection_share_id
collection_id            -> collections.collection_id
student_id               -> profiles.id
shared_by                -> profiles.id
message                  -> nullable
due_at                   -> nullable
shared_at
opened_at                -> nullable
```

`opened_at` is the only educator-facing tracking signal.

### quizzes: versioning fields

```text
status                   -> draft | published
published_at             -> nullable
source_quiz_id           -> quizzes.id, nullable
```

When a published quiz needs changes, create a copied quiz with `source_quiz_id`; never mutate its published question/answer set.

## Access Rules

| Actor | Allowed actions |
| --- | --- |
| Educator owner, Draft | Create, edit, reorder, edit unpublished quizzes, preview, delete, share. |
| Educator owner, Shared | View recipient open status, archive, duplicate as new version. No direct item editing. |
| Educator owner, Archived | View and duplicate as new version. |
| Selected student | Open collection/items, favourite individual items, copy collection privately. |
| Other students | No access. |
| Admin | Existing content-management permissions; no automatic collection sharing. |

## Existing Qubo Tables to Reuse

| Existing table | Role |
| --- | --- |
| `profiles` | Owners, linked students, usernames, roles. |
| `educator_students` | Limits share recipients. |
| `videos` | Video items and thumbnails. |
| `resources` | 3D Model items and thumbnails. |
| `quizzes`, `questions`, `question_options` | Quiz items and publishing workflow. |
| `user_favourites` | Student saves individual items. |
| `user_resources`, `learning_events` | Personal activity only; not collection completion analytics. |
| `collections`, `collection_videos` | Migration starting point. |

## Figma Handoff Prompt

> Create an educator-facing **My Collections** experience in the existing Qubo Figma file. Match the styling of Educator Upload Content, Educator Profile & Settings, and Dashboard. Do not add it to the student sidebar. Create five connected desktop views: (1) educator My Collections list, (2) collection builder with resource library and drag-sort outline, (3) Share to Students modal, (4) shared collection management/detail view with recipient opened status, and (5) student read-only shared collection view. Use this document as the source of truth for functionality and lifecycle states.

