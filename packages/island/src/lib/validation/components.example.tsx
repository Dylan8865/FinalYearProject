'use client';

import { useState } from 'react';
import { useValidation } from '@/lib/validation/hooks';

/**
 * Example component showing how to integrate validation into your publish workflow
 * This can be adapted to your existing island item editor
 */
export function PublishButton({ islandItemId }: { islandItemId: string }) {
  const { validateItem, isValidating, error, success } = useValidation();
  const [showFeedback, setShowFeedback] = useState(false);

  const handlePublish = async () => {
    setShowFeedback(false);

    // Trigger validation
    const result = await validateItem(islandItemId);

    if (result.success) {
      setShowFeedback(true);
      // Optionally, you can poll the database to check when validation is completed
      // or use real-time subscriptions to listen for status updates
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handlePublish}
        disabled={isValidating}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isValidating ? 'Queueing Validation...' : 'Publish'}
      </button>

      {/* Success Message */}
      {success && showFeedback && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-900">
            Validation Queued Successfully!
          </h3>
          <p className="text-sm text-green-700 mt-1">
            Your content has been queued for validation. This usually takes a few moments.
            You'll be notified once the validation is complete.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-900">Validation Failed</h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
          <p className="text-xs text-red-600 mt-2">
            Please ensure your item has a title and at least one piece of content
            before publishing.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Example admin component for monitoring and triggering validation processing
 */
export function ValidationMonitor() {
  const [status, setStatus] = useState<{
    queuedCount: number;
    processingCount: number;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/process-validations');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to check status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerProcessing = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/process-validations', {
        method: 'POST',
      });
      const data = await response.json();
      alert(data.message);
      // Refresh status
      await checkStatus();
    } catch (error) {
      console.error('Failed to trigger processing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Validation Queue Monitor</h2>

      <div className="space-y-4">
        <button
          onClick={checkStatus}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Check Status'}
        </button>

        {status && (
          <div className="p-4 bg-gray-50 rounded">
            <p className="font-semibold">{status.message}</p>
            <div className="mt-2 space-y-1 text-sm">
              <p>Queued: {status.queuedCount}</p>
              <p>Processing: {status.processingCount}</p>
            </div>
          </div>
        )}

        <button
          onClick={triggerProcessing}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Process Queue Now'}
        </button>
      </div>
    </div>
  );
}
