import re

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/backend/ai/gemini_service.py", "r") as f:
    content = f.read()

wrapper_code = """
import time
def generate_content_with_retry(model, contents, max_retries=5):
    for attempt in range(max_retries):
        try:
            return client.models.generate_content(model=model, contents=contents)
        except Exception as e:
            if '429' in str(e) and attempt < max_retries - 1:
                print(f"Rate limit hit (429), retrying in 6 seconds... (Attempt {attempt+1})")
                time.sleep(6)
            else:
                raise e
"""

content = content.replace("client = genai.Client(api_key=GEMINI_API_KEY)", "client = genai.Client(api_key=GEMINI_API_KEY)\n" + wrapper_code)

content = content.replace(
    "client.models.generate_content(",
    "generate_content_with_retry("
)

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/backend/ai/gemini_service.py", "w") as f:
    f.write(content)
