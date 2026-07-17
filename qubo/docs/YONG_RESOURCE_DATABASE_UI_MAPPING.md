# Qubo Resource Database and UI Mapping

This document explains how the Supabase tables `resources`, `user_resources`, `achievements`, `matches`, `match_history`, `collections`, `collection_videos`, `videos`, and `user_favourites` support Yong Chao Juin's Qubo modules from the project report.

The mapping focuses on:

- Personalized Recommendations and Resource Curation Module
- Resource and System Management Module
- Game iframe integration only, because the full game is already implemented separately in `GameDev`

## Module Scope From Report

### Personalized Recommendations and Resource Curation

This module supports the student-facing resource experience:

- Browse 3D model resources.
- Browse tutorial video resources.
- Search tutorial videos by keyword or title.
- Filter videos/resources by subject.
- Show trending and popular videos.
- Show recently viewed resources.
- Save and remove favourite videos/resources.
- Share tutorial videos or curated collections.
- Recommend resources based on the user's subject, learning profile, and viewing history.

### Resource and System Management

This module supports the admin/educator-facing management experience:

- Upload, edit, and delete tutorial video links.
- Upload, update, and categorize 3D model resources.
- Convert YouTube URLs into embeddable playback links.
- Track internal view/play counts.
- Display analytics based on Qubo internal usage instead of YouTube global metrics.
- Curate resources into collections.

### Lightweight Gamification

The card game itself does not need to be rebuilt in the web frontend because it already exists in `GameDev`.

The web frontend only needs:

- A `Game Room` or `Game` page.
- An iframe that embeds the built game.
- Optional result syncing after the game ends, if the iframe/game can send data back.

## Table Responsibilities

| Table | Main Purpose | Supported UI Area | Report Requirement Coverage |
|---|---|---|---|
| `resources` | Stores general learning resources such as 3D models, articles, interactive assets, or resource metadata. | Resource page, 3D model page, admin upload/content page. | FR 1.1, 1.3, 1.5, 1.6, 3.4 |
| `videos` | Stores tutorial video records, YouTube links, embed URLs, subject tags, duration, thumbnail, and internal view count. | Tutorial video page, resource page, analytics dashboard. | FR 1.2, 1.4, 1.7-1.10, 1.16-1.18, 3.2, 3.3, 3.5-3.7 |
| `user_resources` | Tracks each user's interaction with resources, such as viewed, completed, recent, progress, or recommendation status. | Recent list, recommendation feed, dashboard learning activity. | FR 1.11, 1.12, 1.18 |
| `user_favourites` | Stores videos/resources saved by each user. | Favourites list, save/remove favourite button. | FR 1.13, 1.14 |
| `collections` | Stores curated learning collections/playlists created by educators/admins or users. | Collection cards, shared resource packs, admin content management. | FR 1.11, 1.15, 3.2 |
| `collection_videos` | Join table linking videos into collections and controlling order. | Collection detail page, playlist-style video grouping. | FR 1.15, 3.2, 3.3 |
| `achievements` | Stores badges/rewards earned by students from study activity, resource viewing, or game completion. | Dashboard badge section, profile achievements, motivational UI. | Supports gamified learning motivation and usability, but should not replace the GameDev battle logic. |
| `matches` | Stores high-level game session records if the iframe game sends match data back. | Game room summary, match result display, dashboard recent activity. | Optional web-side logging for FR 2.17-2.21 if game result syncing is needed. |
| `match_history` | Stores detailed per-turn or per-action game events if the iframe game exports them. | Game history, analytics, post-game review. | Optional only; full game logic remains in `GameDev`. |

## How Each Table Supports the Current UI

### `resources`

Use this table as the main source for non-video learning resources, especially 3D models.

In the student UI, it can power:

- Resource cards on the Resource page.
- 3D model library by subject.
- Subject/category filter chips.
- Search results mixed with videos if desired.
- Resource detail page with title, description, subject, category, preview image, and launch/open button.

In the admin/educator UI, it can power:

- Upload Content page.
- Edit resource metadata.
- Delete or deactivate outdated resources.
- Categorize by subject such as Biology, Chemistry, Physics, Mathematics.

Suggested UI behavior:

- Student clicks `Resource` in sidebar.
- Frontend loads active resources grouped by subject.
- Student chooses a subject filter.
- Student opens a 3D model page or external asset.
- A row is created/updated in `user_resources` to track the interaction.

