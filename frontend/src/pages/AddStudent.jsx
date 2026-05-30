import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";

function AddStudent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "password123", // Default placeholder password for school records
    admission_number: "",
    date_of_birth: "",
    gender: "male",
    parent_name: "",
    parent_phone: "",
    address: "",
    school_class: "",
    section: "",
  });

  const [classesList, setClassesList] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("access");
      if (!token) {
        navigate("/");
        return;
      }
      const res = await axios.get("students/classes/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClassesList(res.data);
    } catch (err) {
      console.error("Failed to load classes list:", err);
    }
  };

  const handleClassChange = (classId) => {
    const parsedId = parseInt(classId);
    setForm({ ...form, school_class: classId, section: "" });
    const selectedClass = classesList.find(c => c.id === parsedId);
    setAvailableSections(selectedClass ? selectedClass.sections : []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access");
      if (!token) {
        navigate("/");
        return;
      }

      await axios.post(
        "students/add/",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Student Added Successfully!");
      navigate("/students");
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setError(JSON.stringify(err.response.data));
      } else {
        setError("Failed to Add Student. Make sure the admission number is unique.");
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
            <h1>➕ Add New Student</h1>
            <p>Enroll a new student and automatically generate their portal account</p>
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
              👤 Account details (Student Portal Credentials)
            </h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Full Name / Username</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className="form-control"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Student Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. johndoe@school.com"
                  className="form-control"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Student Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +123456789"
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
                  placeholder="e.g. password123"
                  className="form-control"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <h3 style={{ margin: "2rem 0 1.5rem 0", color: "var(--primary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              🎓 Academic & Personal Details
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label>Class Assignment</label>
                <select
                  className="form-select"
                  value={form.school_class}
                  onChange={(e) => handleClassChange(e.target.value)}
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
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  required
                  disabled={!form.school_class}
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
                  placeholder="e.g. ADM2026001"
                  className="form-control"
                  value={form.admission_number}
                  onChange={(e) => setForm({ ...form, admission_number: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.date_of_birth}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Gender</label>
                <select
                  className="form-select"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
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
                  placeholder="e.g. Ramesh Doe"
                  className="form-control"
                  value={form.parent_name}
                  onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Parent Phone Number</label>
              <input
                type="text"
                placeholder="e.g. 9876543210"
                className="form-control"
                value={form.parent_phone}
                onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                placeholder="Residential Address..."
                className="form-textarea"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              ></textarea>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Registering..." : "➕ Enroll Student"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate("/students")}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AddStudent;