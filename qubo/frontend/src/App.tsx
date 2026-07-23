import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { useAuthStore } from '@/contexts/authStore';
import { authService } from '@/lib/authService';
import { LanguageDomBridge } from '@/contexts/languageStore';

// Pages
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import LearningStyleAssessment from '@/features/auth/LearningStyleAssessment';
import Dashboard from '@/pages/Dashboard';
import ProfilePage from '@/features/profile/ProfilePage';
import ProfileSettings from '@/features/profile/ProfileSettings';
import QuizCreatorPage from '@/features/quiz/QuizCreatorPage';
import QuizExperiencePage from '@/features/quiz/QuizExperiencePage';
import LibraryPage from '@/features/library/LibraryPage';
import SubjectsPage from '@/features/analytics/SubjectsPage';
import ResourceHubPage from '@/features/resources/ResourceHubPage';
import ExploreResourcesPage from '@/features/resources/ExploreResourcesPage';
import GameRoomPage from '@/features/game/GameRoomPage';
import TutorialVideoPage from '@/features/videos/TutorialVideoPage';
import MyLearningPage from '@/features/learning/MyLearningPage';
import EducatorUploadContentPage from '@/features/educator/EducatorUploadContentPage';
import MyCollectionsPage from '@/features/educator/MyCollectionsPage';
import EducatorQuizEditorPage from '@/features/educator/EducatorQuizEditorPage';
import AdminLoginPage from '@/features/admin/AdminLoginPage';
import AdminPortalPage from '@/features/admin/AdminPortalPage';

// Components
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AdminProtectedRoute from '@/components/common/AdminProtectedRoute';

import '@/styles/global.css';

const ModelLibraryPage = lazy(() => import('@/features/resources/ModelLibraryPage'));
const ModelDetailPage = lazy(() => import('@/features/resources/ModelDetailPage'));

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
      <LanguageDomBridge />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/:section" element={<AdminProtectedRoute><AdminPortalPage /></AdminProtectedRoute>} />

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
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/settings"
          element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/educator/upload"
          element={
            <ProtectedRoute>
              <EducatorUploadContentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/educator/collections"
          element={
            <ProtectedRoute>
              <MyCollectionsPage />
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
          path="/educator/quizzes/edit"
          element={<ProtectedRoute><EducatorQuizEditorPage /></ProtectedRoute>}
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
          path="/resources"
          element={
            <ProtectedRoute>
              <ResourceHubPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resources/explore"
          element={
            <ProtectedRoute>
              <ExploreResourcesPage />
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
        <Route
          path="/game-room"
          element={
            <ProtectedRoute>
              <GameRoomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutorials"
          element={
            <ProtectedRoute>
              <TutorialVideoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learning"
          element={
            <ProtectedRoute>
              <MyLearningPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/models"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
                <ModelLibraryPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/models/:resourceId"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
                <ModelDetailPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route
          path="/"
          element={
            isAuthInitialized ? (
              user ? <Navigate to={user.role === 'admin' ? '/admin/content' : '/dashboard'} /> : <Navigate to="/login" />
            ) : (
              <div className="min-h-screen bg-slate-50" />
            )
          }
        />
      </Routes>
    </Router>
  );
}