### `videos`

Use this table as the main source for tutorial video browsing and analytics.

In the student UI, it can power:

- Tutorial video homepage.
- Trending videos.
- Popular videos.
- Search by keyword/title.
- Subject filter categories.
- Video card title, subject tag, duration, thumbnail.
- Embedded in-platform playback.

In the admin UI, it can power:

- Add YouTube URL.
- Automatically store embed URL.
- Edit video title and subject tag.
- Delete/deactivate video.
- Internal view count ranking.

Important point for the report:

The `videos` table should track Qubo's **internal view count**, not YouTube's global view count. This directly supports the report's requirement that admin analytics identify resources that are truly useful to the Qubo student cohort.

Suggested UI behavior:

- Student opens a video.
- The frontend/backend increments `videos.internal_view_count`.
- The video is added to `user_resources` as a recent view.
- If the user clicks favourite, insert into `user_favourites`.
- Analytics dashboard ranks videos by internal view count.

### `user_resources`

Use this table to personalize the student experience.

It can track:

- Recently viewed resources.
- Completed resources.
- Time spent or last viewed date.
- Resource recommendation status.
- Learning progress by resource.

In the UI, it can power:

- `Recent` section.
- `You` section.
- Personalized recommendation feed.
- Dashboard activity summary.
- Continue-learning cards.

Suggested UI behavior:

- Every time a student opens a video or 3D resource, update `user_resources`.
- Recommendation logic reads `user_resources` together with profile/subject data.
- The Resource page displays recent resources from this table.

### `user_favourites`

Use this table for the favourite/save feature.

It can support:

- Add video/resource to favourites.
- Remove from favourites.
- Display a personal favourites list.
- Filter recommendations based on saved content.

Suggested UI behavior:

- Video/resource card shows a save icon.
- If saved, icon appears active.
- Clicking again removes the favourite.
- The `Favourites` list loads from `user_favourites` joined with `videos` or `resources`.

### `collections`

Use this table for curated groups of resources/videos.

It can support:

- Educator-created learning collections.
- Admin-curated resource packs.
- User personal collections if needed.
- Shareable collection links.

In the UI, it can power:

- Collection cards on the Resource page.
- `You` section.
- Admin content management page.
- Shared resource pack page.

Suggested UI behavior:

- Educator creates a collection such as `SPM Chemistry - Acid and Alkali`.
- Educator adds videos through `collection_videos`.
- Student opens the collection and watches videos in sequence.
- Collection can be shared with another user.

### `collection_videos`

Use this as a join table between `collections` and `videos`.

It can support:

- Many videos in one collection.
- One video reused in many collections.
- Ordered playlist display.
- Collection progress tracking when combined with `user_resources`.

Suggested UI behavior:

- Collection detail page loads videos ordered by `position` or `sort_order`.
- Student clicks a video inside the collection.
- The video opens in the embedded player.
- View count and recent history are updated.

### `achievements`

Use this table for motivational feedback outside the iframe game.

It can support achievements such as:

- Watched first tutorial video.
- Saved five favourites.
- Completed a collection.
- Played the chemistry card game.
- Won a game through the iframe.
- Maintained a study streak.

In the UI, it can power:

- Dashboard achievement cards.
- Profile badge section.
- Post-action success messages.
- Optional sidebar/profile status.

Suggested UI behavior:

- When a student completes an important action, backend checks achievement rules.
- If an achievement is unlocked, insert or update the achievement record.
- Frontend shows a badge/toast using the same clean blue-white UI style.

### `matches`

Because the game is already built in `GameDev`, this table should not drive game mechanics in the React app.

Use it only if the iframe game sends back a final result.

It can store:

- Student/user id.
- Game session id.
- Winner/result.
- Score or HP summary.
- Match start/end time.

In the UI, it can power:

- Game Room recent matches.
- Dashboard recent game activity.
- Achievement unlocking.

Suggested iframe behavior:

- React page embeds the game using an iframe.
- Game sends `postMessage` to the parent page when a match ends.
- React/backend saves the result into `matches`.
- Achievement logic may unlock a badge.

### `match_history`

Use this only if you want detailed game logs from the iframe game.

It can store:

