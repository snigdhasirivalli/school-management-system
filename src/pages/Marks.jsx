import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";

function Marks() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [marksLogs, setMarksLogs] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [profile, setProfile] = useState(null);

  // Filter States
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [classesList, setClassesList] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [displayLimit, setDisplayLimit] = useState(100);
  
  // Form State for Adding Marks
  const [form, setForm] = useState({
    student: "",
    subject: "",
    exam_type: "midterm",
    marks_obtained: "",
    total_marks: "100",
  });

  // Report Card Generator State
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedExamType, setSelectedExamType] = useState("all");
  const [reportCardData, setReportCardData] = useState(null);
  const [showReportCardModal, setShowReportCardModal] = useState(false);

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
      const classesRes = await axios.get("students/classes/", { headers: { Authorization: `Bearer ${token}` } });
      setClassesList(classesRes.data);
      if (classesRes.data.length > 0) {
        const defaultClass = classesRes.data[0];
        setFilterClass(defaultClass.id);
        const defaultSection = defaultClass.sections.length > 0 ? defaultClass.sections[0] : null;
        if (defaultSection) {
          setFilterSection(defaultSection.id);
          setFilteredSections(defaultClass.sections);
          await loadData(defaultClass.id, defaultSection.id);
        } else {
          await loadData(defaultClass.id, "");
        }
      } else {
        await loadData("", "");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load initial marks page filters.");
      setLoading(false);
    }
  };

  const loadData = async (classId = "", sectionId = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      
      let studentsUrl = "students/all/";
      let marksUrl = "marks/all/";
      const params = [];
      if (classId) params.push(`school_class=${classId}`);
      if (sectionId) params.push(`section=${sectionId}`);
      if (params.length > 0) {
        const queryStr = `?${params.join("&")}`;
        studentsUrl += queryStr;
        marksUrl += queryStr;
      }

      const [profileRes, studentsRes, subjectsRes, logsRes] = await Promise.all([
        axios.get("profile/", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(studentsUrl, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("students/subjects/", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(marksUrl, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setProfile(profileRes.data);
      setStudents(studentsRes.data);
      setSubjectsList(subjectsRes.data);
      setMarksLogs(logsRes.data);
      setDisplayLimit(100);

      if (studentsRes.data.length > 0) {
        setForm((prev) => ({ ...prev, student: studentsRes.data[0].id }));
        setSelectedStudentId(studentsRes.data[0].id);
      } else {
        setForm((prev) => ({ ...prev, student: "" }));
        setSelectedStudentId("");
      }
      if (subjectsRes.data.length > 0) {
        setForm((prev) => ({ ...prev, subject: subjectsRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load marks page details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("access");

    if (!form.student) {
      setError("Please select a student first.");
      return;
    }
    if (!form.subject) {
      setError("Please select a subject first.");
      return;
    }

    try {
      await axios.post(
        "marks/add/",
        {
          student: parseInt(form.student),
          subject: parseInt(form.subject),
          exam_type: form.exam_type,
          marks_obtained: parseInt(form.marks_obtained),
          total_marks: parseInt(form.total_marks),
          graded_by: profile.id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Marks added successfully!");
      setForm((prev) => ({ ...prev, marks_obtained: "" }));
      
      // Reload logs
      const marksUrl = filterClass || filterSection
        ? `marks/all/?school_class=${filterClass}&section=${filterSection}`
        : "marks/all/";
      const logsRes = await axios.get(marksUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMarksLogs(logsRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to add marks. Please verify inputs.");
    }
  };

  const handleGenerateReportCard = () => {
    if (!selectedStudentId) {
      alert("Please select a student.");
      return;
    }

    const studentObj = students.find((s) => s.id === parseInt(selectedStudentId));
    if (!studentObj) return;

    // Filter marks for this student
    let studentMarks = marksLogs.filter((m) => m.student === parseInt(selectedStudentId));
    if (selectedExamType !== "all") {
      studentMarks = studentMarks.filter((m) => m.exam_type === selectedExamType);
    }

    if (studentMarks.length === 0) {
      alert("No marks records found for this student matching the selection.");
      return;
    }

    // Calculations
    let totalObtained = 0;
    let totalPossible = 0;
    studentMarks.forEach((m) => {
      totalObtained += m.marks_obtained;
      totalPossible += m.total_marks;
    });

    const averagePercentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;
    
    // Assign Grade
    let letterGrade = "F";
    if (averagePercentage >= 90) letterGrade = "A+";
    else if (averagePercentage >= 80) letterGrade = "A";
    else if (averagePercentage >= 70) letterGrade = "B";
    else if (averagePercentage >= 60) letterGrade = "C";
    else if (averagePercentage >= 50) letterGrade = "D";

    setReportCardData({
      student: studentObj,
      marks: studentMarks,
      totalObtained,
      totalPossible,
      percentage: averagePercentage.toFixed(1),
      grade: letterGrade,
      examType: selectedExamType,
    });

    setShowReportCardModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h1>📝 Student Grades & Reports</h1>
            <p>Enter grades, inspect exam performance, and generate official report cards</p>
          </div>
        </div>

        {error && <div className="badge badge-danger btn-block" style={{ padding: "0.75rem", borderRadius: "8px", margin: "1rem 0" }}>{error}</div>}

        {/* Filters Panel */}
        <div className="content-card" style={{ marginBottom: "1.5rem", padding: "1.25rem 2rem" }}>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontWeight: "700", color: "var(--text-secondary)" }}>🔍 Filter Directory & Logs:</span>
            <div style={{ display: "flex", gap: "1rem", flexGrow: 1, maxWidth: "500px" }}>
              <select
                className="form-select"
                value={filterClass}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilterClass(val);
                  setFilterSection("");
                  const selectedCls = classesList.find(c => c.id === parseInt(val));
                  const newSecs = selectedCls ? selectedCls.sections : [];
                  setFilteredSections(newSecs);
                  loadData(val, "");
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
                onChange={(e) => {
                  const val = e.target.value;
                  setFilterSection(val);
                  loadData(filterClass, val);
                }}
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
                  loadData("", "");
                }}
              >
                🧹 Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 2fr", alignItems: "start" }}>
          
          {/* Add Marks Card */}
          <div className="content-card">
            <h2 style={{ marginBottom: "1.5rem" }}>📝 Record Exam Marks</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Student</label>
                <select
                  className="form-select"
                  value={form.student}
                  onChange={(e) => setForm({ ...form, student: e.target.value })}
                  required
                >
                  {students.length === 0 ? (
                    <option value="">No students available</option>
                  ) : (
                    students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.user_details?.username} ({s.admission_number})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Subject</label>
                <select
                  className="form-select"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                >
                  <option value="" disabled>-- Choose Subject --</option>
                  {subjectsList.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Exam Type</label>
                <select
                  className="form-select"
                  value={form.exam_type}
                  onChange={(e) => setForm({ ...form, exam_type: e.target.value })}
                  required
                >
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                  <option value="unit_test">Unit Test</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Marks Obtained</label>
                  <input
                    type="number"
                    placeholder="e.g. 85"
                    className="form-control"
                    value={form.marks_obtained}
                    onChange={(e) => setForm({ ...form, marks_obtained: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Total Marks</label>
                  <input
                    type="number"
                    placeholder="100"
                    className="form-control"
                    value={form.total_marks}
                    onChange={(e) => setForm({ ...form, total_marks: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: "1rem" }} disabled={students.length === 0 || subjectsList.length === 0}>
                Record Score
              </button>
            </form>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Report Card Generator Settings Card */}
            <div className="content-card">
              <h2 style={{ marginBottom: "1.25rem" }}>🎓 Report Card Generator</h2>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div className="form-group" style={{ flex: "1", minWidth: "200px", marginBottom: "0" }}>
                  <label>Select Student</label>
                  <select
                    className="form-select"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.user_details?.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ flex: "1", minWidth: "150px", marginBottom: "0" }}>
                  <label>Exam Type Filter</label>
                  <select
                    className="form-select"
                    value={selectedExamType}
                    onChange={(e) => setSelectedExamType(e.target.value)}
                  >
                    <option value="all">All Exams</option>
                    <option value="midterm">Midterm</option>
                    <option value="final">Final</option>
                    <option value="unit_test">Unit Test</option>
                  </select>
                </div>

                <button className="btn btn-success" onClick={handleGenerateReportCard} disabled={students.length === 0}>
                  ✨ Generate Report Card
                </button>
              </div>
            </div>

            {/* Grades Logs History Card */}
            <div className="content-card">
              <h2 style={{ marginBottom: "1.5rem" }}>📋 Grades Registry Logs</h2>
              {loading ? (
                <p>Loading registry log data...</p>
              ) : marksLogs.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>No grades registered in the system yet.</p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Subject</th>
                        <th>Exam Type</th>
                        <th>Score</th>
                        <th>Graded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marksLogs.slice(0, displayLimit).map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{log.student_name}</td>
                          <td style={{ fontWeight: "500" }}>{log.subject_name || `ID: ${log.subject}`}</td>
                          <td>
                            <span className="badge badge-info" style={{ textTransform: "capitalize" }}>
                              {log.exam_type}
                            </span>
                          </td>
                          <td>
                            <strong>{log.marks_obtained}</strong> / {log.total_marks} (
                            {((log.marks_obtained / log.total_marks) * 100).toFixed(0)}%)
                          </td>
                          <td>{log.graded_by_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {marksLogs.length > displayLimit && (
                    <div style={{ textAlign: "center", marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setDisplayLimit(prev => prev + 100)}>
                        Load More Logs (Showing {displayLimit} of {marksLogs.length})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Report Card Modal */}
      {showReportCardModal && reportCardData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "700px" }}>
            <div className="modal-header">
              <h3>🎓 Academic Performance Report</h3>
              <button className="close-btn" onClick={() => setShowReportCardModal(false)}>×</button>
            </div>
            
            <div className="modal-body" id="report-card-area">
              <div className="report-card-print" style={{ border: "2px solid var(--border-color)", borderRadius: "12px", padding: "2rem" }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                  <h1 style={{ margin: "0", fontSize: "1.75rem", color: "var(--text-primary)" }}>ACADEMIX PRO ACADEMY</h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase" }}>Official Student Progress Report</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1.5rem" }}>
                  <div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}><strong>Student Name:</strong> {reportCardData.student.user_details?.username}</p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}><strong>Admission Number:</strong> {reportCardData.student.admission_number}</p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}><strong>Gender:</strong> {reportCardData.student.gender}</p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                      <strong>Class:</strong> {reportCardData.student.class_name ? `${reportCardData.student.class_name} - ${reportCardData.student.section_name}` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}><strong>Parent/Guardian:</strong> {reportCardData.student.parent_name}</p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}><strong>Date of Birth:</strong> {reportCardData.student.date_of_birth}</p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}><strong>Report Period:</strong> {reportCardData.examType.toUpperCase()}</p>
                  </div>
                </div>

                <table className="table" style={{ width: "100%", marginBottom: "2rem" }}>
                  <thead>
                    <tr>
                      <th style={{ background: "#f1f5f9" }}>Subject Name</th>
                      <th style={{ background: "#f1f5f9" }}>Exam Type</th>
                      <th style={{ background: "#f1f5f9" }}>Marks Obtained</th>
                      <th style={{ background: "#f1f5f9" }}>Total Marks</th>
                      <th style={{ background: "#f1f5f9" }}>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportCardData.marks.map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: "600" }}>{m.subject_name || `ID: ${m.subject}`}</td>
                        <td>{m.exam_type}</td>
                        <td>{m.marks_obtained}</td>
                        <td>{m.total_marks}</td>
                        <td>{((m.marks_obtained / m.total_marks) * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", background: "#f8fafc", border: "1px solid var(--border-color)", padding: "1.25rem", borderRadius: "8px", textAlign: "center" }}>
                  <div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>AGGREGATE SCORES</p>
                    <h3 style={{ color: "var(--text-primary)", fontSize: "1.5rem" }}>{reportCardData.totalObtained} / {reportCardData.totalPossible}</h3>
                  </div>
                  <div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>PERCENTAGE</p>
                    <h3 style={{ color: "var(--text-primary)", fontSize: "1.5rem" }}>{reportCardData.percentage}%</h3>
                  </div>
                  <div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>FINAL GRADE</p>
                    <h3 style={{ color: "var(--accent)", fontSize: "1.5rem" }}>{reportCardData.grade}</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowReportCardModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-success" onClick={handlePrint}>
                🖨️ Print Report Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Marks;
