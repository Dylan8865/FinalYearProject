# Qubo - AI-Powered Personalized Learning Platform
## Project Architecture Documentation

---

## 1. Project Overview

**Project Name**: Qubo (AI-Powered Personalized Learning Platform)  
**Target Users**: Malaysian SPM Students (Form 4-5)  
**Focus**: Help SPM students identify knowledge gaps, get personalized study recommendations, and generate unlimited practice quizzes using AI  
**Academic Context**: TUNKU ABDUL RAHMAN UNIVERSITY - Bachelor of Software Engineering (Honours)  
**Supervisor**: Ts. Ten Shai Cheong

---

## 2. Problem Statement

### 2.1 Core Problems
1. **Unable to Identify Knowledge Gaps** - Students discover weaknesses too late (after exam results)
2. **High Academic Stress (49.5% moderate-high stress)** - Lack of personalized support in one-size-fits-all classrooms
3. **Limited Access to Quality Practice Materials** - Expensive resources, not tailored to individual needs/textbooks

### 2.2 Solutions Offered by Qubo
- **Intelligent Performance Tracking** - Continuous monitoring of learning patterns
- **Personalized Recommendations** - ML-driven study strategies based on learning style
- **NLP-Powered Quiz Generation** - Auto-generate quizzes from any textbook content

---

## 3. System Architecture

### 3.1 Three Core Modules

```
Qubo Platform
├── Module 1: User Authentication & Profile Management
├── Module 2: Performance Tracking & Analytics Dashboard
└── Module 3: AI-Powered Quiz Generation & Practice Management
```

#### **Module 1: User Authentication & Profile Management**
- **Purpose**: User registration, authentication, role-based access
- **Key Features**:
  - Secure login/registration (OAuth-based)
  - User role management (Student, Educator, Parent)
  - Learning style assessment (Visual, Auditory, Kinesthetic)
  - Privacy and data security controls
  - Profile customization

#### **Module 2: Performance Tracking & Analytics Dashboard**
- **Purpose**: Monitor learning patterns and provide data-driven insights
- **Key Features**:
  - Quiz performance tracking
  - Study session duration monitoring
  - Topic difficulty ratings
  - Pomodoro-style time tracking
  - Subject-wise performance visualization
  - Learning velocity metrics
  - Peer comparison (anonymized)
  - **Predictive Analytics**: Forecast exam performance & early risk alerts

#### **Module 3: AI-Powered Quiz Generation & Practice Management**
- **Purpose**: Generate unlimited practice quizzes from textbook content
- **Key Features**:
  - NLP-powered automatic quiz generation
  - Support for image/PDF uploads of textbook pages
  - Multiple question types (MCQ, fill-in-blank, short answer)
  - Spaced repetition scheduling (SM-2 algorithm)
  - Personal quiz library management
  - Performance tracking per quiz

---

## 4. Technology Stack

### 4.1 Frontend
```
Framework: React
Language: TypeScript (optional, but recommended)
Styling: Tailwind CSS (recommended)
State Management: Redux or Context API
UI Components: Material-UI or custom components
Charting: Chart.js or D3.js (for analytics visualization)
```

### 4.2 Backend
```
Runtime: Python 3.8+
Web Framework: Flask or FastAPI
Machine Learning: TensorFlow
NLP Library: HuggingFace Transformers
API Gateway: Google Gemini Flash API (for quiz generation)
```

### 4.3 Database
```
Primary DB: PostgreSQL (via Supabase)
Real-time Features: Supabase (built-in real-time sync)
Cache Layer: Redis (for performance optimization)
```

### 4.4 AI/ML Components
```
NLP Models:
- T5 (Text-to-Text Transfer Transformer) for question generation
- HuggingFace Transformers library
- Google Gemini Flash API (for advanced quiz generation)

ML Models for Analytics:
- Bayesian Knowledge Tracing (BKT)
- Deep Knowledge Tracing (DKT) with LSTM
- Gradient Boosting/Random Forest (for predictive analytics)

Learning Algorithm:
- SM-2 Spaced Repetition Algorithm
```

