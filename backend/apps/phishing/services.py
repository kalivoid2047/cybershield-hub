def grade_phishing_attempt(attempt):
    expected = "suspicious" if attempt.simulation.is_phishing else "safe"
    classification_points = 70 if attempt.classification == expected else 0
    expected_flags = set(attempt.simulation.red_flags or [])
    selected_flags = set(attempt.selected_flags or [])
    flag_points = 0
    if expected_flags:
        flag_points = int((len(expected_flags & selected_flags) / len(expected_flags)) * 30)
    elif attempt.classification == expected:
        flag_points = 30

    attempt.correct = attempt.classification == expected
    attempt.score = min(100, classification_points + flag_points)
    attempt.feedback = {
        "expected": expected,
        "red_flags": attempt.simulation.red_flags,
        "training_tip": attempt.simulation.training_tip,
        "ai_detection_mock": {
            "risk_score": 91 if attempt.simulation.is_phishing else 14,
            "signals": ["sender mismatch", "urgent language", "credential request"] if attempt.simulation.is_phishing else ["known sender", "no credential request"],
        },
    }
    attempt.save()
    return attempt
