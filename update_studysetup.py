import re

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/frontend/src/pages/StudySetup.jsx", "r") as f:
    content = f.read()

# We need to add state for materials, source, and selectedMaterial
new_imports = """import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Target, Clock, Zap, Loader2, FileText, BrainCircuit } from "lucide-react";"""
content = re.sub(r'import React.*?from "lucide-react";', new_imports, content, flags=re.DOTALL)

state_vars = """export const StudySetup = () => {
  const [concept, setConcept] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [incompleteSession, setIncompleteSession] = useState(null);
  const [source, setSource] = useState("ai");
  const [materials, setMaterials] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState(new Set());
  const navigate = useNavigate();

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
      console.error("Failed to fetch materials", e);
    }
  };

  const toggleMaterial = (id) => {
    setSelectedMaterials(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };
"""

content = re.sub(r'export const StudySetup = \(\) => {.*?const navigate = useNavigate\(\);', state_vars, content, flags=re.DOTALL)

api_call = """      const response = await fetch(`${API_URL}/api/ai/create-session`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            concept,
            source: source,
            material_ids: Array.from(selectedMaterials)
        })
      });"""

content = re.sub(r'const response = await fetch.*?body: JSON.stringify\(\{ concept \}\)\s*\}\);', api_call, content, flags=re.DOTALL)


ui_insert = """
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button 
                onClick={() => setSource("ai")} 
                style={{ flex: 1, padding: "1rem", borderRadius: "8px", border: source === "ai" ? "2px solid var(--accent-cyan)" : "1px solid var(--border)", background: source === "ai" ? "rgba(6, 182, 212, 0.1)" : "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
                <BrainCircuit size={20} color={source === "ai" ? "var(--accent-cyan)" : "white"} /> AI Knowledge
            </button>
            <button 
                onClick={() => setSource("materials")} 
                style={{ flex: 1, padding: "1rem", borderRadius: "8px", border: source === "materials" ? "2px solid var(--accent-cyan)" : "1px solid var(--border)", background: source === "materials" ? "rgba(6, 182, 212, 0.1)" : "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
                <FileText size={20} color={source === "materials" ? "var(--accent-cyan)" : "white"} /> My Materials
            </button>
        </div>

        {source === "materials" && (
            <div style={{ marginBottom: "20px", padding: "15px", borderRadius: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "var(--text-secondary)" }}>Select Source Materials:</h4>
                {materials.length === 0 ? (
                    <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>No materials found. Upload some first.</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "150px", overflowY: "auto" }}>
                        {materials.map(m => (
                            <div key={m.id} onClick={() => toggleMaterial(m.id)} style={{ padding: "8px", borderRadius: "4px", background: selectedMaterials.has(m.id) ? "rgba(6, 182, 212, 0.2)" : "rgba(255,255,255,0.05)", cursor: "pointer", border: selectedMaterials.has(m.id) ? "1px solid var(--accent-cyan)" : "1px solid transparent" }}>
                                {m.filename}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        <input 
"""

content = content.replace('<input \n          type="text"', ui_insert)
content = content.replace('disabled={!concept.trim()}', 'disabled={!concept.trim() || (source === "materials" && selectedMaterials.size === 0)}')

with open("/home/gopalakrishna/Documents/AI_Focus_Flow/frontend/src/pages/StudySetup.jsx", "w") as f:
    f.write(content)
