import { useAuthStore } from '@/contexts/authStore';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiSettings } from 'react-icons/fi';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Qubo Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <FiSettings /> Settings
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-danger hover:bg-danger/90 text-white rounded-lg transition"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome, {user.full_name}!</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-primary/10 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Account Type</h3>
              <p className="text-gray-600 capitalize">{user.role}</p>
            </div>
            <div className="bg-secondary/10 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Learning Style</h3>
              <p className="text-gray-600 capitalize">{user.learning_style || 'Not set'}</p>
            </div>
          </div>
        </div>

        {user.role === 'student' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quiz Generator</h3>
              <p className="text-gray-600 text-sm">Generate AI-powered quizzes from your textbooks</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
              <p className="text-gray-600 text-sm">Track your learning progress and performance</p>
            </div>
          </div>
        )}

        {user.role === 'educator' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Students</h3>
              <p className="text-gray-600 text-sm">Manage your students and monitor progress</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
              <p className="text-gray-600 text-sm">View class-wide analytics and insights</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
