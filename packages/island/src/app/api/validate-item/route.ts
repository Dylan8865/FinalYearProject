import { NextRequest, NextResponse } from 'next/server';
import {
  generateValidationRequest,
  createValidationLog,
} from '@/lib/validation/utils';

/**
 * POST /api/validate-item
 * Triggers validation for an island item (called when user clicks publish)
 * 
 * Request body:
 * {
 *   "islandItemId": "uuid-string"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "validationLogId": "uuid-string",
 *   "message": "Validation queued successfully"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { islandItemId } = body;

    // Validate input
    if (!islandItemId || typeof islandItemId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid island item ID' },
        { status: 400 }
      );
    }

    // Generate validation request
    const validationRequest = await generateValidationRequest(islandItemId);

    if (!validationRequest) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate validation request. Ensure the island item has a title and at least one item-data with content.',
        },
        { status: 400 }
      );
    }

    // Create validation log entry
    const validationLogId = await createValidationLog(
      islandItemId,
      validationRequest
    );

    if (!validationLogId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create validation log entry',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        validationLogId,
        message: 'Validation queued successfully. Processing will begin shortly.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in validate-item API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
