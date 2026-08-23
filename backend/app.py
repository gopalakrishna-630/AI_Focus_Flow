from flask import Flask, request, jsonify, session
from functools import wraps
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

import os
import re

from utils.json_store import load_sessions, save_session
from ai.session_analyzer import analyze_session
import requests
from ai.session_analyzer import analyze_session
from ai.emotion_detector import detect_emotion
from ai.gemini_service import generate_study_plan, clear_doubt, generate_quiz, generate_study_content, generate_single_page_content, generate_page_quiz
from dotenv import load_dotenv
load_dotenv()

from flask_migrate import Migrate
from database import db, User, Student, Admin, Task, StudySession, AIStudyPlan, AIQuestion


from flask_cors import CORS

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", os.urandom(24))
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
migrate = Migrate(app, db)


ML_SERVICE_URL = os.environ.get("ML_SERVICE_URL", "http://localhost:5001")


@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "student_id" not in session:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "admin_id" not in session:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function

def get_user_sessions():
    if "student_id" not in session:
        return []
    
    rows = StudySession.query.filter_by(user_id=session["student_id"]).all()
    
    user_sessions = []
    for r in rows:
        user_sessions.append({
            "id": r.id,
            "focus_score": r.focus_score,
            "distractions": r.distractions,
            "duration": r.actual_duration or r.planned_duration or 0,
            "analysis_summary": r.analysis_summary,
            "date": r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else "",
            "emotion": detect_emotion(r.focus_score or 0, True)
        })
    return user_sessions

@app.route("/api/auth/student_login", methods=["POST"])
def student_login():
    data = request.json or request.form
    identifier = data.get("identifier", "").strip()
    password = data.get("password", "")
    
    if not identifier or not password:
        return jsonify({"error": "Please provide both your identifier and password."}), 400
        
    user = Student.query.filter((Student.email == identifier) | (Student.username == identifier)).first()
    
    if user and check_password_hash(user.password, password):
        session["student_id"] = user.id
        session["student_username"] = user.username
        return jsonify({
            "status": "success",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        })
    return jsonify({"error": "Invalid credentials."}), 401

@app.route("/api/auth/register_student", methods=["POST"])
def register_student():
    data = request.json or request.form
    email = data.get("email", "").strip()
    phone = data.get("phone", "").strip()
    username = data.get("username", "").strip()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")
    
    if not all([email, phone, username, password, confirm_password]):
        return jsonify({"error": "All fields are required."}), 400
        
    email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    if not re.match(email_regex, email):
        return jsonify({"error": "Invalid email format."}), 400
        
    if password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), 400
        
    if len(password) < 8 or not any(char.isdigit() for char in password) or not any(char.isalpha() for char in password):
        return jsonify({"error": "Password must be at least 8 characters long and contain both letters and numbers."}), 400
    
    existing_email = Student.query.filter_by(email=email).first()
    if existing_email:
        return jsonify({"error": "Email is already registered."}), 400
        
    existing_username = Student.query.filter_by(username=username).first()
    if existing_username:
        return jsonify({"error": "Username is already taken."}), 400
        
    hashed = generate_password_hash(password)
    try:
        new_student = Student(username=username, email=email, phone=phone, password=hashed)
        db.session.add(new_student)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Error registering student."}), 500
    return jsonify({"status": "success", "message": "Registration successful"})

@app.route("/api/auth/admin_login", methods=["POST"])
def admin_login():
    data = request.json or request.form
    username = data.get("username", "").strip()
    password = data.get("password", "")
    
    if not username or not password:
        return jsonify({"error": "Please provide both username and password."}), 400
    
    admin_user = Admin.query.filter_by(username=username).first()
    
    if admin_user and check_password_hash(admin_user.password, password):
        session["admin_id"] = admin_user.id
        session["admin_username"] = admin_user.username
        return jsonify({
            "status": "success",
            "admin": {
                "id": admin_user.id,
                "username": admin_user.username
            }
        })
    return jsonify({"error": "Invalid admin credentials."}), 401

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"status": "success"})

