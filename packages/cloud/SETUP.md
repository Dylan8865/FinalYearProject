# Cloud Package - Complete Setup Guide

## 🎯 Overview

AI-powered 3D word cloud system that processes content, extracts topics using Gemini AI, and displays them in an interactive TagCanvas visualization.

**Architecture**: Pure JavaScript/TypeScript (No Python dependency)

---

## 📋 Prerequisites

- Node.js  
- pnpm package manager
- Supabase account
- Google AI API key (Gemini)

---

## 🗄️ Database Setup

### 1. Tables Required

#### **item-data** (existing content storage)
```sql
CREATE TABLE "item-data" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  type text,
  content text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);
```

#### **cloud-topics-cache** (AI-processed topics)
```sql
CREATE TABLE "cloud-topics-cache" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  main_topic text NOT NULL,
  sub_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  category text,
  bubble_map_data jsonb,
  weight integer DEFAULT 1,
  is_stale boolean DEFAULT false,
  item_id uuid REFERENCES "item-data"(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Index for faster queries
CREATE INDEX idx_cloud_topics_main_topic ON "cloud-topics-cache"(main_topic);
CREATE INDEX idx_cloud_topics_category ON "cloud-topics-cache"(category);
```

### 2. Row Level Security (RLS)

Enable RLS and create policies for anonymous access:

```sql
-- Enable RLS
ALTER TABLE "cloud-topics-cache" ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads
CREATE POLICY "Allow anonymous read access"
ON "cloud-topics-cache"
FOR SELECT
TO anon
USING (true);

-- Allow anonymous writes
CREATE POLICY "Allow anonymous write access"
ON "cloud-topics-cache"
FOR INSERT
TO anon
WITH CHECK (true);
```

---

## ⚙️ Environment Variables

Create `.env.local` in `packages/cloud/`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Google AI (Gemini)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Database Direct Connection (for server-side operations)
DATABASE_URL=postgresql://postgres:password@db.YOUR_PROJECT.supabase.co:5432/postgres
```

### Getting API Keys

1. **Supabase**:
   - Go to Project Settings → API
   - Copy `URL` and `anon public` key
   - Copy `service_role` key (⚠️ keep secret!)

2. **Gemini API**:
   - Visit https://aistudio.google.com/app/apikey
   - Create new API key
   - Copy key

---

## 🚀 Installation

```bash
# From workspace root
cd packages/cloud

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Server runs on: **http://localhost:3002**

---

## 📡 API Endpoints

### **POST /api/process**
Process single content item with AI.

**Request**:
```json
{
  "content": "Your content here...",
  "type": "article",
  "title": "Optional title"
}
```

**Response**:
```json
{
  "success": true,
  "topic": {
    "id": "uuid",
    "main_topic": "AI",
    "sub_topics": ["Machine Learning", "Neural Networks"],
    "category": "Technology",
    "bubble_map_data": { ... }
  }
}
```

### **POST /api/batch-process**
Process multiple records from item-data.

**Request**:
```json
{
  "limit": 10,
  "offset": 0
}
```

**Response**:
```json
{
  "processed": 10,
  "successful": 8,
  "errors": 2,
  "hasMore": true,
  "nextOffset": 10
}
```

### **GET /api/topics**
Fetch all cached topics for word cloud.

**Response**:
```json
{
  "topics": [
    {
      "main_topic": "AI",
      "weight": 5,
      "category": "Technology"
    }
  ]
}
```

### **GET /api/topics/[id]**
Get detailed topic information.

**Response**:
```json
{
  "main_topic": "AI",
  "sub_topics": ["Machine Learning"],
  "bubble_map_data": { ... }
}
```

---

## 🎨 Pages & Components

### **Pages**

1. **`/`** - Main Cloud (3D word cloud)
2. **`/admin`** - Admin panel (upload & batch processing)

### **Key Components**

- **TagCanvas3D**: 3D word cloud visualization
- **ContentUploader**: Upload form with AI processing
- **BubbleMapModal**: Sub-topic visualization modal

