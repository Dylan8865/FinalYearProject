import axios, { AxiosInstance } from 'axios';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  ProfileUpdateRequest,
  LearningStyleAssessment,
  Subject,
  PasswordChangeRequest,
  User 
} from '@/types/auth';
import {
  GeneratedQuiz,
  LibraryQuiz,
  QuizDifficulty,
  QuizAttemptRequest,
  QuizAttemptResponse,
  QuizQuestionType,
  SavedQuizResponse,
} from '@/types/quiz';
import { SubjectAnalytics } from '@/types/analytics';
import { SharedTutorialVideo, TutorialVideo } from '@/types/video';
import { EducatorRecommendation, FavouriteItem, LearningRecommendation, ModelAnnotation, ModelAnnotationDraft, RecentLearningItem, ThreeDModelDetail, ThreeDModelSummary } from '@/types/resource';
import { GameHistoryEvent, GameMatch } from '@/types/game';
import { EducatorAnalytics, LearningEventInput } from '@/types/learning';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

class AuthService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 responses
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        const requestUrl = error.config?.url || '';
        const isAuthAttempt = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
        if (error.response?.status === 401 && !isAuthAttempt) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', data);
    if (response.data.tokens) {
      this.storeTokens(response.data.tokens);
    }
    return response.data;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', data);
    if (response.data.tokens) {
      this.storeTokens(response.data.tokens);
    }
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await this.api.get<User>('/auth/profile');
    return response.data;
  }

  async updateProfile(data: ProfileUpdateRequest): Promise<User> {
    const response = await this.api.put<User>('/auth/profile', data);
    return response.data;
  }

  async generateQuiz(
    files: File[],
    questionType: QuizQuestionType,
    difficulty: QuizDifficulty,
    questionCount = 5
  ): Promise<GeneratedQuiz> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('question_type', questionType);
    formData.append('difficulty', difficulty);
    formData.append('question_count', String(questionCount));

    const response = await this.api.post<GeneratedQuiz>('/quiz/generate', formData, {
      // Let the browser add the multipart boundary instead of inheriting the
      // JSON content type configured for the rest of the API client.
      headers: { 'Content-Type': undefined },
      timeout: 150000,
    });
    return response.data;
  }

  async getQuizLibrary(): Promise<LibraryQuiz[]> {
    const response = await this.api.get<LibraryQuiz[]>('/quiz/library');
    return response.data;
  }

  async saveQuizToLibrary(quiz: GeneratedQuiz): Promise<SavedQuizResponse> {
    const response = await this.api.post<SavedQuizResponse>('/quiz/library', quiz);
    return response.data;
  }

  async getSavedQuiz(quizId: string): Promise<GeneratedQuiz> {
    const response = await this.api.get<GeneratedQuiz>(`/quiz/library/${quizId}`);
    return response.data;
  }

  async deleteSavedQuiz(quizId: string): Promise<SavedQuizResponse> {
    const response = await this.api.delete<SavedQuizResponse>(`/quiz/library/${quizId}`);
    return response.data;
  }

  async getSubjectAnalytics(): Promise<SubjectAnalytics[]> {
    const response = await this.api.get<SubjectAnalytics[]>('/analytics/subjects');
    return response.data;
  }

  async recordQuizAttempt(quizId: string, attempt: QuizAttemptRequest): Promise<QuizAttemptResponse> {
    const response = await this.api.post<QuizAttemptResponse>(`/quiz/${quizId}/attempt`, attempt);
    return response.data;
  }

  async setLearningStyle(assessment: LearningStyleAssessment): Promise<any> {
    const response = await this.api.post('/auth/learning-style', assessment);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
    this.clearTokens();
  }

  async changePassword(data: PasswordChangeRequest): Promise<any> {
    const response = await this.api.post('/auth/change-password', data);
    return response.data;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await this.api.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  }

  async recoverPassword(
    email: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ message: string }> {
    const response = await this.api.post<{ message: string }>('/auth/recover-password', {
      email,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  }

  async getSubjects(): Promise<Subject[]> {
    const response = await this.api.get<Subject[]>('/auth/subjects');
    return response.data;
  }

  async getStudentSubjects(): Promise<Subject[]> {
    const response = await this.api.get<Subject[]>('/auth/profile/subjects');
    return response.data;
  }

  async getTutorialVideos(search?: string, subject?: string): Promise<TutorialVideo[]> {
    const params = new URLSearchParams();
    if (search?.trim()) params.set('search', search.trim());
    if (subject) params.set('subject', subject);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const response = await this.api.get<TutorialVideo[]>(`/videos${suffix}`);
    return response.data;
  }

  async recordTutorialVideoView(videoId: string): Promise<void> {
    await this.api.post(`/videos/${videoId}/view`);
  }

  async recordLearningEvent(event: LearningEventInput): Promise<void> {
    await this.api.post('/learning/events', event);
  }

  async markLearningCompleted(targetType: 'model' | 'video', targetId: string, sessionId?: string): Promise<void> {
    await this.api.post('/learning/completion', { target_type: targetType, target_id: targetId, session_id: sessionId });
  }

  async getLearningCompletion(targetType: 'model' | 'video', targetId: string): Promise<boolean> {
    const response = await this.api.get<{ is_completed: boolean }>(`/learning/completion/${targetType}/${targetId}`);
    return response.data.is_completed;
  }

  async getEducatorAnalytics(): Promise<EducatorAnalytics> {
    const response = await this.api.get<EducatorAnalytics>('/learning/analytics');
    return response.data;
  }

  async shareTutorialVideo(videoId: string, recipientUsername: string, message?: string): Promise<void> {
    await this.api.post(`/videos/${videoId}/share`, { recipient_username: recipientUsername, message });
  }

  async getSharedTutorialVideos(): Promise<SharedTutorialVideo[]> {
    const response = await this.api.get<SharedTutorialVideo[]>('/videos/shared/with-me');
    return response.data;
  }

  async getThreeDModels(): Promise<ThreeDModelSummary[]> {
    const response = await this.api.get<ThreeDModelSummary[]>('/resources/models');
    return response.data;
  }

  async getPopularThreeDModels(): Promise<ThreeDModelSummary[]> {
    const response = await this.api.get<ThreeDModelSummary[]>('/resources/models/popular');
    return response.data;
  }

  async getModelRecommendation(): Promise<LearningRecommendation | null> {
    const response = await this.api.get<LearningRecommendation | null>('/resources/recommendation');
    return response.data;
  }

  async getRecentLearning(): Promise<RecentLearningItem[]> {
    const response = await this.api.get<RecentLearningItem[]>('/resources/recent');
    return response.data;
  }

  async getFavourites(): Promise<FavouriteItem[]> {
    const response = await this.api.get<FavouriteItem[]>('/resources/favourites');
    return response.data;
  }

  async getEducatorPicks(): Promise<EducatorRecommendation[]> {
    const response = await this.api.get<EducatorRecommendation[]>('/resources/educator-picks');
    return response.data;
  }

  async getMyEducatorPicks(): Promise<EducatorRecommendation[]> {
    const response = await this.api.get<EducatorRecommendation[]>('/resources/educator-picks/mine');
    return response.data;
  }

  async createEducatorPick(targetType: 'model' | 'video', targetId: string, note: string): Promise<EducatorRecommendation> {
    const response = await this.api.post<EducatorRecommendation>('/resources/educator-picks', { target_type: targetType, target_id: targetId, note });
    return response.data;
  }

  async deleteEducatorPick(recommendationId: string): Promise<void> {
    await this.api.delete(`/resources/educator-picks/${recommendationId}`);
  }

  async saveFavourite(targetType: 'model' | 'video', targetId: string): Promise<void> {
    await this.api.post('/resources/favourites', { target_type: targetType, target_id: targetId });
  }

  async removeFavourite(targetType: 'model' | 'video', targetId: string): Promise<void> {
    await this.api.delete(`/resources/favourites/${targetType}/${targetId}`);
  }

  async getThreeDModel(resourceId: string): Promise<ThreeDModelDetail> {
    const response = await this.api.get<ThreeDModelDetail>(`/resources/models/${resourceId}`);
    return response.data;
  }

  async getModelAnnotations(resourceId: string): Promise<ModelAnnotation[]> {
    const response = await this.api.get<ModelAnnotation[]>(`/resources/models/${resourceId}/annotations`);
    return response.data;
  }

  async createModelAnnotation(resourceId: string, annotation: ModelAnnotationDraft): Promise<ModelAnnotation> {
    const response = await this.api.post<ModelAnnotation>(`/resources/models/${resourceId}/annotations`, annotation);
    return response.data;
  }

  async updateModelAnnotation(annotationId: string, annotation: ModelAnnotationDraft): Promise<ModelAnnotation> {
    const response = await this.api.put<ModelAnnotation>(`/resources/models/annotations/${annotationId}`, annotation);
    return response.data;
  }

  async deleteModelAnnotation(annotationId: string): Promise<void> {
    await this.api.delete(`/resources/models/annotations/${annotationId}`);
  }

  async createGameMatch(): Promise<GameMatch> {
    const response = await this.api.post<GameMatch>('/game/matches');
    return response.data;
  }

  async saveGameMatchHistory(matchId: string, events: GameHistoryEvent[]): Promise<number> {
    const response = await this.api.post<{ saved_count: number }>(`/game/matches/${matchId}/history`, { events });
    return response.data.saved_count;
  }

  async completeGameMatch(matchId: string, winner: string, turnsPlayed: number): Promise<GameMatch> {
    const response = await this.api.post<GameMatch>(`/game/matches/${matchId}/complete`, {
      winner,
      turns_played: turnsPlayed,
    });
    return response.data;
  }

  async updateStudentSubjects(subjectIds: string[]): Promise<Subject[]> {
    const response = await this.api.post<Subject[]>('/auth/profile/subjects', {
      subject_ids: subjectIds,
    });
    return response.data;
  }

  private storeTokens(tokens: { access_token: string; refresh_token: string }) {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
  }

  private clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authService = new AuthService();
