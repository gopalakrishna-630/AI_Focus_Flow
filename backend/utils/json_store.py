import json
import os

FILE_PATH = "data/sessions.json"

def load_sessions():
    if not os.path.exists(FILE_PATH):
        return []
    with open(FILE_PATH, "r") as f:
        return json.load(f)

def save_session(data):
    sessions = load_sessions()
    sessions.append(data)
    with open(FILE_PATH, "w") as f:
        json.dump(sessions, f, indent=4)
