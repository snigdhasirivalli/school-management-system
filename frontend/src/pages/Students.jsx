import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";
import StudentDetailsModal from "../components/StudentDetailsModal";

function Students() {
  const [students, setStudents] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    phone: "",
    admission_number: "",
    date_of_birth: "",
    gender: "male",
    parent_name: "",
    parent_phone: "",
    address: "",
    school_class: "",
    section: "",
  });
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);

  // Filter States
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filteredSections, setFilteredSections] = useState([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents(filterClass, filterSection);
  }, [filterClass, filterSection]);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("access");
      if (!token) return;
      const res = await axios.get("students/classes/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClassesList(res.data);
    } catch (err) {
      console.error("Failed to load classes:", err);
    }
  };

  const fetchStudents = async (classId = "", sectionId = "") => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("access");
      if (!token) {
        navigate("/");
        return;
      }
      let url = "students/all/";
      const params = [];
      if (classId) params.push(`school_class=${classId}`);
      if (sectionId) params.push(`section=${sectionId}`);
      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStudents(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch students. Make sure you are logged in as admin.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;

    try {
      const token = localStorage.getItem("access");
      await axios.delete(`students/delete/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Student deleted successfully.");
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert("Failed to delete student.");
    }
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    const classId = student.school_class || "";
    const selectedClass = classesList.find(c => c.id === parseInt(classId));
    setAvailableSections(selectedClass ? selectedClass.sections : []);

    setEditForm({
      username: student.user_details?.username || "",
      email: student.user_details?.email || "",
      phone: student.user_details?.phone || "",
      admission_number: student.admission_number || "",
      date_of_birth: student.date_of_birth || "",
      gender: student.gender || "male",
      parent_name: student.parent_name || "",
      parent_phone: student.parent_phone || "",
      address: student.address || "",
      school_class: classId,
      section: student.section || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditClassChange = (classId) => {
    setEditForm({ ...editForm, school_class: classId, section: "" });
    const selectedClass = classesList.find(c => c.id === parseInt(classId));
    setAvailableSections(selectedClass ? selectedClass.sections : []);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("access");
      await axios.put(`students/update/${editingStudent.id}/`, editForm, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Student details updated successfully!");
      setIsEditModalOpen(false);
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert("Failed to update student. Please check input values.");
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h1>🎓 Student Registry</h1>
            <p>View and manage all registered students and their details</p>
          </div>
          <div>
            <button className="btn btn-primary" onClick={() => navigate("/add-student")}>
              ➕ Add New Student
            </button>
          </div>
        </div>

        {error && <div className="badge badge-danger btn-block" style={{ padding: "0.75rem", borderRadius: "8px", margin: "1rem 0" }}>{error}</div>}

        <div className="content-card" style={{ marginBottom: "1.5rem", padding: "1.25rem 2rem" }}>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontWeight: "700", color: "var(--text-secondary)" }}>🔍 Filter Registry:</span>
            <div style={{ display: "flex", gap: "1rem", flexGrow: 1, maxWidth: "500px" }}>
              <select
                className="form-select"
                value={filterClass}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilterClass(val);
                  setFilterSection("");
                  const selectedCls = classesList.find(c => c.id === parseInt(val));
                  setFilteredSections(selectedCls ? selectedCls.sections : []);
                }}
              >
                <option value="">All Classes</option>
                {classesList.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>

              <select
                className="form-select"
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                disabled={!filterClass}
              >
                <option value="">All Sections</option>
                {filteredSections.map(sec => (
                  <option key={sec.id} value={sec.id}>Sec {sec.name}</option>
                ))}
              </select>
            </div>
            {(filterClass || filterSection) && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setFilterClass("");
                  setFilterSection("");
                  setFilteredSections([]);
                }}
              >
                🧹 Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="content-card">
          {loading ? (
            <p>Loading student directory...</p>
          ) : students.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", textAlign: "center" }}>No students registered in the database yet.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Admission No</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Class Section</th>
                    <th>Parent details</th>
                    <th>DOB</th>
                    <th>Gender</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td><code>{student.admission_number}</code></td>
                      <td>
                        <span
                          style={{
                            fontWeight: "600",
                            color: "var(--primary)",
                            cursor: "pointer",
                            textDecoration: "underline"
                          }}
                          title="Click to view full profile details"
                          onClick={() => setSelectedStudentDetails(student)}
                        >
                          {student.user_details?.username || "N/A"}
                        </span>
                      </td>
                      <td>{student.user_details?.email || "N/A"}</td>
                      <td style={{ fontWeight: "500" }}>
                        {student.class_name ? (
                          <span className="badge badge-info">
                            {student.class_name} - {student.section_name}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Not Assigned</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem" }}>
                          <strong>{student.parent_name}</strong>
                          <div style={{ color: "var(--text-muted)" }}>{student.parent_phone}</div>
                        </div>
                      </td>
                      <td>{student.date_of_birth}</td>
                      <td>
                        <span className={`badge ${student.gender === "male" ? "badge-info" : "badge-success"}`}>
                          {student.gender}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button
                            onClick={() => openEditModal(student)}
                            className="btn btn-secondary btn-sm"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="btn btn-danger btn-sm"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Edit Student Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>✏️ Edit Student Info</h3>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <h4 style={{ marginBottom: "1rem", color: "var(--text-muted)" }}>Account Details</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    required
                  />
                </div>

                <h4 style={{ margin: "1.5rem 0 1rem 0", color: "var(--text-muted)" }}>Student Profile</h4>

                <div className="form-row">
                  <div className="form-group">
                    <label>Class Assignment</label>
                    <select
                      className="form-select"
                      value={editForm.school_class}
                      onChange={(e) => handleEditClassChange(e.target.value)}
                      required
                    >
                      <option value="">-- Select Class --</option>
                      {classesList.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Section Assignment</label>
                    <select
                      className="form-select"
                      value={editForm.section}
                      onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                      required
                      disabled={!editForm.school_class}
                    >
                      <option value="">-- Select Section --</option>
                      {availableSections.map(sec => (
                        <option key={sec.id} value={sec.id}>Sec {sec.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row" style={{ marginTop: "1rem" }}>
                  <div className="form-group">
                    <label>Admission Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.admission_number}
                      onChange={(e) => setEditForm({ ...editForm, admission_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      className="form-control"
                      value={editForm.date_of_birth}
                      onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      className="form-select"
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      required
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Parent Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.parent_name}
                      onChange={(e) => setEditForm({ ...editForm, parent_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Parent Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.parent_phone}
                    onChange={(e) => setEditForm({ ...editForm, parent_phone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    className="form-textarea"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Student Profile Modal */}
      {selectedStudentDetails && (
        <StudentDetailsModal
          student={selectedStudentDetails}
          onClose={() => setSelectedStudentDetails(null)}
        />
      )}
    </div>
  );
}

export default Students;