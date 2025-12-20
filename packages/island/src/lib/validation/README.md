# Island Item Validation System

This system validates island items using Google's Gemini AI to ensure quality content before publication.

## Overview

The validation system follows this flow:

1. **User triggers validation** - When a user clicks "publish" on an island item
2. **Validation queued** - Request is added to validation queue
3. **Background processing** - System processes queued items in batches (up to 5 at once)
4. **AI validation** - Gemini evaluates content based on clarity, completeness, usefulness, and authenticity
5. **Results saved** - Validity scores and feedback are saved to database
6. **Status updated** - Items are automatically approved, flagged for review, or declined based on scores

## Architecture

### Files Structure

```
src/
├── lib/
│   ├── gemini/
│   │   ├── client.ts       # Gemini API integration
│   │   └── types.ts        # TypeScript types for validation
│   └── validation/
│       └── utils.ts        # Validation processing utilities
└── app/
    └── api/
        ├── validate-item/
        │   └── route.ts    # Endpoint to queue validation
        └── process-validations/
            └── route.ts    # Background processing endpoint
```

### Database Tables

#### `island-item`
- `validation_status`: 'pending' | 'completed' | 'error' | null
- `validity`: Numeric score 0-100
- `comment`: AI-generated feedback
- `status`: 'unverified' | 'pending' | 'declined' | 'verified'

#### `item-data`
- `validity`: Numeric score 0-100 for each piece of content

#### `validation-log`
- `status`: 'queued' | 'processing' | 'completed' | 'failed' | 'superseeded'
- `request`: The validation request JSON
- `response`: The validation response JSON
- `error`: Error message if failed
- `retry_count`: Number of retry attempts (max 5)

## API Endpoints

### POST /api/validate-item

Triggers validation for a single island item.

**Request:**
```json
{
  "islandItemId": "uuid-string"
}
```

**Response:**
```json
{
  "success": true,
  "validationLogId": "uuid-string",
  "message": "Validation queued successfully. Processing will begin shortly."
}
```

### POST /api/process-validations

Processes queued validation requests (called by background job).

**Response:**
```json
{
  "success": true,
  "processed": 3,
  "message": "Successfully processed 3 validation request(s)"
}
```

### GET /api/process-validations

Checks the status of validation queue.

**Response:**
```json
{
  "success": true,
  "queuedCount": 5,
  "processingCount": 2,
  "message": "5 item(s) queued, 2 currently processing"
}
```

## Validation Criteria

Gemini evaluates content based on four criteria:

1. **Clarity (0-100)**: Is the content easy to understand?
2. **Completeness (0-100)**: Is there enough detail?
3. **Usefulness (0-100)**: Would this be valuable to others?
4. **Authenticity (0-100)**: Does this feel genuine?

### Scoring System

- **80-100**: Excellent - Auto-verified
- **60-79**: Good - Auto-verified
- **55-59**: Acceptable - Pending moderator review
- **40-54**: Poor - Auto-declined
- **0-39**: Unacceptable - Auto-declined

## Prerequisites for Validation

An island item can only be validated if:

1. ✅ Item has been saved to database
2. ✅ User clicked the "publish" button
3. ✅ `island-item.title` is not null
4. ✅ At least one `item-data.content` is not null

## Background Processing

The `/api/process-validations` endpoint should be called periodically to process queued items. Options:

### Option 1: Vercel Cron Jobs
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/process-validations",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

### Option 2: Client-Side Polling
Call the endpoint every 30 seconds from the client when user is active.

### Option 3: External Cron Service
Use services like cron-job.org or EasyCron to call the endpoint.

## Error Handling

### Retry Logic
- Failed validations are automatically retried up to 5 times
- Each retry creates a new queued entry with incremented `retry_count`
- After 5 failures, item is marked with validation error

### Superseding
- If a newer validation request is queued for the same item, older requests are marked as 'superseeded'
- This prevents processing outdated content

## Usage Example

### Client-Side Integration

```typescript
// Trigger validation when user clicks publish
async function handlePublish(islandItemId: string) {
  try {
    const response = await fetch('/api/validate-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ islandItemId }),
    });

    const data = await response.json();
    
    if (data.success) {
      // Show success message
      console.log(data.message);
      // Validation is now queued and will be processed in background
    } else {
      // Show error message
      console.error(data.error);
    }
  } catch (error) {
    console.error('Failed to queue validation:', error);
  }
}
```

### Check Validation Status

```typescript
async function checkValidationStatus() {
  const response = await fetch('/api/process-validations');
  const data = await response.json();
  console.log(data.message); // "5 item(s) queued, 2 currently processing"
}
```

## Environment Variables

Required in `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

## Important Notes

### About Personal Knowledge
The validation system is designed to **accept and encourage** personal and traditional knowledge:
- ✅ Family recipes and cultural practices
- ✅ Personal experiences and anecdotes
- ✅ Traditional remedies and folk wisdom
- ✅ Local tips and life hacks

The system does **NOT** penalize content for being unconventional or lacking scientific backing.

### Batch Processing
- Up to 5 items are processed together in a single Gemini API call
- This optimizes token usage and reduces API costs
- Items are batched by creation time (oldest first)

### Status Flow
```
User saves item
  ↓
User clicks publish
  ↓
validation_status: 'pending'
  ↓
Background processing
  ↓
Gemini validation
  ↓
validation_status: 'completed' or 'error'
  ↓
status: 'verified' / 'pending' / 'declined'
```

## Monitoring

Monitor validation health by:
1. Checking `validation-log` table for failed entries
2. Monitoring items stuck in 'pending' validation_status
3. Reviewing items with validation_status='error'

## Troubleshooting

### Items stuck in 'processing'
If items remain in 'processing' status, it means the validation request was interrupted. Run the background processor again.

### High failure rate
Check:
- Gemini API key is valid
- API quota hasn't been exceeded
- Network connectivity is stable

### Items not being validated
Ensure:
- Background processor is running periodically
- Items meet validation prerequisites
- Validation logs show 'queued' status
