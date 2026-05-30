import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";

function Timetable() {
  const navigate = useNavigate();
  const [timetableSlots, setTimetableSlots] = useState([]);
  
  // Lists from backend
  const [classesList, setClassesList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);

  // Filter selection states for board
  const [boardClass, setBoardClass] = useState("");
  const [boardSection, setBoardSection] = useState("");
  const [boardSectionsList, setBoardSectionsList] = useState([]);

  // Form State
  const [form, setForm] = useState({
    school_class: "",
    section: "",
    subject: "",
    teacher: "",
    day: "monday",
    start_time: "09:00",
    end_time: "10:00",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  useEffect(() => {
    fetchTimetable();
    fetchFormParameters();
  }, []);

  const fetchTimetable = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("access");
      if (!token) {
        navigate("/");
        return;
      }
      const response = await axios.get("timetable/all/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimetableSlots(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch timetable slots.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFormParameters = async () => {
    try {
      const token = localStorage.getItem("access");
      if (!token) return;

      const [classesRes, subjectsRes, teachersRes] = await Promise.all([
        axios.get("students/classes/", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("students/subjects/", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("students/teachers/", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setClassesList(classesRes.data);
      setSubjectsList(subjectsRes.data);
      setTeachersList(teachersRes.data);

      if (classesRes.data.length > 0) {
        setBoardClass(classesRes.data[0].id);
        setBoardSectionsList(classesRes.data[0].sections || []);
        if (classesRes.data[0].sections?.length > 0) {
          setBoardSection(classesRes.data[0].sections[0].id);
        }
        
        // Init form class select defaults
        setForm(prev => ({
          ...prev,
          school_class: classesRes.data[0].id,
          section: classesRes.data[0].sections?.length > 0 ? classesRes.data[0].sections[0].id : ""
        }));
        setSectionsList(classesRes.data[0].sections || []);
      }
      if (subjectsRes.data.length > 0) {
        setForm(prev => ({ ...prev, subject: subjectsRes.data[0].id }));
      }
      if (teachersRes.data.length > 0) {
        setForm(prev => ({ ...prev, teacher: teachersRes.data[0].id }));
      }
    } catch (err) {
      console.error("Failed to load parameters", err);
    }
  };

  const handleFormClassChange = (classId) => {
    const parsedId = parseInt(classId);
    const cls = classesList.find(c => c.id === parsedId);
    const secs = cls ? cls.sections : [];
    setSectionsList(secs);
    setForm(prev => ({
      ...prev,
      school_class: classId,
      section: secs.length > 0 ? secs[0].id : ""
    }));
  };

  const handleBoardClassChange = (classId) => {
    const parsedId = parseInt(classId);
    setBoardClass(classId);
    const cls = classesList.find(c => c.id === parsedId);
    const secs = cls ? cls.sections : [];
    setBoardSectionsList(secs);
    setBoardSection(secs.length > 0 ? secs[0].id : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("access");

    if (!form.school_class || !form.section || !form.subject || !form.teacher) {
      setError("Please ensure Class, Section, Subject, and Teacher are selected.");
      return;
    }

    // Format times into HH:MM:SS format
    let startTimeFormatted = form.start_time;
    let endTimeFormatted = form.end_time;
    if (startTimeFormatted.length === 5) startTimeFormatted += ":00";
    if (endTimeFormatted.length === 5) endTimeFormatted += ":00";

    try {
      await axios.post(
        "timetable/add/",
        {
          school_class: parseInt(form.school_class),
          section: parseInt(form.section),
          subject: parseInt(form.subject),
          teacher: parseInt(form.teacher),
          day: form.day,
          start_time: startTimeFormatted,
          end_time: endTimeFormatted,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Timetable slot scheduled successfully!");
      fetchTimetable();
    } catch (err) {
      console.error(err);
      setError("Failed to add timetable slot. Please check for scheduling conflicts.");
    }
  };

  // Group slots for the selected class & section by day of week
  const getSlotsForDay = (day) => {
    return timetableSlots
      .filter(
        (slot) =>
          slot.school_class === parseInt(boardClass) &&
          slot.section === parseInt(boardSection) &&
          slot.day.toLowerCase() === day.toLowerCase()
      )
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h1>🕒 School Timetable</h1>
            <p>Define class schedules and view weekly timetables for different grades</p>
          </div>
        </div>

        {error && <div className="badge badge-danger btn-block" style={{ padding: "0.75rem", borderRadius: "8px", margin: "1rem 0" }}>{error}</div>}

        <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 2.5fr", alignItems: "start" }}>
          
          {/* Schedule Form Card */}
          <div className="content-card">
            <h2 style={{ marginBottom: "1.5rem" }}>🕒 Schedule Class</h2>
            <form onSubmit={handleSubmit}>
              
              <div className="form-group">
                <label>Class/Grade</label>
                <select
                  className="form-select"
                  value={form.school_class}
                  onChange={(e) => handleFormClassChange(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Choose Class --</option>
                  {classesList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Section</label>
                <select
                  className="form-select"
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  required
                  disabled={!form.school_class}
                >
                  <option value="" disabled>-- Choose Section --</option>
                  {sectionsList.map(s => (
                    <option key={s.id} value={s.id}>Sec {s.name}</option>
                  ))}
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
                  {subjectsList.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Teacher</label>
                <select
                  className="form-select"
                  value={form.teacher}
                  onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                  required
                >
                  <option value="" disabled>-- Choose Teacher --</option>
                  {teachersList.map(t => (
                    <option key={t.id} value={t.id}>{t.user_details?.username} (ID: {t.employee_id})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Day of the Week</label>
                <select
                  className="form-select"
                  value={form.day}
                  onChange={(e) => setForm({ ...form, day: e.target.value })}
                  required
                >
                  {daysOfWeek.map((d) => (
                    <option key={d} value={d}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: "1rem" }} disabled={classesList.length === 0 || subjectsList.length === 0 || teachersList.length === 0}>
                Add Schedule Slot
              </button>
            </form>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Class Selector Card */}
            <div className="content-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <h2 style={{ margin: "0" }}>📅 Weekly Timetable Board</h2>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                
                <select
                  className="form-select"
                  value={boardClass}
                  onChange={(e) => handleBoardClassChange(e.target.value)}
                  style={{ width: "160px" }}
                >
                  <option value="" disabled>-- Class --</option>
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  className="form-select"
                  value={boardSection}
                  onChange={(e) => setBoardSection(e.target.value)}
                  style={{ width: "120px" }}
                  disabled={!boardClass}
                >
                  <option value="" disabled>-- Section --</option>
                  {boardSectionsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      Sec {s.name}
                    </option>
                  ))}
                </select>

              </div>
            </div>

            {/* Weekly Grid Card */}
            <div className="content-card">
              {loading ? (
                <p>Loading timetables...</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                  {daysOfWeek.map((day) => {
                    const slots = getSlotsForDay(day);
                    return (
                      <div
                        key={day}
                        style={{
                          background: "#ffffff",
                          border: "1px solid var(--border-color)",
                          borderRadius: "8px",
                          padding: "1rem",
                          minHeight: "220px",
                        }}
                      >
                        <h4 style={{ textTransform: "capitalize", borderBottom: "2px solid var(--border-color)", paddingBottom: "0.4rem", marginBottom: "0.8rem", color: "var(--primary)" }}>
                          {day}
                        </h4>
                        {slots.length === 0 ? (
                          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>No classes</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                            {slots.map((slot) => (
                              <div
                                key={slot.id}
                                style={{
                                  background: "#f8fafc",
                                  borderLeft: "3px solid var(--accent)",
                                  padding: "0.5rem 0.75rem",
                                  borderRadius: "4px",
                                }}
                              >
                                <div style={{ fontWeight: "600", fontSize: "0.9rem", color: "var(--text-primary)" }}>{slot.subject_name || `Sub: ${slot.subject}`}</div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>👨‍🏫 {slot.teacher_name || `Teacher: ${slot.teacher}`}</div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                                  🕒 {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Timetable;
