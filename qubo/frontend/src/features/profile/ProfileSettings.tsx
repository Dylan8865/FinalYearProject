import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@/contexts/authStore';
import { authService } from '@/lib/authService';
import { normalizeSpmTargetGrade, VALID_SPM_TARGET_GRADES } from '@/lib/spmGrades';
import { ProfileUpdateRequest, Subject } from '@/types/auth';
import Tooltip from '@/components/common/Tooltip';
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiImage,
  FiLock,
  FiSave,
  FiUploadCloud,
  FiUser,
  FiX,
} from 'react-icons/fi';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const getApiErrorMessage = (requestError: any, fallback: string) => {
  const detail = requestError.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => (typeof item === 'string' ? item : item?.msg))
      .filter(Boolean)
      .join(', ') || fallback;
  }

  return typeof detail === 'string' ? detail : fallback;
};

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ProfileSettings() {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    username: user?.username || '',
    full_name: user?.full_name || '',
    profile_picture_url: user?.profile_picture_url || '',
    school: user?.school || '',
    form_level: user?.form_level || '',
    target_grade: normalizeSpmTargetGrade(user?.target_grade),
    target_exam_date: user?.target_exam_date || '',
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData({
      username: user.username || '',
      full_name: user.full_name || '',
      profile_picture_url: user.profile_picture_url || '',
      school: user.school || '',
      form_level: user.form_level || '',
      target_grade: normalizeSpmTargetGrade(user.target_grade),
      target_exam_date: user.target_exam_date ? user.target_exam_date.slice(0, 10) : '',
    });
  }, [user]);

  useEffect(() => {
    setProfileImageFailed(false);
  }, [formData.profile_picture_url]);

  useEffect(() => {
    if (!isImagePreviewOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsImagePreviewOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isImagePreviewOpen]);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!user || !['student', 'educator'].includes(user.role)) {
        return;
      }

      try {
        const [allSubjects, selectedSubjects] = await Promise.all([
          authService.getSubjects(),
          authService.getStudentSubjects(),
        ]);
        setAvailableSubjects(allSubjects);
        setSelectedSubjectIds(selectedSubjects.map((subject) => subject.id));
      } catch (fetchError) {
        console.error('Failed to load subjects:', fetchError);
      }
    };

    loadSubjects();
  }, [user]);

  const selectedSubjectLabels = useMemo(
    () =>
      availableSubjects
        .filter((subject) => selectedSubjectIds.includes(subject.id))
        .map((subject) => subject.subject_name),
    [availableSubjects, selectedSubjectIds]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'profile_picture_url') {
      if (selectedImageFile) {
        URL.revokeObjectURL(formData.profile_picture_url);
        setSelectedImageFile(null);
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        username: user.username || '',
        full_name: user.full_name || '',
        profile_picture_url: user.profile_picture_url || '',
        school: user.school || '',
        form_level: user.form_level || '',
        target_grade: normalizeSpmTargetGrade(user.target_grade),
        target_exam_date: user.target_exam_date ? user.target_exam_date.slice(0, 10) : '',
      });
      
      if (user.role === 'student' || user.role === 'educator') {
        authService.getStudentSubjects().then((subjects) => {
          setSelectedSubjectIds(subjects.map((s) => s.id));
        }).catch(console.error);
      }
    }
    if (selectedImageFile) {
      URL.revokeObjectURL(formData.profile_picture_url);
      setSelectedImageFile(null);
    }
    setIsEditing(false);
    setError('');
    setSaveSuccess(false);
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleImageFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImageUploadError('');
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageUploadError('Choose a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageUploadError('Profile picture must be 5 MB or smaller.');
      return;
    }

    if (selectedImageFile) {
      URL.revokeObjectURL(formData.profile_picture_url);
    }

    setSelectedImageFile(file);
    const localUrl = URL.createObjectURL(file);
    setFormData((previous) => ({
      ...previous,
      profile_picture_url: localUrl,
    }));
  };

  const handleSave = async () => {
    if (!user) {
      return;
    }

    if (formData.target_exam_date && formData.target_exam_date < getTodayDateString()) {
      setError('Target exam date cannot be in the past.');
      return;
    }

    const normalizedGrade = formData.target_grade.trim().toUpperCase();
    if (normalizedGrade && !VALID_SPM_TARGET_GRADES.some((grade) => grade === normalizedGrade)) {
      setError('Choose a valid SPM target grade.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSaveSuccess(false);

    try {
      let finalProfilePictureUrl = formData.profile_picture_url;
      
      if (selectedImageFile) {
        setIsUploadingImage(true);
        const uploadedUser = await authService.uploadProfilePicture(selectedImageFile);
        finalProfilePictureUrl = uploadedUser.profile_picture_url || '';
        setIsUploadingImage(false);
        // Clean up the local blob URL
        URL.revokeObjectURL(formData.profile_picture_url);
        setSelectedImageFile(null);
      }

      const updateData: ProfileUpdateRequest = {
        username: formData.username,
        full_name: formData.full_name,
        profile_picture_url: finalProfilePictureUrl,
        school: formData.school,
        form_level: formData.form_level,
        target_grade: normalizedGrade,
        target_exam_date: formData.target_exam_date || undefined,
      };

      const updatedUser = await authService.updateProfile(updateData);

      if (user.role === 'student' || user.role === 'educator') {
        await authService.updateStudentSubjects(selectedSubjectIds);
      }

      setUser(updatedUser);
      setFormData((prev) => ({
        ...prev,
        profile_picture_url: finalProfilePictureUrl,
      }));
      setIsEditing(false);
      setSaveSuccess(true);
    } catch (saveError: any) {
      setError(getApiErrorMessage(saveError, 'Failed to update profile'));
      setIsUploadingImage(false);
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
      setPasswordSuccess('Password changed successfully');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      setPasswordVisibility({ old: false, new: false, confirm: false });
    } catch (changeError: any) {
      setPasswordError(getApiErrorMessage(changeError, 'Failed to change password'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-[#f4f7fb]" />;
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <div className="mx-auto w-full max-w-7xl px-5 py-6 md:px-8 md:py-8">
        <button
          onClick={() => window.history.back()}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <section className="rounded-[32px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:p-8">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Profile settings</p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Manage your account</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Update your identity, academic details, and selected SPM subjects using data stored in the database.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {isEditing && (
                  <button
                    onClick={handleSave}
                    disabled={isLoading || isUploadingImage}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiSave className="h-4 w-4" />
                    {isLoading ? 'Saving...' : 'Save changes'}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (isEditing) {
                      handleCancel();
                    } else {
                      setIsEditing(true);
                      setSaveSuccess(false);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {isEditing ? <FiX className="h-4 w-4" /> : <FiEdit2 className="h-4 w-4" />}
                  {isEditing ? 'Cancel' : 'Edit profile'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            
            {saveSuccess && (
              <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-4 flex items-center gap-3 text-sm text-green-700">
                <FiCheckCircle className="h-5 w-5" />
                <span>Profile updated successfully</span>
              </div>
            )}

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">Email</label>
                <div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500">
                  {user.email}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">Role</label>
                <div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold capitalize text-slate-500">
                  {user.role}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">Username</label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">Full name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">Profile picture</label>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="relative">
                    <FiImage className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      name="profile_picture_url"
                      value={formData.profile_picture_url}
                      onChange={handleChange}
                      disabled={!isEditing || isUploadingImage}
                      placeholder="https://..."
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isEditing || isUploadingImage}
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 dark:disabled:border-slate-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-400 dark:disabled:opacity-100"
                  >
                    <FiUploadCloud className="h-4 w-4" />
                    {isUploadingImage ? 'Uploading...' : 'Browse'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageFileSelect}
                    className="hidden"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-400">JPEG, PNG, WebP, or GIF. Maximum 5 MB.</p>
                {imageUploadError && <p className="mt-2 text-sm font-semibold text-red-600">{imageUploadError}</p>}
                {formData.profile_picture_url && (
                  <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    {!profileImageFailed ? (
                      <button
                        type="button"
                        onClick={() => setIsImagePreviewOpen(true)}
                        aria-label="Open large profile picture preview"
                        className="group relative h-14 w-14 flex-none overflow-hidden rounded-full border border-slate-200"
                      >
                        <img
                          src={formData.profile_picture_url}
                          alt="Profile preview"
                          onError={() => setProfileImageFailed(true)}
                          className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        />
                      </button>
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                        <FiImage className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Preview</p>
                      <p className={`mt-1 text-sm font-semibold ${profileImageFailed ? 'text-red-600' : 'text-slate-700'}`}>
                        {profileImageFailed ? 'This image URL could not be loaded.' : 'Image loaded. Click it for a larger preview.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {user.role === 'student' && <>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-600">School</label>
                  <input type="text" name="school" value={formData.school} onChange={handleChange} disabled={!isEditing} className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-600">Form level</label>
                  <select name="form_level" value={formData.form_level} onChange={handleChange} disabled={!isEditing} className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-primary focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100">
                    <option value="">Select form level</option><option value="Form 4">Form 4</option><option value="Form 5">Form 5</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-600">Target grade <Tooltip content="The SPM grading system ranges from A+ (highest) to G (fail)." position="top" /></label>
                  <select name="target_grade" value={normalizeSpmTargetGrade(formData.target_grade)} onChange={handleChange} disabled={!isEditing} className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100">
                    <option value="">Select target grade</option>{VALID_SPM_TARGET_GRADES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-600">Target exam date</label>
                  <div className="relative"><FiCalendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="date" name="target_exam_date" value={formData.target_exam_date} onChange={handleChange} min={getTodayDateString()} disabled={!isEditing} className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-primary focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100" /></div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-600">Learning style</label>
                  <div className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold capitalize text-slate-700">{user.learning_style || 'Not set'}</div>
                </div>
              </>}
            </div>

            {(user.role === 'student' || user.role === 'educator') && (
              <div className="mt-8 rounded-[28px] border border-slate-100 bg-slate-50 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{user.role === 'educator' ? 'Teaching subjects' : 'Target subjects'}</p>
                    <h2 className="mt-2 text-xl font-extrabold text-slate-950">{user.role === 'educator' ? 'Subjects you teach' : 'Subjects stored in the database'}</h2>
                  </div>
                  <p className="text-sm text-slate-500">
                    {selectedSubjectLabels.length} selected
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {availableSubjects.length > 0 ? (
                    availableSubjects.map((subject) => (
                      <label
                        key={subject.id}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                          isEditing ? 'border-slate-200 bg-white' : 'border-slate-100 bg-white/70'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubjectIds.includes(subject.id)}
                          onChange={() => handleSubjectToggle(subject.id)}
                          disabled={!isEditing}
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{subject.subject_name}</p>
                          <p className="text-xs text-slate-500">{subject.category || 'Subject'}</p>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500 sm:col-span-2">
                      No subjects loaded from the database yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div id="change-password" className="scroll-mt-24 rounded-[32px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Account summary</p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">Your profile data</h2>

              <div className="mt-5 space-y-3">
                {[
                  ['Username', user.username],
                  ['Full name', user.full_name],
                  ['School', user.school || 'Not set'],
                  ['Form level', user.form_level || 'Not set'],
                  ['Target grade', normalizeSpmTargetGrade(user.target_grade) || 'Not set'],
                  ['Target exam date', user.target_exam_date ? user.target_exam_date.slice(0, 10) : 'Not set'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm font-semibold text-slate-500">{label}</span>
                    <span className="text-sm font-bold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-950">
                <FiLock className="h-5 w-5 text-primary" />
                Change password
              </h3>

              {passwordError && (
                <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <FiCheckCircle className="mb-1 inline-block h-4 w-4" /> {passwordSuccess}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="mt-5 space-y-4">
                <div className="relative">
                  <input
                    type={passwordVisibility.old ? 'text' : 'password'}
                    value={passwordForm.old_password}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, old_password: e.target.value }))}
                    placeholder="Old password"
                    required
                    disabled={isChangingPassword}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisibility((prev) => ({ ...prev, old: !prev.old }))}
                    aria-label={passwordVisibility.old ? 'Hide old password' : 'Show old password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {passwordVisibility.old ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={passwordVisibility.new ? 'text' : 'password'}
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))}
                    placeholder="New password"
                    required
                    disabled={isChangingPassword}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisibility((prev) => ({ ...prev, new: !prev.new }))}
                    aria-label={passwordVisibility.new ? 'Hide new password' : 'Show new password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {passwordVisibility.new ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={passwordVisibility.confirm ? 'text' : 'password'}
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
                    placeholder="Confirm new password"
                    required
                    disabled={isChangingPassword}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisibility((prev) => ({ ...prev, confirm: !prev.confirm }))}
                    aria-label={passwordVisibility.confirm ? 'Hide password confirmation' : 'Show password confirmation'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {passwordVisibility.confirm ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="h-12 w-full rounded-full bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {isChangingPassword ? 'Updating password...' : 'Update password'}
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>

      {isImagePreviewOpen && formData.profile_picture_url && !profileImageFailed && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Profile picture preview"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsImagePreviewOpen(false);
          }}
        >
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[28px] bg-white p-3 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsImagePreviewOpen(false)}
              aria-label="Close profile picture preview"
              className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/75 text-white backdrop-blur hover:bg-slate-950"
            >
              <FiX className="h-5 w-5" />
            </button>
            <img
              src={formData.profile_picture_url}
              alt="Large profile preview"
              className="max-h-[calc(90vh-1.5rem)] w-full rounded-[20px] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
