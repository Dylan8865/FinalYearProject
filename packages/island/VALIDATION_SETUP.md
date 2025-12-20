# Island Item Validation System - Setup & Usage Guide

## 🎯 Overview

This validation system uses Google's Gemini AI to automatically validate island items (knowledge contributions) based on clarity, completeness, usefulness, and authenticity. The system follows the design draft closely and implements all specified features.

## 📦 What Was Implemented

### 1. **Core Files Created**

```
src/
├── lib/
│   ├── gemini/
│   │   ├── client.ts          # Gemini API integration
│   │   ├── types.ts           # TypeScript type definitions
│   │   └── index.ts           # Barrel export
│   └── validation/
│       ├── utils.ts           # Core validation logic
│       ├── hooks.ts           # React hooks for client use
│       ├── index.ts           # Barrel export
│       ├── components.example.tsx  # Example components
│       └── README.md          # Detailed documentation
└── app/
    └── api/
        ├── validate-item/
        │   └── route.ts       # POST endpoint to queue validation
        └── process-validations/
            └── route.ts       # POST/GET endpoint for processing

vercel.json                    # Automated cron job configuration
```

### 2. **Database Tables Required**

The system expects these tables (already in your design):

- **`island-item`**: Stores island items with validation fields
  - `validation_status`: 'pending' | 'completed' | 'error' | null
  - `validity`: Numeric (0-100)
  - `comment`: Text feedback from AI
  - `status`: 'unverified' | 'pending' | 'declined' | 'verified'

- **`item-data`**: Stores content data
  - `validity`: Numeric (0-100)

- **`validation-log`**: Tracks validation requests
  - `status`: 'queued' | 'processing' | 'completed' | 'failed' | 'superseeded'
  - `request`: JSONB
  - `response`: JSONB
  - `error`: Text
  - `retry_count`: Smallint

## 🚀 Quick Start

### Step 1: Prerequisites

✅ The `@google/genai` package is already installed  
✅ The `GEMINI_API_KEY` is already in your `.env`

### Step 2: Integrate into Your Publish Flow

Add the validation trigger to your island item editor:

```typescript
import { useValidation } from '@/lib/validation';

function YourIslandEditor({ islandItemId }: { islandItemId: string }) {
  const { validateItem, isValidating, error, success } = useValidation();

  const handlePublish = async () => {
    // Trigger validation
    const result = await validateItem(islandItemId);
    
    if (result.success) {
      // Show success message to user
      alert('Your content has been queued for validation!');
    } else {
      // Show error
      alert(`Validation failed: ${result.error}`);
    }
  };

  return (
    <button 
      onClick={handlePublish} 
      disabled={isValidating}
    >
      {isValidating ? 'Queueing...' : 'Publish'}
    </button>
  );
}
```

### Step 3: Enable Background Processing

**Option A: Automatic (Vercel Cron)**

The `vercel.json` file is already configured to run validation processing every 2 minutes automatically when deployed to Vercel.

**Option B: Manual Trigger**

Create an admin page to manually trigger processing:

```typescript
import { useValidationProcessor } from '@/lib/validation';

function AdminValidationPanel() {
  const { processQueue, isProcessing, result } = useValidationProcessor();

  return (
    <button onClick={() => processQueue()} disabled={isProcessing}>
      {isProcessing ? 'Processing...' : 'Process Queue'}
    </button>
  );
}
```

**Option C: Client Polling**

Add to your layout or main app component:

```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    await fetch('/api/process-validations', { method: 'POST' });
  }, 30000); // Every 30 seconds

  return () => clearInterval(interval);
}, []);
```

## 🔄 How It Works

### Flow Diagram

```
User saves island-item
        ↓
User clicks "Publish"
        ↓
POST /api/validate-item
  - Creates validation-log entry (status: 'queued')
  - Sets island-item.validation_status = 'pending'
        ↓
[Background Processing]
POST /api/process-validations (runs every 2 minutes via cron)
  - Fetches up to 5 queued items (oldest first)
  - Checks for superseded entries
  - Marks selected items as 'processing'
  - Batches them into one Gemini API call
        ↓
Gemini AI Validates
  - Evaluates clarity, completeness, usefulness, authenticity
  - Returns validity scores (0-100) and feedback
        ↓
Results Saved to Database
  - Updates item-data.validity for each piece
  - Updates island-item with:
    * validity score
    * AI comment
    * status (verified/pending/declined based on score)
    * validation_status = 'completed'
  - Saves response to validation-log
        ↓
Done! Content is now published or flagged for review
```

### Status Transitions

**Island Item Status:**
- **Verified** (60-100): Auto-published, visible to public
- **Pending** (55-59): Requires moderator review
- **Declined** (0-54): Hidden, user can see feedback

### Retry Logic

