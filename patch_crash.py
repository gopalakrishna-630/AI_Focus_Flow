import re

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/frontend/src/pages/StudySession.jsx", "r") as f:
    content = f.read()

# Fix the unsafe array access
old_render = """                studyPages.length > 0 && (
                  <div>
                    <h3 style={{ marginBottom: "1rem", color: "var(--accent-cyan)" }}>
                      Page {currentPageIndex + 1}: {studyPages[currentPageIndex].title}
                    </h3>
                    <div style={{ lineHeight: "1.8", color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                      {studyPages[currentPageIndex].content}
                    </div>
                  </div>
                )"""
new_render = """                studyPages.length > 0 && studyPages[currentPageIndex] && (
                  <div>
                    <h3 style={{ marginBottom: "1rem", color: "var(--accent-cyan)" }}>
                      Page {currentPageIndex + 1}: {studyPages[currentPageIndex]?.title}
                    </h3>
                    <div style={{ lineHeight: "1.8", color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                      {studyPages[currentPageIndex]?.content}
                    </div>
                  </div>
                )"""
content = content.replace(old_render, new_render)

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/frontend/src/pages/StudySession.jsx", "w") as f:
    f.write(content)
