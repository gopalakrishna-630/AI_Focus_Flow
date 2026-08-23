import datetime

def analyze_session(data):
    duration = data.get("duration", 0)
    distractions = data.get("distractions", 0)

    if duration == 0:
        focus_score = 0
    else:
        focus_score = max(0, 100 - (distractions * 5))

    return {
        "date": datetime.datetime.now().strftime("%Y-%m-%d"),
        "duration": duration,
        "distractions": distractions,
        "focus_score": focus_score
    }
