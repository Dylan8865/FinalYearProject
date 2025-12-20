import { NextRequest, NextResponse } from 'next/server';
import { validateWithGemini } from '@/lib/gemini/client';
import {
  fetchQueuedValidations,
  processValidationResponse,
  handleValidationFailure,
} from '@/lib/validation/utils';
import type { ValidationRequest } from '@/lib/gemini/types';

/**
 * POST /api/process-validations
 * Background endpoint that processes queued validation requests
 * This should be called periodically (e.g., every 30 seconds via cron job or client polling)
 * 
 * Response:
 * {
 *   "success": true,
 *   "processed": 3,
 *   "message": "Successfully processed 3 validation requests"
 * }
 */
export async function POST(_request: NextRequest) {
  try {
    console.log('Starting validation processing...');

    // Fetch up to 5 queued validation requests
    const queuedLogs = await fetchQueuedValidations(5);

    if (queuedLogs.length === 0) {
      return NextResponse.json(
        {
          success: true,
          processed: 0,
          message: 'No queued validations to process',
        },
        { status: 200 }
      );
    }

    console.log(`Found ${queuedLogs.length} validation requests to process`);

    // Build the batch validation request
    const validationRequest: ValidationRequest = {
      items: queuedLogs.map((log) => log.request),
    };

    const logIds = queuedLogs.map((log) => log.logId);

    try {
      // Send to Gemini API
      console.log('Sending validation request to Gemini...');
      const validationResponse = await validateWithGemini(validationRequest);

      // Process successful response
      console.log('Received validation response, processing...');
      await processValidationResponse(logIds, validationResponse);

      return NextResponse.json(
        {
          success: true,
          processed: queuedLogs.length,
          message: `Successfully processed ${queuedLogs.length} validation request(s)`,
        },
        { status: 200 }
      );
    } catch (geminiError) {
      // Handle Gemini API failure
      console.error('Gemini validation failed:', geminiError);
      const errorMessage =
        geminiError instanceof Error
          ? geminiError.message
          : 'Unknown Gemini API error';

      await handleValidationFailure(logIds, errorMessage);

      return NextResponse.json(
        {
          success: false,
          processed: 0,
          error: `Validation failed: ${errorMessage}`,
          message: 'Validation requests marked for retry',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in process-validations API:', error);
    return NextResponse.json(
      {
        success: false,
        processed: 0,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/process-validations
 * Check status of validation processing
 * 
 * Response:
 * {
 *   "queuedCount": 3,
 *   "processingCount": 2,
 *   "message": "3 items queued, 2 currently processing"
 * }
 */
export async function GET(_request: NextRequest) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Count queued items
    const { count: queuedCount } = await supabaseAdmin
      .from('validation-log')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'queued');

    // Count processing items
    const { count: processingCount } = await supabaseAdmin
      .from('validation-log')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processing');

    return NextResponse.json(
      {
        success: true,
        queuedCount: queuedCount || 0,
        processingCount: processingCount || 0,
        message: `${queuedCount || 0} item(s) queued, ${processingCount || 0} currently processing`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting validation status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