---

## 🔄 System Flow

### User Upload Flow

```
1. User opens /admin
   ↓
2. Fills form (content + type + title)
   ↓
3. Submits → POST /api/process
   ↓
4. API calls Gemini AI to extract topics
   ↓
5. Generates bubble map structure
   ↓
6. Caches to cloud-topics-cache
   ↓
7. Returns success → UI shows extracted topic
   ↓
8. Topic appears in word cloud on / page
```

### Batch Processing Flow

```
1. User clicks "Start Batch Processing" on /admin
   ↓
2. POST /api/batch-process (limit=10, offset=0)
   ↓
3. Fetches 10 records from item-data
   ↓
4. For each record:
   - AI extracts topics
   - Generates bubble map
   - Caches result
   - Waits 2s (rate limiting)
   ↓
5. Returns progress + nextOffset
   ↓
6. Auto-continues if hasMore=true
   ↓
7. Repeats until all records processed
```

### Word Cloud Display Flow

```
1. User visits /
   ↓
2. TagCanvas3D fetches GET /api/topics
   ↓
3. Queries cloud-topics-cache
   ↓
4. Returns all topics with weights
   ↓
5. TagCanvas renders 3D cloud
   ↓
6. User clicks word → Opens modal
   ↓
7. Fetches GET /api/topics/[id]
   ↓
8. Displays bubble map in modal
```

---

## ⚠️ Rate Limiting

### Gemini API Limits

- **Free tier**: 15 requests/minute
- **Our implementation**: 2-second delay between requests
- **Batch processing**: ~30 records/minute

### Recommendations

1. Process in batches of 10-20 records
2. Monitor API usage in Google AI Studio
3. Consider upgrading to paid tier for production

---

## 🐛 Troubleshooting

### "Failed to fetch topics"

**Check**:
1. `.env.local` exists with correct variables
2. Supabase URL and keys are correct
3. RLS policies are enabled
4. `cloud-topics-cache` table exists

**Fix**:
```bash
# Test Supabase connection
curl https://YOUR_PROJECT.supabase.co/rest/v1/cloud-topics-cache \
  -H "apikey: YOUR_ANON_KEY"
```

### "Gemini API error"

**Check**:
1. `GEMINI_API_KEY` is set
2. API key is valid (test in AI Studio)
3. Not rate limited (wait 1 minute)

**Fix**:
```bash
# Test Gemini API
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_KEY \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Test"}]}]}'
```

### TagCanvas not loading

**Check**:
1. Network tab shows successful load from goat1000.com
2. No CSP errors in console
3. Script loads before page render

**Fix**: Clear browser cache and hard refresh

---

## 📦 Deployment

### Vercel Deployment

```bash
# From workspace root
vercel --cwd packages/cloud

# Set environment variables in Vercel dashboard
# Project Settings → Environment Variables
```

### Environment Variables (Production)

Add these in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

### Database Preparation

1. Run all SQL scripts in Supabase SQL Editor
2. Verify RLS policies are active
3. Test with anonymous queries

---

## 🎯 Next Steps

### Optional Enhancements

1. **Authentication**:
   - Add Supabase Auth
   - Protect /admin route
   - User-specific topics

2. **Caching**:
   - Redis for API responses
   - ISR for static pages
   - Edge caching

3. **Monitoring**:
   - Sentry for errors
   - Vercel Analytics
   - API usage tracking

4. **UI Improvements**:
   - Drag-and-drop upload
   - Real-time batch progress
   - Topic editing interface

---

## 📚 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini 2.0-flash-exp
- **Visualization**: TagCanvas 3D
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm

---

## 🔗 Links

- [Supabase Docs](https://supabase.com/docs)
- [Gemini API](https://ai.google.dev/)
- [TagCanvas](https://www.goat1000.com/tagcanvas.php)
- [Next.js](https://nextjs.org/docs)

---

## 📝 License

MIT