### 4.5 Deployment & DevOps
```
Frontend Hosting: Vercel or Netlify
Backend Hosting: Heroku, AWS, or Google Cloud
Database: Supabase (serverless PostgreSQL)
CI/CD: GitHub Actions or GitLab CI
Container: Docker (optional)
```

---

## 5. Database Schema

### 5.1 Core Tables

#### **users**
```sql
- id (PK)
- email (UNIQUE)
- password_hash
- full_name
- role (student, educator, parent)
- learning_style (visual, auditory, kinesthetic)
- created_at
- updated_at
```

#### **students**
```sql
- id (PK, FK to users)
- grade_level (Form 4, Form 5)
- school_name
- subjects (JSON array of selected subjects)
- target_grade_point (GPMP target)
- profile_completion_percentage
```

#### **quiz**
```sql
- id (PK)
- student_id (FK to users)
- title
- topic
- subject (e.g., Mathematics, Physics)
- source_type (generated, pre-made)
- generated_from_textbook_content (TEXT)
- difficulty_level
- total_questions
- created_at
- updated_at
```

#### **questions**
```sql
- id (PK)
- quiz_id (FK to quiz)
- question_text
- question_type (MCQ, fill_blank, short_answer)
- correct_answer
- options (JSON array for MCQ)
- difficulty_rating (1-5)
- blooms_level (remember, understand, apply, analyze, evaluate, create)
```

#### **quiz_attempts**
```sql
- id (PK)
- student_id (FK to users)
- quiz_id (FK to quiz)
- score
- percentage_correct
- time_taken_seconds
- answers_submitted (JSON with responses)
- attempt_number
- attempted_at
```

#### **performance_tracking**
```sql
- id (PK)
- student_id (FK to users)
- subject
- topic
- average_score
- quiz_attempts_count
- mastery_level (1-100%)
- last_practiced_at
- estimated_retention (based on spaced repetition)
```

#### **study_sessions**
```sql
- id (PK)
- student_id (FK to users)
- subject
- topic
- start_time
- end_time
- session_type (pomodoro, free_study)
- focus_quality (1-5 self-rated)
- distractions_count
```

#### **predictive_analytics**
```sql
- id (PK)
- student_id (FK to users)
- predicted_exam_score
- predicted_grade (A+, A, A-, B+, etc.)
- confidence_score (0-100%)
- risk_level (low, medium, high)
- recommended_study_hours_per_week
- top_weak_areas (JSON array of topics)
- prediction_date
```

#### **learning_recommendations**
```sql
- id (PK)
- student_id (FK to users)
- recommendation_type (study_strategy, topic_focus, resource)
- subject
- topic
- recommendation_text
- priority_level (1-10)
- resource_link (URL to YouTube, article, etc.)
- created_at
- accepted_by_student (boolean)
```

#### **spaced_repetition_schedule**
```sql
- id (PK)
- student_id (FK to users)
- quiz_id (FK to quiz)
- topic
- next_review_date
- review_interval (in days)
- ease_factor (SM-2 algorithm parameter)
- review_count
- last_reviewed_at
```

---

## 6. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        WEB CLIENT (React)                     │
│  - Student Dashboard - Analytics - Quiz Interface - Uploads  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  API Gateway │
                    │   (REST/GQL) │
                    └──────┬───────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
