import re

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/frontend/src/pages/StudySession.jsx", "r") as f:
    content = f.read()

old_fetch = """  const fetchSinglePage = async (pageNumber) => {
    setLoadingContent(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_URL}/api/ai/generate-single-page`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: config.concept, page_number: pageNumber })
      });
      const data = await res.json();
      if (data.content) {
        setStudyPages(prev => {
          // avoid duplicates if already fetched
          if (prev.find(p => p.page_number === pageNumber)) return prev;
          return [...prev, data.content];
        });
      } else {
        setStudyPages(prev => [...prev, { page_number: pageNumber, title: "Content Unavailable", content: "Could not generate content." }]);
      }
    } catch (e) {
      console.error(e);
      setStudyPages(prev => [...prev, { page_number: pageNumber, title: "Error", content: "Error fetching AI content." }]);
    }
    setLoadingContent(false);
  };"""

# Wait, `fetchSinglePage` originally is slightly different in the file right now. Let me fetch the actual content first.
