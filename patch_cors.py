import re

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/backend/app.py", "r") as f:
    content = f.read()

# Replace CORS and cookie config
old_cors = """app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", os.urandom(24))
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')"""

new_cors = """app = Flask(__name__)
frontend_url = os.environ.get("FRONTEND_URL", "https://ai-focusflow-frontend.onrender.com")
# Fix CORS by specifying origins
CORS(app, supports_credentials=True, origins=[frontend_url, "http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"])

# Fix Cross-Origin session cookies
app.config.update(
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=True,
)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", os.urandom(24))
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')"""

content = content.replace(old_cors, new_cors)

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/backend/app.py", "w") as f:
    f.write(content)
