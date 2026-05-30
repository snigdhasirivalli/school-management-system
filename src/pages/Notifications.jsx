import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(null);

  // Form State
  const [form, setForm] = useState({
    title: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const profileRes = await axios.get("profile/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(profileRes.data);

        const response = await axios.get("notifications/all/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(response.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch notification bulletins.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("access");

    if (!profile) {
      setError("Author profile is not loaded yet.");
      return;
    }

    try {
      await axios.post(
        "notifications/send/",
        {
          sender: profile.id,
          title: form.title,
          message: form.message,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Broadcast bulletin sent successfully!");
      setForm({ title: "", message: "" });

      // Reload notifications list
      const response = await axios.get("notifications/all/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to broadcast notification. Verify text size.");
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h1>🔔 Bulletin Board & Notifications</h1>
            <p>Broadcast announcements and view administrative notifications</p>
          </div>
        </div>

        {error && <div className="badge badge-danger btn-block" style={{ padding: "0.75rem", borderRadius: "8px", margin: "1rem 0" }}>{error}</div>}

        <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 2fr", alignItems: "start" }}>
          
          {/* Send Broadcast Form Card */}
          <div className="content-card">
            <h2 style={{ marginBottom: "1.5rem" }}>🔔 Broadcast Announcement</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Announcement Title</label>
                <input
                  type="text"
                  placeholder="e.g. Midterm Exams Schedule Release"
                  className="form-control"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Message Content</label>
                <textarea
                  placeholder="Detailed announcement details for students and faculty..."
                  className="form-textarea"
                  style={{ minHeight: "150px" }}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: "1rem" }}>
                Send Broadcast
              </button>
            </form>
          </div>

          {/* Bulletin Feed List Card */}
          <div className="content-card">
            <h2 style={{ marginBottom: "1.5rem" }}>📢 Recent Bulletins</h2>
            {loading ? (
              <p>Loading school bulletins...</p>
            ) : notifications.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>
                No announcements have been broadcasted yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {notifications.map((n) => (
                  <div key={n.id} className="notification-item">
                    <h3 style={{ color: "var(--text-primary)", fontSize: "1.1rem", marginBottom: "0.5rem", fontWeight: "600" }}>
                      📢 {n.title}
                    </h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", whiteSpace: "pre-line" }}>
                      {n.message}
                    </p>
                    <div className="notification-meta">
                      <span>👤 Posted by: <strong>{n.sender_name || "Admin"}</strong></span>
                      <span>📅 Date: {new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Notifications;
