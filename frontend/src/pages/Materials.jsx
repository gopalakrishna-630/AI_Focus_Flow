import React, { useState, useEffect, useRef } from "react";
import { Upload, FileText, Send, CheckCircle2, Loader2, FolderUp } from "lucide-react";
import { showToast } from "../components/Toast";
import "../styles/global.css";

export const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { sender: "ai", text: "Hello! Select one or more materials from your library and ask me anything about them." }
  ]);
  
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await fetch(`${API_URL}/api/materials`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.materials) {
        setMaterials(data.materials);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to fetch materials.", "error");
    }
  };

  const handleFilesUpload = async (files) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    let validFilesCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.endsWith('.pdf') || file.name.endsWith('.txt')) {
        formData.append("file", file);
        validFilesCount++;
      }
    }

    if (validFilesCount === 0) {
      showToast("No valid .pdf or .txt files found.", "error");
      setIsUploading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/materials/upload`, {
        method: "POST",
        credentials: "include",
        body: formData
      });
      const data = await res.json();
      
      if (res.ok && data.materials) {
        showToast(`${data.materials.length} files uploaded successfully!`, "success");
        setMaterials(prev => [...prev, ...data.materials]);
      } else if (res.ok && data.material) {
        showToast(`File uploaded successfully!`, "success");
        setMaterials(prev => [...prev, data.material]);
      } else {
        showToast(data.error || "Upload failed.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("An error occurred during upload.", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const toggleMaterialSelection = (id) => {
    setSelectedMaterials(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    if (selectedMaterials.size === 0) {
      showToast("Please select at least one material first.", "error");
      return;
    }

    const currentQuestion = question.trim();
    setQuestion("");
    setChatHistory(prev => [...prev, { sender: "user", text: currentQuestion }]);
    setIsAsking(true);

    try {
      const res = await fetch(`${API_URL}/api/materials/ask`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion,
          material_ids: Array.from(selectedMaterials)
        })
      });
      const data = await res.json();
      
      if (res.ok && data.answer) {
        setChatHistory(prev => [...prev, { sender: "ai", text: data.answer }]);
      } else {
        setChatHistory(prev => [...prev, { sender: "ai", text: data.error || "Failed to analyze materials." }]);
      }
    } catch (e) {
      console.error(e);
      setChatHistory(prev => [...prev, { sender: "ai", text: "Network error. Please try again." }]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>Study Materials Q&A</h1>
          <p style={{ color: "var(--text-secondary)" }}>Upload folders or files and ask questions directly against them.</p>
        </div>
        
        <div style={{ display: "flex", gap: "10px" }}>
          {/* File Upload */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => handleFilesUpload(e.target.files)} 
            accept=".pdf,.txt" 
            multiple
            style={{ display: "none" }} 
            id="file-upload" 
          />
          <label 
            htmlFor="file-upload" 
            className="btn btn-primary" 
            style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--accent-purple)", border: "none" }}
          >
            {isUploading ? <Loader2 size={18} className="spin" /> : <Upload size={18} />}
            Upload Files
          </label>

          {/* Folder Upload */}
          <input 
            type="file" 
            ref={folderInputRef} 
            onChange={(e) => handleFilesUpload(e.target.files)} 
            webkitdirectory="true"
            directory="true"
            multiple
            style={{ display: "none" }} 
            id="folder-upload" 
          />
          <label 
            htmlFor="folder-upload" 
            className="btn btn-primary" 
            style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--accent-cyan)", border: "none", color: "#000" }}
          >
            {isUploading ? <Loader2 size={18} className="spin" /> : <FolderUp size={18} />}
            Upload Folder
          </label>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem", minHeight: "60vh" }}>
        
        {/* Left Side: Materials Library */}
        <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", height: "600px" }}>
          <h3 style={{ color: "var(--accent-cyan)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={20} /> Your Library
          </h3>
          
          <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "10px", paddingRight: "5px" }}>
            {materials.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", textAlign: "center", marginTop: "2rem" }}>No materials uploaded yet.</p>
            ) : (
              materials.map(mat => (
                <div 
                  key={mat.id} 
                  onClick={() => toggleMaterialSelection(mat.id)}
                  style={{ 
                    padding: "1rem", 
                    borderRadius: "8px", 
                    background: selectedMaterials.has(mat.id) ? "rgba(6, 182, 212, 0.15)" : "rgba(255,255,255,0.03)", 
                    border: selectedMaterials.has(mat.id) ? "1px solid var(--accent-cyan)" : "1px solid var(--border)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ color: selectedMaterials.has(mat.id) ? "var(--accent-cyan)" : "var(--text-secondary)" }}>
                    {selectedMaterials.has(mat.id) ? <CheckCircle2 size={20} /> : <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid var(--border)" }} />}
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ color: "var(--text-primary)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", fontWeight: selectedMaterials.has(mat.id) ? "500" : "normal" }}>
                      {mat.filename}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Q&A Chat */}
        <div className="glass-card" style={{ padding: "0", display: "flex", flexDirection: "column", height: "600px", overflow: "hidden" }}>
          
          <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: 0, color: "var(--text-primary)" }}>Ask the Materials</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0.5rem 0 0 0" }}>
              {selectedMaterials.size > 0 
                ? `Ready to answer questions based on ${selectedMaterials.size} selected file(s).`
                : "Select files from your library to start asking questions."}
            </p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {chatHistory.map((msg, i) => (
              <div 
                key={i} 
                style={{ 
                  alignSelf: msg.sender === 'user' ? "flex-end" : "flex-start",
                  background: msg.sender === 'user' ? "var(--accent-purple)" : "rgba(255,255,255,0.05)",
                  color: "#fff",
                  padding: "1rem 1.5rem",
                  borderRadius: "16px",
                  borderBottomRightRadius: msg.sender === 'user' ? "4px" : "16px",
                  borderBottomLeftRadius: msg.sender === 'ai' ? "4px" : "16px",
                  maxWidth: "80%",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap"
                }}
              >
                {msg.text}
              </div>
            ))}
            {isAsking && (
              <div style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.05)", padding: "1rem 1.5rem", borderRadius: "16px", borderBottomLeftRadius: "4px", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Loader2 size={18} className="spin" /> Analyzing documents...
              </div>
            )}
          </div>

          <form onSubmit={handleAskQuestion} style={{ padding: "1rem", borderTop: "1px solid var(--border)", display: "flex", gap: "10px", background: "rgba(0,0,0,0.2)" }}>
            <input 
              type="text" 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={selectedMaterials.size > 0 ? "Ask a question about the selected materials..." : "Select materials to ask questions"}
              disabled={selectedMaterials.size === 0 || isAsking}
              style={{ 
                flex: 1, 
                padding: "1rem", 
                borderRadius: "8px", 
                border: "1px solid var(--border)", 
                background: "rgba(255,255,255,0.05)", 
                color: "#fff",
                outline: "none",
                fontSize: "1rem"
              }}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={selectedMaterials.size === 0 || isAsking || !question.trim()}
              style={{ padding: "0 1.5rem" }}
            >
              <Send size={20} />
            </button>
          </form>
          
        </div>
      </div>
    </div>
  );
};
