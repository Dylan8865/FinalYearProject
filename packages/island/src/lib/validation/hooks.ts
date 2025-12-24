"use client";

import { useState, useCallback } from "react";

interface ValidationState {
  isValidating: boolean;
  error: string | null;
  success: boolean;
  validationLogId: string | null;
}

interface ValidationQueueStatus {
  queuedCount: number;
  processingCount: number;
  message: string;
}

/**
 * React hook for triggering and monitoring island item validation
 *
 * @example
 * ```tsx
 * const { validateItem, isValidating, error, success } = useValidation();
 *
 * const handlePublish = async () => {
 *   const result = await validateItem(islandItemId);
 *   if (result.success) {
 *     console.log('Validation queued!');
 *   }
 * };
 * ```
 */
export function useValidation() {
  const [state, setState] = useState<ValidationState>({
    isValidating: false,
    error: null,
    success: false,
    validationLogId: null,
  });

  /**
   * Trigger validation for an island item
   * @param islandItemId UUID of the island item to validate
   * @returns Promise with success status and validation log ID
   */
  const validateItem = useCallback(async (islandItemId: string) => {
    setState({
      isValidating: true,
      error: null,
      success: false,
      validationLogId: null,
    });

    try {
      const response = await fetch("/api/validate-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ islandItemId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setState({
          isValidating: false,
          error: data.error || "Validation failed",
          success: false,
          validationLogId: null,
        });
        return { success: false, error: data.error };
      }

      setState({
        isValidating: false,
        error: null,
        success: true,
        validationLogId: data.validationLogId,
      });

      return {
        success: true,
        validationLogId: data.validationLogId,
        message: data.message,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Network error";

      setState({
        isValidating: false,
        error: errorMessage,
        success: false,
        validationLogId: null,
      });

      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Check the status of the validation queue
   * @returns Promise with queue status information
   */
  const checkQueueStatus =
    useCallback(async (): Promise<ValidationQueueStatus | null> => {
      try {
        const response = await fetch("/api/process-validations");
        const data = await response.json();

        if (!response.ok) {
          console.error("Failed to check queue status:", data.error);
          return null;
        }

        return {
          queuedCount: data.queuedCount,
          processingCount: data.processingCount,
          message: data.message,
        };
      } catch (error) {
        console.error("Error checking queue status:", error);
        return null;
      }
    }, []);

  /**
   * Reset the validation state
   */
  const reset = useCallback(() => {
    setState({
      isValidating: false,
      error: null,
      success: false,
      validationLogId: null,
    });
  }, []);

  return {
    validateItem,
    checkQueueStatus,
    reset,
    isValidating: state.isValidating,
    error: state.error,
    success: state.success,
    validationLogId: state.validationLogId,
  };
}

/**
 * Hook for triggering background validation processing
 * Useful for admin panels or monitoring dashboards
 *
 * @example
 * ```tsx
 * const { processQueue, isProcessing, result } = useValidationProcessor();
 *
 * const handleProcess = async () => {
 *   const result = await processQueue();
 *   console.log(`Processed ${result?.processed} items`);
 * };
 * ```
 */
export function useValidationProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    processed: number;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Manually trigger the validation processor
   * @returns Promise with processing results
   */
  const processQueue = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/process-validations", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Processing failed");
        setIsProcessing(false);
        return { success: false, error: data.error };
      }

      setResult({
        processed: data.processed,
        message: data.message,
      });

      setIsProcessing(false);

      return {
        success: true,
        processed: data.processed,
        message: data.message,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Network error";

      setError(errorMessage);
      setIsProcessing(false);

      return { success: false, error: errorMessage };
    }
  }, []);

  return {
    processQueue,
    isProcessing,
    result,
    error,
  };
}