┌───▼──────┐      ┌───────▼────────┐    ┌──────▼──────┐
│   Auth   │      │  Analytics &   │    │  Quiz Gen   │
│  Service │      │  Prediction ML │    │  NLP Engine │
│(FastAPI) │      │   (TensorFlow) │    │(Transformers│
└──────────┘      └────────────────┘    └─────────────┘
    │                      │                      │
    └──────────────────────┼──────────────────────┘
                           │
                    ┌──────▼──────────┐
                    │   PostgreSQL    │
                    │   (Supabase)    │
                    └─────────────────┘
                           │
        ┌──────────────────┼─────────────────┐
        │                  │                 │
   ┌────▼──┐          ┌────▼────┐      ┌───▼─────┐
   │ Users │          │ Quizzes │      │Analytics│
   └───────┘          └─────────┘      └─────────┘
```

---

## 7. Data Flow

### 7.1 Quiz Generation Flow
```
Student uploads textbook image/PDF
        ↓
OCR Processing (Extract text)
        ↓
Text Preprocessing (Clean, normalize)
        ↓
NLP Model (T5/Gemini API) - Extract key concepts
        ↓
Question Generation (MCQ, fill-blank, short-answer)
        ↓
Distractor Generation (Plausible wrong answers)
        ↓
Quiz stored in database
        ↓
Student practices quiz
```

### 7.2 Analytics & Prediction Flow
```
Student completes quiz
        ↓
Performance recorded (score, time, difficulty)
        ↓
ML Engine processes data
        ↓
Update Knowledge State (Bayesian/Deep Knowledge Tracing)
        ↓
Calculate Mastery Level & Learning Velocity
        ↓
Run Predictive Model (LSTM/Gradient Boosting)
        ↓
Generate Risk Alert (if needed)
        ↓
Dashboard updated with visualizations
        ↓
Personalized recommendations generated
```

### 7.3 Spaced Repetition Flow
```
Quiz completed
        ↓
Apply SM-2 Algorithm
        ↓
Calculate next review date & ease factor
        ↓
Schedule reminder
        ↓
Student reviews on scheduled date
        ↓
Update ease factor based on difficulty rating
        ↓
Recalculate next review date
```

---

## 8. Key Algorithms

### 8.1 SM-2 Spaced Repetition Algorithm
```
I(n) = I(n-1) × EF

Where:
- I(n) = interval between reviews in days
- I(n-1) = previous interval
- EF = ease factor (difficulty modifier)

EF is updated after each review:
EF := EF + (0.1 - (5 - q) × (0.08 + (5 - q) × 0.02))

Where q = student's difficulty rating (0-5)
```

### 8.2 Bayesian Knowledge Tracing (BKT)
```
Models student's knowledge state as a hidden variable
P(K_t) = Probability student has mastered concept at time t

Updates based on quiz performance:
P(K_t+1 | correct answer) = P(S|K) × P(K_t) / P(correct)
Where:
- P(S|K) = slip probability (knew but got wrong)
- P(G|¬K) = guess probability (didn't know but got right)
```

### 8.3 Learning Velocity Calculation
```
Velocity = (Recent_Performance - Historical_Average) / Time_Period

Shows if student is improving or declining
Used for risk assessment and recommendation prioritization
```

---

## 9. Feature Breakdown by Module

### 9.1 Authentication Module (Flask/FastAPI)
```
Endpoints:
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- GET /auth/profile
- PUT /auth/profile/update
- POST /auth/learning-style-assessment
```

### 9.2 Analytics Module (TensorFlow + Flask/FastAPI)
```
Endpoints:
- GET /analytics/dashboard
- GET /analytics/performance/{subject}
- GET /analytics/learning-velocity
- GET /analytics/peer-comparison
- GET /analytics/predictions/exam-score
- GET /analytics/recommendations
- POST /analytics/tracking/session-start
- POST /analytics/tracking/session-end
```

### 9.3 Quiz Generation Module (NLP + Flask/FastAPI)
```
Endpoints:
- POST /quiz/generate (accepts file upload)
- GET /quiz/library
- POST /quiz/{id}/attempt
- GET /quiz/{id}/results
- DELETE /quiz/{id}
- GET /quiz/{id}/spaced-repetition-schedule
```

---

## 10. UI/UX Components

### 10.1 Student Dashboard
- Performance overview cards (subjects, scores, grades)
- Learning velocity chart
- Calendar view of study sessions
- Quick stats (total quizzes, average score, streak)
- Upcoming reviews (spaced repetition)

### 10.2 Analytics Dashboard
- Subject-wise performance (bar/line charts)
- Topic mastery heatmap
- Time spent vs. performance correlation
- Exam score prediction (with confidence interval)
- Risk alerts (red/yellow/green indicators)
- Peer performance comparison (anonymized)

### 10.3 Quiz Generator Interface
- File upload area (drag & drop)
- OCR preview
- Quiz customization (difficulty, question count, type)
- Generated quiz review & edit
- Quiz difficulty calibration

### 10.4 Practice Quiz Interface
- Question display (clear formatting)
- Timer (optional)
- Progress indicator
- Answer submission
- Instant feedback (correct/incorrect with explanation)
- Results summary

---

## 11. Development Methodology

**Approach**: Agile Software Development (Iterative Sprints)

### Sprint Structure:
1. **Sprint 1-2**: User Authentication Module
   - User registration/login
   - Profile management
   - Learning style assessment

2. **Sprint 3-4**: Performance Tracking & Analytics
   - Data collection infrastructure
   - Analytics dashboard UI
   - Basic ML models (BKT)

3. **Sprint 5-6**: Quiz Generation Module
   - OCR integration
   - NLP pipeline
   - Question generation

4. **Sprint 7-8**: Predictive Analytics & Recommendations
   - Prediction models (LSTM)
   - Risk alerts
   - Personalized recommendations

5. **Sprint 9-10**: Integration & Testing
   - End-to-end testing
   - Performance optimization
   - User acceptance testing

---

## 12. Performance & Scalability Considerations

### 12.1 Optimization Strategies
- **Caching**: Redis for frequently accessed data (student profiles, analytics)
- **Database Indexing**: Index on (student_id, subject, created_at)
- **Async Processing**: Use task queues (Celery) for heavy ML computations
- **CDN**: Static assets via CDN
- **API Rate Limiting**: Prevent abuse

### 12.2 Scalability
- **Horizontal Scaling**: Load balancer for multiple API instances
- **Database Sharding**: If user base exceeds 1M+ students
- **Microservices**: Separate analytics and quiz generation services

---

## 13. Security Considerations

- **Authentication**: OAuth 2.0 or JWT tokens
- **Data Encryption**: HTTPS (TLS/SSL), encrypted at-rest
- **Database**: RLS (Row-Level Security) policies in Supabase
- **Input Validation**: Sanitize all user inputs (prevent SQL injection, XSS)
- **Privacy**: GDPR/PDPA compliance, data anonymization for peer comparison
- **Audit Logging**: Track all student progress modifications

---

## 14. Deployment Environment

```
Development:
- Local: React dev server + Flask dev server + local PostgreSQL

Staging:
- Vercel (frontend) + Heroku (backend) + Supabase (database)

Production:
- Vercel/Netlify (frontend) + Google Cloud Run/AWS Lambda (backend) + Supabase (database)
- CDN for static assets
- Monitoring: Sentry, DataDog, or New Relic
```

---

## 15. Testing Strategy

### 15.1 Unit Testing
- Frontend: Jest + React Testing Library
- Backend: pytest for Python
- Coverage target: 80%+

### 15.2 Integration Testing
- API integration tests (Postman/Jest)
- Database integration tests
- ML model evaluation tests

### 15.3 End-to-End Testing
- Selenium or Cypress for user workflows
- Full system testing with real data

### 15.4 Performance Testing
- Load testing (k6, JMeter)
- Database query optimization
- API response time monitoring

---

## 16. Target Metrics & Success Criteria

### 16.1 Student Outcomes
- Improve SPM examination performance (target: +15% average)
- Increase study engagement (target: 4+ hours/week sustained usage)
- Reduce exam anxiety (survey-based)

### 16.2 System Performance
- API response time < 500ms (p95)
- Dashboard load time < 3 seconds
- Quiz generation < 2 minutes
- Quiz accuracy > 85% (educator evaluation)

### 16.3 Adoption
- 1000+ active student users in Year 1
- 50%+ monthly retention rate
- Positive educator feedback (4+ / 5 stars)

---

## 17. Future Enhancements

1. **Mobile App** (React Native/Flutter)
2. **Educator Portal** - Class management, student monitoring
3. **Parent Portal** - Student progress notifications
4. **Adaptive Difficulty** - Dynamic question difficulty adjustment
5. **Real-time Collaboration** - Study groups, peer learning
6. **Video Content Integration** - Auto-curated YouTube/educational videos
7. **Voice-based Quiz** - Spoken answers (for auditory learners)
8. **Advanced Gamification** - Achievement badges, leaderboards (stress-relief focused)
9. **Integration with LMS** - Google Classroom, Canvas
10. **Export Reports** - PDF/Excel performance summaries for educators

---

## 18. Project Timeline (Based on FYP Schedule)

| Phase | Duration | Completion |
|-------|----------|-----------|
| Requirements & Literature Review | 8 weeks | Dec 2025 |
| System Design & Architecture | 3 weeks | Dec 2025 |
| Module 1 Development (Auth) | 4 weeks | Apr 2026 |
| Module 2 Development (Analytics) | 3 weeks | May 2026 |
| Module 3 Development (Quiz Gen) | 4 weeks | May 2026 |
| Integration & Testing | 2 weeks | June 2026 |
| Final Report & Submission | 2 weeks | Aug 2026 |

---

## 19. Risk Management

| Risk | Impact | Mitigation |
|------|--------|-----------|
| NLP Quiz Quality | High | Pre-test questions, human review, iterate on model |
| ML Model Accuracy | High | Collect sufficient training data, use established algorithms |
| Scale to 1000+ users | Medium | Design for scalability, use Supabase free tier initially |
| API Rate Limits (Gemini) | Medium | Cache results, use fallback models |
| Data Privacy Issues | High | Implement RLS, encrypt data, regular security audits |

---

## 20. Key Dependencies & Tools

```
Frontend Stack:
- React 18+
- TypeScript
- Tailwind CSS
- Chart.js / D3.js
- Axios (HTTP client)

Backend Stack:
- Python 3.8+
- FastAPI / Flask
- TensorFlow 2.x
- HuggingFace Transformers
- Scikit-learn
- Pandas, NumPy

Database:
- PostgreSQL (via Supabase)
- Redis (optional, for caching)

External APIs:
- Google Gemini Flash API
- Supabase SDK

DevTools:
- Git & GitHub
- Docker (optional)
- Postman (API testing)
- GitHub Actions (CI/CD)
```

---

## 21. Comparative Advantage vs. Competitors

| Feature | Kahoot | Quizizz | Duolingo | **Qubo** |
|---------|--------|---------|----------|---------|
| Predictive Analytics | ✖️ | Limited | ✖️ | ✔️ Advanced |
| AI Quiz Generation | ✖️ | ✖️ | ✔️ | ✔️ From Textbooks |
| SPM-Specific | ✖️ | ✖️ | ✖️ | ✔️ Yes |
| Personalized Recommendations | Limited | Limited | ✔️ | ✔️ Learning Style-based |
| Spaced Repetition | ✖️ | ✖️ | ✔️ | ✔️ SM-2 Algorithm |
| Learning Analytics | Basic | Basic | ✖️ | ✔️ Comprehensive |
| Gamification | ✔️ | ✔️ | ✔️ | ✔️ Stress-Relief Focused |

---

## 22. Conclusion

Qubo is positioned as a **comprehensive, AI-driven learning platform** that uniquely addresses the challenges faced by Malaysian SPM students. By integrating intelligent analytics, predictive insights, NLP-powered content generation, and personalized learning pathways, Qubo offers a transformative approach to examination preparation that goes beyond existing platforms.

The architecture is designed to be:
- **Scalable**: From initial 100 to 100,000+ users
- **Secure**: Compliant with data privacy regulations
- **Maintainable**: Clear separation of concerns, modular design
- **Extensible**: Foundation for future features and enhancements

---

**Project Author**: Benjamin Yee Jun Yi  
**Supervisor**: Ts. Ten Shai Cheong  
**Institution**: TUNKU ABDUL RAHMAN UNIVERSITY OF MANAGEMENT AND TECHNOLOGY  
**Academic Year**: 2025/26
