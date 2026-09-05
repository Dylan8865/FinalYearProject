import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ProfileUpdateRequest,
  LearningStyleAssessment,
  LearningStyleAssessmentResult,
  StudyReminderPreferences,
  StudyReminderPreferencesUpdate,
  Subject,
  PasswordChangeRequest,
  AccountDataSummary,
  User,
  AuthTokens,
} from "@/types/auth";
import {
  GeneratedQuiz,
  LibraryQuiz,
  QuizDifficulty,
  QuizAttemptRequest,
  QuizAttemptResponse,
  QuizQuestionType,
  SavedQuizResponse,
} from "@/types/quiz";
import {
  EducatorDashboard,
  AnalyticsFilters,
  ReviewSchedule,
  StudySession,
  StudySessionCreate,
  SubjectAnalytics,
  StudyPlanRecommendation,
  StudyPlanResponse,
} from "@/types/analytics";
import { SharedLearningItem, TutorialVideo } from "@/types/video";
import {
  EducatorRecommendation,
  FavouriteItem,
  LearningRecommendation,
  ModelAnnotation,
  ModelAnnotationDraft,
  RecentLearningItem,
  ThreeDModelDetail,
  ThreeDModelSummary,
} from "@/types/resource";
import {
  GameHistoryEvent,
  GameMatch,
  GameMatchHistory,
  LevelOneLeaderboardEntry,
} from "@/types/game";
import { StudentActivityAnalytics, EducatorAnalytics, LearningEventInput } from "@/types/learning";
import {
  CollectionContentOption,
  CollectionEditorData,
  CollectionItemType,
  EducatorCollection,
  LinkedStudent,
  SharedCollection,
  SharedCollectionDetail,
} from "@/types/collection";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

