def suggest_session_length(focus_score):
    if focus_score > 0.8:
        return 50
    elif focus_score > 0.6:
        return 40
    else:
        return 25


def burnout_index(focus_trend, avg_duration, distraction_rate):
    score = (
        (-focus_trend * 0.4) +
        (avg_duration / 120 * 0.3) +
        (distraction_rate * 0.3)
    )
    return score
