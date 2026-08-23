import re

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/frontend/src/pages/StudySession.jsx", "r") as f:
    content = f.read()

# Replace body: JSON.stringify({ concept: config.concept, ... }) 
# with body: JSON.stringify({ concept: config.concept, source: config.source, material_ids: config.material_ids, ... })

content = content.replace(
    'body: JSON.stringify({ concept: config.concept, module: config.modules[pageIndex] })',
    'body: JSON.stringify({ concept: config.concept, module: config.modules[pageIndex], source: config.source, material_ids: config.material_ids })'
)

content = content.replace(
    'body: JSON.stringify({ concept: config.concept, module: config.modules[pageIndex], previous_performance: performance })',
    'body: JSON.stringify({ concept: config.concept, module: config.modules[pageIndex], previous_performance: performance, source: config.source, material_ids: config.material_ids })'
)

content = content.replace(
    'body: JSON.stringify({ concept: config.concept, module: config.modules[nextIndex] })',
    'body: JSON.stringify({ concept: config.concept, module: config.modules[nextIndex], source: config.source, material_ids: config.material_ids })'
)

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/frontend/src/pages/StudySession.jsx", "w") as f:
    f.write(content)