@app.route("/api/auth/me", methods=["GET"])
def get_me():
    if "student_id" in session:
        return jsonify({
            "role": "student",
            "id": session["student_id"],
            "username": session["student_username"]
        })
    elif "admin_id" in session:
        return jsonify({
            "role": "admin",
            "id": session["admin_id"],
            "username": session["admin_username"]
        })
    return jsonify({"error": "Not authenticated"}), 401

@app.route("/api/student/delete_account", methods=["POST"])
@login_required
def delete_account():
    student_id = session.get("student_id")
    if student_id:
        StudySession.query.filter_by(user_id=student_id).delete()
        Student.query.filter_by(id=student_id).delete()
        db.session.commit()
        session.clear()
        return jsonify({"status": "success", "message": "Account deleted"})
    return jsonify({"error": "Not authenticated"}), 401

@app.route("/api/admin/students", methods=["GET"])
@admin_required
def api_admin_students():
    students_data = Student.query.all()
    
    result = []
    from sqlalchemy import func
    for s in students_data:
        stats = db.session.query(
            func.avg(StudySession.focus_score).label('avg_focus'),
            func.count(StudySession.id).label('total_sessions'),
            func.sum(StudySession.distractions).label('total_dist')
        ).filter(StudySession.user_id == s.id).first()
        
        avg_focus = round(stats.avg_focus, 1) if stats.avg_focus else 0.0
        total_sessions = stats.total_sessions if stats.total_sessions else 0
        total_alerts = stats.total_dist if stats.total_dist else 0
        
        status = "Offline"
        if total_sessions > 0:
            if avg_focus >= 70:
                status = "Focused"
            elif avg_focus >= 40:
                status = "OK"
            else:
                status = "Distracted"
                
        result.append({
            "id": s.id,
            "name": s.username,
            "email": s.email,
            "average_focus": avg_focus,
            "total_sessions": total_sessions,
            "total_alerts": total_alerts,
            "status": status,
            "avatar": f"https://ui-avatars.com/api/?name={s.username}&background=random"
        })
    return jsonify(result)

@app.route("/api/admin/students/<int:student_id>/sessions", methods=["GET"])
@admin_required
def api_admin_student_sessions(student_id):
    sessions_db = StudySession.query.filter_by(user_id=student_id).order_by(StudySession.created_at.asc()).all()
    
    sessions_list = []
    grouped_by_day = {}
    grouped_by_month = {}
    grouped_by_year = {}
    
    for s in sessions_db:
        date_str = str(s.created_at).split()[0] if s.created_at else "Unknown"
        duration = s.actual_duration or s.planned_duration or 0
        focus_score = s.focus_score if s.focus_score else 0
        alerts = s.distractions if s.distractions else 0

        sessions_list.append({
            "id": s["id"],
            "date": date_str,
            "duration": f"{round(duration / 60)}m",
            "average_focus": round(focus_score, 1),
            "alerts_triggered": alerts
        })

        if date_str != "Unknown":
            month_str = date_str[:7]
            year_str = date_str[:4]
            for key, group in [(date_str, grouped_by_day), (month_str, grouped_by_month), (year_str, grouped_by_year)]:
                if key not in group:
                    group[key] = {"totalFocus": 0, "totalSessions": 0, "totalDistractions": 0, "totalDuration": 0}
                group[key]["totalFocus"] += focus_score
                group[key]["totalSessions"] += 1
                group[key]["totalDistractions"] += alerts
                group[key]["totalDuration"] += duration

    def populate_wise_data(grouped_dict):
        output_list = []
        for key in sorted(grouped_dict.keys(), reverse=True):
            info = grouped_dict[key]
            if info["totalSessions"] > 0:
                avg_f = round(info["totalFocus"] / info["totalSessions"], 1)
                emo = "Focused" if avg_f >= 70 else ("OK" if avg_f >= 40 else "Distracted")
                output_list.append({
                    "date": key,
                    "avgFocus": avg_f,
                    "sessions": info["totalSessions"],
                    "distractions": info["totalDistractions"],
                    "avgDuration": round((info["totalDuration"] / info["totalSessions"]) / 60) if info["totalDuration"] else 0,
                    "emotion": emo
                })
        return output_list

    return jsonify({
        "sessions": sessions_list,
        "day_wise_data": populate_wise_data(grouped_by_day),
        "month_wise_data": populate_wise_data(grouped_by_month),
        "year_wise_data": populate_wise_data(grouped_by_year)
    })

