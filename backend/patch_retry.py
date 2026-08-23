import re

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/backend/ai/gemini_service.py", "r") as f:
    content = f.read()

# Add retry logic to generate_single_page_content
old_single_page = """    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        print(f"Error generating single page content: {e}")"""
new_single_page = """    import time
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt,
            )
            return response.text
        except Exception as e:
            if '429' in str(e) and attempt < 2:
                print(f"Rate limit hit, retrying in 5 seconds...")
                time.sleep(6)
                continue
            print(f"Error generating single page content (Attempt {attempt+1}): {e}")
            break"""
content = content.replace(old_single_page, new_single_page)

# Add retry logic to generate_page_quiz
old_page_quiz = """    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
        )"""
new_page_quiz = """    import time
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt,
            )
            break
        except Exception as e:
            if '429' in str(e) and attempt < 2:
                print(f"Rate limit hit for quiz, retrying in 5 seconds...")
                time.sleep(6)
                continue
            print(f"Error generating page quiz (Attempt {attempt+1}): {e}")
            break
    else:
        # Fallback if all attempts fail
        return [
            {"question": "Could not load question?", "options": {"a":"Yes", "b":"No"}, "correctOption": "a"}
        ]
    try:"""
content = content.replace(old_page_quiz, new_page_quiz)

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/backend/ai/gemini_service.py", "w") as f:
    f.write(content)
