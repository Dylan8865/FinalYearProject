import { useState } from 'react';
import { FiBookOpen, FiCheck, FiCpu, FiStar } from 'react-icons/fi';
import { StudyPlanRecommendation } from '@/types/analytics';
import { authService } from '@/lib/authService';

interface StudyPlanCardProps {
  recommendations: StudyPlanRecommendation[];
  onRefresh: () => void;
}

export default function StudyPlanCard({ recommendations, onRefresh }: StudyPlanCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      await authService.generateStudyPlan();
      onRefresh();
    } catch (error: any) {
      console.error('Failed to generate study plan', error);
      const errorMessage = error.response?.data?.detail || 'Failed to generate study plan. Make sure you have completed some quizzes!';
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = async (id: string) => {
    setIsAccepting(id);
    try {
      await authService.acceptStudyPlanRecommendation(id);
      onRefresh();
    } catch (error) {
      console.error('Failed to accept recommendation', error);
    } finally {
      setIsAccepting(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiCpu className="text-blue-500" />
            AI Study Plan
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Personalised recommendations based on your weak topics
          </p>
        </div>
        <button
          onClick={handleGeneratePlan}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FiStar />
              Generate Plan
            </>
          )}
        </button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBookOpen className="text-2xl text-blue-500" />
          </div>
          <h3 className="text-gray-900 dark:text-white font-medium mb-1">No Active Plan</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate an AI study plan to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-4 rounded-xl border transition-all ${
                rec.is_accepted
                  ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 hover:border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 capitalize">
                      {rec.recommendation_type.replace('_', ' ')}
                    </span>
                    {rec.subject_name && (
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {rec.subject_name} {rec.topic_name ? `• ${rec.topic_name}` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{rec.recommendation_text}</p>
                </div>
                {!rec.is_accepted && (
                  <button
                    onClick={() => handleAccept(rec.id)}
                    disabled={isAccepting === rec.id}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-green-500 hover:text-green-600 dark:hover:border-green-500 rounded-lg text-xs font-medium transition-colors"
                  >
                    {isAccepting === rec.id ? (
                      <div className="w-3 h-3 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                    ) : (
                      <FiCheck />
                    )}
                    Accept
                  </button>
                )}
                {rec.is_accepted && (
                  <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-green-600 bg-green-100/50 dark:bg-green-900/30 rounded-lg text-xs font-medium">
                    <FiCheck />
                    Accepted
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