MODULES = [
    {
        "id": 1,
        "title": "Deep Focus Reading",
        "description": "Practice sustained attention with uninterrupted reading blocks.",
    },
    {
        "id": 2,
        "title": "Active Recall Quiz",
        "description": "Test your understanding with short question bursts.",
    },
    {
        "id": 3,
        "title": "Concept Review Sprint",
        "description": "Quickly revisit key ideas to reinforce memory.",
    },
]

MODULES_CONTENT = {
    1: [
        "Deep focus is the ability to concentrate without distraction.",
        "Short, intense reading blocks can train your attention.",
        "Turn off notifications before starting a deep focus block.",
        "Keep a notebook nearby to park distracting thoughts.",
        "Use a timer so you do not need to check the clock.",
        "Start with 15–20 minutes and extend as you improve.",
        "Notice when your mind wanders and gently return to the text.",
        "Highlight only the most important ideas, not every sentence.",
        "Summarize each section in your own words after reading.",
        "End the session by writing one concrete takeaway.",
        "Practice deep focus regularly to build mental stamina.",
        "Create a dedicated study space free from interruptions.",
        "Use the Pomodoro technique: 25 minutes focused, 5 minutes break.",
        "Eliminate digital distractions by using website blockers.",
        "Take notes actively rather than passively reading.",
        "Review your notes immediately after each reading session.",
        "Connect new information to what you already know.",
        "Ask yourself questions about the material as you read.",
        "Visualize concepts to make them more memorable.",
        "Reflect on what you learned at the end of each session.",
    ],
    2: [
        "Active recall is the practice of testing yourself from memory.",
        "Simply re-reading material is less effective than retrieval.",
        "After a short review, close the notes and write what you recall.",
        "Check what you missed and focus only on those gaps.",
        "Small, frequent quizzes beat one long cramming session.",
        "Mix questions from different topics to strengthen retention.",
        "Explain answers as if you are teaching a friend.",
        "Use flashcards with clear prompts and concise answers.",
        "Space out your quizzes over several days.",
        "Track which questions you often miss and revisit them.",
        "Test yourself before looking at the answer key.",
        "Use the Feynman technique: explain concepts simply.",
        "Create practice problems based on the material.",
        "Review incorrect answers more frequently than correct ones.",
        "Use spaced repetition to reinforce learning over time.",
        "Combine active recall with other study techniques.",
        "Focus on understanding concepts, not just memorizing facts.",
        "Take breaks between active recall sessions.",
        "Use different question formats to test comprehension.",
        "Reflect on why you got questions wrong to improve.",
    ],
    3: [
        "Concept review sprints help refresh knowledge quickly.",
        "List 5–10 key ideas you want to revisit.",
        "Set a short timer and scan your notes for each concept.",
        "For each idea, write one example or application.",
        "Connect related concepts together in a small mind map.",
        "Identify which ideas feel weak or confusing.",
        "Spend extra time strengthening only those weak links.",
        "Use color or symbols to mark concepts by confidence level.",
        "Review the hardest concepts again the next day.",
        "End by writing a one-paragraph summary of the topic.",
        "Use concept maps to visualize relationships between ideas.",
        "Create analogies to make abstract concepts concrete.",
        "Teach the concept to someone else to test understanding.",
        "Compare and contrast related concepts to deepen learning.",
        "Use real-world examples to illustrate abstract ideas.",
        "Break complex concepts into smaller, manageable parts.",
        "Review concepts in different orders to avoid rote memorization.",
        "Use visual aids like diagrams and charts when helpful.",
        "Connect new concepts to personal experiences.",
        "Regularly review previously learned concepts to maintain retention.",
    ],
}

