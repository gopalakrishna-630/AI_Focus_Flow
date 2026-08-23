import re

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/backend/app.py", "r") as f:
    content = f.read()

# Helper function to append material context
helper = """
def get_material_context(user_id, material_ids):
    if not user_id or not material_ids: return ""
    materials = Material.query.filter(Material.id.in_(material_ids), Material.user_id == user_id).all()
    if not materials: return ""
    combined_text = ""
    for m in materials:
        combined_text += f"\\n--- {m.filename} ---\\n{m.content[:3000]}"
    return "\\n\\nSource Materials:\\n" + combined_text
"""

# inject helper after generate_study_plan import
content = content.replace("from ai.gemini_service import generate_study_plan, clear_doubt, generate_study_content, generate_single_page_content, generate_page_quiz, generate_quiz, answer_from_materials", "from ai.gemini_service import generate_study_plan, clear_doubt, generate_study_content, generate_single_page_content, generate_page_quiz, generate_quiz, answer_from_materials" + helper)


# Patch create-session
create_sess_old = """    weak_topics = [t.topic for t in weak_topics_query if t.topic]
    
    prompt_context = concept
    if weak_topics:
        prompt_context += f". Note: student struggles with {', '.join(weak_topics)}"
        
    plan_data = generate_study_plan(prompt_context)"""

create_sess_new = """    weak_topics = [t.topic for t in weak_topics_query if t.topic]
    
    prompt_context = concept
    if weak_topics:
        prompt_context += f". Note: student struggles with {', '.join(weak_topics)}"
        
    source = data.get("source", "ai")
    material_ids = data.get("material_ids", [])
    if source == "materials" and material_ids:
        mat_text = get_material_context(user_id, material_ids)
        prompt_context += mat_text
        
    plan_data = generate_study_plan(prompt_context)"""
content = content.replace(create_sess_old, create_sess_new)


# Patch generate-single-page
single_page_old = """@app.route("/api/ai/generate-single-page", methods=["POST"])
def api_generate_single_page():
    data = request.json
    concept = data.get("concept", "")
    page_number = data.get("page_number", 1)
    if not concept:
        return jsonify({"error": "Concept is required"}), 400
    content = generate_single_page_content(concept, page_number)
    return jsonify({"content": content})"""

single_page_new = """@app.route("/api/ai/generate-single-page", methods=["POST"])
def api_generate_single_page():
    data = request.json
    concept = data.get("concept", "")
    page_number = data.get("page_number", 1)
    if not concept:
        return jsonify({"error": "Concept is required"}), 400
        
    source = data.get("source", "ai")
    material_ids = data.get("material_ids", [])
    user_id = session.get("student_id")
    if source == "materials" and material_ids and user_id:
        mat_text = get_material_context(user_id, material_ids)
        concept += mat_text
        
    content = generate_single_page_content(concept, page_number)
    return jsonify({"content": content})"""
content = content.replace(single_page_old, single_page_new)


# Patch generate-page-quiz
page_quiz_old = """@app.route("/api/ai/generate-page-quiz", methods=["POST"])
def api_generate_page_quiz():
    data = request.json
    concept = data.get("concept", "")
    page_content = data.get("page_content", "")
    if not concept or not page_content:
        return jsonify({"error": "Concept and page_content are required"}), 400
    quiz = generate_page_quiz(concept, page_content)
    return jsonify(quiz)"""

page_quiz_new = """@app.route("/api/ai/generate-page-quiz", methods=["POST"])
def api_generate_page_quiz():
    data = request.json
    concept = data.get("concept", "")
    page_content = data.get("page_content", "")
    if not concept or not page_content:
        return jsonify({"error": "Concept and page_content are required"}), 400
        
    source = data.get("source", "ai")
    material_ids = data.get("material_ids", [])
    user_id = session.get("student_id")
    if source == "materials" and material_ids and user_id:
        mat_text = get_material_context(user_id, material_ids)
        concept += mat_text
        
    quiz = generate_page_quiz(concept, page_content)
    return jsonify(quiz)"""
content = content.replace(page_quiz_old, page_quiz_new)


# Patch generate-quiz
quiz_old = """@app.route("/api/ai/quiz", methods=["POST"])
@login_required
def api_generate_quiz():
    data = request.json
    concept = data.get("concept", "")
    if not concept:
        return jsonify({"error": "Concept is required"}), 400
    quiz_data = generate_quiz(concept)
    return jsonify(quiz_data)"""

quiz_new = """@app.route("/api/ai/quiz", methods=["POST"])
@login_required
def api_generate_quiz():
    data = request.json
    concept = data.get("concept", "")
    if not concept:
        return jsonify({"error": "Concept is required"}), 400
        
    source = data.get("source", "ai")
    material_ids = data.get("material_ids", [])
    user_id = session.get("student_id")
    if source == "materials" and material_ids and user_id:
        mat_text = get_material_context(user_id, material_ids)
        concept += mat_text
        
    quiz_data = generate_quiz(concept)
    return jsonify(quiz_data)"""
content = content.replace(quiz_old, quiz_new)

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/backend/app.py", "w") as f:
    f.write(content)
