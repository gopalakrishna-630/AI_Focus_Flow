import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Modal } from "../components/Modal";
import { showToast } from "../components/Toast";
import { 
  Search, 
  Trash2, 
  Eye, 
  Calendar, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  Award,
  AlertTriangle,
  Loader2
} from "lucide-react";
import "../styles/analytics.css"; // contains table rules

export const SessionHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [prodFilter, setProdFilter] = useState("all");

  // Sorting
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc"); // "asc" | "desc"

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Details Modal
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await api.getSessions();
      setSessions(data);
    } catch (err) {
      showToast("Failed to fetch session history.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = (session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleDeleteSession = async (id, e) => {
    e.stopPropagation(); // prevent row click triggers
    if (window.confirm("Are you sure you want to delete this focus session record?")) {
      try {
        await api.deleteSession(id);
        showToast("Session record purged.", "success");
        loadSessions(); // reload list
      } catch {
        showToast("Could not purge session.", "error");
      }
    }
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortField(field);
    setSortDirection(isAsc ? "desc" : "asc");
    setCurrentPage(1); // reset to first page on sort change
  };

  // Helper formatting functions
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getProductivityBadge = (rating) => {
    switch (rating) {
      case "Excellent": return <span className="badge badge-success">Excellent</span>;
      case "Good": return <span className="badge badge-success" style={{ filter: "hue-rotate(60deg)" }}>Good</span>;
      case "Moderate": return <span className="badge badge-warning">Moderate</span>;
      default: return <span className="badge badge-danger">Low</span>;
    }
  };

  // 1. Apply Filtering and Searching
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.emotion?.toLowerCase().includes(searchText.toLowerCase()) || 
      session.productivity?.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus = statusFilter === "all" || session.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesProd = prodFilter === "all" || session.productivity?.toLowerCase() === prodFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesProd;
  });

  // 2. Apply Sorting
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    let fieldA = a[sortField];
    let fieldB = b[sortField];

    if (sortField === "date") {
      fieldA = new Date(a.date).getTime();
      fieldB = new Date(b.date).getTime();
    }

    if (fieldA < fieldB) return sortDirection === "asc" ? -1 : 1;
    if (fieldA > fieldB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // 3. Apply Pagination boundaries
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedSessions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedSessions.length / itemsPerPage);

  return (
    <div style={{ flexGrow: 1 }}>
      {/* Header section */}
      <div className="analytics-header-row" style={{ marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "4px" }}>Session History</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>View, search, and manage historical focus logs.</p>
        </div>
      </div>

      {/* Searching and filtering row */}
      <div className="history-controls-row">
        <div className="history-filters">
          {/* Text searching input */}
          <div className="search-input-wrapper">
            <Search className="search-icon-inside" size={16} />
            <input
              type="text"
              placeholder="Search emotion or productivity..."
              className="form-control search-input-field"
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Productivity Filter dropdown */}
          <select 
            className="filter-select-element"
            value={prodFilter}
            onChange={(e) => { setProdFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Productivity Levels</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="moderate">Moderate</option>
            <option value="low">Low</option>
          </select>

          {/* Status Filter dropdown */}
          <select 
            className="filter-select-element"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="discarded">Discarded</option>
          </select>
        </div>
      </div>

      {/* Dynamic Main Body Content states */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px" }}>
          <Loader2 size={32} style={{ animation: "spin 1.5s linear infinite" }} />
          <p style={{ marginTop: "12px", color: "var(--text-secondary)" }}>Fetching historical logs...</p>
        </div>
      ) : currentItems.length === 0 ? (
        <div className="glass-card empty-state-card">
          <SlidersHorizontal className="empty-state-icon" />
          <h3>No Focus Sessions Found</h3>
          <p>Try clearing filters or start a new tracking session to record data.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort("date")}>
                    Date {sortField === "date" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="sortable" onClick={() => handleSort("duration")}>
                    Duration {sortField === "duration" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="sortable" onClick={() => handleSort("focusScore")}>
                    Focus Score {sortField === "focusScore" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th>Distraction</th>
                  <th>Drowsiness</th>
                  <th className="sortable" onClick={() => handleSort("productivity")}>
                    Productivity {sortField === "productivity" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((session) => (
                  <tr key={session.id}>
                    <td>{formatDate(session.date)}</td>
                    <td>{formatDuration(session.duration)}</td>
                    <td style={{ fontWeight: "700", color: "var(--accent-cyan)" }}>
                      {session.focusScore}%
                    </td>
                    <td>{formatDuration(session.distractionTime)}</td>
                    <td>{session.drowsiness}</td>
                    <td>{getProductivityBadge(session.productivity)}</td>
                    <td>
                      <span className="badge badge-success">{session.status}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={actionsCellWrap}>
                        <button 
                          className="btn btn-secondary" 
                          style={smallActionBtn}
                          onClick={() => handleOpenDetails(session)}
                          title="View session details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ ...smallActionBtn, color: "var(--status-red)" }}
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          title="Delete session"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Row */}
          <div className="pagination-row">
            <div className="pagination-info">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedSessions.length)} of {sortedSessions.length} sessions
            </div>
            <div className="pagination-buttons">
              <button 
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Details modal popup */}
      {selectedSession && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title="Focus Session Details"
          size="md"
        >
          <div style={detailGridStyle}>
            <div style={detailMetricStyle}>
              <Calendar size={18} color="var(--text-muted)" />
              <div>
                <div style={detailLabelStyle}>Start Timestamp</div>
                <div style={detailValueStyle}>{formatDate(selectedSession.date)}</div>
              </div>
            </div>

            <div style={detailMetricStyle}>
              <TrendingUp size={18} color="var(--accent-cyan)" />
              <div>
                <div style={detailLabelStyle}>Average Focus Index</div>
                <div style={detailValueStyle}>{selectedSession.focusScore}%</div>
              </div>
            </div>

            <div style={detailMetricStyle}>
              <Activity size={18} color="var(--status-green)" />
              <div>
                <div style={detailLabelStyle}>Session Duration</div>
                <div style={detailValueStyle}>{formatDuration(selectedSession.duration)}</div>
              </div>
            </div>

            <div style={detailMetricStyle}>
              <AlertTriangle size={18} color="var(--status-yellow)" />
              <div>
                <div style={detailLabelStyle}>Distraction Interrupts</div>
                <div style={detailValueStyle}>{formatDuration(selectedSession.distractionTime)}</div>
              </div>
            </div>

            <div style={detailMetricStyle}>
              <Award size={18} color="var(--accent-purple)" />
              <div>
                <div style={detailLabelStyle}>Productivity Tier</div>
                <div style={detailValueStyle}>{selectedSession.productivity}</div>
              </div>
            </div>

            <div style={detailMetricStyle}>
              <SlidersHorizontal size={18} color="var(--text-muted)" />
              <div>
                <div style={detailLabelStyle}>Dominant Emotion & fatigue</div>
                <div style={detailValueStyle}>
                  {selectedSession.emotion} (Drowsiness: {selectedSession.drowsiness})
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions-row centered">
            <button className="btn btn-primary" onClick={() => setIsModalOpen(false)}>
              Close Details
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Styling structures
const actionsCellWrap = {
  display: "flex",
  gap: "6px",
  justifyContent: "flex-end"
};

const smallActionBtn = {
  padding: "6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "6px"
};

const detailGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  margin: "12px 0 24px 0"
};

const detailMetricStyle = {
  display: "flex",
  gap: "12px",
  alignItems: "flex-start",
  backgroundColor: "var(--surface-light)",
  padding: "16px",
  borderRadius: "8px",
  border: "1px solid var(--border)"
};

const detailLabelStyle = {
  fontSize: "0.75rem",
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  marginBottom: "4px"
};

const detailValueStyle = {
  fontSize: "0.95rem",
  fontWeight: "600",
  color: "var(--text-primary)"
};

export default SessionHistory;
