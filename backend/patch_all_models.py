import re

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/backend/ai/gemini_service.py", "r") as f:
    content = f.read()

content = content.replace("model='gemini-1.5-flash'", "model='gemini-3.6-flash'")

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/backend/ai/gemini_service.py", "w") as f:
    f.write(content)
