# Qubo - Gamified Interactive Educational Learning Platform

Qubo is a modern educational platform designed for Malaysian SPM students. It combines a **Centralised Resource Hub** (3D models, tutorial videos), a **Lightweight Gamification Module** (ChemBattle Card Game via Unity WebGL), and an **AI-powered Smart Analytics Dashboard** to combat revision fatigue and improve learning efficiency.

---

## 🔗 1. Deployment URLs

*   **Live Web Application (Frontend):** [https://final-year-project-murex-rho.vercel.app](https://final-year-project-murex-rho.vercel.app)
*   **Backend API (FastAPI Docs):** *(Please append `/docs` to your live Render backend URL, e.g., `https://your-backend.onrender.com/docs`)*
*   **Database:** Hosted on [Supabase](https://supabase.com/)

---

## 🔑 2. Login Credentials (For Testing)

To explore the different role-based dashboards, you can use the following test accounts:

**Student Account:**
*   **Email:** `testing@gmail.com`
*   **Password:** `Testing@123`

**Educator Account:**
*   **Email:** `educator@qubo.com` *(Replace with your actual test email)*
*   **Password:** `Testing@123`

**Administrator Account:**
*   **Email:** `admin@qubo.com` *(Replace with your actual test email)*
*   **Password:** `Admin@123`

*(Note: If testing account lockout or password reset features, please use a personal Gmail account during registration to receive the Supabase authentication emails.)*

---

## 💻 3. Required Software and Libraries

To run this project locally, ensure you have the following installed on your machine:

### System Requirements:
*   **Operating System:** Windows 10/11, macOS, or Linux
*   **Browser:** Google Chrome (latest) or Microsoft Edge (with WebGL support enabled)

### Development Tools:
*   **Node.js** (v18 or higher) - For running the React frontend
*   **Python** (v3.11 or higher) - For running the FastAPI backend
*   **Git** - For version control
*   **Unity Hub & Unity Editor** (2022 LTS or newer) - *Only required if modifying the ChemBattle game source code*

### Key Libraries/Dependencies:
*   **Frontend:** React, TypeScript, Vite, React Three Fiber (for 3D models)
*   **Backend:** FastAPI, Uvicorn, scikit-learn, google-generativeai (Gemini)
*   **Database:** Supabase Client

---

## ⚙️ 4. Environment Variables (`.env` Files)

You need to set up environment variables for both the frontend and backend to connect to Supabase and the Gemini API.

### Frontend `.env` (Place in `/qubo/frontend/.env`):
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000/api/v1
```

### Backend `.env` (Place in `/qubo/backend/.env`):
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_google_gemini_api_key
CORS_ORIGINS=http://localhost:5173,https://final-year-project-murex-rho.vercel.app
```

---

## 🚀 5. Local Installation Guide

Follow these steps to run the Qubo platform on your local machine:

### Step 1: Clone the Repository
```bash
git clone <your-github-repo-url>
cd FinalYearProject/qubo
```

### Step 2: Start the Backend (FastAPI)
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The backend will now be running at `http://localhost:8000`*

### Step 3: Start the Frontend (React)
1. Open a **new** terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the required Node modules:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will now be running at `http://localhost:5173`*

### Step 4: Access the Platform
Open your browser and go to `http://localhost:5173`. You can now log in using the test credentials provided above!
