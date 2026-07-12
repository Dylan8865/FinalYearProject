# Setup & Installation Guide

## Prerequisites
- Node.js 18+ (for frontend)
- Python 3.8+ (for backend)
- PostgreSQL 13+ or Supabase account
- Git

## Frontend Setup

## One-Command Development Startup

On Windows, from the `FinalYearProject` folder:

```powershell
.\start-dev.bat
```

Or from the `qubo` folder:

```powershell
.\start-dev.bat
```

This starts FastAPI on `http://localhost:8000` and Vite on `http://localhost:3000`.
Open the frontend URL; frontend API calls are proxied through Vite from `/api/v1` to the backend.

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
- `VITE_API_URL` - Backend API URL
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase public key

### 3. Development Server
```bash
npm run dev
```
Frontend will be available at `http://localhost:3000`

### 4. Build for Production
```bash
npm run build
npm run preview
```

## Backend Setup

### 1. Create Virtual Environment
```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `DATABASE_URL` - Database connection string
- `SUPABASE_URL` and `SUPABASE_KEY` - Supabase project URL and anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for backend-only database/auth operations
- `GEMINI_API_KEY` - Google Gemini API key
- `SECRET_KEY` - Application secret (change in production!)

### 4. Run Development Server
```bash
python -m uvicorn app.main:app --reload
```
Backend will be available at `http://localhost:8000`

## Database Setup

### Using Supabase
1. Create a Supabase project
2. Run the schema.sql file in the Supabase SQL editor
3. If you are testing Module 1 only, run `database/module1_schema_fix.sql` in the Supabase SQL editor
4. Update credentials in `.env` files

### Using Local PostgreSQL
```bash
createdb qubo
psql qubo < database/schema.sql
```

## Docker Setup (Optional)

### Using Docker Compose
```bash
docker-compose up -d
```

This will start:
- Frontend (port 3000)
- Backend (port 8000)
- PostgreSQL (port 5432)

## Verification

### Check Frontend
```bash
curl http://localhost:3000
```

### Check Backend
```bash
curl http://localhost:8000/health
```

### Check Database
```bash
psql -U qubo_user -d qubo -h localhost
```

## Common Issues

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000
# Or on Windows
netstat -ano | findstr :3000
```

### Module Not Found
Ensure all dependencies are installed:
```bash
pip install -r requirements.txt  # Backend
npm install                      # Frontend
```

### Database Connection Error
- Verify DATABASE_URL in `.env`
- Check database is running
- Ensure credentials are correct

---

For more information, see the full documentation in `docs/` directory.
