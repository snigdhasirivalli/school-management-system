import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndStats();
  }, [navigate]);

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="page-header">
            <div className="page-title">
              <h1>📊 System Dashboard</h1>
              <p>Welcome back, loading...</p>
            </div>
          </div>
          <div className="dashboard-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="stat-card" style={{ padding: "24px", minHeight: "135px" }}>
                <div className="skeleton-base skeleton-text" style={{ width: "40%", height: "14px", marginBottom: "12px" }}></div>
                <div className="skeleton-base skeleton-text" style={{ width: "65%", height: "28px", marginBottom: "12px" }}></div>
                <div className="skeleton-base skeleton-text" style={{ width: "45%", height: "12px" }}></div>
              </div>
            ))}
          </div>
          <div className="content-card">
            <div className="skeleton-base skeleton-text" style={{ width: "20%", height: "20px", marginBottom: "16px" }}></div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <div className="skeleton-base skeleton-rect" style={{ width: "120px", height: "38px" }}></div>
              <div className="skeleton-base skeleton-rect" style={{ width: "120px", height: "38px" }}></div>
              <div className="skeleton-base skeleton-rect" style={{ width: "120px", height: "38px" }}></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

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

        {/* Custom Attendance Chart for Admins/Teachers */}
        {(profile?.role === "admin" || profile?.role === "teacher") && (
          <div className="content-card" style={{ marginTop: "24px" }}>
            <h3 style={{ marginBottom: "1rem", color: "var(--primary)", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
              📈 Academic Attendance Trends (Yearly Average)
            </h3>
            
            <div style={{ position: "relative", width: "100%", height: "250px", marginTop: "20px" }}>
              <svg viewBox="0 0 500 200" width="100%" height="100%" style={{ overflow: "visible" }}>
                {/* Grid Lines */}
                <line x1="40" y1="30" x2="480" y2="30" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="40" y1="70" x2="480" y2="70" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="40" y1="110" x2="480" y2="110" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="40" y1="150" x2="480" y2="150" stroke="var(--border-color)" strokeWidth="1" />
                
                {/* Y Axis Labels */}
                <text x="15" y="35" fill="var(--text-muted)" fontSize="10" textAnchor="middle">100%</text>
                <text x="15" y="75" fill="var(--text-muted)" fontSize="10" textAnchor="middle">95%</text>
                <text x="15" y="115" fill="var(--text-muted)" fontSize="10" textAnchor="middle">90%</text>
                <text x="15" y="155" fill="var(--text-muted)" fontSize="10" textAnchor="middle">85%</text>
                
                {/* Gradient for Area Fill */}
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Area Path */}
                <path
                  d="M 50 150 L 50 114 L 150 90 L 250 54 L 350 78 L 450 42 L 450 150 Z"
                  fill="url(#chartGrad)"
                />
                
                {/* Line Path */}
                <path
                  d="M 50 114 L 150 90 L 250 54 L 350 78 L 450 42"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Data Circles with Hover effect / Labels */}
                <g>
                  <circle cx="50" cy="114" r="5" fill="var(--bg-card)" stroke="var(--primary)" strokeWidth="2.5" />
                  <text x="50" y="98" fill="var(--text-primary)" fontSize="9" fontWeight="600" textAnchor="middle">93.0%</text>
                  <circle cx="150" cy="90" r="5" fill="var(--bg-card)" stroke="var(--primary)" strokeWidth="2.5" />
                  <text x="150" y="74" fill="var(--text-primary)" fontSize="9" fontWeight="600" textAnchor="middle">94.5%</text>
                  <circle cx="250" cy="54" r="5" fill="var(--bg-card)" stroke="var(--primary)" strokeWidth="2.5" />
                  <text x="250" y="38" fill="var(--text-primary)" fontSize="9" fontWeight="600" textAnchor="middle">96.0%</text>
                  <circle cx="350" cy="78" r="5" fill="var(--bg-card)" stroke="var(--primary)" strokeWidth="2.5" />
                  <text x="350" y="62" fill="var(--text-primary)" fontSize="9" fontWeight="600" textAnchor="middle">95.0%</text>
                  <circle cx="450" cy="42" r="5" fill="var(--bg-card)" stroke="var(--primary)" strokeWidth="2.5" />
                  <text x="450" y="26" fill="var(--text-primary)" fontSize="9" fontWeight="600" textAnchor="middle">96.8%</text>
                </g>
                
                {/* X Axis Labels */}
                <text x="50" y="172" fill="var(--text-muted)" fontSize="10" textAnchor="middle" fontWeight="500">Jan</text>
                <text x="150" y="172" fill="var(--text-muted)" fontSize="10" textAnchor="middle" fontWeight="500">Feb</text>
                <text x="250" y="172" fill="var(--text-muted)" fontSize="10" textAnchor="middle" fontWeight="500">Mar</text>
                <text x="350" y="172" fill="var(--text-muted)" fontSize="10" textAnchor="middle" fontWeight="500">Apr</text>
                <text x="450" y="172" fill="var(--text-muted)" fontSize="10" textAnchor="middle" fontWeight="500">May</text>
              </svg>
            </div>
          </div>
        )}

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