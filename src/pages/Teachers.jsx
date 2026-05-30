import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("access");
      if (!token) {
        navigate("/");
        return;
      }
      const response = await axios.get("students/teachers/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTeachers(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch teachers registry. Admin credentials required.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this teacher? This will also remove their user portal account!")) return;

    try {
      const token = localStorage.getItem("access");
      await axios.delete(`students/teachers/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Teacher profile deleted successfully.");
      fetchTeachers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete teacher.");
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h1>🧑‍🏫 Teacher Management</h1>
            <p>Manage school faculty, subjects taught, and class section assignments</p>
          </div>
          <div>
            <button className="btn btn-primary" onClick={() => navigate("/add-teacher")}>
              ➕ Add New Teacher
            </button>
          </div>
        </div>

        {error && (
          <div className="badge badge-danger btn-block" style={{ padding: "0.75rem", borderRadius: "8px", margin: "1rem 0" }}>
            {error}
          </div>
        )}

        <div className="content-card">
          {loading ? (
            <p>Loading teacher registry...</p>
          ) : teachers.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", textAlign: "center" }}>No teachers registered in the system database yet.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Assigned Subjects</th>
                    <th>Class Sections</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td><code>{teacher.employee_id}</code></td>
                      <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                        {teacher.user_details?.username || "N/A"}
                      </td>
                      <td>{teacher.user_details?.email || "N/A"}</td>
                      <td>{teacher.user_details?.phone || "N/A"}</td>
                      <td>
                        {teacher.subject_details && teacher.subject_details.length > 0 ? (
                          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                            {teacher.subject_details.map((sub) => (
                              <span key={sub.id} className="badge badge-info" style={{ fontSize: "0.75rem" }}>
                                {sub.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>None</span>
                        )}
                      </td>
                      <td>
                        {teacher.section_details && teacher.section_details.length > 0 ? (
                          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                            {teacher.section_details.map((sec) => (
                              <span key={sec.id} className="badge badge-success" style={{ fontSize: "0.75rem" }}>
                                {sec.class_name} - {sec.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>None</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDelete(teacher.id)}
                          className="btn btn-danger btn-sm"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Teachers;
