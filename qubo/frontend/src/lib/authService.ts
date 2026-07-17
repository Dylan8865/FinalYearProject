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
import {
  EducatorDashboard,
  StudySession,
  StudySessionCreate,
  SubjectAnalytics,
} from '@/types/analytics';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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

  async uploadProfilePicture(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('picture', file);
    const response = await this.api.post<User>('/auth/profile/picture', formData, {
      headers: { 'Content-Type': undefined },
      timeout: 30000,
    });
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

  async createStudySession(data: StudySessionCreate): Promise<StudySession> {
    const response = await this.api.post<StudySession>('/analytics/study-sessions', data);
    return response.data;
  }

  async getStudySessions(limit = 10): Promise<StudySession[]> {
    const response = await this.api.get<StudySession[]>('/analytics/study-sessions', { params: { limit } });
    return response.data;
  }

  async getPredictionThreshold(): Promise<number> {
    const response = await this.api.get<{ threshold: number }>('/analytics/prediction-settings');
    return response.data.threshold;
  }

  async updatePredictionThreshold(threshold: number): Promise<number> {
    const response = await this.api.put<{ threshold: number }>('/analytics/prediction-settings', { threshold });
    return response.data.threshold;
  }

  async getEducatorDashboard(): Promise<EducatorDashboard> {
    const response = await this.api.get<EducatorDashboard>('/analytics/educator/dashboard');
    return response.data;
  }

  async linkStudent(username: string): Promise<{ id: string; message: string }> {
    const response = await this.api.post<{ id: string; message: string }>('/analytics/educator/students', { username });
    return response.data;
  }

  async unlinkStudent(studentId: string): Promise<{ id: string; message: string }> {
    const response = await this.api.delete<{ id: string; message: string }>(`/analytics/educator/students/${studentId}`);
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
