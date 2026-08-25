import { DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useQuizStore } from '@/contexts/quizStore';
import { authService } from '@/lib/authService';
import {
  FiCamera,
  FiCheck,
  FiFileText,
  FiInfo,
  FiEye,
  FiPlus,
  FiSave,
  FiTrash2,
  FiUploadCloud,
  FiX,
  FiZap,
} from 'react-icons/fi';
import { GeneratedQuestion, QuizDifficulty, QuizQuestionType } from '@/types/quiz';
import { useAuthStore } from '@/contexts/authStore';

const MAX_FILE_SIZE_BYTES = 32 * 1024 * 1024;
const MAX_TOTAL_SIZE_BYTES = 32 * 1024 * 1024;

const formatMegabytes = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function QuizCreatorPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isEducator = user?.role === 'educator';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generatedQuiz = useQuizStore((state) => state.generatedQuiz);
  const setGeneratedQuiz = useQuizStore((state) => state.setGeneratedQuiz);
  const savedQuizId = useQuizStore((state) => state.savedQuizId);
  const setSavedQuizId = useQuizStore((state) => state.setSavedQuizId);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [questionType, setQuestionType] = useState<QuizQuestionType>('mcq');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('Intermediate');
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [creationMethod, setCreationMethod] = useState<'ai' | 'manual'>('ai');
  const totalUploadSize = useMemo(
    () => uploadedFiles.reduce((total, file) => total + file.size, 0),
    [uploadedFiles]
  );

  const filePreviews = useMemo(
    () => uploadedFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [uploadedFiles]
  );

  useEffect(
    () => () => filePreviews.forEach(({ url }) => URL.revokeObjectURL(url)),
    [filePreviews]
  );

  useEffect(() => {
    setRevealedAnswers(new Set());
    setSaveError('');
  }, [generatedQuiz]);

  const addFiles = (files: FileList | File[]) => {
    const knownFiles = new Set(uploadedFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
    const acceptedFiles: File[] = [];
    const rejectedFiles: string[] = [];
    let nextTotalSize = totalUploadSize;

    Array.from(files).forEach((file) => {
      const signature = `${file.name}-${file.size}-${file.lastModified}`;
      if (knownFiles.has(signature)) return;
      knownFiles.add(signature);

      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        rejectedFiles.push(`${file.name}: unsupported file type`);
      } else if (file.size > MAX_FILE_SIZE_BYTES) {
        rejectedFiles.push(`${file.name}: larger than 32 MB`);
      } else if (nextTotalSize + file.size > MAX_TOTAL_SIZE_BYTES) {
        rejectedFiles.push(`${file.name}: would exceed the 32 MB total`);
      } else {
        acceptedFiles.push(file);
        nextTotalSize += file.size;
      }
    });

    if (acceptedFiles.length) setUploadedFiles((current) => [...current, ...acceptedFiles]);
    setGeneratedQuiz(null);
    setGenerationError(rejectedFiles.length ? `Some files were not added: ${rejectedFiles.join('; ')}.` : '');
  };

  const removeFile = (fileToRemove: File) => {
    setUploadedFiles((current) => current.filter((file) => file !== fileToRemove));
    if (previewFile === fileToRemove) setPreviewFile(null);
    setGeneratedQuiz(null);
    setGenerationError('');
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const handleGenerate = async () => {
    if (generatedQuiz) {
      navigate('/quiz/session');
      return;
    }
    if (uploadedFiles.length === 0) {
      setGenerationError('Upload at least one textbook image or PDF first.');
      return;
    }

    setGenerationError('');
    setSaveError('');
    setIsGenerating(true);
    try {
      const quiz = await authService.generateQuiz(uploadedFiles, questionType, difficulty, questionCount);
      setGeneratedQuiz(quiz);
      if (isEducator) {
        navigate('/educator/quizzes/edit');
      } else {
        setIsSaving(true);
        try {
          const savedQuiz = await authService.saveQuizToLibrary(quiz);
          setSavedQuizId(savedQuiz.id);
        } catch (saveRequestError: any) {
          const detail = saveRequestError.response?.data?.detail;
          setSaveError(typeof detail === 'string' ? detail : 'Quiz generated, but automatic saving failed. Select retry below.');
        } finally {
          setIsSaving(false);
        }
      }
    } catch (requestError: any) {
      const detail = requestError.response?.data?.detail;
      if (typeof detail === 'string') {
        setGenerationError(detail);
      } else if (requestError.code === 'ECONNABORTED') {
        setGenerationError('Quiz generation took too long. Please try again with fewer or smaller files.');
      } else if (!requestError.response) {
        setGenerationError('Cannot reach the quiz server. Please make sure the backend is running and try again.');
      } else {
        setGenerationError('Quiz generation failed. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const updateQuestion = (index: number, patch: Partial<GeneratedQuestion>) => {
    if (!generatedQuiz) return;
    setGeneratedQuiz({
      ...generatedQuiz,
      questions: generatedQuiz.questions.map((question, questionIndex) => questionIndex === index ? { ...question, ...patch } : question),
    });
  };

  const addManualQuestion = () => {
    if (!generatedQuiz) return;
    setGeneratedQuiz({
      ...generatedQuiz,
      questions: [...generatedQuiz.questions, {
        question: 'Write your question here', question_type: questionType,
        options: questionType === 'mcq' ? ['Option A', 'Option B', 'Option C', 'Option D'] : [],
        correct_answer: questionType === 'mcq' ? 'Option A' : 'Write the expected answer', explanation: '',
      }],
    });
  };

  const startManualQuiz = () => {
    setCreationMethod('manual');
    setSavedQuizId(null);
    setGenerationError('');
    setGeneratedQuiz({
      title: 'Untitled educator quiz', subject: 'General', topic: 'General', question_type: questionType,
      difficulty, source_files: [], questions: [{
        question: 'Write your first question here', question_type: questionType,
        options: questionType === 'mcq' ? ['Option A', 'Option B', 'Option C', 'Option D'] : [],
        correct_answer: questionType === 'mcq' ? 'Option A' : 'Write the expected answer', explanation: '',
      }],
    });
    navigate('/educator/quizzes/edit');
  };

  const toggleAnswer = (questionIndex: number) => {
    setRevealedAnswers((current) => {
      const next = new Set(current);
      if (next.has(questionIndex)) next.delete(questionIndex);
      else next.add(questionIndex);
      return next;
    });
  };

  const handleSaveToLibrary = async () => {
    if (!generatedQuiz || isSaving) return;
    if (savedQuizId) {
      navigate('/library');
      return;
    }

    setSaveError('');
    setIsSaving(true);
    try {
      const savedQuiz = await authService.saveQuizToLibrary(generatedQuiz);
      setSavedQuizId(savedQuiz.id);
    } catch (requestError: any) {
      const detail = requestError.response?.data?.detail;
      setSaveError(typeof detail === 'string' ? detail : 'Unable to save this quiz. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
      <AppSidebar />

      <div className="min-w-0">
        <main className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 lg:py-10">
          <div className="mb-7">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">AI-Powered Generation</p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-950">Quiz Creator</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Transform study materials into interactive mastery challenges. Upload textbook pages or notes and configure the quiz experience.
            </p>
          </div>

          <div className={`grid items-start gap-6 ${isEducator ? 'xl:grid-cols-1' : 'xl:grid-cols-[minmax(0,1fr)_380px]'}`}>
            <div className="space-y-6">
              <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] md:p-7">
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`flex min-h-[330px] flex-col items-center justify-center rounded-[24px] border-2 border-dashed px-6 text-center transition ${
                    isDragging ? 'border-primary bg-blue-50' : 'border-slate-200 bg-slate-50/80'
                  }`}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-primary">
                    <FiCamera className="h-7 w-7" />
                  </div>
                  <h2 className="mt-5 text-lg font-extrabold text-slate-900">Drag and drop textbook pages</h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    Upload JPEG/PNG images or PDFs. Maximum 32 MB per file and 32 MB in total.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
                  >
                    <FiUploadCloud className="h-4 w-4" />
                    Browse files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,application/pdf"
                    multiple
                    onChange={(event) => {
                      if (event.target.files) addFiles(event.target.files);
                      event.target.value = '';
                    }}
                    className="hidden"
                  />
                </div>

                <div className="mt-7 flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">Selected uploads</h3>
                  <span className="text-xs font-bold text-slate-400" aria-label={`${uploadedFiles.length} files selected, ${formatMegabytes(totalUploadSize)} of 32 MB used`}>
                    {uploadedFiles.length} selected · {formatMegabytes(totalUploadSize)} / 32 MB
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {filePreviews.map(({ file, url }) => (
                    <div key={`${file.name}-${file.size}-${file.lastModified}`} className="group relative rounded-2xl border border-slate-200 bg-white p-3">
                      <button
                        type="button"
                        onClick={() => setPreviewFile(file)}
                        className="block w-full text-left"
                        aria-label={`Preview ${file.name}`}
                      >
                        <div className="flex h-24 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-200 to-slate-100 text-slate-500">
                          {file.type.startsWith('image/') ? (
                            <img src={url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                          ) : (
                            <FiFileText className="h-8 w-8" />
                          )}
                        </div>
                        <p className="mt-2 truncate text-xs font-bold text-slate-800">{file.name}</p>
                        <p className="mt-1 text-[11px] text-primary">Tap to preview</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFile(file)}
                        className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 shadow-md hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${file.name}`}
                        title="Delete file"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {uploadedFiles.length === 0 && (
                    <div className="col-span-2 flex min-h-[150px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center text-sm font-semibold text-slate-400">
                      No uploads yet. Added files will appear here.
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-500 hover:border-primary hover:text-primary"
                  >
                    <FiPlus className="h-5 w-5" />
                    <span className="mt-2 text-xs font-bold">New scan</span>
                  </button>
                </div>
              </section>

              <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] md:p-7">
                <h2 className="text-xl font-extrabold text-slate-950">Quiz configuration</h2>
                {isEducator && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button type="button" onClick={() => { setCreationMethod('ai'); setGeneratedQuiz(null); setSavedQuizId(null); }} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${creationMethod === 'ai' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>Generate with AI</button>
                    <button type="button" onClick={startManualQuiz} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${creationMethod === 'manual' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>Create manually</button>
                  </div>
                )}
                {generationError && (
                  <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
                    {generationError}
                  </div>
                )}
                <div className="mt-6 grid gap-7 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Question type</p>
                    <div className="mt-3 space-y-3">
                      {[
                        { value: 'mcq', label: 'MCQ (Single choice)' },
                        { value: 'fill', label: 'Fill-in-the-blank' },
                        { value: 'short', label: 'Short answer' },
                      ].map((option) => (
                        <label key={option.value} className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700">
                          <input
                            type="radio"
                            name="question-type"
                            checked={questionType === option.value}
                            onChange={() => {
                              setQuestionType(option.value as QuizQuestionType);
                              setGeneratedQuiz(null);
                            }}
                            className="h-4 w-4 accent-blue-600"
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Difficulty level</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(['Beginner', 'Intermediate', 'Advanced'] as QuizDifficulty[]).map((level) => (
                        <button
                          key={level}
                          onClick={() => {
                            setDifficulty(level);
                            setGeneratedQuiz(null);
                          }}
                          className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${
                            difficulty === level
                              ? 'border-purple-500 bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Number of questions</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[5, 10, 15, 20].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => {
                            setQuestionCount(count);
                            setGeneratedQuiz(null);
                          }}
                          className={`h-10 min-w-12 rounded-xl border px-3 text-sm font-bold ${
                            questionCount === count
                              ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-400">More questions use more generation time and AI tokens.</p>
                  </div>
                </div>
                {isEducator && generatedQuiz && (
                  <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 md:grid-cols-2">
                    <label className="text-sm font-bold text-slate-700">Quiz title<input value={generatedQuiz.title} onChange={(event) => setGeneratedQuiz({ ...generatedQuiz, title: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-primary" /></label>
                    <label className="text-sm font-bold text-slate-700">Subject<input value={generatedQuiz.subject} onChange={(event) => setGeneratedQuiz({ ...generatedQuiz, subject: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-primary" /></label>
                  </div>
                )}
                {isEducator && creationMethod === 'ai' && (
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={uploadedFiles.length === 0 || isGenerating}
                    className="mt-7 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <FiZap className="h-4 w-4" />
                    {isGenerating ? 'Generating quiz…' : 'Generate full quiz'}
                  </button>
                )}
              </section>
            </div>

            {!isEducator && <aside className="space-y-5 xl:sticky xl:top-6">
              <section className="rounded-[30px] bg-slate-100 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white">
                    <FiZap className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-slate-950">AI-generated preview</h2>
                    <p className="text-xs text-slate-500">
                      {generatedQuiz ? `${generatedQuiz.subject} · ${generatedQuiz.topic} · ${generatedQuiz.difficulty}` : 'Generated questions will appear here'}
                    </p>
                  </div>
                </div>

                {generatedQuiz ? (
                  <div className="mt-5 max-h-[58vh] space-y-4 overflow-y-scroll overscroll-contain pr-2 touch-pan-y" tabIndex={0}>
                    {generatedQuiz.questions.map((item, index) => (
                      <div key={index} className="rounded-2xl bg-white p-4 shadow-sm">
                        <span className="rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-extrabold uppercase text-emerald-700">
                          Question {index + 1} · {item.question_type}
                        </span>
                        {isEducator ? <div className="mt-3 space-y-2"><textarea value={item.question} onChange={(event) => updateQuestion(index, { question: event.target.value })} rows={2} className="w-full rounded-xl border border-slate-200 p-2 text-sm font-bold outline-none focus:border-primary" />{item.question_type === 'mcq' && item.options.map((option, optionIndex) => <input key={optionIndex} value={option} onChange={(event) => updateQuestion(index, { options: item.options.map((value, currentIndex) => currentIndex === optionIndex ? event.target.value : value) })} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-primary" />)}<input value={item.correct_answer} onChange={(event) => updateQuestion(index, { correct_answer: event.target.value })} placeholder="Correct answer" className="h-9 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-xs font-semibold outline-none focus:border-primary" /><textarea value={item.explanation} onChange={(event) => updateQuestion(index, { explanation: event.target.value })} placeholder="Teaching explanation (optional)" rows={2} className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-primary" /></div> : <p className="mt-3 text-sm font-bold leading-5 text-slate-800">{item.question}</p>}
                        {revealedAnswers.has(index) ? (
                          <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-xs font-semibold text-emerald-800">
                            <div className="flex items-start gap-2">
                              <FiCheck className="mt-0.5 flex-none" />
                              <span>{item.correct_answer}</span>
                            </div>
                            <button type="button" onClick={() => toggleAnswer(index)} className="mt-2 text-[11px] font-extrabold text-emerald-700 hover:underline">
                              Hide answer
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleAnswer(index)}
                            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <FiEye className="h-4 w-4" />
                            Reveal answer
                          </button>
                        )}
                      </div>
                    ))}
                    {isEducator && <button type="button" onClick={addManualQuestion} className="w-full rounded-xl border border-dashed border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-primary">+ Add question</button>}
                  </div>
                ) : (
                  <div className="mt-5 flex min-h-[330px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 text-center">
                    <FiFileText className="h-9 w-9 text-slate-300" />
                    <p className="mt-4 text-sm font-bold text-slate-500">No generated questions yet</p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">Upload study material, choose the configuration, and generate a quiz.</p>
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={(creationMethod === 'ai' && !generatedQuiz && uploadedFiles.length === 0) || isGenerating}
                  className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-extrabold text-white shadow-xl shadow-blue-600/20 disabled:opacity-40"
                >
                  {isGenerating ? 'Generating quiz…' : generatedQuiz ? (isEducator ? 'Preview as student' : 'Start quiz') : 'Generate full quiz'}
                  <FiZap className="h-4 w-4" />
                </button>
                {saveError && (
                  <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    {saveError}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleSaveToLibrary}
                  disabled={!generatedQuiz || isSaving}
                  className={`mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold disabled:opacity-50 ${
                    savedQuizId ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {savedQuizId ? <FiCheck className="h-4 w-4" /> : <FiSave className="h-4 w-4" />}
                  {isSaving ? 'Saving automatically…' : savedQuizId ? 'Saved automatically — view library' : 'Retry save to library'}
                </button>
              </section>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                <div className="flex items-start gap-3">
                  <FiInfo className="mt-1 h-4 w-4 flex-none" />
                  <p><span className="font-extrabold">Pro tip:</span> Clear, well-lit pages with readable labels produce more accurate questions.</p>
                </div>
              </div>
            </aside>}
          </div>
        </main>
      </div>

      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${previewFile.name}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewFile(null);
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-slate-900">{previewFile.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {previewFile.type === 'application/pdf' ? 'PDF document' : 'Image'} · {(previewFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="ml-4 flex h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                aria-label="Close preview"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4">
              {previewFile.type === 'application/pdf' ? (
                <iframe
                  src={filePreviews.find(({ file }) => file === previewFile)?.url}
                  title={previewFile.name}
                  className="h-[75vh] w-full rounded-xl bg-white"
                />
              ) : (
                <img
                  src={filePreviews.find(({ file }) => file === previewFile)?.url}
                  alt={`Preview of ${previewFile.name}`}
                  className="mx-auto max-h-[75vh] max-w-full rounded-xl object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