@app.route("/api/student/dashboard", methods=["GET"])
@login_required
def api_student_dashboard():
    sessions = get_user_sessions()
    return jsonify({"sessions": sessions})


@app.route("/api/student/profile", methods=["GET"])
@login_required
def api_student_profile():
    sessions = get_user_sessions()

    focus_scores = []
    durations = []
    for s in sessions:
        score = s.get("focus_score")
        if isinstance(score, (int, float)):
            focus_scores.append(score)
            
        duration = s.get("duration")
        if isinstance(duration, (int, float)):
            durations.append(duration)

    avg_focus = round(sum(focus_scores) / len(focus_scores), 1) if focus_scores else 0.0
    avg_duration_mins = round(sum(durations) / len(durations) / 60) if durations else 0

    if avg_focus >= 75:
        focus_band = "high"
    elif avg_focus >= 50:
        focus_band = "medium"
    else:
        focus_band = "low"

    from datetime import datetime as _dt
    session_wise_data = []
    for s in sessions:
        score = s.get("focus_score", 0)
        if not isinstance(score, (int, float)):
            continue
        date_str = s.get("date", "")
        if not date_str:
            continue
        session_wise_data.append({
            "date": date_str,
            "score": max(0, min(int(score), 100)),
        })

    def parse_date(date_str):
        try:
            if len(date_str) >= 19:
                return _dt.strptime(date_str[:19], "%Y-%m-%d %H:%M:%S")
            else:
                return _dt.strptime(date_str[:10], "%Y-%m-%d")
        except:
            return _dt.min

    session_wise_data.sort(key=lambda x: parse_date(x["date"]))

    grouped_by_day = {}
    grouped_by_month = {}
    grouped_by_year = {}
    
    for s in sessions:
        date_str = s.get("date", "")
        if not date_str:
            continue
        try:
            if " " in date_str:
                day_key = date_str.split(" ")[0]
            else:
                day_key = date_str[:10]
            month_key = day_key[:7]
            year_key = day_key[:4]
        except:
            continue

        for key, group in [(day_key, grouped_by_day), (month_key, grouped_by_month), (year_key, grouped_by_year)]:
            if key not in group:
                group[key] = {"totalFocus": 0, "totalSessions": 0, "totalDistractions": 0, "totalDuration": 0}
            
            score = s.get("focus_score", 0) or 0
            distractions = s.get("distractions", 0) or 0
            duration = s.get("duration", 0) or 0
            
            group[key]["totalFocus"] += score
            group[key]["totalSessions"] += 1
            group[key]["totalDistractions"] += distractions
            group[key]["totalDuration"] += duration

    def populate_wise_data(grouped_dict):
        output_list = []
        for key in sorted(grouped_dict.keys()):
            info = grouped_dict[key]
            if info["totalSessions"] > 0:
                avg_f = round(info["totalFocus"] / info["totalSessions"], 1)
                emo = "Focused" if avg_f >= 70 else ("OK" if avg_f >= 40 else "Distracted")
                output_list.append({
                    "date": key,
                    "avgFocus": avg_f,
                    "sessions": info["totalSessions"],
                    "distractions": info["totalDistractions"],
                    "avgDuration": round((info["totalDuration"] / info["totalSessions"]) / 60) if info["totalDuration"] else 0,
                    "emotion": emo
                })
        return output_list

    day_wise_data = populate_wise_data(grouped_by_day)
    month_wise_data = populate_wise_data(grouped_by_month)
    year_wise_data = populate_wise_data(grouped_by_year)
            
    recent_day_wise_data = list(reversed(day_wise_data))
    recent_month_wise_data = list(reversed(month_wise_data))
    recent_year_wise_data = list(reversed(year_wise_data))

    focused_pct = int(round(avg_focus)) if sessions else 0
    distracted_pct = 100 - focused_pct if sessions else 0

    now = _dt.now()
    current_year, current_week, _ = now.isocalendar()
    sessions_this_week = 0
    for s in sessions:
        date_str = s.get("date")
        if not isinstance(date_str, str):
            continue
        try:
            dt = _dt.strptime(date_str[:10], "%Y-%m-%d")
            year, week, _ = dt.isocalendar()
            if year == current_year and week == current_week:
                sessions_this_week += 1
        except ValueError:
            continue

    sessions_sorted_for_list = sorted(
        sessions,
        key=lambda x: parse_date(x.get("date", "")),
        reverse=True,
    )

    username = session.get("student_username", "Student")
    emotion = "Focused" if avg_focus >= 70 else ("OK" if avg_focus >= 40 else "Distracted")
    avatar = f"https://ui-avatars.com/api/?name={username}&background=random"

    if avg_focus >= 75:
        suggestion_text = "Your concentration levels look exceptional. You are able to reliably sustain deep focus over extended periods of time, allowing you to maximize your learning efficiency without burning out. To push even further, consider trying advanced active recall and incorporating slight breaks between modules to reinforce your long-term memory."
    elif avg_focus >= 50:
        suggestion_text = "You are maintaining a decent level of focus, but there is still room to optimize your routine. You may find your mind occasionally wandering when material becomes dense or repetitive. Try experimenting with smaller, chunked reading sessions and actively taking notes during breaks to keep your attention sharper preventing minor distractions from accumulating."
    else:
        suggestion_text = "It looks like you are currently struggling to maintain sustained focus, getting frequently distracted during sessions. This is very common, and the quickest way to improve is by eliminating environmental triggers: putting away your phone, clearing your workspace, and starting with short 10-minute deep-work sprints before gradually building endurance over time."

    return jsonify({
        "username": username,
        "emotion": emotion,
        "avatar": avatar,
        "suggestion_text": suggestion_text,
        "sessions": sessions_sorted_for_list,
        "avg_focus": avg_focus,
        "focus_band": focus_band,
        "session_wise_data": session_wise_data,
        "day_wise_data": day_wise_data,
        "focused_pct": focused_pct,
        "distracted_pct": distracted_pct,
        "consistency_score": sessions_this_week,
        "total_sessions": len(sessions),
        "avg_duration_mins": avg_duration_mins,
        "recent_day_wise_data": recent_day_wise_data,
        "recent_month_wise_data": recent_month_wise_data,
        "recent_year_wise_data": recent_year_wise_data,
    })

