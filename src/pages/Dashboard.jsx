import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    studentsCount: 0,
    attendanceRate: "94.2%",
    totalFeesCollected: "$12,450",
    notificationsCount: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/");
      return;
    }

    const fetchProfileAndStats = async () => {
      try {
        const profileRes = await axios.get("profile/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(profileRes.data);

        // Fetch students to get the count
        const studentsRes = await axios.get("students/all/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const notificationsRes = await axios.get("notifications/all/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStats({
          studentsCount: studentsRes.data.length,
          attendanceRate: "95.6%",
          totalFeesCollected: "$18,250",
          notificationsCount: notificationsRes.data.length,
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("access");
          navigate("/");
        }
      }
    };

    fetchProfileAndStats();
  }, [navigate]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h1>📊 System Dashboard</h1>
            <p>Welcome back, {profile ? `${profile.username} (${profile.role})` : "loading..."}</p>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="stat-card primary">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span className="stat-title">Total Students</span>
              <span style={{ fontSize: "1.75rem" }}>🎓</span>
            </div>
            <div className="stat-value">{stats.studentsCount}</div>
            <span className="stat-desc">Active enrollments in system</span>
          </div>

          <div className="stat-card accent">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span className="stat-title">Avg Attendance</span>
              <span style={{ fontSize: "1.75rem" }}>📅</span>
            </div>
            <div className="stat-value">{stats.attendanceRate}</div>
            <span className="stat-desc">Daily attendance average</span>
          </div>

          <div className="stat-card warning">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span className="stat-title">Fees Collected</span>
              <span style={{ fontSize: "1.75rem" }}>💳</span>
            </div>
            <div className="stat-value">{stats.totalFeesCollected}</div>
            <span className="stat-desc">Current term collection rate</span>
          </div>

          <div className="stat-card" style={{ borderRight: "4px solid var(--success)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span className="stat-title">Active Bulletins</span>
              <span style={{ fontSize: "1.75rem" }}>🔔</span>
            </div>
            <div className="stat-value">{stats.notificationsCount}</div>
            <span className="stat-desc">Global bulletins broadcasted</span>
          </div>
        </div>

        <div className="content-card">
          <h2 style={{ marginBottom: "1rem" }}>⚡ Quick Actions</h2>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link to="/add-student" className="btn btn-primary">
              ➕ Add New Student
            </Link>
            <Link to="/students" className="btn btn-secondary">
              🎓 View Student Registry
            </Link>
            <Link to="/attendance" className="btn btn-success">
              📅 Mark Daily Attendance
            </Link>
            <Link to="/marks" className="btn btn-secondary">
              📝 Enter Exam Marks
            </Link>
          </div>
        </div>

        <div className="content-card">
          <h2 style={{ marginBottom: "1rem" }}>🏫 System Information</h2>
          <p style={{ color: "var(--text-secondary)" }}>
            Academix Pro is a complete School Management System providing full control over student enrollment,
            daily attendance tracking, grade distribution, financial transactions, and internal communications.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;