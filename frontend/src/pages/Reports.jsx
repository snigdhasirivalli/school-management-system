import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";

function Reports() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("students");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Lists from backend
  const [students, setStudents] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [fees, setFees] = useState([]);

  // Filters
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [sectionsList, setSectionsList] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/");
      return;
    }
    try {
      const classesRes = await axios.get("students/classes/", { headers: { Authorization: `Bearer ${token}` } });
      setClassesList(classesRes.data);
      if (classesRes.data.length > 0) {
        const defaultClass = classesRes.data[0];
        setSelectedClass(defaultClass.id);
        const defaultSection = defaultClass.sections.length > 0 ? defaultClass.sections[0] : null;
        if (defaultSection) {
          setSelectedSection(defaultSection.id);
          setSectionsList(defaultClass.sections);
          await loadReportsData(defaultClass.id, defaultSection.id);
        } else {
          await loadReportsData(defaultClass.id, "");
        }
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load initial report parameters. Ensure your login session is active.");
      setLoading(false);
    }
  };

  const loadReportsData = async (classId = "", sectionId = "") => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      let queryStr = "";
      const params = [];
      if (classId) params.push(`school_class=${classId}`);
      if (sectionId) params.push(`section=${sectionId}`);
      if (params.length > 0) {
        queryStr = `?${params.join("&")}`;
      }

      const [studentsRes, attendanceRes, marksRes, feesRes] = await Promise.all([
        axios.get(`students/all/${queryStr}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`attendance/all/${queryStr}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`marks/all/${queryStr}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`fees/all/${queryStr}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setStudents(studentsRes.data);
      setAttendance(attendanceRes.data);
      setMarks(marksRes.data);
      setFees(feesRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to compile reports. Ensure your login session is active.");
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setSelectedSection("");
    const cls = classesList.find(c => c.id === parseInt(classId));
    setSectionsList(cls ? cls.sections : []);
    loadReportsData(classId, "");
  };

  const getFilteredStudents = () => {
    let result = students;
    if (selectedClass) {
      result = result.filter(s => s.school_class === parseInt(selectedClass));
    }
    if (selectedSection) {
      result = result.filter(s => s.section === parseInt(selectedSection));
    }
    return result;
  };

  // 1. Attendance Calculation
  const getAttendanceSummary = () => {
    const classStudents = getFilteredStudents();
    const studentIds = classStudents.map(s => s.id);
    
    // Filter logs for selected students
    const relevantLogs = attendance.filter(log => studentIds.includes(log.student));
    
    if (relevantLogs.length === 0) return { present: 0, absent: 0, late: 0, total: 0, percentage: 0 };
    
    const present = relevantLogs.filter(l => l.status === "present").length;
    const absent = relevantLogs.filter(l => l.status === "absent").length;
    const late = relevantLogs.filter(l => l.status === "late").length;
    const total = relevantLogs.length;
    const percentage = total > 0 ? (((present + late) / total) * 100).toFixed(1) : 0;
    
    return { present, absent, late, total, percentage };
  };

  // 2. Marks Summaries
  const getMarksSummary = () => {
    const classStudents = getFilteredStudents();
    const studentIds = classStudents.map(s => s.id);
    const relevantMarks = marks.filter(m => studentIds.includes(m.student));

    if (relevantMarks.length === 0) return [];

    // Group by subject
    const subjectMap = {};
    relevantMarks.forEach(m => {
      const subName = m.subject_name || `Subject ${m.subject}`;
      if (!subjectMap[subName]) {
        subjectMap[subName] = { totalObtained: 0, totalMax: 0, count: 0 };
      }
      subjectMap[subName].totalObtained += m.marks_obtained;
      subjectMap[subName].totalMax += m.total_marks;
      subjectMap[subName].count += 1;
    });

    return Object.keys(subjectMap).map(subject => {
      const { totalObtained, totalMax } = subjectMap[subject];
      return {
        subject,
        average: totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : 0
      };
    });
  };

  // 3. Fees Collection summaries
  const getFeesSummary = () => {
    const classStudents = getFilteredStudents();
    const studentIds = classStudents.map(s => s.id);
    const relevantFees = fees.filter(f => studentIds.includes(f.student));

    let invoiced = 0;
    let collected = 0;
    let outstanding = 0;

    relevantFees.forEach(f => {
      invoiced += parseFloat(f.total_amount);
      collected += parseFloat(f.paid_amount);
      outstanding += parseFloat(f.remaining_amount);
    });

    return {
      invoiced: invoiced.toFixed(2),
      collected: collected.toFixed(2),
      outstanding: outstanding.toFixed(2),
      list: relevantFees
    };
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredStudentsList = getFilteredStudents();
  const attendanceSum = getAttendanceSummary();
  const marksSum = getMarksSummary();
  const feesSum = getFeesSummary();

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h1>📊 Reports & Analytics</h1>
            <p>Export and print academic performance worksheets, fee ledgers, and registry rosters</p>
          </div>
          <div>
            <button className="btn btn-success" onClick={handlePrint}>
              🖨️ Print Sheet
            </button>
          </div>
        </div>

        {error && (
          <div className="badge badge-danger btn-block" style={{ padding: "0.75rem", borderRadius: "8px", margin: "1rem 0" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Filters Panel */}
        <div className="content-card" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "1rem" }}>
          <div className="form-group" style={{ flex: "1", minWidth: "200px", marginBottom: "0" }}>
            <label>Filter Class</label>
            <select className="form-select" value={selectedClass} onChange={(e) => handleClassChange(e.target.value)}>
              <option value="">-- All Classes --</option>
              {classesList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ flex: "1", minWidth: "150px", marginBottom: "0" }}>
            <label>Filter Section</label>
            <select
              className="form-select"
              value={selectedSection}
              onChange={(e) => {
                const secId = e.target.value;
                setSelectedSection(secId);
                loadReportsData(selectedClass, secId);
              }}
              disabled={!selectedClass}
            >
              <option value="">-- All Sections --</option>
              {sectionsList.map(s => (
                <option key={s.id} value={s.id}>Sec {s.name}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={() => { setSelectedClass(""); setSelectedSection(""); setSectionsList([]); loadReportsData("", ""); }}>
            Reset Filters
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
          <button className={`btn ${activeTab === "students" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("students")}>
            🎓 Student Lists
          </button>
          <button className={`btn ${activeTab === "attendance" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("attendance")}>
            📅 Attendance Overview
          </button>
          <button className={`btn ${activeTab === "marks" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("marks")}>
            📝 Grading Performance
          </button>
          <button className={`btn ${activeTab === "fees" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("fees")}>
            💳 Tuition Financials
          </button>
        </div>

        {loading ? (
          <p>Compiling database analytics...</p>
        ) : (
          <div className="content-card" style={{ marginTop: "1rem" }}>
            
            {/* Student list Tab */}
            {activeTab === "students" && (
              <div>
                <h3 style={{ marginBottom: "1rem", color: "var(--primary)" }}> Roster List ({filteredStudentsList.length} Students)</h3>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Admission No</th>
                        <th>Student Name</th>
                        <th>Class Section</th>
                        <th>Parent Name</th>
                        <th>Parent Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudentsList.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: "center" }}>No students matching the filter.</td>
                        </tr>
                      ) : (
                        filteredStudentsList.map(s => (
                          <tr key={s.id}>
                            <td><code>{s.admission_number}</code></td>
                            <td style={{ fontWeight: "600" }}>{s.user_details?.username}</td>
                            <td>{s.class_name ? `${s.class_name} - ${s.section_name}` : "N/A"}</td>
                            <td>{s.parent_name}</td>
                            <td>{s.parent_phone}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Attendance Overview Tab */}
            {activeTab === "attendance" && (
              <div>
                <h3 style={{ marginBottom: "1rem", color: "var(--primary)" }}>📅 Attendance Metrics Summary</h3>
                <div className="dashboard-grid" style={{ marginBottom: "2rem" }}>
                  <div className="stat-card primary">
                    <div className="stat-title">Average Attendance Rate</div>
                    <div className="stat-value">{attendanceSum.percentage}%</div>
                    <div className="stat-desc">From total of {attendanceSum.total} logs recorded</div>
                  </div>
                  <div className="stat-card accent">
                    <div className="stat-title">Present Statuses</div>
                    <div className="stat-value">{attendanceSum.present}</div>
                    <div className="stat-desc">Students marked present</div>
                  </div>
                  <div className="stat-card warning">
                    <div className="stat-title">Late / Absent</div>
                    <div className="stat-value">{attendanceSum.late} / {attendanceSum.absent}</div>
                    <div className="stat-desc">Late entries & unexcused absences</div>
                  </div>
                </div>
              </div>
            )}

            {/* Grading performance tab */}
            {activeTab === "marks" && (
              <div>
                <h3 style={{ marginBottom: "1.5rem", color: "var(--primary)" }}>📝 Subject Performance Indexes</h3>
                {marksSum.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", textAlign: "center" }}>No graded exams logged for matching students.</p>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Subject Name</th>
                          <th>Mean Score Percentage</th>
                          <th>Performance Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marksSum.map((s, idx) => {
                          let label = "Excellent (A/A+)";
                          let badge = "badge-success";
                          if (s.average < 50) { label = "Needs Improvement (F)"; badge = "badge-danger"; }
                          else if (s.average < 60) { label = "Below Average (D)"; badge = "badge-warning"; }
                          else if (s.average < 75) { label = "Average (C/B)"; badge = "badge-info"; }
                          
                          return (
                            <tr key={idx}>
                              <td style={{ fontWeight: "600" }}>{s.subject}</td>
                              <td><strong>{s.average}%</strong></td>
                              <td><span className={`badge ${badge}`}>{label}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Fees overview tab */}
            {activeTab === "fees" && (
              <div>
                <h3 style={{ marginBottom: "1.5rem", color: "var(--primary)" }}>💳 Financial Ledger Sheet</h3>
                <div className="dashboard-grid" style={{ marginBottom: "2rem" }}>
                  <div className="stat-card primary">
                    <div className="stat-title">Total Invoiced Billing</div>
                    <div className="stat-value">${feesSum.invoiced}</div>
                    <div className="stat-desc">Total tuition fees invoiced</div>
                  </div>
                  <div className="stat-card accent">
                    <div className="stat-title">Total Revenue Collected</div>
                    <div className="stat-value">${feesSum.collected}</div>
                    <div className="stat-desc">Revenue securely paid to ledger</div>
                  </div>
                  <div className="stat-card warning">
                    <div className="stat-title">Total Outstanding Balance</div>
                    <div className="stat-value" style={{ color: "var(--danger)" }}>${feesSum.outstanding}</div>
                    <div className="stat-desc">Pending collections</div>
                  </div>
                </div>

                <h4 style={{ marginBottom: "1rem" }}>Fee Status registry</h4>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Invoiced</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feesSum.list.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: "center" }}>No billing records logged for matching students.</td>
                        </tr>
                      ) : (
                        feesSum.list.map(f => {
                          const studentObj = students.find(s => s.id === f.student);
                          return (
                            <tr key={f.id}>
                              <td style={{ fontWeight: "600" }}>{studentObj?.user_details?.username || `ID: ${f.student}`}</td>
                              <td>${f.total_amount}</td>
                              <td>${f.paid_amount}</td>
                              <td><strong style={{ color: parseFloat(f.remaining_amount) > 0 ? "var(--danger)" : "inherit" }}>${f.remaining_amount}</strong></td>
                              <td>
                                <span className={`badge ${f.status === "paid" ? "badge-success" : f.status === "partial" ? "badge-warning" : "badge-danger"}`}>
                                  {f.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}

export default Reports;
