import cv2
import mediapipe as mp
import numpy as np
import time
import collections

class FocusEngine:
    def __init__(self, window_size=30):
        self.window_size = window_size
        self.scores = collections.deque(maxlen=window_size)

        self.eye_closed_start = 0.0
        self.distraction_streak = 0
        self.total = 0
        self.distraction_frames = 0
        self.focus_score_accumulator = 0.0

        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            refine_landmarks=True,
            max_num_faces=1,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6
        )

    # -------------------------------------------------
    # 1️⃣ Eye Aspect Ratio (EAR)
    # -------------------------------------------------
    def eye_aspect_ratio(self, eye_landmarks):
        A = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
        B = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
        C = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])
        return (A + B) / (2.0 * C)

    # -------------------------------------------------
    # 2️⃣ Iris Gaze Direction
    # -------------------------------------------------
    def iris_ratio(self, eye_points, iris_points):
        left = eye_points[0]
        right = eye_points[3]
        iris_center = np.mean(iris_points, axis=0)

        total_width = np.linalg.norm(right - left)
        iris_position = np.linalg.norm(iris_center - left)

        return iris_position / total_width

    # -------------------------------------------------
    # 3️⃣ Head Pose Estimation
    # -------------------------------------------------
    def head_pose(self, landmarks, image_shape):
        image_points = np.array([
            landmarks[1],    # Nose tip
            landmarks[152],  # Chin
            landmarks[33],   # Left eye corner
            landmarks[263],  # Right eye corner
            landmarks[61],   # Left mouth
            landmarks[291]   # Right mouth
        ], dtype="double")

        model_points = np.array([
            (0.0, 0.0, 0.0),
            (0.0, -330.0, -65.0),
            (-225.0, 170.0, -135.0),
            (225.0, 170.0, -135.0),
            (-150.0, -150.0, -125.0),
            (150.0, -150.0, -125.0)
        ])

        focal_length = image_shape[1]
        center = (image_shape[1] / 2, image_shape[0] / 2)
        camera_matrix = np.array(
            [[focal_length, 0, center[0]],
             [0, focal_length, center[1]],
             [0, 0, 1]], dtype="double"
        )

        dist_coeffs = np.zeros((4, 1))

        success, rotation_vector, translation_vector = cv2.solvePnP(
            model_points, image_points, camera_matrix, dist_coeffs
        )

        rmat, _ = cv2.Rodrigues(rotation_vector)
        angles, _, _, _, _, _ = cv2.RQDecomp3x3(rmat)

        pitch, yaw, roll = angles
        
        # Normalize angles to handle 180-degree coordinate system flips
        if pitch > 90:
            pitch -= 180
        elif pitch < -90:
            pitch += 180
            
        if yaw > 90:
            yaw -= 180
        elif yaw < -90:
            yaw += 180
            
        return yaw, pitch

    # -------------------------------------------------
    # 4️⃣ Main Update Function
    # -------------------------------------------------
    def update(self, frame):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = self.face_mesh.process(rgb)

        frame_score = 1.0
        current_time = time.time()

        if not result.multi_face_landmarks:
            self.scores.append(0.0)
            self.distraction_streak += 1
            self.total += 1
            self.distraction_frames += 1
            return

        h, w, _ = frame.shape
        landmarks = []

        for lm in result.multi_face_landmarks[0].landmark:
            landmarks.append([lm.x * w, lm.y * h])

        landmarks = np.array(landmarks)

        # ------------------ EAR ------------------
        left_eye_idx = [33, 160, 158, 133, 153, 144]
        right_eye_idx = [362, 385, 387, 263, 373, 380]

        left_eye = landmarks[left_eye_idx]
        right_eye = landmarks[right_eye_idx]

        ear_left = self.eye_aspect_ratio(left_eye)
        ear_right = self.eye_aspect_ratio(right_eye)
        ear = (ear_left + ear_right) / 2.0

        if ear < 0.18:
            if self.eye_closed_start == 0.0:
                self.eye_closed_start = current_time

            if current_time - self.eye_closed_start > 1.0:
                frame_score *= 0.2
                self.distraction_streak += 1
        else:
            self.eye_closed_start = 0.0

        # ------------------ Iris ------------------
        left_iris = landmarks[468:473]
        right_iris = landmarks[473:478]

        left_ratio = self.iris_ratio(left_eye, left_iris)
        right_ratio = self.iris_ratio(right_eye, right_iris)

        gaze_ratio = (left_ratio + right_ratio) / 2

        if gaze_ratio < 0.20 or gaze_ratio > 0.80:
            frame_score *= 0.4
            self.distraction_streak += 1

        # ------------------ Head Pose ------------------
        yaw, pitch = self.head_pose(landmarks, frame.shape)

        if abs(yaw) > 25:
            frame_score *= 0.3
            self.distraction_streak += 1

        if abs(pitch) > 25:
            frame_score *= 0.5

        # ------------------ Temporal Smoothing ------------------
        self.scores.append(frame_score)

        if frame_score > 0.6:
            self.distraction_streak = max(0, self.distraction_streak - 1)
            
        self.total += 1
        self.focus_score_accumulator += frame_score
        if frame_score < 0.4:
            self.distraction_frames += 1

    # -------------------------------------------------
    # 5️⃣ Final Focus Score
    # -------------------------------------------------
    def score(self):
        if not self.scores:
            return 1.0

        weights = np.arange(1, len(self.scores) + 1)
        weighted_avg = np.average(self.scores, weights=weights)

        return round(weighted_avg, 3)

    def is_distracted(self):
        return self.distraction_streak > 20

    def session_score(self):
        if self.total == 0:
            return 1.0
        return self.focus_score_accumulator / self.total

    def reset(self):
        self.scores.clear()
        self.eye_closed_start = 0.0
        self.distraction_streak = 0
        self.total = 0
        self.distraction_frames = 0
        self.focus_score_accumulator = 0.0