@app.route("/api/modules", methods=["GET"])
@login_required
def get_modules():
    return jsonify({
        "modules": MODULES,
        "content": MODULES_CONTENT
    })

@app.route("/api/module/<int:module_id>/complete_preview", methods=["POST"])
@login_required
def complete_preview(module_id: int):
    session[f"preview_{module_id}_completed"] = True
    return jsonify({"status": "success"})


def _finalize_session(module_id: int):
    try:
        resp = requests.get(f"{ML_SERVICE_URL}/api/vision/get_session_stats")
        stats = resp.json()
        duration = stats.get("duration", 0)
        distractions = stats.get("distractions", 0)
        dynamic_focus_score = stats.get("dynamic_focus_score", 0)
    except Exception as e:
        duration = 0
        distractions = 0
        dynamic_focus_score = 0
    

    analysis_input = {
        "duration": duration,
        "distractions": distractions,
        "focus_score": dynamic_focus_score
    }

    result = analyze_session(analysis_input)
    focus_score = analysis_input["focus_score"]
    result["focus_score"] = focus_score

    emotion = detect_emotion(focus_score, focus_engine.total > 0)
    
    if focus_score >= 75:
        suggestion = "Great concentration! Keep up the excellent work."
    elif focus_score >= 50:
        suggestion = "Try minimizing distractions to improve your focus score."
    else:
        suggestion = "You seem distracted. A short break might help."

    result["emotion"] = emotion
    result["suggestion"] = suggestion
    result["date"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if "student_id" in session:
        user_id = session["student_id"]
        new_session = StudySession(
            user_id=user_id,
            focus_score=focus_score,
            distractions=distractions,
            actual_duration=duration,
            analysis_summary=suggestion,
            created_at=datetime.strptime(result["date"], "%Y-%m-%d %H:%M:%S")
        )
        db.session.add(new_session)
        db.session.commit()

    save_session(result)
    
    try:
        requests.post(f"{ML_SERVICE_URL}/api/vision/reset")
    except:
        pass

    summary = {
        "focus_score": focus_score,
        "distractions": distractions,
        "emotion": emotion,
        "suggestion": suggestion,
    }

    return summary

@app.route("/api/module/<int:module_id>/submit", methods=["POST"])
@login_required
def submit_module_route(module_id: int):
    summary = _finalize_session(module_id)
    return jsonify({
        "status": "ok",
        **summary,
    })

@app.route("/api/vision/analyze_frame", methods=["POST"])
@login_required
def analyze_frame_route():
    file = request.files.get("frame")
    if not file:
        return jsonify({"error": "no_frame"}), 400

    files = {"frame": (file.filename, file.read(), file.content_type)}
    try:
        response = requests.post(f"{ML_SERVICE_URL}/api/vision/analyze_frame", files=files)
        return jsonify(response.json()), response.status_code
    except Exception:
        return jsonify({"focus_score": 0.0, "alert": "ML Service unavailable."}), 503

@app.route("/api/vision/live_focus", methods=["POST"])
@login_required
def live_focus():
    file = request.files.get("frame")
    if file:
        files = {"frame": (file.filename, file.read(), file.content_type)}
        try:
            response = requests.post(f"{ML_SERVICE_URL}/api/vision/live_focus", files=files)
            return jsonify(response.json()), response.status_code
        except Exception:
            return jsonify({"focus_score": 0, "is_distracted": False}), 503
    return jsonify({"focus_score": 0, "is_distracted": False})


@app.route("/api/session/save", methods=["POST"])
@login_required
def save_session_route():
    data = request.json
    if not data:
        return jsonify({"error": "No data received"}), 400

    if "date" not in data:
        data["date"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if "student_id" in session:
        user_id = session["student_id"]
        focus_score = data.get("focus_score", 0)
        distractions = data.get("distractions", 0)
        duration = data.get("duration", 0)
        analysis_summary = data.get("suggestion", "")
        try:
            dt_obj = datetime.strptime(data["date"], "%Y-%m-%d %H:%M:%S")
        except:
            dt_obj = datetime.utcnow()
        new_session = StudySession(
            user_id=user_id,
            focus_score=focus_score,
            distractions=distractions,
            actual_duration=duration,
            analysis_summary=analysis_summary,
            created_at=dt_obj
        )
        db.session.add(new_session)
        db.session.commit()

    save_session(data)
    return jsonify({"status": "success"})


@app.route("/api/ai/generate_plan", methods=["POST"])
def api_generate_plan():
    data = request.json
    concept = data.get("concept", "")
    if not concept:
        return jsonify({"error": "Concept is required"}), 400
    plan = generate_study_plan(concept)
    return jsonify(plan)

@app.route("/api/ai/doubt", methods=["POST"])
def api_clear_doubt():
    data = request.json
    concept = data.get("concept", "")
    doubt = data.get("doubt", "")
    if not concept or not doubt:
        return jsonify({"error": "Concept and doubt are required"}), 400
    answer = clear_doubt(concept, doubt)
    return jsonify({"answer": answer})

@app.route("/api/ai/quiz", methods=["POST"])
def api_generate_quiz():
    data = request.json
    concept = data.get("concept", "")
    if not concept:
        return jsonify({"error": "Concept is required"}), 400
    quiz = generate_quiz(concept)
    return jsonify({"quiz": quiz})

@app.route("/api/ai/generate-content", methods=["POST"])
def api_generate_study_content():
    data = request.json
    concept = data.get("concept", "")
    if not concept:
        return jsonify({"error": "Concept is required"}), 400
    content = generate_study_content(concept)
    return jsonify({"content": content})

@app.route("/api/ai/generate-single-page", methods=["POST"])
def api_generate_single_page():
    data = request.json
    concept = data.get("concept", "")
    page_number = data.get("page_number", 1)
    if not concept:
        return jsonify({"error": "Concept is required"}), 400
    content = generate_single_page_content(concept, page_number)
    return jsonify({"content": content})

@app.route("/api/ai/generate-page-quiz", methods=["POST"])
def api_generate_page_quiz():
    data = request.json
    concept = data.get("concept", "")
    page_content = data.get("page_content", "")
    if not concept or not page_content:
        return jsonify({"error": "Concept and page_content are required"}), 400
    quiz = generate_page_quiz(concept, page_content)
    return jsonify({"quiz": quiz})

@app.route("/api/tasks", methods=["GET", "POST"])
@login_required
def api_tasks():
    user_id = session["student_id"]
    if request.method == "POST":
        data = request.json
        new_task = Task(
            user_id=user_id,
            title=data.get("title", "New Task"),
            description=data.get("description", ""),
            subject=data.get("subject", ""),
            priority=data.get("priority", "Medium")
        )
        if "due_date" in data and data["due_date"]:
            try:
                new_task.due_date = datetime.fromisoformat(data["due_date"].replace("Z", "+00:00"))
            except ValueError:
                pass
        db.session.add(new_task)
        db.session.commit()
        return jsonify(new_task.to_dict()), 201
    else:
        tasks = Task.query.filter_by(user_id=user_id).all()
        return jsonify([t.to_dict() for t in tasks])

@app.route("/api/tasks/<int:task_id>", methods=["PUT", "DELETE"])
@login_required
def api_task_detail(task_id):
    user_id = session["student_id"]
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task:
        return jsonify({"error": "Task not found"}), 404
        
    if request.method == "DELETE":
        db.session.delete(task)
        db.session.commit()
        return jsonify({"status": "success"})
        
    if request.method == "PUT":
        data = request.json
        if "title" in data: task.title = data["title"]
        if "description" in data: task.description = data["description"]
        if "subject" in data: task.subject = data["subject"]
        if "priority" in data: task.priority = data["priority"]
        if "completed" in data: task.completed = data["completed"]
        db.session.commit()
        return jsonify(task.to_dict())

@app.route("/api/sessions", methods=["GET", "POST"])
@login_required
def api_sessions():
    user_id = session["student_id"]
    if request.method == "POST":
        data = request.json
        new_session = StudySession(
            user_id=user_id,
            subject=data.get("subject", ""),
            topic=data.get("topic", ""),
            planned_duration=data.get("planned_duration", 0),
            actual_duration=data.get("actual_duration", 0),
            focus_score=data.get("focus_score", 0.0),
            distractions=data.get("distractions", 0),
            completed=data.get("completed", False)
        )
        db.session.add(new_session)
        db.session.commit()
        return jsonify(new_session.to_dict()), 201
    else:
        sessions = StudySession.query.filter_by(user_id=user_id).all()
        return jsonify([s.to_dict() for s in sessions])

@app.route("/api/sessions/analytics", methods=["GET"])
@login_required
def api_sessions_analytics():
    user_id = session["student_id"]
    from sqlalchemy import func
    stats = db.session.query(
        func.sum(StudySession.actual_duration).label('total_time'),
        func.avg(StudySession.focus_score).label('avg_focus'),
        func.sum(StudySession.distractions).label('total_dist'),
        func.count(StudySession.id).label('num_sessions')
    ).filter(StudySession.user_id == user_id).first()
    
    completed_sessions = StudySession.query.filter_by(user_id=user_id, completed=True).count()
    
    return jsonify({
        "total_study_time": int(stats.total_time or 0),
        "average_focus_score": float(stats.avg_focus or 0.0),
        "total_distractions": int(stats.total_dist or 0),
        "completed_sessions": completed_sessions,
        "number_of_sessions": int(stats.num_sessions or 0)
    })

@app.route("/api/ai/create-session", methods=["POST"])
@login_required
def api_create_session():
    data = request.json
    concept = data.get("subject", "")
    if not concept and "concept" in data:
        concept = data["concept"]
    if not concept.strip():
        return jsonify({"error": "Subject or concept is required"}), 400
        
    user_id = session["student_id"]
    from sqlalchemy import func
    
    # Analyze student's weak topics based on focus score
    weak_topics_query = db.session.query(
        StudySession.topic, func.avg(StudySession.focus_score).label('avg_score')
    ).filter(StudySession.user_id == user_id).group_by(StudySession.topic).having(func.avg(StudySession.focus_score) < 60).limit(3).all()
    
    weak_topics = [t.topic for t in weak_topics_query if t.topic]
    
    prompt_context = concept
    if weak_topics:
        prompt_context += f". Note: student struggles with {', '.join(weak_topics)}"
        
    plan_data = generate_study_plan(prompt_context)
    
    new_plan = AIStudyPlan(
        user_id=user_id,
        title=plan_data.get("concept", concept),
        objective="Master " + concept,
        duration=plan_data.get("estimatedTime", 30),
        focus_strategy=plan_data.get("distractionThreshold", "Standard"),
        recommendation="Follow the modules"
    )
    db.session.add(new_plan)
    db.session.commit()
    
    # Return the exact schema the frontend expects, merging with DB ID
    response_data = plan_data.copy()
    response_data["id"] = new_plan.id
    response_data["concept"] = new_plan.title
    response_data["estimatedTime"] = new_plan.duration
    response_data["distractionThreshold"] = new_plan.focus_strategy
    if "modules" not in response_data:
        response_data["modules"] = ["Introduction", "Core Concepts", "Advanced Application"]
        
    return jsonify(response_data), 201

@app.route("/api/ai/generate-doubts", methods=["POST"])
@login_required
def api_generate_doubts():
    data = request.json
    concept = data.get("topic", "")
    if not concept:
        return jsonify({"error": "Topic is required"}), 400
        
    user_id = session["student_id"]
    quiz_data = generate_quiz(concept)
    
    questions = []
    for q in quiz_data:
        new_q = AIQuestion(
            user_id=user_id,
            subject=data.get("subject", ""),
            topic=concept,
            question=q.get("question", ""),
            expected_answer=q.get("correctOption", "")
        )
        db.session.add(new_q)
        questions.append(new_q)
    
    db.session.commit()
    return jsonify([q.to_dict() for q in questions])

@app.route("/api/ai/evaluate-answer", methods=["POST"])
@login_required
def api_evaluate_answer():
    data = request.json
    question = data.get("question", "")
    student_answer = data.get("student_answer", "")
    topic = data.get("topic", "")
    expected = data.get("expected_answer", "")
    
    if not question or not student_answer:
        return jsonify({"error": "Question and student_answer are required"}), 400
        
    # Ask gemini to evaluate
    from ai.gemini_service import client
    prompt = f"Topic: {topic}. Question: {question}. Expected answer context: {expected}. Student's answer: {student_answer}. Is the student's answer conceptually correct? Start with YES or NO, then provide short feedback."
    try:
        response = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
        feedback = response.text.strip()
        is_correct = feedback.upper().startswith("YES")
    except Exception as e:
        print(f"Error evaluating answer: {e}")
        feedback = "Unable to evaluate answer right now."
        is_correct = False
        
    return jsonify({
        "is_correct": is_correct,
        "feedback": feedback
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
