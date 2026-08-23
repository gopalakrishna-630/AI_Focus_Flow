import cv2
import mediapipe as mp
import numpy as np

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True)

def analyze_frame(frame):
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb)

    if not results.multi_face_landmarks:
        return {
            "face": False,
            "head_pose": "no_face",
            "eyes": "unknown"
        }

    landmarks = results.multi_face_landmarks[0].landmark

    # Improved head pose logic with tolerance
    left_eye = landmarks[33]
    right_eye = landmarks[263]

    eye_diff = abs(left_eye.x - right_eye.x)

    # Increased tolerance: ±20 degrees equivalent
    if eye_diff < 0.15:
        head_pose = "forward"
    else:
        head_pose = "turned"

    # Eye blink estimation
    top_lid = landmarks[159]
    bottom_lid = landmarks[145]

    ear = abs(top_lid.y - bottom_lid.y)

    if ear < 0.01:
        eyes = "closed"
    else:
        eyes = "open"

    # Find approximate pitch/yaw
    nose = landmarks[1]
    left_cheek = landmarks[234]
    right_cheek = landmarks[454]
    
    left_dist = abs(nose.x - left_cheek.x)
    right_dist = abs(nose.x - right_cheek.x)
    yaw = (left_dist - right_dist) / (left_dist + right_dist + 1e-6)

    top = landmarks[10]
    bottom = landmarks[152]
    pitch = (nose.y - top.y) / (abs(bottom.y - top.y) + 1e-6)

    # Calculate gaze deviation logic
    gaze_deviation = abs(yaw) + abs(pitch)

    return {
        "face": True,
        "head_pose": head_pose,
        "eyes": eyes,
        "yaw": yaw,
        "pitch": pitch,
        "gaze_deviation": gaze_deviation
    }
