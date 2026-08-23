def detect_emotion(focus_score, has_face):
    if not has_face:
        return "No Face"
    if focus_score is None:
        return "Unknown"
    
    try:
        score = float(focus_score)
        if score >= 75:
            return "Focused"
        elif score >= 50:
            return "Engaged"
        else:
            return "Distracted"
    except Exception:
        return "Unknown"