import { useState, useEffect } from 'react';
import { useAuthStore } from '@/contexts/authStore';
import { authService } from '@/lib/authService';
import { ProfileUpdateRequest, Subject } from '@/types/auth';
import { FiEdit2, FiSave, FiX, FiLock } from 'react-icons/fi';

export default function ProfileSettings() {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    school: user?.school || '',
    form_level: user?.form_level || '',
    target_grade: user?.target_grade || '',
    profile_picture_url: user?.profile_picture_url || '',
  });

  // Subjects state
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const [all, selected] = await Promise.all([
          authService.getSubjects(),
          authService.getStudentSubjects(),
        ]);
        setAvailableSubjects(all);
        setSelectedSubjectIds(selected.map((s) => s.id));
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    };
    if (user && user.role === 'student') {
      loadSubjects();
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');

    try {
      const updateData: ProfileUpdateRequest = {
        full_name: formData.full_name,
        school: formData.school,
        form_level: formData.form_level,
        target_grade: formData.target_grade,
        profile_picture_url: formData.profile_picture_url,
      };

      const updatedUser = await authService.updateProfile(updateData);
      
      if (user?.role === 'student') {
        await authService.updateStudentSubjects(selectedSubjectIds);
      }

      setUser(updatedUser);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setIsChangingPassword(true);

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match');
      setIsChangingPassword(false);
      return;
    }

    try {
      await authService.changePassword(passwordForm);
      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            {isEditing ? (
              <>
                <FiX /> Cancel
              </>
            ) : (
              <>
                <FiEdit2 /> Edit
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={user.username}
                disabled
                className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture URL</label>
            <input
              type="text"
              name="profile_picture_url"
              value={formData.profile_picture_url}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
            <input
              type="text"
              name="school"
              value={formData.school}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Form Level</label>
              <select
                name="form_level"
                value={formData.form_level}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-100"
              >
                <option value="">Select form level</option>
                <option value="Form 4">Form 4</option>
                <option value="Form 5">Form 5</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Grade</label>
              <input
                type="text"
                name="target_grade"
                value={formData.target_grade}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="e.g., A, A+"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Learning Style</label>
            <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 capitalize">
              {user.learning_style || 'Not set'}
            </div>
          </div>

          {/* SPM Subjects Multi-Select (Students Only) */}
          {user.role === 'student' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SPM Subjects</label>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                {availableSubjects.map((subject) => (
                  <label
                    key={subject.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition select-none ${
                      isEditing
                        ? 'hover:bg-white'
                        : 'pointer-events-none opacity-80'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubjectIds.includes(subject.id)}
                      onChange={() => handleSubjectToggle(subject.id)}
                      disabled={!isEditing}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-800 font-medium">
                      {subject.subject_name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {isEditing && (
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-success hover:bg-success/90 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              <FiSave /> {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FiLock /> Change Password
        </h3>

        {passwordError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {passwordError}
          </div>
        )}

        {passwordSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {passwordSuccess}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Old Password</label>
            <input
              type="password"
              value={passwordForm.old_password}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, old_password: e.target.value }))
              }
              placeholder="••••••••"
              required
              disabled={isChangingPassword}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))
                }
                placeholder="••••••••"
                required
                disabled={isChangingPassword}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))
                }
                placeholder="••••••••"
                required
                disabled={isChangingPassword}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="w-full py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {isChangingPassword ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
