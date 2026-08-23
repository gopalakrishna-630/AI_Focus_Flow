from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    tasks = db.relationship('Task', backref='user', lazy=True)
    sessions = db.relationship('StudySession', backref='user', lazy=True)
    study_plans = db.relationship('AIStudyPlan', backref='user', lazy=True)
    questions = db.relationship('AIQuestion', backref='user', lazy=True)

class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Admin(db.Model):
    __tablename__ = 'admins'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)

class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    subject = db.Column(db.String(100))
    priority = db.Column(db.String(50))
    due_date = db.Column(db.DateTime)
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "subject": self.subject,
            "priority": self.priority,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "completed": self.completed,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class StudySession(db.Model):
    __tablename__ = 'study_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id')) # Could be students.id depending on how old app works, wait, old app used students for login but sessions refer to 'users' table or just stores student_id. Let's look at the old sql.
    # In old db: CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, focus_score REAL, distraction_count INTEGER, duration REAL, analysis_summary TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))
    # Wait, the old app used "students" table for student login (`session["student_id"]`), and inserted into `sessions` table. It didn't define a foreign key to students, it defined it to 'users' which was unused!
    # Let's fix this to allow user_id to point to whatever. I won't define a strict FK for old sessions table to keep it compatible with old sqlite if needed, but for PostgreSQL I will link it to users.
    
    subject = db.Column(db.String(100))
    topic = db.Column(db.String(200))
    planned_duration = db.Column(db.Integer)
    actual_duration = db.Column(db.Integer)
    focus_score = db.Column(db.Float)
    distractions = db.Column(db.Integer)
    completed = db.Column(db.Boolean, default=False)
    analysis_summary = db.Column(db.Text)
    started_at = db.Column(db.DateTime)
    ended_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "subject": self.subject,
            "topic": self.topic,
            "planned_duration": self.planned_duration,
            "actual_duration": self.actual_duration,
            "focus_score": self.focus_score,
            "distractions": self.distractions,
            "completed": self.completed,
            "analysis_summary": self.analysis_summary,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class AIStudyPlan(db.Model):
    __tablename__ = 'ai_study_plans'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    session_id = db.Column(db.Integer, db.ForeignKey('study_sessions.id'))
    title = db.Column(db.String(200))
    objective = db.Column(db.Text)
    duration = db.Column(db.Integer)
    difficulty = db.Column(db.String(50))
    focus_strategy = db.Column(db.Text)
    recommendation = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "objective": self.objective,
            "duration": self.duration,
            "difficulty": self.difficulty,
            "focus_strategy": self.focus_strategy,
            "recommendation": self.recommendation
        }

class AIQuestion(db.Model):
    __tablename__ = 'ai_questions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    study_plan_id = db.Column(db.Integer, db.ForeignKey('ai_study_plans.id'))
    subject = db.Column(db.String(100))
    topic = db.Column(db.String(200))
    question = db.Column(db.Text, nullable=False)
    difficulty = db.Column(db.String(50))
    hint = db.Column(db.Text)
    expected_answer = db.Column(db.Text)
    student_answer = db.Column(db.Text)
    is_correct = db.Column(db.Boolean)
    score = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "question": self.question,
            "difficulty": self.difficulty,
            "hint": self.hint,
            "expected_answer": self.expected_answer,
            "student_answer": self.student_answer,
            "is_correct": self.is_correct,
            "score": self.score
        }
