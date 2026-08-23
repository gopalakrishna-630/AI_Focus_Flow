import re

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/backend/ai/gemini_service.py", "r") as f:
    content = f.read()

# Define the wrapper at the top, just after client initialization
wrapper_code = """
import time
def generate_content_with_retry(model, contents, max_retries=3):
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

# Now, we need to replace all `client.models.generate_content(...)` logic, but since it's messed up, I'll just restore the original file and apply the wrapper.
