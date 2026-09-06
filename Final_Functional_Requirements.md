# Qubo: Comprehensive Requirements Analysis (Codebase Verified)

The following functional and non-functional requirements have been extracted directly from the deployed application codebase (`App.tsx`, `authService.ts`, and backend controllers). This reflects the actual, working capabilities of the platform.

## 1. Functional Requirements

### 1.1 User Authentication and Account Management
- **FR1.1.1:** The system shall allow users to register an account with an explicitly defined role (Student, Educator, or Admin).
- **FR1.1.2:** The system shall support secure login using JWT tokens (Access and Refresh tokens).
- **FR1.1.3:** The system shall enforce Role-Based Access Control (RBAC) across all protected routes (e.g., locking `/admin/*` to admins, `/educator/*` to educators).
- **FR1.1.4:** The system shall allow users to request a password reset via email and complete the reset using a recovery token.
- **FR1.1.5:** The system shall automatically intercept and renew expired access tokens using the stored refresh token to maintain session continuity.
- **FR1.1.6:** The system shall allow users to deactivate or permanently delete their accounts (requiring password confirmation).
- **FR1.1.7:** The system shall allow users to download a summary of their account data or clear their learning history.

### 1.2 User Profile & Personalization
- **FR1.2.1:** The system shall require students to complete a Learning Style Assessment to determine their cognitive profile.
- **FR1.2.2:** The system shall allow users to upload and update a custom profile picture.
- **FR1.2.3:** The system shall allow students to select and update their target SPM subjects and academic goals.
- **FR1.2.4:** The system shall allow users to configure Study Reminder preferences (e.g., daily flashcards, nightly progress reviews).

### 1.3 Resource Curation (3D Models & Videos)
- **FR1.3.1:** The system shall provide a centralized Resource Hub for students to browse educational tutorial videos and interactive 3D models.
- **FR1.3.2:** The system shall allow users to filter resources by subject (e.g., Physics, Biology) and scope (Public or Private).
- **FR1.3.3:** The system shall allow Educators to upload new educational content (YouTube URLs or `.glb` 3D model files) via the Educator Upload Dashboard.
- **FR1.3.4:** The system shall allow users to interact with 3D models using a manipulatable WebGL canvas, including viewing and creating model annotations.
- **FR1.3.5:** The system shall allow users to save resources to a "Favourites" list and track recently viewed items.
- **FR1.3.6:** The system shall allow users to directly share specific tutorial videos or 3D models with other registered users via email.

### 1.4 Educator Collections (Teaching Packs)
- **FR1.4.1:** The system shall allow Educators to group multiple resources (videos, models, quizzes) into structured "Collections".
- **FR1.4.2:** The system shall allow Educators to search and link registered students to their network by email.
- **FR1.4.3:** The system shall allow Educators to share Collections with specific linked students, optionally setting custom messages and due dates.
- **FR1.4.4:** The system shall allow students to view shared collections assigned to them in their personal dashboard.

### 1.5 AI-Powered Quiz Generation
- **FR1.5.1:** The system shall allow students to upload multiple textbook pages (PDF or image files) to generate custom quizzes.
- **FR1.5.2:** The system shall use the Gemini Flash API to extract text and context from the uploaded images to generate educational questions.
- **FR1.5.3:** The system shall allow users to configure the desired Quiz Difficulty and Question Type (e.g., Multiple Choice, Fill-in-the-blank) before generation.
- **FR1.5.4:** The system shall allow users to attempt generated quizzes interactively and immediately record their score and time taken.
- **FR1.5.5:** The system shall save generated quizzes to the user's personal Quiz Library for later review.
- **FR1.5.6:** The system shall allow Educators to explicitly create and edit their own quizzes via the Educator Quiz Editor.

### 1.6 Performance Tracking and Analytics
- **FR1.6.1:** The system shall allow students to log independent Study Sessions (recording subject, duration, and self-rated difficulty).
- **FR1.6.2:** The system shall provide a Student Analytics Dashboard displaying subject mastery percentages, predicted examination thresholds, and an intelligent "Review Schedule".
- **FR1.6.3:** The system shall allow students to generate and download a comprehensive Progress Report as a PDF file (supporting English and Bahasa Melayu).
- **FR1.6.4:** The system shall provide an Educator Analytics Dashboard that aggregates performance data from all linked students, allowing educators to identify class-wide weaknesses.

### 1.7 Gamification (Game Room)
- **FR1.7.1:** The system shall provide a dedicated Game Room featuring a gamified educational experience.
- **FR1.7.2:** The system shall allow users to initiate matches and record in-game history events (e.g., turns played, enemies defeated, compounds discovered).
- **FR1.7.3:** The system shall update a global leaderboard and assign academic ranks/levels based on cumulative game performance and XP.

### 1.8 Administrator Portal
- **FR1.8.1:** The system shall provide a dedicated Admin Portal for managing platform integrity.
- **FR1.8.2:** The system shall allow Admins to view all registered users, toggle their active status, and execute account deletions.
- **FR1.8.3:** The system shall allow Admins to review and manage uploaded educational content (models and videos) across the platform.
- **FR1.8.4:** The system shall allow Admins to view global platform analytics and detailed system Audit Logs.

---

## 2. Non-Functional Requirements (NFR)

### 2.1 Security & Authentication
- **NFR2.1.1:** The frontend API client shall automatically inject Bearer tokens into the authorization headers of all outgoing requests.
- **NFR2.1.2:** The system shall intercept `401 Unauthorized` responses and silently attempt token renewal before forcing a user logout.
- **NFR2.1.3:** The backend database (Supabase) shall restrict direct data access via strict Row Level Security (RLS) policies, preventing users from modifying content they do not own.

### 2.2 Performance & Responsiveness
- **NFR2.2.1:** AI Quiz Generation requests shall bypass standard payload limits, accepting files up to 5MB, and extending request timeouts to handle long-running LLM inferences.
- **NFR2.2.2:** 3D Model thumbnails shall be asynchronously generated via hidden WebGL canvases to prevent blocking the main UI thread.
- **NFR2.2.3:** API requests fetching analytics or historical data shall utilize query parameters (e.g., `limit`, `due_only`, `search`) to prevent loading overly large datasets into client memory.

### 2.3 Usability & Internationalization
- **NFR2.3.1:** The system shall support dynamic theme switching (Dark Mode/Light Mode) mapped globally across all application routes.
- **NFR2.3.2:** The system shall implement a `LanguageDomBridge` to seamlessly support multi-language context updates throughout the UI.

### 2.4 Maintainability
- **NFR2.4.1:** The frontend codebase shall utilize lazy-loading (e.g., `React.lazy`) for heavy components like the 3D Model Viewer (`ModelDetailPage.tsx`) to optimize initial bundle size.
- **NFR2.4.2:** All API interactions shall be abstracted into a centralized `authService` class to ensure consistent error handling and type safety.