class AuthService {
  private api: AxiosInstance;
  private refreshRequest: Promise<AuthTokens> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 20000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Retry one failed request after renewing an expired access token.
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const requestUrl = error.config?.url || "";
        const originalRequest = error.config as
          (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
        const isAuthRequest =
          requestUrl.includes("/auth/login") ||
          requestUrl.includes("/auth/register") ||
          requestUrl.includes("/auth/refresh") ||
          requestUrl.includes("/auth/forgot-password") ||
          requestUrl.includes("/auth/password-reset/complete");

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !isAuthRequest
        ) {
          originalRequest._retry = true;
          try {
            const tokens = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
            return this.api.request(originalRequest);
          } catch {
            this.clearTokens();
            window.location.href = "/login";
          }
        } else if (error.response?.status === 401 && !isAuthRequest) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      },
    );
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>("/auth/register", data);
    if (response.data.tokens) {
      this.storeTokens(response.data.tokens);
    }
    return response.data;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>("/auth/login", data);
    if (response.data.tokens) {
      this.storeTokens(response.data.tokens);
    }
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await this.api.get<User>("/auth/profile");
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post("/auth/logout");
    } catch (error) {
      // Ignore network errors during logout
    } finally {
      this.clearTokens();
    }
  }

  async getAdminContent(contentType: "video" | "model") {
    const response = await this.api.get("/admin/content", {
      params: { content_type: contentType },
    });
    return response.data;
  }

  async updateAdminContent(
    contentType: "video" | "model",
    contentId: string,
    data: {
      title: string;
      subject_name?: string;
      visibility?: "public" | "private";
    },
  ) {
    const response = await this.api.put(
      `/admin/content/${contentType}/${contentId}`,
      data,
    );
    return response.data;
  }

  async deleteAdminContent(
    contentType: "video" | "model",
    contentId: string,
  ): Promise<void> {
    await this.api.delete(`/admin/content/${contentType}/${contentId}`);
  }

  async getAdminAnalytics() {
    const response = await this.api.get("/admin/analytics");
    return response.data;
  }

  async getAdminUsers(search?: string) {
    const response = await this.api.get("/admin/users", {
      params: search ? { search } : undefined,
    });
    return response.data;
  }

  async setAdminUserActiveStatus(
    userId: string,
    isActive: boolean,
    reason?: string,
  ): Promise<void> {
    await this.api.patch(`/admin/users/${userId}/active`, {
      is_active: isActive,
      reason,
    });
  }

  async deleteAdminUser(userId: string): Promise<void> {
    await this.api.delete(`/admin/users/${userId}`);
  }

  async getAdminAuditLogs() {
    const response = await this.api.get("/admin/audit-logs");
    return response.data;
  }

  async updateProfile(data: ProfileUpdateRequest): Promise<User> {
    const response = await this.api.put<User>("/auth/profile", data);
    return response.data;
  }

  async uploadProfilePicture(file: File): Promise<User> {
    const formData = new FormData();
    formData.append("picture", file);
    const response = await this.api.post<User>(
      "/auth/profile/picture",
      formData,
      {
        headers: { "Content-Type": undefined },
        timeout: 30000,
      },
    );
    return response.data;
  }

  async generateQuiz(
    files: File[],
    questionType: QuizQuestionType,
    difficulty: QuizDifficulty,
    questionCount = 5,
  ): Promise<GeneratedQuiz> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("question_type", questionType);
    formData.append("difficulty", difficulty);
    formData.append("question_count", String(questionCount));

    const response = await this.api.post<GeneratedQuiz>(
      "/quiz/generate",
      formData,
      {
        // Let the browser add the multipart boundary instead of inheriting the
        // JSON content type configured for the rest of the API client.
        headers: { "Content-Type": undefined },
        timeout: 150000,
      },
    );
    return response.data;
  }

  async getQuizLibrary(): Promise<LibraryQuiz[]> {
    const response = await this.api.get<LibraryQuiz[]>("/quiz/library");
    return response.data;
  }

  async saveQuizToLibrary(quiz: GeneratedQuiz): Promise<SavedQuizResponse> {
    const response = await this.api.post<SavedQuizResponse>(
      "/quiz/library",
      quiz,
    );
    return response.data;
  }

  async getSavedQuiz(quizId: string): Promise<GeneratedQuiz> {
    const response = await this.api.get<GeneratedQuiz>(
      `/quiz/library/${quizId}`,
    );
    return response.data;
  }

  async deleteSavedQuiz(quizId: string): Promise<SavedQuizResponse> {
    const response = await this.api.delete<SavedQuizResponse>(
      `/quiz/library/${quizId}`,
    );
    return response.data;
  }

  async getQuizProgress(quizId: string) {
    const response = await this.api.get(`/quiz/${quizId}/progress`);
    return response.data;
  }

  async saveQuizProgress(quizId: string, progress: {
    current_index: number;
    elapsed_seconds: number;
    answers: Record<string, string>;
    answer_times: Record<string, number>;
  }) {
    await this.api.put(`/quiz/${quizId}/progress`, progress);
  }

  async deleteQuizProgress(quizId: string) {
    await this.api.delete(`/quiz/${quizId}/progress`);
  }

  async getSubjectAnalytics(
    filters: AnalyticsFilters = {},
  ): Promise<SubjectAnalytics[]> {
    const response = await this.api.get<SubjectAnalytics[]>(
      "/analytics/subjects",
      { params: filters },
    );
    return response.data;
  }

  async getReviewSchedule(dueOnly = false): Promise<ReviewSchedule[]> {
    const response = await this.api.get<ReviewSchedule[]>(
      "/analytics/review-schedule",
      { params: { due_only: dueOnly } },
    );
    return response.data;
  }

  async exportProgressReport(
    language: "en" | "ms",
    filters: AnalyticsFilters = {},
  ): Promise<void> {
    const response = await this.api.get<Blob>("/analytics/export/pdf", {
      params: { language, ...filters },
      responseType: "blob",
      timeout: 60000,
    });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download =
      language === "ms"
        ? "laporan-kemajuan-qubo.pdf"
        : "qubo-progress-report.pdf";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async createStudySession(data: StudySessionCreate): Promise<StudySession> {
    const response = await this.api.post<StudySession>(
      "/analytics/study-sessions",
      data,
    );
    return response.data;
  }

  async getStudySessions(limit = 10): Promise<StudySession[]> {
    const response = await this.api.get<StudySession[]>(
      "/analytics/study-sessions",
      { params: { limit } },
    );
    return response.data;
  }

  async getPredictionThreshold(): Promise<number> {
    const response = await this.api.get<{ threshold: number }>(
      "/analytics/prediction-settings",
    );
    return response.data.threshold;
  }

  async updatePredictionThreshold(threshold: number): Promise<number> {
    const response = await this.api.put<{ threshold: number }>(
      "/analytics/prediction-settings",
      { threshold },
    );
    return response.data.threshold;
  }

  async getEducatorDashboard(): Promise<EducatorDashboard> {
    const response = await this.api.get<EducatorDashboard>(
      "/analytics/educator/dashboard",
    );
    return response.data;
  }

  async searchStudentForLinking(
    username: string,
  ): Promise<{ id: string; username: string; full_name: string; profile_picture_url: string | null }> {
    const response = await this.api.get<{ id: string; username: string; full_name: string; profile_picture_url: string | null }>(
      "/analytics/educator/students/search",
      { params: { username } }
    );
    return response.data;
  }

  async linkStudent(
    username: string,
  ): Promise<{ id: string; message: string }> {
    const response = await this.api.post<{ id: string; message: string }>(
      "/analytics/educator/students",
      { username },
    );
    return response.data;
  }

  async unlinkStudent(
    studentId: string,
  ): Promise<{ id: string; message: string }> {
    const response = await this.api.delete<{ id: string; message: string }>(
      `/analytics/educator/students/${studentId}`,
    );
    return response.data;
  }

  async recordQuizAttempt(
    quizId: string,
    attempt: QuizAttemptRequest,
  ): Promise<QuizAttemptResponse> {
    const response = await this.api.post<QuizAttemptResponse>(
      `/quiz/${quizId}/attempt`,
      attempt,
    );
    return response.data;
  }

  async setLearningStyle(
    assessment: LearningStyleAssessment,
  ): Promise<LearningStyleAssessmentResult> {
    const response = await this.api.post<LearningStyleAssessmentResult>(
      "/auth/learning-style",
      assessment,
    );
    return response.data;
  }

  async getStudyReminders(): Promise<StudyReminderPreferences> {
    const response = await this.api.get<StudyReminderPreferences>(
      "/auth/profile/reminders",
    );
    return response.data;
  }

  async updateStudyReminders(
    preferences: StudyReminderPreferencesUpdate,
  ): Promise<StudyReminderPreferences> {
    const response = await this.api.put<StudyReminderPreferences>(
      "/auth/profile/reminders",
      preferences,
    );
    return response.data;
  }

  clearSession(): void {
    this.clearTokens();
  }

  async deactivateAccount(password: string): Promise<void> {
    await this.api.post("/auth/account/deactivate", { password });
    this.clearTokens();
  }

  async deleteAccount(password: string): Promise<void> {
    await this.api.delete("/auth/account", { data: { password } });
    this.clearTokens();
  }

  async getAccountDataSummary(): Promise<AccountDataSummary> {
    const response = await this.api.get<AccountDataSummary>(
      "/auth/account/data-summary",
    );
    return response.data;
  }

  async downloadAccountData(): Promise<void> {
    const response =
      await this.api.get<Record<string, unknown>>("/auth/account/data");
    const blob = new Blob([JSON.stringify(response.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `qubo-account-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async clearLearningHistory(
    password: string,
  ): Promise<{ message: string; cleared: Record<string, number> }> {
    const response = await this.api.delete<{
      message: string;
      cleared: Record<string, number>;
    }>("/auth/account/learning-history", { data: { password } });
    return response.data;
  }

  async changePassword(data: PasswordChangeRequest): Promise<any> {
    const response = await this.api.post("/auth/change-password", data);
    return response.data;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await this.api.post<{ message: string }>(
      "/auth/forgot-password",
      { email },
    );
    return response.data;
  }

  async completePasswordReset(
    recoveryAccessToken: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const response = await this.api.post<{ message: string }>(
      "/auth/password-reset/complete",
      {
        recovery_access_token: recoveryAccessToken,
        new_password: newPassword,
      },
    );
    return response.data;
  }

  async getSubjects(): Promise<Subject[]> {
    const response = await this.api.get<Subject[]>("/auth/subjects");
    return response.data;
  }

  async getStudentSubjects(): Promise<Subject[]> {
    const response = await this.api.get<Subject[]>("/auth/profile/subjects");
    return response.data;
  }

  async getStudyPlanRecommendations(): Promise<StudyPlanRecommendation[]> {
    const response = await this.api.get<StudyPlanRecommendation[]>(
      "/analytics/recommendations",
    );
    return response.data;
  }

  async generateStudyPlan(): Promise<StudyPlanResponse> {
    const response = await this.api.post<StudyPlanResponse>(
      "/analytics/recommendations/generate-plan",
    );
    return response.data;
  }

  async acceptStudyPlanRecommendation(
    recommendationId: string,
  ): Promise<{ id: string; is_accepted: boolean; message: string }> {
    const response = await this.api.post<{
      id: string;
      is_accepted: boolean;
      message: string;
    }>(`/analytics/recommendations/${recommendationId}/accept`);
    return response.data;
  }

  async getTutorialVideos(
    search?: string,
    subject?: string,
    scope: "public" | "private" = "public",
  ): Promise<TutorialVideo[]> {
    const params = new URLSearchParams();
    if (search?.trim()) params.set("search", search.trim());
    if (subject) params.set("subject", subject);
    if (scope === "private") params.set("scope", scope);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const response = await this.api.get<TutorialVideo[]>(`/videos${suffix}`);
    return response.data;
  }

  private async refreshAccessToken(): Promise<AuthTokens> {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    if (!this.refreshRequest) {
      this.refreshRequest = this.api
        .post<AuthTokens>("/auth/refresh", { refresh_token: refreshToken })
        .then((response) => {
          this.storeTokens(response.data);
          return response.data;
        })
        .finally(() => {
          this.refreshRequest = null;
        });
    }

    return this.refreshRequest;
  }

  async deleteTutorialVideo(videoId: string): Promise<void> {
    await this.api.delete(`/videos/${videoId}`);
  }

  async recordTutorialVideoView(videoId: string): Promise<void> {
    await this.api.post(`/videos/${videoId}/view`);
  }

  async recordLearningEvent(event: LearningEventInput): Promise<void> {
    await this.api.post("/learning/events", event);
  }

  async markLearningCompleted(
    targetType: "model" | "video",
    targetId: string,
    sessionId?: string,
  ): Promise<void> {
    await this.api.post("/learning/completion", {
      target_type: targetType,
      target_id: targetId,
      session_id: sessionId,
    });
  }

  async getLearningCompletion(
    targetType: "model" | "video",
    targetId: string,
  ): Promise<boolean> {
    const response = await this.api.get<{ is_completed: boolean }>(
      `/learning/completion/${targetType}/${targetId}`,
    );
    return response.data.is_completed;
  }

  async getStudentActivityAnalytics(): Promise<StudentActivityAnalytics> {
    const response = await this.api.get<StudentActivityAnalytics>(
      "/learning/analytics/student",
    );
    return response.data;
  }

  async getEducatorAnalytics(): Promise<EducatorAnalytics> {
    const response = await this.api.get<EducatorAnalytics>(
      "/learning/analytics",
    );
    return response.data;
  }

  async searchStudent(query: string): Promise<any[]> {
    const response = await this.api.get<any[]>(
      `/auth/search-student?query=${encodeURIComponent(query)}`
    );
    return response.data;
  }

  async assignQuiz(quizId: string, studentId: string): Promise<{ id: string; message: string }> {
    const response = await this.api.post<{ id: string; message: string }>(
      `/quiz/library/${quizId}/assign`,
      { student_id: studentId }
    );
    return response.data;
  }

  async shareTutorialVideo(
    videoId: string,
    recipientEmail: string,
    message?: string,
  ): Promise<void> {
    await this.api.post(`/videos/${videoId}/share`, {
      recipient_email: recipientEmail,
      message,
    });
  }

  async shareThreeDModel(
    resourceId: string,
    recipientEmail: string,
    message?: string,
  ): Promise<void> {
    await this.api.post(`/resources/models/${resourceId}/share`, {
      recipient_email: recipientEmail,
      message,
    });
  }

  async getSharedLearningItems(): Promise<SharedLearningItem[]> {
    const response = await this.api.get<SharedLearningItem[]>(
      "/videos/shared/with-me",
    );
    return response.data;
  }

  async getThreeDModels(
    scope: "public" | "private" = "public",
  ): Promise<ThreeDModelSummary[]> {
    const response = await this.api.get<ThreeDModelSummary[]>(
      "/resources/models",
      { params: { scope } },
    );
    return response.data;
  }

  async deleteThreeDModel(resourceId: string): Promise<void> {
    await this.api.delete(`/resources/models/${resourceId}`);
  }

  async getPopularThreeDModels(): Promise<ThreeDModelSummary[]> {
    const response = await this.api.get<ThreeDModelSummary[]>(
      "/resources/models/popular",
    );
    return response.data;
  }

  async getModelRecommendation(): Promise<LearningRecommendation | null> {
    const response = await this.api.get<LearningRecommendation | null>(
      "/resources/recommendation",
    );
    return response.data;
  }

  async getRecentLearning(): Promise<RecentLearningItem[]> {
    const response =
      await this.api.get<RecentLearningItem[]>("/resources/recent");
    return response.data;
  }

  async removeRecentLearning(
    targetType: "model" | "video",
    targetId: string,
  ): Promise<void> {
    await this.api.delete(`/learning/recent/${targetType}/${targetId}`);
  }

  async restoreRecentLearning(
    targetType: "model" | "video",
    targetId: string,
  ): Promise<void> {
    await this.api.post(`/learning/recent/${targetType}/${targetId}/restore`);
  }

  async dismissSharedLearningItem(shareId: string): Promise<void> {
    await this.api.post(`/videos/shared/with-me/${shareId}/dismiss`);
  }

  async restoreSharedLearningItem(shareId: string): Promise<void> {
    await this.api.post(`/videos/shared/with-me/${shareId}/restore`);
  }

  async getFavourites(): Promise<FavouriteItem[]> {
    const response = await this.api.get<FavouriteItem[]>(
      "/resources/favourites",
    );
    return response.data;
  }

  async getEducatorPicks(): Promise<EducatorRecommendation[]> {
    const response = await this.api.get<EducatorRecommendation[]>(
      "/resources/educator-picks",
    );
    return response.data;
  }

  async getMyEducatorPicks(): Promise<EducatorRecommendation[]> {
    const response = await this.api.get<EducatorRecommendation[]>(
      "/resources/educator-picks/mine",
    );
    return response.data;
  }

  async createEducatorPick(
    targetType: "model" | "video",
    targetId: string,
    note: string,
  ): Promise<EducatorRecommendation> {
    const response = await this.api.post<EducatorRecommendation>(
      "/resources/educator-picks",
      { target_type: targetType, target_id: targetId, note },
    );
    return response.data;
  }

  async deleteEducatorPick(recommendationId: string): Promise<void> {
    await this.api.delete(`/resources/educator-picks/${recommendationId}`);
  }

  async saveFavourite(
    targetType: "model" | "video",
    targetId: string,
  ): Promise<void> {
    await this.api.post("/resources/favourites", {
      target_type: targetType,
      target_id: targetId,
    });
  }

  async removeFavourite(
    targetType: "model" | "video",
    targetId: string,
  ): Promise<void> {
    await this.api.delete(`/resources/favourites/${targetType}/${targetId}`);
  }

  async getThreeDModel(resourceId: string): Promise<ThreeDModelDetail> {
    const response = await this.api.get<ThreeDModelDetail>(
      `/resources/models/${resourceId}`,
    );
    return response.data;
  }

  async getModelAnnotations(resourceId: string): Promise<ModelAnnotation[]> {
    const response = await this.api.get<ModelAnnotation[]>(
      `/resources/models/${resourceId}/annotations`,
    );
    return response.data;
  }

  async createModelAnnotation(
    resourceId: string,
    annotation: ModelAnnotationDraft,
  ): Promise<ModelAnnotation> {
    const response = await this.api.post<ModelAnnotation>(
      `/resources/models/${resourceId}/annotations`,
      annotation,
    );
    return response.data;
  }

  async updateModelAnnotation(
    annotationId: string,
    annotation: ModelAnnotationDraft,
  ): Promise<ModelAnnotation> {
    const response = await this.api.put<ModelAnnotation>(
      `/resources/models/annotations/${annotationId}`,
      annotation,
    );
    return response.data;
  }

  async deleteModelAnnotation(annotationId: string): Promise<void> {
    await this.api.delete(`/resources/models/annotations/${annotationId}`);
  }

  async createGameMatch(): Promise<GameMatch> {
    const response = await this.api.post<GameMatch>("/game/matches");
    return response.data;
  }

  async saveGameMatchHistory(
    matchId: string,
    events: GameHistoryEvent[],
  ): Promise<number> {
    const response = await this.api.post<{ saved_count: number }>(
      `/game/matches/${matchId}/history`,
      { events },
    );
    return response.data.saved_count;
  }

  async completeGameMatch(
    matchId: string,
    winner: string,
    turnsPlayed: number,
    wavesCleared = 0,
    isVictory = false,
    score?: number,
    enemiesDefeated?: number,
    compoundsDiscovered?: number,
    highestCombo?: number,
  ): Promise<GameMatch> {
    const response = await this.api.post<GameMatch>(
      `/game/matches/${matchId}/complete`,
      {
        winner,
        turns_played: turnsPlayed,
        waves_cleared: wavesCleared,
        is_victory: isVictory,
        score,
        enemies_defeated: enemiesDefeated,
        compounds_discovered: compoundsDiscovered,
        highest_combo: highestCombo,
      },
    );
    return response.data;
  }

  async createTutorialVideo(data: {
    title: string;
    youtube_url: string;
    subject_tag?: string;
  }): Promise<TutorialVideo> {
    const response = await this.api.post<TutorialVideo>("/videos", data);
    return response.data;
  }

  async uploadThreeDModel(data: {
    title: string;
    subject_name: string;
    topic_name?: string;
    visibility: "public" | "private";
    model: File;
  }): Promise<ThreeDModelSummary> {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("subject_name", data.subject_name);
    if (data.topic_name) formData.append("topic_name", data.topic_name);
    formData.append("visibility", data.visibility);
    formData.append("model", data.model);
    const response = await this.api.post<ThreeDModelSummary>(
      "/resources/models",
      formData,
      { headers: { "Content-Type": undefined }, timeout: 60000 },
    );
    return response.data;
  }

  async getMyCollections(status?: string): Promise<EducatorCollection[]> {
    const response = await this.api.get<EducatorCollection[]>(
      "/collections/mine",
      { params: status ? { status_filter: status } : undefined },
    );
    return response.data;
  }

  async createCollection(data: {
    title: string;
    description: string;
    primary_subject_id?: string;
  }): Promise<EducatorCollection> {
    const response = await this.api.post<EducatorCollection>(
      "/collections",
      data,
    );
    return response.data;
  }

  async getCollectionEditor(
    collectionId: string,
  ): Promise<CollectionEditorData> {
    const response = await this.api.get<CollectionEditorData>(
      `/collections/${collectionId}/editor`,
    );
    return response.data;
  }

  async getCollectionContentOptions(): Promise<CollectionContentOption[]> {
    const response = await this.api.get<CollectionContentOption[]>(
      "/collections/content-options",
    );
    return response.data;
  }

  async addCollectionItem(
    collectionId: string,
    data: {
      item_type: CollectionItemType;
      target_id: string;
      sort_order: number;
    },
  ): Promise<void> {
    await this.api.post(`/collections/${collectionId}/items`, data);
  }

  async removeCollectionItem(
    collectionId: string,
    collectionItemId: string,
  ): Promise<void> {
    await this.api.delete(
      `/collections/${collectionId}/items/${collectionItemId}`,
    );
  }

  async getLinkedStudents(): Promise<LinkedStudent[]> {
    const response = await this.api.get<LinkedStudent[]>(
      "/collections/linked-students",
    );
    return response.data;
  }

  async searchStudentsByEmail(email: string): Promise<LinkedStudent[]> {
    const response = await this.api.get<LinkedStudent[]>(
      "/collections/student-search",
      { params: { email } },
    );
    return response.data;
  }

  async shareCollection(
    collectionId: string,
    data: { student_ids: string[]; message?: string; due_at?: string },
  ): Promise<void> {
    await this.api.post(`/collections/${collectionId}/share`, data);
  }

  async archiveCollection(collectionId: string): Promise<void> {
    await this.api.post(`/collections/${collectionId}/archive`);
  }

  async deleteCollection(collectionId: string): Promise<void> {
    await this.api.delete(`/collections/${collectionId}`);
  }

  async duplicateCollection(collectionId: string): Promise<EducatorCollection> {
    const response = await this.api.post<EducatorCollection>(
      `/collections/${collectionId}/duplicate`,
    );
    return response.data;
  }

  async getGameMatchHistory(limit = 5): Promise<GameMatchHistory[]> {
    const response = await this.api.get<GameMatchHistory[]>(
      "/game/matches/history",
      { params: { limit } },
    );
    return response.data;
  }

  async getLevelOneLeaderboard(
    limit = 50,
  ): Promise<LevelOneLeaderboardEntry[]> {
    const response = await this.api.get<LevelOneLeaderboardEntry[]>(
      "/game/matches/leaderboard/level-1",
      { params: { limit } },
    );
    return response.data;
  }

  async updateStudentSubjects(subjectIds: string[]): Promise<Subject[]> {
    const response = await this.api.post<Subject[]>("/auth/profile/subjects", {
      subject_ids: subjectIds,
    });
    return response.data;
  }

  private storeTokens(tokens: { access_token: string; refresh_token: string }) {
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
  }

  private clearTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  getAccessToken(): string | null {
    return localStorage.getItem("access_token");
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // -----------------------------------------------------------------------
  // Shared collections inbox (student-facing)
  // -----------------------------------------------------------------------

  async getSharedCollections(): Promise<SharedCollection[]> {
    const response = await this.api.get<SharedCollection[]>(
      "/learning/shared-collections",
    );
    return response.data;
  }

  async getSharedCollectionDetail(
    collectionId: string,
  ): Promise<SharedCollectionDetail> {
    const response = await this.api.get<SharedCollectionDetail>(
      `/learning/shared-collections/${collectionId}`,
    );
    return response.data;
  }

  async openSharedCollection(collectionShareId: string): Promise<void> {
    await this.api.post(
      `/learning/shared-collections/${collectionShareId}/open`,
    );
  }

  async saveSharedQuizToLibrary(
    collectionId: string,
    quizId: string,
  ): Promise<{ id: string; message: string }> {
    const response = await this.api.post<{ id: string; message: string }>(
      `/learning/shared-collections/${collectionId}/save-quiz/${quizId}`,
    );
    return response.data;
  }
}

export const authService = new AuthService();
