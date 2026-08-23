import re

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/frontend/src/pages/StudySession.jsx", "r") as f:
    content = f.read()

# 1. Add prefetchedNextPage to state
states_old = """  const [pageQuizScore, setPageQuizScore] = useState(0);
  const [pageQuizEvaluations, setPageQuizEvaluations] = useState({});"""
states_new = """  const [pageQuizScore, setPageQuizScore] = useState(0);
  const [pageQuizEvaluations, setPageQuizEvaluations] = useState({});
  const [prefetchedNextPage, setPrefetchedNextPage] = useState(null);"""
content = content.replace(states_old, states_new)


# 2. Add prefetch logic for the next page
prefetch_funcs = """  const fetchPrefetchNextPage = async (pageNumber) => {
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
        setPrefetchedNextPage(data.content);
      }
    } catch (e) {
      console.error("Prefetch error", e);
    }
  };

  // Prefetch quiz when a page loads
  useEffect(() => {
    if (studyPages.length > 0) {
      fetchPageQuiz(studyPages.length - 1);
    }
  }, [studyPages.length]);

  // Prefetch next page when user opens the quiz
  useEffect(() => {
    if (showPageQuiz && studyPages.length < 4) {
      fetchPrefetchNextPage(studyPages.length + 1);
    }
  }, [showPageQuiz]);
"""

old_use_effect_start = """  useEffect(() => {
    fetchSinglePage(1);"""
content = content.replace(old_use_effect_start, prefetch_funcs + "\n" + old_use_effect_start)


# 3. Update handlePageQuizSuccess to use prefetched page
old_success = """  const handlePageQuizSuccess = () => {
    setShowPageQuiz(false);
    fetchSinglePage(studyPages.length + 1);
    setCurrentPageIndex(prev => prev + 1);
  };"""
new_success = """  const handlePageQuizSuccess = () => {
    setShowPageQuiz(false);
    if (prefetchedNextPage) {
      setStudyPages(prev => [...prev, prefetchedNextPage]);
      setPrefetchedNextPage(null);
    } else {
      fetchSinglePage(studyPages.length + 1);
    }
    setCurrentPageIndex(prev => prev + 1);
  };"""
content = content.replace(old_success, new_success)

# 4. Do not fetchPageQuiz when button is clicked because it's already prefetched!
# Actually, if it's already fetching/fetched, calling it again might be redundant but okay if it nulls it. Wait, `fetchPageQuiz(currentPageIndex)` nulls `setPageQuizData(null)` which clears the prefetched quiz!
# We should only fetch if not already present.
old_btn = """                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setShowPageQuiz(true);
                    fetchPageQuiz(currentPageIndex);
                  }}
                >"""
new_btn = """                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setShowPageQuiz(true);
                    if (!pageQuizData) {
                      fetchPageQuiz(currentPageIndex);
                    }
                  }}
                >"""
content = content.replace(old_btn, new_btn)

# Make fetchPageQuiz not clear data if it's already the right quiz? Wait, the prefetch happens, it sets it. We don't need to change `fetchPageQuiz`, just don't call it if `pageQuizData` exists.

# Ensure `setPageQuizData(null)` is called when moving to next page, so the NEXT prefetch knows it's empty.
# In `handlePageQuizSuccess`:
new_success2 = """  const handlePageQuizSuccess = () => {
    setShowPageQuiz(false);
    setPageQuizData(null); // Clear for the next page's prefetch
    setPageQuizAnswers({});
    setPageQuizResult(null);
    if (prefetchedNextPage) {
      setStudyPages(prev => [...prev, prefetchedNextPage]);
      setPrefetchedNextPage(null);
    } else {
      fetchSinglePage(studyPages.length + 1);
    }
    setCurrentPageIndex(prev => prev + 1);
  };"""
content = content.replace(new_success, new_success2)

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/frontend/src/pages/StudySession.jsx", "w") as f:
    f.write(content)

