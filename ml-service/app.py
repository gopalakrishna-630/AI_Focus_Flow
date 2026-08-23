from flask import Flask, request, jsonify
import cv2
import numpy as np
from vision.face_analysis import analyze_frame as analyze_face
from analytics.focus_engine import FocusEngine
from analytics.advanced_focus_engine import AdvancedFocusEngine
import os

app = Flask(__name__)
advanced_focus = AdvancedFocusEngine()
focus_engine = FocusEngine()

@app.route("/api/vision/analyze_frame", methods=["POST"])
def analyze_frame_route():
    file = request.files.get("frame")
    if not file:
        return jsonify({"error": "no_frame"}), 400

    file_bytes = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if frame is None:
        return jsonify({"focus_score": 0.0, "alert": "Camera frame invalid."})

    face_info = analyze_face(frame)
    focus_engine.update(frame)
    score = focus_engine.score()

    alert = ""
    if not face_info.get("face"):
        alert = "Face not detected. Please stay in frame."
    elif face_info.get("eyes") == "closed":
        alert = "Eyes closed detected. Try to stay alert."
    elif face_info.get("head_pose") != "forward":
        alert = "You seem distracted. Look at the screen."

    return jsonify({
        "focus_score": score,
        "alert": alert,
    })

@app.route("/api/vision/live_focus", methods=["POST"])
def live_focus():
    file = request.files.get("frame")
    if not file:
        return jsonify({
            "focus_score": focus_engine.score(), 
            "is_distracted": focus_engine.is_distracted()
        })

    file_bytes = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if frame is None:
        return jsonify({
            "focus_score": focus_engine.score(), 
            "is_distracted": focus_engine.is_distracted()
        })

    focus_engine.update(frame)

    return jsonify({
        "focus_score": focus_engine.score(),
        "is_distracted": focus_engine.is_distracted()
    })

@app.route("/api/vision/get_session_stats", methods=["GET"])
def get_session_stats():
    duration = focus_engine.total * 3
    distractions = focus_engine.distraction_frames
    dynamic_focus_score = round(focus_engine.session_score() * 100)
    return jsonify({
        "duration": duration,
        "distractions": distractions,
        "dynamic_focus_score": dynamic_focus_score
    })

@app.route("/api/vision/reset", methods=["POST"])
def reset_engine():
    focus_engine.reset()
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)
