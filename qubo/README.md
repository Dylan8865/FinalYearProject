# Qubo - AI-Powered Personalized Learning Platform

AI-powered personalized learning platform designed for Malaysian SPM students to identify knowledge gaps, receive personalized recommendations, and generate unlimited practice quizzes using NLP technology.

## Project Structure

```
qubo/
├── frontend/              # React TypeScript application
├── backend/               # Python FastAPI server
├── database/              # Database schema & migrations
├── docs/                  # Documentation
└── README.md              # This file
```

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### Database
Follow setup instructions in docs/DATABASE.md

## Project Information

- **Author**: Benjamin Yee Jun Yi
- **Supervisor**: Ts. Ten Shai Cheong
- **Institution**: TUNKU ABDUL RAHMAN UNIVERSITY
- **Academic Year**: 2025/26
- **Status**: In Development

## Features

- User Authentication & Profile Management (FR 1.1-1.10)
- Performance Tracking & Analytics Dashboard (FR 2.1-2.10)
- AI-Powered Quiz Generation (FR 3.1-3.10)
- Predictive Analytics & Risk Detection
- Spaced Repetition Algorithm (SM-2)
- Personalized Learning Recommendations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18+, TypeScript, Tailwind CSS, Vite |
| Backend | Python 3.8+, FastAPI |
| Database | PostgreSQL (Supabase) |
| ML/AI | TensorFlow, HuggingFace Transformers, Scikit-learn |
| NLP | Google Gemini Flash API, T5 Transformer |

## Documentation

- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Setup & Installation](docs/SETUP.md)
- [Architecture Documentation](QUBO_ARCHITECTURE.md)

## Getting Started

See [SETUP.md](docs/SETUP.md) for detailed installation instructions.

## License

This project is for educational purposes as part of the Final Year Project at TUNKU ABDUL RAHMAN UNIVERSITY.