- Turn number.
- Player action.
- Bot action.
- Combination used.
- Damage/heal/defense value.
- HP before/after.

In the UI, it can power:

- Post-game review.
- Match timeline.
- Analytics about most-used combinations.

Since the full game is already in `GameDev`, this table is optional. If time is limited, implement only `matches` result saving and leave `match_history` for future improvement.

## UI Matching Guidance

The database-driven pages should follow the style captured in `screenshots/qubo-frontend`:

- White and light slate background.
- Compact left sidebar navigation.
- Strong blue primary actions.
- Rounded content panels.
- Soft shadows.
- Bold black headings.
- Small uppercase section labels.
- Resource cards arranged in clean grids.
- Admin tools shown as organized dashboards, not marketing pages.

### Student Resource Page

Recommended sections:

- Header: `Educational Resources`
- Search bar.
- Subject filter chips.
- Two main cards: `Video Tutorials` and `Interactive 3D Models`
- `Popular / Trending Videos`
- `Recent`
- `Favourites`
- `Collections`

Database sources:

- `videos`
- `resources`
- `user_resources`
- `user_favourites`
- `collections`
- `collection_videos`

### Video Detail / Player Page

Recommended sections:

- Embedded YouTube iframe.
- Title, subject tag, duration.
- Favourite button.
- Share button.
- Related/recommended videos.

Database sources:

- `videos`
- `user_resources`
- `user_favourites`
- `collection_videos`

### 3D Model Page

Recommended sections:

- 3D model viewer or embedded model.
- Subject/category metadata.
- Related resources.
- Recent/favourite controls if needed.

Database sources:

- `resources`
- `user_resources`
- `user_favourites`

### Admin Content Management Page

Recommended sections:

- Upload new video/resource form.
- YouTube URL field.
- Title and subject tag fields.
- Resource type selector.
- Active resource table.
- Edit/delete actions.

Database sources:

- `videos`
- `resources`
- `collections`
- `collection_videos`

### Admin Analytics Page

Recommended sections:

- Total internal views.
- Trending videos ranked by internal Qubo views.
- Subject distribution chart.
- Resource engagement table.
- Most favourited resources/videos.

Database sources:

- `videos`
- `resources`
- `user_resources`
- `user_favourites`
- `collections`

### Game Room Page With Iframe

Recommended sections:

- Header: `ChemBattle`
- Main iframe area for the built GameDev game.
- Small side panel for recent match result or achievements.
- Optional note/status if game result sync is unavailable.

Database sources:

- `matches`, optional
- `match_history`, optional
- `achievements`, optional

The React app should not duplicate card battle logic. It should only embed the game and optionally save the result.

## Requirement Traceability

| Report Feature | Database Tables |
|---|---|
| Display 3D model library | `resources` |
| Display tutorial video page | `videos` |
| Subject/category filter | `resources`, `videos` |
| Search tutorial videos | `videos` |
| Trending/popular videos | `videos`, `user_resources` |
| Recent videos/resources | `user_resources` |
| Favourites list | `user_favourites`, `videos`, `resources` |
| Add/remove favourite | `user_favourites` |
| Share video/collection | `videos`, `collections`, `collection_videos` |
| Video title, subject, duration, thumbnail | `videos` |
| In-app video playback | `videos` |
| Personalized recommendations | `user_resources`, `user_favourites`, `resources`, `videos` |
| Admin upload/edit/delete videos | `videos` |
| Admin upload/update/categorize 3D models | `resources` |
| YouTube URL embedding | `videos` |
| Internal video play tracking | `videos`, `user_resources` |
| Analytics dashboard | `videos`, `user_resources`, `user_favourites` |
| Game iframe play access | iframe page, optionally `matches` |
| Post-game result tracking | `matches`, optional `match_history` |
| Achievement/badge display | `achievements` |

## Suggested Implementation Priority

1. Connect `videos` to the Resource page.
2. Connect `resources` to the 3D model/resource area.
3. Add `user_resources` tracking for recent views.
4. Add `user_favourites` for save/remove favourite.
5. Add `collections` and `collection_videos` for curated playlists.
6. Add admin CRUD for `videos` and `resources`.
7. Add analytics from internal view counts.
8. Embed GameDev game through iframe.
9. Optionally save iframe game results into `matches`.
10. Optionally unlock/display `achievements`.

