import re

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/backend/ai/gemini_service.py", "r") as f:
    content = f.read()

# Replace gemini-3.6-flash with gemini-1.5-flash
content = content.replace("gemini-3.6-flash", "gemini-1.5-flash")

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/backend/ai/gemini_service.py", "w") as f:
    f.write(content)
