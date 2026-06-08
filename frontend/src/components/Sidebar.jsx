import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    navigate("/");
  };

  const role = localStorage.getItem("role") || "student";

  const allMenuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "📊", roles: ["admin", "teacher", "student"] },
    { path: "/classes", label: "Classes & Sections", icon: "🏫", roles: ["admin"] },
    { path: "/teachers", label: "Teachers", icon: "🧑‍🏫", roles: ["admin"] },
    { path: "/students", label: "Students", icon: "🎓", roles: ["admin", "teacher"] },
    { path: "/add-student", label: "Add Student", icon: "➕", roles: ["admin"] },
    { path: "/attendance", label: "Attendance", icon: "📅", roles: ["admin", "teacher", "student"] },
    { path: "/marks", label: "Marks & Exams", icon: "📝", roles: ["admin", "teacher", "student"] },
    { path: "/fees", label: "Fees Module", icon: "💳", roles: ["admin", "student"] },
    { path: "/timetable", label: "Timetable", icon: "🕒", roles: ["admin", "teacher", "student"] },
    { path: "/notifications", label: "Notifications", icon: "🔔", roles: ["admin", "teacher", "student"] },
    { path: "/reports", label: "Reports", icon: "📊", roles: ["admin"] }
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(role));

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2L2 9L16 16L30 9L16 2Z" fill="url(#logoGrad)" />
          <path d="M2 17L16 24L30 17" stroke="url(#logoGrad)" strokeWidth="3" strokeLinecap="round" />
          <path d="M6 22L16 29L26 22" stroke="url(#logoGrad)" strokeWidth="3" strokeLinecap="round" />
          <defs>
            <linearGradient id="logoGrad" x1="2" y1="2" x2="30" y2="29" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--primary)" />
              <stop offset="1" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
        </svg>
        <span className="logo-text">Academix Pro</span>
      </div>
      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li
            key={item.path}
            className={`sidebar-item ${location.pathname === item.path ? "active" : ""}`}
          >
            <Link to={item.path}>
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        <button
          onClick={toggleTheme}
          className="btn btn-secondary btn-block btn-sm"
          style={{
            marginBottom: "0.5rem",
            justifyContent: "center",
            background: "var(--bg-main)",
            borderColor: "var(--border-color)",
            fontWeight: "600"
          }}
        >
          {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>
        <button
          onClick={handleLogout}
          className="btn btn-danger btn-block btn-sm"
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
