import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/contexts/authStore';
import { authService } from '@/lib/authService';

// Pages
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import LearningStyleAssessment from '@/features/auth/LearningStyleAssessment';
import Dashboard from '@/pages/Dashboard';
import ProfileSettings from '@/features/profile/ProfileSettings';
import QuizCreatorPage from '@/features/quiz/QuizCreatorPage';
import QuizExperiencePage from '@/features/quiz/QuizExperiencePage';
import LibraryPage from '@/features/library/LibraryPage';
import SubjectsPage from '@/features/analytics/SubjectsPage';

// Components
import ProtectedRoute from '@/components/common/ProtectedRoute';

import '@/styles/global.css';

export default function App() {
  const { setUser, setAuthInitialized, user, isAuthInitialized } = useAuthStore();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const userProfile = await authService.getProfile();
          setUser(userProfile);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setAuthInitialized(true);
      }
    };

    checkAuth();
  }, [setAuthInitialized, setUser]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route
          path="/learning-style-assessment"
          element={
            <ProtectedRoute>
              <LearningStyleAssessment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 p-8">
                <ProfileSettings />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/create"
          element={
            <ProtectedRoute>
              <QuizCreatorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/session"
          element={
            <ProtectedRoute>
              <QuizExperiencePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <LibraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subjects"
          element={
            <ProtectedRoute>
              <SubjectsPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route
          path="/"
          element={
            isAuthInitialized ? (
              user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
            ) : (
              <div className="min-h-screen bg-slate-50" />
            )
          }
        />
      </Routes>
    </Router>
  );
}
