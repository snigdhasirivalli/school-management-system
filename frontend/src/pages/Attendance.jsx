import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";

function Attendance() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [profile, setProfile] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(100);
  
  // Form State
  const [form, setForm] = useState({
    student: "",
    date: new Date().toISOString().split("T")[0],
    status: "present",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/");
      return;
    }
    fetchInitialData();
  }, [navigate]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      const [profileRes, classesRes] = await Promise.all([
        axios.get("profile/", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("students/classes/", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setProfile(profileRes.data);
      setClassesList(classesRes.data);
      
      if (classesRes.data.length > 0) {
        const defaultClass = classesRes.data[0];
        setSelectedClass(defaultClass.id);
        const defaultSection = defaultClass.sections.length > 0 ? defaultClass.sections[0] : null;
        if (defaultSection) {
          setSelectedSection(defaultSection.id);
          setSectionsList(defaultClass.sections);
          await loadAttendanceData(defaultClass.id, defaultSection.id);
        } else {
          await loadAttendanceData(defaultClass.id, "");
        }
      } else {
        await loadAttendanceData("", "");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load initial attendance filters.");
      setLoading(false);
    }
  };

  const loadAttendanceData = async (classId = "", sectionId = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      let studentsUrl = "students/all/";
      let attendanceUrl = "attendance/all/";
      
      const params = [];
      if (classId) params.push(`school_class=${classId}`);
      if (sectionId) params.push(`section=${sectionId}`);
      if (params.length > 0) {
        const queryStr = `?${params.join("&")}`;
        studentsUrl += queryStr;
        attendanceUrl += queryStr;
      }

      const [studentsRes, logsRes] = await Promise.all([
        axios.get(studentsUrl, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(attendanceUrl, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setStudents(studentsRes.data);
      setFilteredStudents(studentsRes.data);
      setAttendanceLogs(logsRes.data);
      setDisplayLimit(100);

      if (studentsRes.data.length > 0) {
        setForm((prev) => ({ ...prev, student: studentsRes.data[0].id }));
      } else {
        setForm((prev) => ({ ...prev, student: "" }));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load attendance logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleClassFilterChange = (classId) => {
    setSelectedClass(classId);
    setSelectedSection("");
    
    const parsedClassId = parseInt(classId);
    const cls = classesList.find(c => c.id === parsedClassId);
    setSectionsList(cls ? cls.sections : []);
    loadAttendanceData(classId, "");
  };

  const handleSectionFilterChange = (sectionId) => {
    setSelectedSection(sectionId);
    loadAttendanceData(selectedClass, sectionId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("access");
    
    if (!form.student) {
      setError("Please select a student first.");
      return;
    }

    try {
      await axios.post(
        "attendance/mark/",
        {
          student: parseInt(form.student),
          marked_by: profile.id,
          date: form.date,
          status: form.status,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Attendance marked successfully!");
      
      // Reload logs with current filter parameters
      const attendanceUrl = selectedClass || selectedSection
        ? `attendance/all/?school_class=${selectedClass}&section=${selectedSection}`
        : "attendance/all/";
      const logsRes = await axios.get(attendanceUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendanceLogs(logsRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to mark attendance. Check if already marked or invalid inputs.");
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h1>📅 Student Attendance</h1>
            <p>Mark daily attendance and inspect attendance history log</p>
          </div>
        </div>

        {error && <div className="badge badge-danger btn-block" style={{ padding: "0.75rem", borderRadius: "8px", margin: "1rem 0" }}>{error}</div>}

        <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 2fr", alignItems: "start" }}>
          
          {/* Mark Attendance Form Card */}
          <div className="content-card">
            <h2 style={{ marginBottom: "1.5rem" }}>📅 Mark Attendance</h2>
            <form onSubmit={handleSubmit}>
              
              {/* Class Filter */}
              <div className="form-group">
                <label>Filter by Class</label>
                <select
                  className="form-select"
                  value={selectedClass}
                  onChange={(e) => handleClassFilterChange(e.target.value)}
                >
                  <option value="">-- All Classes --</option>
                  {classesList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Section Filter */}
              <div className="form-group" style={{ marginTop: "0.5rem" }}>
                <label>Filter by Section</label>
                <select
                  className="form-select"
                  value={selectedSection}
                  onChange={(e) => handleSectionFilterChange(e.target.value)}
                  disabled={!selectedClass}
                >
                  <option value="">-- All Sections --</option>
                  {sectionsList.map(s => (
                    <option key={s.id} value={s.id}>Sec {s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ borderTop: "1px solid var(--border-color)", margin: "1rem 0" }}></div>

              <div className="form-group">
                <label>Select Student</label>
                <select
                  className="form-select"
                  value={form.student}
                  onChange={(e) => setForm({ ...form, student: e.target.value })}
                  required
                >
                  <option value="" disabled>-- Choose Student --</option>
                  {filteredStudents.length === 0 ? (
                    <option value="" disabled>No students found for filter</option>
                  ) : (
                    filteredStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.user_details?.username} ({s.admission_number})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  required
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: "1.5rem" }} disabled={filteredStudents.length === 0}>
                Mark Status
              </button>
            </form>
          </div>

          {/* Attendance History Card */}
          <div className="content-card">
            <h2 style={{ marginBottom: "1.5rem" }}>📋 Daily Attendance History</h2>
            {loading ? (
              <p>Loading registry logs...</p>
            ) : attendanceLogs.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No attendance records found.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Marked By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLogs.slice(0, displayLimit).map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{log.student_name || `ID: ${log.student}`}</td>
                        <td>{log.date}</td>
                        <td>
                          <span
                            className={`badge ${
                              log.status === "present"
                                ? "badge-success"
                                : log.status === "absent"
                                ? "badge-danger"
                                : "badge-warning"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td>{log.marked_by_name || `ID: ${log.marked_by}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {attendanceLogs.length > displayLimit && (
                  <div style={{ textAlign: "center", marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setDisplayLimit(prev => prev + 100)}>
                      Load More Logs (Showing {displayLimit} of {attendanceLogs.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Attendance;
