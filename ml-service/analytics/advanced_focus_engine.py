import cv2
import numpy as np
import time

class AdvancedFocusEngine:
    def __init__(self):
        # 7. Initialize models once at startup to optimize performance
        try:
            import mediapipe as mp
            self.mp_face_mesh = mp.solutions.face_mesh
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
        except ImportError:
            self.face_mesh = None

        try:
            from deepface import DeepFace
            self.DeepFace = DeepFace
        except ImportError:
            self.DeepFace = None

        # 5. Smoothing - weighted moving average weights
        self.last_scores = []
        self.weights = [0.1, 0.15, 0.2, 0.25, 0.3]  # Older -> Newer
        
        # Tracking states
        self.face_missing_start = None
        
        # 6. Hysteresis control
        self.trigger_threshold = 0.30
        self.recovery_threshold = 0.35
        self.is_distracted = False
        self.current_stable_score = 1.0

        # Session tracking
        self.total = 0
        self.distraction_frames = 0
        self.focus_score_accumulator = 0.0

    def get_ear(self, landmarks, indices):
        """Calculate Eye Aspect Ratio using 3D landmarks."""
        try:
            p2_p6 = np.linalg.norm(np.array([landmarks[indices[1]].x, landmarks[indices[1]].y]) - 
                                   np.array([landmarks[indices[5]].x, landmarks[indices[5]].y]))
            p3_p5 = np.linalg.norm(np.array([landmarks[indices[2]].x, landmarks[indices[2]].y]) - 
                                   np.array([landmarks[indices[4]].x, landmarks[indices[4]].y]))
            p1_p4 = np.linalg.norm(np.array([landmarks[indices[0]].x, landmarks[indices[0]].y]) - 
                                   np.array([landmarks[indices[3]].x, landmarks[indices[3]].y]))
            return (p2_p6 + p3_p5) / (2.0 * p1_p4) if p1_p4 != 0 else 0.25
        except Exception:
             return 0.25

    def process_frame(self, frame: np.ndarray) -> dict:
        """Process a single frame safely and return focus metrics."""
        result = {
            "focus": float(self.current_stable_score),
            "face": False,
            "emotion": "Unknown",
            "confidence": 0.0
        }
        
        if frame is None:
            return result

        # Ensure color format compatibility
        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        except Exception:
            return result
        
        # -- Phase 1: Mesh & Landmark Extraction (MediaPipe) --
        mesh_results = None
        if self.face_mesh:
            try:
                mesh_results = self.face_mesh.process(rgb_frame)
            except Exception:
                pass

        # -- Phase 2: DeepFace Emotion & Drowsiness --
        emotion = "Neutral"
        if self.DeepFace:
            try:
                # Do not enforce detection to prevent blocking errors when face is off-frame
                dfs = self.DeepFace.analyze(rgb_frame, actions=['emotion'], enforce_detection=False, silent=True)
                if isinstance(dfs, list) and len(dfs) > 0:
                    emotion = dfs[0]['dominant_emotion'].capitalize()
                elif isinstance(dfs, dict):
                    emotion = dfs['dominant_emotion'].capitalize()
            except Exception:
                emotion = "Neutral"

        raw_score = 0.0
        face_presence = 0.0

        # -- Phase 3: Focus Score Calculation --
        if not mesh_results or not mesh_results.multi_face_landmarks:
            # 4. No face detected logic
            if self.face_missing_start is None:
                self.face_missing_start = time.time()
            
            missing_duration = time.time() - self.face_missing_start

            # Reduce score sharply
            if missing_duration > 3.0:
                self.is_distracted = True
                raw_score = 0.0
            else:
                # Linear drop while missing
                raw_score = max(0.0, self.current_stable_score - (missing_duration * 0.3))

            face_presence = 0.0
        else:
            self.face_missing_start = None
            result["face"] = True
            face_presence = 1.0
            
            landmarks = mesh_results.multi_face_landmarks[0].landmark
            
            # 35% Head Orientation
            try:
                nose_tip = landmarks[1]
                left_eye_inner = landmarks[133]
                right_eye_inner = landmarks[362]
                face_center_x = (left_eye_inner.x + right_eye_inner.x) / 2.0
                eye_distance = abs(right_eye_inner.x - left_eye_inner.x)
                if eye_distance > 0:
                    deviation_ratio = abs(nose_tip.x - face_center_x) / eye_distance
                    head_orientation_score = max(0.0, min(1.0, 1.0 - (deviation_ratio * 1.5)))
                else:
                    head_orientation_score = 0.5
            except Exception:
                head_orientation_score = 0.5

            # 25% Eye Openness / EAR
            LEFT_EYE = [33, 160, 158, 133, 153, 144]
            RIGHT_EYE = [362, 385, 387, 263, 373, 380]
            avg_ear = (self.get_ear(landmarks, LEFT_EYE) + self.get_ear(landmarks, RIGHT_EYE)) / 2.0
            # Normal EAR is ~0.25 to 0.3. Map 0.15 - 0.25 linearly to 0.0 - 1.0
            ear_score = max(0.0, min(1.0, (avg_ear - 0.15) / 0.10))
            
            # Override emotion if strictly drowsy based on EAR
            if avg_ear < 0.18 and emotion not in ["Sad", "Angry"]:
                emotion = "Sleepy"
                
            # 15% Gaze Direction
            try:
                left_iris = landmarks[468]
                left_eye_outer = landmarks[33]
                eye_center_x = (left_eye_inner.x + left_eye_outer.x) / 2.0
                eye_width = abs(left_eye_outer.x - left_eye_inner.x)
                if eye_width > 0:
                    # Deviation from eye center relative to eye width
                    deviation_ratio = abs(left_iris.x - eye_center_x) / eye_width
                    gaze_score = max(0.0, min(1.0, 1.0 - (deviation_ratio * 4.0)))
                else:
                    gaze_score = 0.5
            except IndexError:
                gaze_score = 0.5
            except Exception:
                gaze_score = 0.5
            
            # 10% Emotion Adjustment
            emotion_score = 1.0
            if emotion in ["Sad", "Angry", "Fear", "Disgust"]:
                emotion_score = 0.5
            elif emotion == "Sleepy":
                emotion_score = 0.1
            elif emotion in ["Happy", "Surprise"]:
                emotion_score = 0.9
                
            # Weighted Scoring Math
            raw_score = (
                0.35 * head_orientation_score +
                0.25 * ear_score +
                0.15 * gaze_score +
                0.15 * face_presence +
                0.10 * emotion_score
            )

        # -- Phase 4: Backend Smoothing (Moving Average) --
        self.last_scores.append(raw_score)
        if len(self.last_scores) > 5:
            self.last_scores.pop(0)
            
        if len(self.last_scores) == 5:
            smoothed_score = sum(s * w for s, w in zip(self.last_scores, self.weights))
        else:
            smoothed_score = sum(self.last_scores) / len(self.last_scores)
            
        # -- Phase 5: Hysteresis Control --
        if not self.is_distracted and smoothed_score < self.trigger_threshold:
            self.is_distracted = True
        elif self.is_distracted and smoothed_score > self.recovery_threshold:
            self.is_distracted = False
            
        # Hard lock bounds if completely missing/distracted preventing lingering drift overlaps
        if self.is_distracted and face_presence == 0.0:
            smoothed_score = min(smoothed_score, 0.25)
            
        self.current_stable_score = max(0.0, min(1.0, smoothed_score))
        
        # Update session tracking
        self.total += 1
        self.focus_score_accumulator += self.current_stable_score
        if self.is_distracted or face_presence == 0.0:
            self.distraction_frames += 1

        # 8. Return Clean JSON format
        result["focus"] = float(round(self.current_stable_score, 4))
        result["emotion"] = emotion
        result["face"] = bool(face_presence > 0)
        result["confidence"] = float(round(face_presence, 2))
        
        return result

    def score(self):
        if self.total == 0:
            return 1.0
        return self.focus_score_accumulator / self.total

    def reset(self):
        self.total = 0
        self.distraction_frames = 0
        self.focus_score_accumulator = 0.0
