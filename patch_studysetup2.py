import re

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/frontend/src/pages/StudySetup.jsx", "r") as f:
    content = f.read()

# Make sure preview gets source and material_ids
api_call = """      const data = await response.json();
      data.source = source;
      data.material_ids = Array.from(selectedMaterials);
      setPreview(data);"""

content = re.sub(r'const data = await response\.json\(\);\s*setPreview\(data\);', api_call, content)

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/frontend/src/pages/StudySetup.jsx", "w") as f:
    f.write(content)
