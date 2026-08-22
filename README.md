# AI FocusFlow - Intelligent Productivity Platform

## Overview
AI FocusFlow is a modern, intelligent web application designed to help students improve their learning efficiency and focus. By combining advanced computer vision techniques with Large Language Models (Google Gemini), the platform provides real-time attention monitoring, drowsiness detection, personalized study planning, and AI-evaluated subjective quizzes.

## Architecture

The project has been refactored into a modern decoupled architecture:
- **Frontend**: React, Vite, CSS Modules.
- **Backend**: Python, Flask, Flask-SQLAlchemy, Flask-Migrate.
- **Database**: PostgreSQL hosted on Supabase.
- **AI/ML**: 
  - **Generative AI**: Google Gemini (`google-genai`) for generating tailored study plans and subjective evaluations.
  - **Computer Vision**: OpenCV, MediaPipe, DeepFace for real-time focus, emotion, and distraction detection.

## Project Structure

```text
.
├── backend/
│   ├── ai/
│   │   ├── emotion_detector.py
│   │   ├── focus_detector.py
│   │   └── gemini_service.py        # Gemini Integration for study plans & evaluations
│   ├── analytics/                   # Focus metric aggregation and analytics
│   ├── migrations/                  # Alembic DB Migrations for PostgreSQL
│   ├── app.py                       # Main Flask API Application
│   ├── database.py                  # SQLAlchemy ORM Models
│   ├── requirements.txt
│   └── .env                         # Backend Environment Variables
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/              # Reusable React components (StatCard, Toast, etc.)
│   │   ├── context/                 # React Context (AuthContext)
│   │   ├── pages/                   # Main Views (Dashboard, StudySetup, StudySession, Profile)
│   │   ├── services/                # API communication layers
│   │   ├── styles/                  # Application Stylesheets
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
```

## Key Features

1. **AI-Powered Study Planning**: Enter a topic you want to learn, and Gemini will break it down into a highly-focused session plan with estimated times and customized modules.
2. **Real-time Focus Monitoring**: While you study, our Computer Vision engine monitors your webcam feed to track eye-contact, head posture, and drowsiness to calculate a real-time Focus Score.
3. **Subjective AI Evaluations**: At the end of a session, take a personalized knowledge check. You can answer in free text, and Gemini will contextually evaluate your response for accuracy and give you targeted feedback.
4. **Comprehensive Analytics Dashboard**: View your historical performance, distraction times, and aggregate focus scores over all sessions.

## Setup & Local Development

### 1. Database Configuration (Supabase)
Create a PostgreSQL database on [Supabase](https://supabase.com/). You will need the database connection URL.

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[db_name]
GEMINI_API_KEY=your_gemini_api_key_here
FLASK_SECRET_KEY=your_random_secret_key
```
*(Make sure to URL-encode special characters in your database password)*

Run database migrations:
```bash
flask db upgrade
```

Start the Flask server:
```bash
python app.py
```
*(The backend will run on `http://localhost:5000`)*

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory (optional, if defaults change):
```env
VITE_API_URL=http://localhost:5000
```

Start the Vite development server:
```bash
npm run dev
```

## Deployment
- **Frontend**: Can be deployed to Vercel, Netlify, or Render as a static site.
- **Backend**: Can be deployed to Render, Railway, or Heroku. Ensure you configure all environment variables on the production server.
- **Database**: Ensure your Supabase database is properly secured and connection strings are updated in your production backend environment.
