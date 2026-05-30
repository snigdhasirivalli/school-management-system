import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";
import StudentDetailsModal from "../components/StudentDetailsModal";

function Classes() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("classes");
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Input states
  const [newClassName, setNewClassName] = useState("");
  const [newSectionName, setNewSectionName] = useState("A");
  const [selectedClassForSection, setSelectedClassForSection] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");

  // Student viewing states
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionStudents, setSectionStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      if (activeTab === "classes") {
        const res = await axios.get("students/classes/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClasses(res.data);
        if (res.data.length > 0) {
          setSelectedClassForSection(res.data[0].id);
        }
      } else {
        const res = await axios.get("students/subjects/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubjects(res.data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load school structures. Please make sure you are logged in as admin.");
    } finally {
      setLoading(false);
    }
  };

  // View students in section
  const handleViewSectionStudents = async (cls, sec) => {
    setSelectedSection({ ...sec, className: cls.name });
    setIsStudentsModalOpen(true);
    setLoadingStudents(true);
    try {
      const token = localStorage.getItem("access");
      const res = await axios.get(`students/all/?section=${sec.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSectionStudents(res.data);
    } catch (err) {
      console.error("Failed to load students in section:", err);
      alert("Failed to load students in section.");
    } finally {
      setLoadingStudents(false);
    }
  };

  // Add Class
  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    try {
      const token = localStorage.getItem("access");
      await axios.post("students/classes/", { name: newClassName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewClassName("");
      alert("Class added successfully!");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to add class. Ensure it doesn't already exist.");
    }
  };

  // Delete Class
  const handleDeleteClass = async (id) => {
    if (!window.confirm("Are you sure? Deleting a class deletes all its sections, and removes assignments for students and teachers!")) return;
    try {
      const token = localStorage.getItem("access");
      await axios.delete(`students/classes/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Class deleted successfully.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete class.");
    }
  };

  // Add Section
  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!selectedClassForSection) return;
    try {
      const token = localStorage.getItem("access");
      await axios.post("students/sections/", {
        name: newSectionName,
        school_class: selectedClassForSection
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Section added successfully!");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to add section. Make sure this section name is unique for the class.");
    }
  };

  // Delete Section
  const handleDeleteSection = async (id) => {
    if (!window.confirm("Are you sure you want to delete this section?")) return;
    try {
      const token = localStorage.getItem("access");
      await axios.delete(`students/sections/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Section deleted successfully.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete section.");
    }
  };

  // Add Subject
  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    try {
      const token = localStorage.getItem("access");
      await axios.post("students/subjects/", { name: newSubjectName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewSubjectName("");
      alert("Subject added successfully!");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to add subject. Ensure it doesn't already exist.");
    }
  };

  // Delete Subject
  const handleDeleteSubject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject? This might affect teacher allocations and timetables.")) return;
    try {
      const token = localStorage.getItem("access");
      await axios.delete(`students/subjects/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Subject deleted successfully.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete subject.");
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h1>🏫 School Structure Configuration</h1>
            <p>Define classes, class sections, and subjects for the current academic session</p>
          </div>
        </div>

        {error && (
          <div className="badge badge-danger btn-block" style={{ padding: "0.75rem", borderRadius: "8px", margin: "1rem 0" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Tab Selection */}
        <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
          <button
            className={`btn ${activeTab === "classes" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("classes")}
          >
            🏫 Classes & Sections
          </button>
          <button
            className={`btn ${activeTab === "subjects" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("subjects")}
          >
            📚 Subject List
          </button>
        </div>

        {loading ? (
          <p>Loading school configuration parameters...</p>
        ) : activeTab === "classes" ? (
          // Classes & Sections Tab
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "1rem" }}>
            
            {/* Class Directory List */}
            <div className="content-card">
              <h3 style={{ marginBottom: "1.5rem", color: "var(--primary)" }}>Class List</h3>
              
              <form onSubmit={handleAddClass} style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
                <input
                  type="text"
                  placeholder="e.g. Class 11"
                  className="form-control"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary">➕ Add Class</button>
              </form>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Class Name</th>
                      <th>Sections</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((cls) => (
                      <tr key={cls.id}>
                        <td style={{ fontWeight: "600" }}>{cls.name}</td>
                        <td>
                          {cls.sections && cls.sections.length > 0 ? (
                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                              {cls.sections.map((sec) => (
                                <span
                                  key={sec.id}
                                  className="badge badge-info"
                                  style={{
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                    padding: "0.35rem 0.6rem",
                                    borderRadius: "6px",
                                    transition: "all 0.2s"
                                  }}
                                  title="Click to view students in section"
                                  onClick={() => handleViewSectionStudents(cls, sec)}
                                >
                                  {sec.name}
                                  <span
                                    style={{
                                      fontSize: "0.85rem",
                                      fontWeight: "bold",
                                      marginLeft: "0.35rem",
                                      cursor: "pointer",
                                      color: "rgba(255, 255, 255, 0.75)",
                                      transition: "color 0.2s"
                                    }}
                                    title="Delete section"
                                    onMouseOver={(e) => e.target.style.color = "#ff4d4f"}
                                    onMouseOut={(e) => e.target.style.color = "rgba(255, 255, 255, 0.75)"}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSection(sec.id);
                                    }}
                                  >
                                    ×
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No sections</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteClass(cls.id)}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section Creation panel */}
            <div className="content-card" style={{ height: "fit-content" }}>
              <h3 style={{ marginBottom: "1.5rem", color: "var(--primary)" }}>Add Section to Class</h3>
              <form onSubmit={handleAddSection}>
                <div className="form-group">
                  <label>Select Target Class</label>
                  <select
                    className="form-select"
                    value={selectedClassForSection}
                    onChange={(e) => setSelectedClassForSection(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Choose Class --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginTop: "1rem" }}>
                  <label>Section Name</label>
                  <select
                    className="form-select"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    required
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-success" style={{ marginTop: "1.5rem", width: "100%" }}>
                  ➕ Create Section
                </button>
              </form>
            </div>

          </div>
        ) : (
          // Subjects Tab
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem", marginTop: "1rem" }}>
            
            {/* Subject Directory List */}
            <div className="content-card">
              <h3 style={{ marginBottom: "1.5rem", color: "var(--primary)" }}>Subject Registry</h3>
              
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Subject Name</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: "center" }}>No academic subjects created yet.</td>
                      </tr>
                    ) : (
                      subjects.map((sub) => (
                        <tr key={sub.id}>
                          <td><code>{sub.id}</code></td>
                          <td style={{ fontWeight: "600" }}>{sub.name}</td>
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteSubject(sub.id)}
                            >
                              🗑️ Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Subject panel */}
            <div className="content-card" style={{ height: "fit-content" }}>
              <h3 style={{ marginBottom: "1.5rem", color: "var(--primary)" }}>Add New Subject</h3>
              <form onSubmit={handleAddSubject}>
                <div className="form-group">
                  <label>Subject Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    className="form-control"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: "1.5rem", width: "100%" }}>
                  ➕ Create Subject
                </button>
              </form>
            </div>

          </div>
        )}
      </main>

      {/* Section Students Modal */}
      {isStudentsModalOpen && selectedSection && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: "700px" }}>
            <div className="modal-header">
              <h3>👥 Students in {selectedSection.className} - Sec {selectedSection.name}</h3>
              <button className="close-btn" onClick={() => setIsStudentsModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              {loadingStudents ? (
                <p style={{ textAlign: "center", padding: "1.5rem" }}>Loading section students...</p>
              ) : sectionStudents.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: "1.5rem" }}>
                  No students registered in this section yet.
                </p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Admission No</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Gender</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectionStudents.map((student) => (
                        <tr key={student.id}>
                          <td><code>{student.admission_number}</code></td>
                          <td>
                            <span
                              style={{
                                color: "var(--primary)",
                                fontWeight: "600",
                                cursor: "pointer",
                                textDecoration: "underline"
                              }}
                              title="Click to view full details"
                              onClick={() => setSelectedStudentDetails(student)}
                            >
                              {student.user_details?.username || "N/A"}
                            </span>
                          </td>
                          <td>{student.user_details?.email || "N/A"}</td>
                          <td style={{ textTransform: "capitalize" }}>{student.gender}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsStudentsModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Nested Detailed Student Profile Modal */}
      {selectedStudentDetails && (
        <StudentDetailsModal
          student={selectedStudentDetails}
          onClose={() => setSelectedStudentDetails(null)}
        />
      )}
    </div>
  );
}

export default Classes;