- Failed validations automatically retry up to 5 times
- Each retry increments `retry_count`
- After 5 failures: sets status to 'pending' with comment "Gemini error ≥5 times, manual validation required."

### Superseding

If user edits and republishes before validation completes:
- Older queued requests are marked as 'superseeded'
- Only the newest request is processed

## 📊 Monitoring

### Check Queue Status

```bash
curl http://localhost:3004/api/process-validations
```

Response:
```json
{
  "success": true,
  "queuedCount": 3,
  "processingCount": 1,
  "message": "3 item(s) queued, 1 currently processing"
}
```

### Trigger Processing Manually

```bash
curl -X POST http://localhost:3004/api/process-validations
```

Response:
```json
{
  "success": true,
  "processed": 3,
  "message": "Successfully processed 3 validation request(s)"
}
```

## 🔍 Validation Criteria

Gemini evaluates each piece of content on:

1. **Clarity (0-100)**: Can readers understand it?
2. **Completeness (0-100)**: Enough detail to be useful?
3. **Usefulness (0-100)**: Valuable to others?
4. **Authenticity (0-100)**: Genuine personal knowledge?

**Important**: The system is designed to **accept** personal and traditional knowledge:
- ✅ Family recipes, folk wisdom, cultural practices
- ✅ Personal experiences and anecdotes
- ✅ Unconventional methods
- ❌ Does NOT penalize for lacking scientific backing

## 🛠️ API Endpoints

### POST /api/validate-item
Queue an island item for validation

**Request:**
```json
{
  "islandItemId": "uuid-here"
}
```

**Prerequisites:**
- `island-item.title` must not be null
- At least one `item-data.content` must not be null

**Response:**
```json
{
  "success": true,
  "validationLogId": "uuid-here",
  "message": "Validation queued successfully..."
}
```

### POST /api/process-validations
Process queued validations (called by cron)

### GET /api/process-validations
Check queue status

## 📝 Example Validation Response

For an island item with 3 pieces of content:

```json
{
  "results": [{
    "island_item_id": "abc-123",
    "validity": 75.33,
    "comment": "Clear and well-structured content with good practical examples. Consider adding approximate measurements for better clarity.",
    "item_data": [
      { "id": "data-1", "validity": 80 },
      { "id": "data-2", "validity": 75 },
      { "id": "data-3", "validity": 71 }
    ]
  }]
}
```

This results in:
- `island-item.status` = 'verified' (because 75.33 ≥ 60)
- `island-item.validity` = 75.33
- `island-item.comment` = "Clear and well-structured..."
- Each `item-data` gets its individual validity score

## 🚨 Troubleshooting

### Items Stuck in 'pending' validation_status
- Check if background processing is running
- Manually trigger: `POST /api/process-validations`

### High Failure Rate
- Verify `GEMINI_API_KEY` is valid
- Check Gemini API quota
- Review error messages in `validation-log` table

### Items Not Being Validated
- Ensure prerequisites are met (title + content not null)
- Check `validation-log` table for queued entries
- Verify cron job is running (Vercel deployment)

## 🔐 Security Notes

- Uses `SUPABASE_SERVICE_ROLE_KEY` for database operations
- API routes should be rate-limited in production
- Consider adding authentication to prevent abuse

## 🎨 Customization

### Change Validation Frequency

Edit `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/process-validations",
    "schedule": "*/5 * * * *"  // Every 5 minutes
  }]
}
```

### Adjust Batch Size

In `process-validations/route.ts`, change:
```typescript
const queuedLogs = await fetchQueuedValidations(10); // Process 10 at once
```

### Modify Scoring Thresholds

In `validation/utils.ts`, update the status logic:
```typescript
if (result.validity >= 70) {  // Changed from 60
  status = 'verified';
}
```

### Customize AI Prompt

Edit the `VALIDATION_PROMPT` in `gemini/client.ts` to adjust evaluation criteria.

## 📚 Additional Resources

- Full documentation: `src/lib/validation/README.md`
- Example components: `src/lib/validation/components.example.tsx`
- Type definitions: `src/lib/gemini/types.ts`

## ✅ Design Compliance

This implementation follows your design draft closely:

✅ Creates validation-log with 'queued' status  
✅ Sets island-item.validation_status to 'pending'  
✅ Generates proper JSON request format  
✅ Processes oldest first, handles superseding  
✅ Batches up to 5 items per request  
✅ Sets status to 'processing' during validation  
✅ Saves response and updates all database fields  
✅ Status determination based on validity (60+, 55-59, <55)  
✅ Retry logic with max 5 attempts  
✅ Error handling and error messages  
✅ Structured JSON request/response format  

## 🎉 You're Done!

The validation system is now ready to use. When deployed to Vercel, it will automatically process validations every 2 minutes. Users can click "Publish" and their content will be queued, validated, and either published or flagged for review based on the AI's assessment.
