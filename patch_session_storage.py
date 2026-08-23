import re

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/frontend/src/pages/StudySession.jsx", "r") as f:
    content = f.read()

# Add saving state to sessionStorage
use_effect_save = """
  // Persist session to sessionStorage on every meaningful change
  useEffect(() => {
    if (config.concept !== "Unknown Concept" && studyPages.length > 0) {
      sessionStorage.setItem("activeSession", JSON.stringify({
        config,
        timeSpent,
        studyPages,
        currentPageIndex,
        showFinalQuiz,
        showPageQuiz
      }));
    }
  }, [config, timeSpent, studyPages, currentPageIndex, showFinalQuiz, showPageQuiz]);
"""

old_mount = """  useEffect(() => {
    fetchSinglePage(1);
    camera.startCamera();
    return () => {
      camera.stopCamera();
    };
  }, []);"""

new_mount = """  useEffect(() => {
    const saved = sessionStorage.getItem("activeSession");
    if (saved && (!location.state || location.state.config?.concept === "Unknown Concept")) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.config && parsed.config.concept !== "Unknown Concept") {
          // Restore from session storage
          setStudyPages(parsed.studyPages || []);
          setCurrentPageIndex(parsed.currentPageIndex || 0);
          setTimeSpent(parsed.timeSpent || 0);
          if (parsed.showFinalQuiz) setShowFinalQuiz(true);
          if (parsed.showPageQuiz) setShowPageQuiz(true);
          camera.startCamera();
          return () => camera.stopCamera();
        }
      } catch (e) {
        console.error("Failed to parse session storage", e);
      }
    }
    
    // Normal initialization
    if (studyPages.length === 0) {
      fetchSinglePage(1);
    }
    camera.startCamera();
    return () => {
      camera.stopCamera();
    };
  }, []);"""

content = content.replace(old_mount, use_effect_save + "\n" + new_mount)

# Also need to fix where config is initialized
old_config = """  const config = location.state?.config || { concept: "Unknown Concept", estimatedTime: 30 };"""
new_config = """  let initialConfig = location.state?.config || { concept: "Unknown Concept", estimatedTime: 30 };
  const savedSessionStr = sessionStorage.getItem("activeSession");
  if ((!location.state || !location.state.config) && savedSessionStr) {
    try {
      const parsed = JSON.parse(savedSessionStr);
      if (parsed.config && parsed.config.concept) {
        initialConfig = parsed.config;
      }
    } catch (e) {}
  }
  const config = initialConfig;"""

content = content.replace(old_config, new_config)

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/frontend/src/pages/StudySession.jsx", "w") as f:
    f.write(content)
