# Qubo - SPM Mastery Learning Platform

An interactive, AI-powered personalized learning platform designed for Malaysian SPM (Sijil Pelajaran Malaysia) students. Qubo offers a comprehensive ecosystem for students, educators, and administrators, featuring interactive 3D models, tutorial videos, quizzes, and a lightweight gamification module.

## Project Structure

```
qubo/
├── frontend/              # React, TypeScript, Vite, Tailwind CSS
├── backend/               # Python, FastAPI, Pydantic
├── database/              # Supabase PostgreSQL schema & migrations
├── docs/                  # Project Documentation
└── README.md              # This file
```

## Core Modules & Features

### 1.0 Resource Hub, Content Discovery and Management
*   **3D Model Explorer**: Interactive 3D science models (Biology, Chemistry, Physics) with rotatable views and educator annotations.
*   **Video Explorer**: Integrated YouTube tutorial videos playable directly within the platform.
*   **Quiz Library**: Access to public quizzes created by educators to test SPM knowledge.
*   **Educator's Picks & Recommendations**: Manually recommended resources by educators, complete with teaching notes.
*   **My Learning Space**: Personal tracking for recently viewed items and saved/bookmarked resources.
*   **Teaching Packs (Collections)**: Educators can organize resources into structured teaching packs and share them with specific students.

### 2.0 Lightweight Gamification (ChemBattle)
*   **Chemistry Card Game**: A Unity WebGL integrated turn-based card game.
*   **Educational Mechanics**: Combine element cards (e.g., H₂O, NaCl) to attack, defend, or heal.
*   **Progression System**: Clear waves to earn stat upgrades (Max HP, Attack boosts).
*   **Leaderboard**: Competitive ranking system based on score, turns, and chemistry mastery.

### 3.0 Resource & System Management (Admin Portal)
*   **Content Moderation**: Administrators can monitor all educator-uploaded content.
*   **Lock & Delete Rules**: Admins can lock inappropriate content (hiding it from students) or completely remove violating content with an attached mandatory reason.
*   **User Security Management**: View all registered users (Students, Educators) and manually deactivate/delete accounts.
*   **Analytics Dashboard**: High-level platform metrics including internal views, user counts, and subject distribution.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18+, TypeScript, Tailwind CSS, Vite |
| **Backend** | Python 3.11, FastAPI, Pydantic, SQLAlchemy |
| **Database** | PostgreSQL (hosted on Supabase) |
| **Game Engine**| Unity (WebGL Build) |
| **Deployment** | Vercel (Frontend), Render (Backend) |

## Quick Start (Local Development)

### Start Frontend + Backend Together
From the `qubo` folder:

```powershell
.\start-dev.bat
```

This opens:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8003`
The public access
- https://final-year-project-murex-rho.vercel.app

### Manual Setup
**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
python -m venv .venv
# On Windows: .venv\Scripts\activate
# On Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8003 --reload
```

## Environment Variables (.env)
You will need to set up `.env` files in both `/frontend` and `/backend` directories containing your Supabase URL, Anon Key, and Service Role Key (Backend only).

> **Security Note:** The `SUPABASE_SERVICE_ROLE_KEY` has full administrative access to the database. It must strictly remain in the `backend/.env` file and **never** be exposed to the frontend.

## Project Information

- **Developer**: Yong Chao Juin
- **Institution**: TUNKU ABDUL RAHMAN UNIVERSITY
- **Status**: Deployment Phase (Production)
- **License**: This project is for educational purposes as part of a Final Year Project.
