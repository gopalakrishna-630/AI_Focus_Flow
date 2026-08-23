import os
from google import genai
from google.genai import types
import json

from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

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


def generate_study_plan(concept: str):
    prompt = f"""
    You are an AI study planner. Create a study plan for the concept: '{concept}'.
    Return the response as a valid JSON object with the following structure:
    {{
        "concept": "{concept}",
        "estimatedTime": 45,
        "modules": [
            "Module 1 Name",
            "Module 2 Name",
            "Module 3 Name"
        ],
        "distractionThreshold": "High Sensitivity"
    }}
    Provide exactly 3 to 4 module names. Do not include markdown formatting or anything else outside the JSON.
    """
    try:
        response = generate_content_with_retry(
            model='gemini-3.6-flash',
            contents=prompt,
        )
        # Parse JSON
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        print(f"Error generating plan: {e}")
        return {
            "concept": concept,
            "estimatedTime": 45,
            "modules": ["Introduction", "Core Concepts", "Advanced Applications"],
            "distractionThreshold": "High Sensitivity"
        }

def clear_doubt(concept: str, doubt: str):
    prompt = f"""
    You are a helpful AI tutor focusing on the concept: '{concept}'.
    A student has asked the following doubt: '{doubt}'.
    Provide a concise, encouraging, and clear explanation to clear their doubt. 
    Remind them to stay focused at the end!
    """
    try:
        response = generate_content_with_retry(
            model='gemini-3.6-flash',
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        print(f"Error clearing doubt: {e}")
        return "I'm having trouble connecting right now, but stay focused! We'll clear this doubt soon."

def generate_study_content(concept: str):
    prompt = f"""
    You are an AI study tutor. Generate comprehensive study material for the concept: '{concept}'.
    You must provide EXACTLY 4 pages of content.
    Return the response as a valid JSON array of objects, where each object represents a page.
    Format:
    [
      {{
        "page_number": 1,
        "title": "Page 1 Title",
        "content": "Detailed educational content for this page..."
      }},
      ... up to 4 pages
    ]
    Do not include markdown formatting or anything else outside the JSON.
    """
    try:
        response = generate_content_with_retry(
            model='gemini-3.6-flash',
            contents=prompt,
        )
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        print(f"Error generating content: {e}")
        return [
            {"page_number": 1, "title": "Introduction", "content": f"Introduction to {concept}."},
            {"page_number": 2, "title": "Core Concepts", "content": "Details of core concepts."},
            {"page_number": 3, "title": "Advanced Topics", "content": "Advanced topics and applications."},
            {"page_number": 4, "title": "Summary", "content": f"Summary of {concept}."}
        ]

def generate_quiz(concept: str):
    prompt = f"""
    You are an AI tutor. Generate a 5-question multiple choice quiz on the concept: '{concept}'.
    Return the response as a valid JSON array of objects, with each object having this structure:
    {{
        "question": "The question text?",
        "options": {{
            "a": "Option A text",
            "b": "Option B text",
            "c": "Option C text"
        }},
        "correctOption": "a" // must be one of "a", "b", or "c"
    }}
    Provide exactly 5 questions. Do not include markdown formatting or anything else outside the JSON.
    """
    try:
        response = generate_content_with_retry(
            model='gemini-3.6-flash',
            contents=prompt,
        )
        # Parse JSON
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        print(f"Error generating quiz: {e}")
        # Fallback
        return [
            {
                "question": f"What is the main idea behind {concept}?",
                "options": {"a": "Option 1", "b": "Option 2", "c": "Option 3"},
                "correctOption": "a"
            }
        ] * 5

def generate_single_page_content(concept: str, page_number: int):
    prompt = f"""
    You are an AI study tutor. Generate comprehensive study material for the concept: '{concept}'.
    This is for Page {page_number}.
    Focus on one specific subtopic or aspect of the concept suitable for this page number.
    Return the response as a valid JSON object.
    Format:
    {{
        "page_number": {page_number},
        "title": "Subtopic Title",
        "content": "Detailed educational content..."
    }}
    Do not include markdown formatting or anything else outside the JSON.
    """
    try:
        response = generate_content_with_retry(
            model='gemini-3.6-flash',
            contents=prompt,
        )
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        print(f"Error generating single page content: {e}")
        return {
            "page_number": page_number,
            "title": f"Subtopic {page_number}",
            "content": f"Content for page {page_number} about {concept}."
        }

def generate_page_quiz(concept: str, page_content: str):
    prompt = f"""
    You are an AI tutor. Generate a 2-question multiple choice quiz based strictly on the following content about '{concept}':
    
    {page_content}
    
    Return the response as a valid JSON array of objects, with each object having this structure:
    {{
        "question": "The question text?",
        "options": {{
            "a": "Option A text",
            "b": "Option B text",
            "c": "Option C text"
        }},
        "correctOption": "a" // must be one of "a", "b", or "c"
    }}
    Provide exactly 2 questions. Do not include markdown formatting or anything else outside the JSON.
    """
    try:
        response = generate_content_with_retry(
            model='gemini-3.6-flash',
            contents=prompt,
        )
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        print(f"Error generating page quiz: {e}")
        return [
            {
                "question": f"Question about {concept}?",
                "options": {"a": "Option A", "b": "Option B", "c": "Option C"},
                "correctOption": "a"
            }
        ] * 2

def answer_from_materials(question: str, materials_text: str):
    prompt = f"""
    You are an AI study assistant. Answer the user's question using ONLY the provided materials below.
    If the answer cannot be found in the materials, explicitly say 'I cannot find the answer in the provided documents.'
    Do not use outside knowledge.
    
    MATERIALS:
    {materials_text}
    
    QUESTION:
    {question}
    """
    try:
        response = generate_content_with_retry(
            model='gemini-flash-lite-latest',
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        print(f'Error answering from materials: {e}')
        return 'Sorry, I am having trouble analyzing the materials right now.'
