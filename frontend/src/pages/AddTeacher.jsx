import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";

function AddTeacher() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "teacherpassword", // Default placeholder
    employee_id: "",
    subjects: [], // IDs
    classes: [],  // IDs
    sections: [], // IDs
  });

  const [subjectsList, setSubjectsList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAcademicData();
  }, []);

  const fetchAcademicData = async () => {
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const [subjectsRes, classesRes] = await Promise.all([
        axios.get("students/subjects/", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("students/classes/", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setSubjectsList(subjectsRes.data);
      setClassesList(classesRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load subjects or classes list. Make sure you are an admin.");
    }
  };

  const handleSubjectChange = (subjectId) => {
    const isSelected = form.subjects.includes(subjectId);
    let updatedSubjects;
    if (isSelected) {
      updatedSubjects = form.subjects.filter(id => id !== subjectId);
    } else {
      updatedSubjects = [...form.subjects, subjectId];
    }
    setForm({ ...form, subjects: updatedSubjects });
  };

  const handleSectionChange = (classId, sectionId) => {
    const isSecSelected = form.sections.includes(sectionId);
    let updatedSections;
    if (isSecSelected) {
      updatedSections = form.sections.filter(id => id !== sectionId);
    } else {
      updatedSections = [...form.sections, sectionId];
    }

    // Auto-manage classes selection based on sections chosen
    let updatedClasses = [...form.classes];
    const targetClass = classesList.find(c => c.id === classId);
    
    // Check if any sections from this class are selected in updatedSections
    const hasAnySectionOfClass = targetClass?.sections?.some(sec => updatedSections.includes(sec.id));
    if (hasAnySectionOfClass) {
      if (!updatedClasses.includes(classId)) {
        updatedClasses.push(classId);
      }
    } else {
      updatedClasses = updatedClasses.filter(id => id !== classId);
    }

    setForm({ ...form, sections: updatedSections, classes: updatedClasses });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access");
      await axios.post(
        "students/teachers/",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Teacher Added Successfully!");
      navigate("/teachers");
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setError(JSON.stringify(err.response.data));
      } else {
        setError("Failed to Add Teacher. Verify employee ID uniqueness.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h1>➕ Add New Teacher</h1>
            <p>Enroll a new school faculty member, set their portal access and assign academic roles</p>
          </div>
        </div>

        {error && (
          <div className="badge badge-danger" style={{ padding: "0.75rem", borderRadius: "8px", width: "100%", textAlign: "center", display: "block", marginBottom: "1rem" }}>
            ⚠️ {error}
          </div>
        )}

        <div className="content-card">
          <form onSubmit={handleSubmit}>
            <h3 style={{ marginBottom: "1.5rem", color: "var(--primary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              👤 Teacher Portal Credentials
            </h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Teacher Full Name / Username</label>
                <input
                  type="text"
                  placeholder="e.g. Prof. Alan Turing"
                  className="form-control"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Teacher Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. turing@school.com"
                  className="form-control"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +919988776655"
                  className="form-control"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Portal Password</label>
                <input
                  type="password"
                  placeholder="e.g. teacherpassword"
                  className="form-control"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <h3 style={{ margin: "2rem 0 1.5rem 0", color: "var(--primary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              🎓 Academic Allocation
            </h3>

            <div className="form-group">
              <label>Employee ID</label>
              <input
                type="text"
                placeholder="e.g. EMP2026101"
                className="form-control"
                value={form.employee_id}
                onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                required
              />
            </div>

            {/* Subjects Selection */}
            <div style={{ marginTop: "1.5rem" }}>
              <label style={{ fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>Assign Subject(s)</label>
              {subjectsList.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No subjects defined yet. Create them in Classes & Sections.</p>
              ) : (
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  {subjectsList.map(sub => (
                    <label key={sub.id} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-main)", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={form.subjects.includes(sub.id)}
                        onChange={() => handleSubjectChange(sub.id)}
                      />
                      <span>{sub.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Class Sections Selection */}
            <div style={{ marginTop: "2rem" }}>
              <label style={{ fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>Assign Class Section(s)</label>
              {classesList.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No classes or sections configured yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {classesList.map(cls => (
                    <div key={cls.id} style={{ padding: "1rem", background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                      <strong style={{ color: "var(--primary)" }}>{cls.name}</strong>
                      <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                        {cls.sections && cls.sections.length > 0 ? (
                          cls.sections.map(sec => (
                            <label key={sec.id} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={form.sections.includes(sec.id)}
                                onChange={() => handleSectionChange(cls.id, sec.id)}
                              />
                              <span>Sec {sec.name}</span>
                            </label>
                          ))
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No sections configured</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Registering..." : "➕ Enroll Teacher"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate("/teachers")}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AddTeacher;
