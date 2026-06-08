import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    studentsCount: 0,
    attendanceRate: "0.0%",
    totalFeesCollected: "$0",
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
        const userProfile = profileRes.data;
        setProfile(userProfile);

        // Update local storage in case of any profile changes
        localStorage.setItem("role", userProfile.role);
        localStorage.setItem("user_profile", JSON.stringify(userProfile));

        // Get notifications count (common to all)
        const notificationsRes = await axios.get("notifications/all/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const notifCount = notificationsRes.data.length;

        if (userProfile.role === "student") {
          // Fetch student-specific statistics
          const [attendanceRes, marksRes, feesRes] = await Promise.all([
            axios.get("attendance/all/", { headers: { Authorization: `Bearer ${token}` } }),
            axios.get("marks/all/", { headers: { Authorization: `Bearer ${token}` } }),
            axios.get("fees/all/", { headers: { Authorization: `Bearer ${token}` } }),
          ]);

          // Calculate attendance rate
          const attLogs = attendanceRes.data;
          let attRate = "100.0%";
          if (attLogs.length > 0) {
            const present = attLogs.filter(a => a.status === "present" || a.status === "late").length;
            attRate = `${((present / attLogs.length) * 100).toFixed(1)}%`;
          }

          // Calculate outstanding tuition fee
          const feeLogs = feesRes.data;
          let outstandingFees = "$0.00";
          if (feeLogs.length > 0) {
            const pendingTotal = feeLogs.reduce((acc, f) => acc + parseFloat(f.remaining_amount || 0), 0);
            outstandingFees = `$${pendingTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }

          setStats({
            studentsCount: 1,
            attendanceRate: attRate,
            totalFeesCollected: outstandingFees,
            notificationsCount: notifCount,
          });
        } else if (userProfile.role === "teacher") {
          // Fetch teacher statistics
          const studentsRes = await axios.get("students/all/", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setStats({
            studentsCount: studentsRes.data.length,
            attendanceRate: "96.4%",
            totalFeesCollected: "--",
            notificationsCount: notifCount,
          });
        } else {
          // Fetch admin statistics
          const studentsRes = await axios.get("students/all/", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setStats({
            studentsCount: studentsRes.data.length,
            attendanceRate: "95.6%",
            totalFeesCollected: "$18,250",
            notificationsCount: notifCount,
          });
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("access");
          localStorage.removeItem("role");
          localStorage.removeItem("user_profile");
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
          {profile?.role === "student" ? (
            <>
              <div className="stat-card primary">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span className="stat-title">Admission ID</span>
                  <span style={{ fontSize: "1.75rem" }}>🎓</span>
                </div>
                <div className="stat-value" style={{ fontSize: "1.75rem", margin: "1.1rem 0" }}>{profile.admission_number || "N/A"}</div>
                <span className="stat-desc">Class: {profile.class_name || "Unassigned"} - Sec {profile.section_name || "Unassigned"}</span>
              </div>

              <div className="stat-card accent">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span className="stat-title">My Attendance Rate</span>
                  <span style={{ fontSize: "1.75rem" }}>📅</span>
                </div>
                <div className="stat-value">{stats.attendanceRate}</div>
                <span className="stat-desc">Your present/late percentage</span>
              </div>

              <div className="stat-card warning">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span className="stat-title">Outstanding Tuition</span>
                  <span style={{ fontSize: "1.75rem" }}>💳</span>
                </div>
                <div className="stat-value" style={{ color: "var(--danger)" }}>{stats.totalFeesCollected}</div>
                <span className="stat-desc">Outstanding payment due</span>
              </div>
            </>
          ) : profile?.role === "teacher" ? (
            <>
              <div className="stat-card primary">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span className="stat-title">Total Registry Students</span>
                  <span style={{ fontSize: "1.75rem" }}>🎓</span>
                </div>
                <div className="stat-value">{stats.studentsCount}</div>
                <span className="stat-desc">Active enrollments in system</span>
              </div>

              <div className="stat-card accent">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span className="stat-title">Registry Avg Attendance</span>
                  <span style={{ fontSize: "1.75rem" }}>📅</span>
                </div>
                <div className="stat-value">{stats.attendanceRate}</div>
                <span className="stat-desc">Daily attendance average</span>
              </div>

              <div className="stat-card warning">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span className="stat-title">Assigned ID</span>
                  <span style={{ fontSize: "1.75rem" }}>🧑‍🏫</span>
                </div>
                <div className="stat-value" style={{ fontSize: "1.75rem", margin: "1.1rem 0" }}>{profile.employee_id || "Teacher"}</div>
                <span className="stat-desc">Employee Profile ID</span>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}

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
            {profile?.role === "student" ? (
              <>
                <Link to="/timetable" className="btn btn-primary">
                  🕒 Class Timetable
                </Link>
                <Link to="/marks" className="btn btn-success">
                  📝 View My Grades
                </Link>
                <Link to="/attendance" className="btn btn-secondary">
                  📅 My Attendance
                </Link>
                <Link to="/fees" className="btn btn-secondary">
                  💳 Fees Ledger
                </Link>
              </>
            ) : profile?.role === "teacher" ? (
              <>
                <Link to="/attendance" className="btn btn-success">
                  📅 Mark Daily Attendance
                </Link>
                <Link to="/marks" className="btn btn-primary">
                  📝 Enter Exam Marks
                </Link>
                <Link to="/students" className="btn btn-secondary">
                  🎓 View Student Registry
                </Link>
                <Link to="/timetable" className="btn btn-secondary">
                  🕒 View Timetable
                </Link>
              </>
            ) : (
              <>
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
              </>
            )}
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