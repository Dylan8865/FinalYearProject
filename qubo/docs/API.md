# API Documentation

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication Endpoints

### User Registration
- **POST** `/auth/register`
- **Request**:
  ```json
  {
    "email": "student@example.com",
    "password": "secure_password",
    "username": "student_username",
    "role": "student"
  }
  ```
- **Response**: `200 OK` with user profile

### User Login
- **POST** `/auth/login`
- **Request**:
  ```json
  {
    "email": "student@example.com",
    "password": "secure_password"
  }
  ```
- **Response**: Access token, user profile

### Get Profile
- **GET** `/auth/profile`
- **Auth**: Required
- **Response**: User profile details

### Update Profile
- **PUT** `/auth/profile`
- **Auth**: Required
- **Request**: Profile updates
- **Response**: Updated profile

## Quiz Endpoints

### Generate Quiz
- **POST** `/quiz/generate`
- **Auth**: Required
- **Request**: File upload (textbook image/PDF)
- **Response**: Generated quiz

### Get Quiz Library
- **GET** `/quiz/library`
- **Auth**: Required
- **Response**: List of user's quizzes

### Attempt Quiz
- **POST** `/quiz/{quiz_id}/attempt`
- **Auth**: Required
- **Request**: Quiz answers
- **Response**: Score and feedback

### Get Quiz Results
- **GET** `/quiz/{quiz_id}/results`
- **Auth**: Required
- **Response**: Quiz results and analytics

## Analytics Endpoints

### Dashboard
- **GET** `/analytics/dashboard`
- **Auth**: Required
- **Response**: Dashboard metrics

### Performance by Subject
- **GET** `/analytics/performance/{subject}`
- **Auth**: Required
- **Response**: Subject-specific analytics

### Predictions
- **GET** `/analytics/predictions/exam-score`
- **Auth**: Required
- **Response**: Predicted exam score and risk level

### Recommendations
- **GET** `/analytics/recommendations`
- **Auth**: Required
- **Response**: Personalized study recommendations

## Error Codes
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

For detailed endpoint specifications, see the backend API documentation.
