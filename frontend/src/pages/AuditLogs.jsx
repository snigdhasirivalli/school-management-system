import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";
import { TableSkeleton } from "../components/SkeletonLoader";
import { useToast } from "../context/ToastContext";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      showToast("Access denied. Admin role required.", "error");
      navigate("/dashboard");
      return;
    }
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [search, actionFilter, logs]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      if (!token) return;
      const res = await axios.get("accounts/audit-logs/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data);
      setFilteredLogs(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to retrieve system audit logs.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (actionFilter) {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        log =>
          (log.actor_email && log.actor_email.toLowerCase().includes(searchLower)) ||
          (log.actor_username && log.actor_username.toLowerCase().includes(searchLower)) ||
          (log.action && log.action.toLowerCase().includes(searchLower)) ||
          (log.details && log.details.toLowerCase().includes(searchLower)) ||
          (log.ip_address && log.ip_address.includes(searchLower))
      );
    }

    setFilteredLogs(filtered);
  };

  // Get list of unique actions for filters
  const uniqueActions = [...new Set(logs.map(log => log.action))];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="content-header">
          <div>
            <h1>📋 System Audit Logs</h1>
            <p style={{ color: "var(--text-secondary)" }}>Monitor administrative actions and system updates</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchLogs} disabled={loading}>
            🔄 Refresh Logs
          </button>
        </div>

        {/* Filters Panel */}
        <div className="content-card" style={{ marginBottom: "24px", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
          <div className="form-group" style={{ flex: 1, minWidth: "200px", marginBottom: 0 }}>
            <label htmlFor="search-input" style={{ marginBottom: "6px", display: "block", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Search Logs
            </label>
            <input
              id="search-input"
              type="text"
              className="form-control"
              placeholder="Search by actor, details, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ width: "200px", marginBottom: 0 }}>
            <label htmlFor="action-filter" style={{ marginBottom: "6px", display: "block", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Filter by Action
            </label>
            <select
              id="action-filter"
              className="form-control"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="">All Actions</option>
              {uniqueActions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          {(search || actionFilter) && (
            <button
              className="btn btn-secondary"
              style={{ marginTop: "20px" }}
              onClick={() => {
                setSearch("");
                setActionFilter("");
              }}
            >
              🧹 Clear
            </button>
          )}
        </div>

        {/* Logs Table */}
        <div className="content-card">
          {loading ? (
            <TableSkeleton rows={8} />
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
              🔍 No audit log records found matching your filters.
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "180px" }}>Timestamp</th>
                    <th style={{ width: "150px" }}>Actor</th>
                    <th style={{ width: "150px" }}>Action</th>
                    <th>Details</th>
                    <th style={{ width: "130px" }}>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                        {formatDate(log.timestamp)}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: "600" }}>{log.actor_username || "System"}</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{log.actor_email || ""}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${
                          log.action.includes('DELETE') ? 'danger' :
                          log.action.includes('CREATE') ? 'success' :
                          log.action.includes('UPDATE') ? 'warning' : 'accent'
                        }`} style={{ fontSize: "0.75rem" }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                        {log.details}
                      </td>
                      <td>
                        <code style={{ fontSize: "0.8rem" }}>{log.ip_address || "N/A"}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuditLogs;
