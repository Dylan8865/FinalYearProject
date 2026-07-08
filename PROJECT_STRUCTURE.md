# Qubo Project Structure Guide

## Complete Directory Tree

```
FinalYearProject/
├── qubo/                          # Main project directory
│   ├── frontend/                  # React TypeScript Frontend
│   │   ├── public/                # Static assets
│   │   ├── src/
│   │   │   ├── components/        # Reusable UI components
│   │   │   │   ├── common/        # Common components (Header, Footer, etc)
│   │   │   │   ├── charts/        # Chart components
│   │   │   │   └── forms/         # Form components
│   │   │   ├── features/          # Feature-specific modules
│   │   │   │   ├── auth/          # Authentication
│   │   │   │   ├── dashboard/     # Dashboard
│   │   │   │   ├── quiz/          # Quiz management
│   │   │   │   ├── analytics/     # Analytics
│   │   │   │   ├── study/         # Study sessions
│   │   │   │   └── profile/       # User profile
│   │   │   ├── pages/             # Page components
│   │   │   ├── hooks/             # Custom React hooks
│   │   │   ├── contexts/          # React contexts
│   │   │   ├── lib/               # Utility libraries
│   │   │   ├── utils/             # Utility functions
│   │   │   ├── types/             # TypeScript type definitions
│   │   │   ├── styles/            # Global styles
│   │   │   ├── App.tsx            # Main app component
│   │   │   └── index.tsx          # Entry point
│   │   ├── package.json           # Dependencies
│   │   ├── tsconfig.json          # TypeScript config
│   │   ├── vite.config.ts         # Vite config
│   │   ├── tailwind.config.js     # Tailwind config
│   │   ├── postcss.config.js      # PostCSS config
│   │   ├── .env.example           # Example environment variables
│   │   └── .gitignore
│   │
│   ├── backend/                   # Python FastAPI Backend
│   │   ├── app/
│   │   │   ├── api/               # API routes
│   │   │   │   └── v1/            # API v1
│   │   │   │       ├── auth/      # Authentication endpoints
│   │   │   │       ├── quiz/      # Quiz endpoints
│   │   │   │       ├── analytics/ # Analytics endpoints
│   │   │   │       ├── study/     # Study session endpoints
│   │   │   │       └── admin/     # Admin endpoints
│   │   │   ├── core/              # Core configuration
│   │   │   │   ├── config.py      # Settings
│   │   │   │   ├── security.py    # Auth & security
│   │   │   │   └── constants.py   # Constants
│   │   │   ├── db/                # Database
│   │   │   │   ├── base.py        # Database base
│   │   │   │   ├── session.py     # Session management
│   │   │   │   └── deps.py        # Dependencies
│   │   │   ├── models/            # SQLAlchemy models
│   │   │   │   ├── user.py
│   │   │   │   ├── quiz.py
│   │   │   │   └── performance.py
│   │   │   ├── schemas/           # Pydantic schemas
│   │   │   │   ├── user.py
│   │   │   │   ├── quiz.py
│   │   │   │   └── analytics.py
│   │   │   ├── services/          # Business logic
│   │   │   │   ├── auth.py
│   │   │   │   ├── quiz.py
│   │   │   │   ├── analytics.py
│   │   │   │   └── ml.py
│   │   │   ├── ml/                # Machine Learning
│   │   │   │   ├── knowledge_tracing/
│   │   │   │   │   ├── bkt.py     # Bayesian Knowledge Tracing
│   │   │   │   │   └── dkt.py     # Deep Knowledge Tracing
│   │   │   │   ├── predictive/
│   │   │   │   │   └── exam_predictor.py
│   │   │   │   └── nlp/
│   │   │   │       ├── quiz_generator.py
│   │   │   │       └── question_refiner.py
│   │   │   ├── utils/             # Utilities
│   │   │   │   ├── logger.py
│   │   │   │   ├── validators.py
│   │   │   │   └── helpers.py
│   │   │   └── main.py            # FastAPI app
│   │   ├── tests/                 # Tests
│   │   │   ├── unit/              # Unit tests
│   │   │   └── integration/       # Integration tests
│   │   ├── requirements.txt       # Python dependencies
│   │   ├── .env.example           # Example environment variables
│   │   └── Dockerfile
│   │
│   ├── database/                  # Database files
│   │   ├── schema.sql             # Database schema
│   │   ├── migrations/            # Alembic migrations
│   │   └── seeds/
│   │       └── initial_data.sql   # Sample data
│   │
│   ├── docs/                      # Documentation
│   │   ├── API.md                 # API documentation
│   │   ├── DATABASE.md            # Database documentation
│   │   └── SETUP.md               # Setup guide
│   │
│   ├── README.md                  # Project overview
│   ├── .gitignore                 # Git ignore rules
│   ├── docker-compose.yml         # Docker compose config
│   └── ARCHITECTURE.md            # Architecture documentation
│
└── [other project files]
    ├── ARCHITECTURE.md            # Wisdom Island architecture
    ├── QUBO_ARCHITECTURE.md       # Qubo architecture
    ├── Qubo Schema                # Database schema file
    ├── AI-Powered Personalized.txt # Qubo project document
    ├── README.md
    └── ...
```

## Module Organization

### Frontend Features
Each feature in `src/features/` follows this pattern:
```
features/feature_name/
├── components/          # Feature-specific components
├── hooks/              # Feature-specific hooks
├── types/              # Feature-specific types
├── services/           # Feature API calls
└── index.ts            # Exports
```

### Backend Modules
Each API module in `app/api/v1/` contains:
```
module_name/
├── routes.py           # FastAPI routes
├── schemas.py          # Request/response schemas
├── models.py           # Database models
└── services.py         # Business logic
```

## File Purpose Summary

### Root Level
- `README.md` - Project overview and quick start
- `.gitignore` - Git configuration
- `docker-compose.yml` - Docker setup
- `ARCHITECTURE.md` - System architecture

### Frontend
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Build configuration
- `tailwind.config.js` - Styling configuration

### Backend
- `requirements.txt` - Python dependencies
- `app/main.py` - FastAPI application entry
- `app/core/config.py` - Application settings
- `app/db/` - Database connections
- `app/ml/` - Machine learning models

### Database
- `schema.sql` - Complete database schema
- `seeds/initial_data.sql` - Sample data

### Documentation
- `docs/API.md` - REST API endpoints
- `docs/DATABASE.md` - Database details
- `docs/SETUP.md` - Installation guide

## Development Workflow

### Working on Frontend
```bash
cd qubo/frontend
npm install          # Once
npm run dev          # Start dev server
npm run build        # Build for production
```

### Working on Backend
```bash
cd qubo/backend
source venv/bin/activate  # Activate environment
pip install -r requirements.txt  # Once
python -m uvicorn app.main:app --reload  # Start dev server
```

### Working with Database
- Schema changes go in `database/schema.sql`
- Use Supabase console or psql to run migrations
- Sample data in `database/seeds/`

## Key Conventions

### Frontend
- Components: PascalCase (`UserCard.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Styles: Tailwind CSS classes
- Type safety: Strict TypeScript

### Backend
- Modules: snake_case (`quiz_service.py`)
- Functions: snake_case (`get_user_quizzes()`)
- Classes: PascalCase (`QuizGenerator`)
- Type hints: Required for all functions

### Naming Conventions
- Branches: `feature/user-auth`, `fix/quiz-bug`
- Commits: `feat: add quiz generation`, `fix: prevent duplicate entries`
- PRs: Descriptive titles with module prefix

---

**Ready to start development!** See SETUP.md for detailed instructions.
