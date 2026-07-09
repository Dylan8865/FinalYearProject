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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class AuthService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
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
        if (error.response?.status === 401) {
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
