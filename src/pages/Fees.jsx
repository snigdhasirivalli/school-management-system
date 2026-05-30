import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";

function Fees() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [feesLogs, setFeesLogs] = useState([]);

  // Filter States
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [classesList, setClassesList] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [displayLimit, setDisplayLimit] = useState(100);
  
  // Form State for Adding / Recording Fee Details
  const [form, setForm] = useState({
    student: "",
    total_amount: "5000",
    paid_amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    status: "pending",
  });

  // Receipt Modal State
  const [selectedFee, setSelectedFee] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

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
          await loadFeesData(defaultClass.id, defaultSection.id);
        } else {
          await loadFeesData(defaultClass.id, "");
        }
      } else {
        await loadFeesData("", "");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load initial fees filters.");
      setLoading(false);
    }
  };

  const loadFeesData = async (classId = "", sectionId = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      let studentsUrl = "students/all/";
      let feesUrl = "fees/all/";
      
      const params = [];
      if (classId) params.push(`school_class=${classId}`);
      if (sectionId) params.push(`section=${sectionId}`);
      if (params.length > 0) {
        const queryStr = `?${params.join("&")}`;
        studentsUrl += queryStr;
        feesUrl += queryStr;
      }

      const [studentsRes, logsRes] = await Promise.all([
        axios.get(studentsUrl, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(feesUrl, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setStudents(studentsRes.data);
      setFeesLogs(logsRes.data);
      setDisplayLimit(100);

      if (studentsRes.data.length > 0) {
        setForm((prev) => ({ ...prev, student: studentsRes.data[0].id }));
      } else {
        setForm((prev) => ({ ...prev, student: "" }));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load fees logs.");
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

    const total = parseFloat(form.total_amount);
    const paid = parseFloat(form.paid_amount || 0);
    const remaining = total - paid;

    let derivedStatus = "pending";
    if (paid >= total) {
      derivedStatus = "paid";
    } else if (paid > 0) {
      derivedStatus = "partial";
    }

    try {
      await axios.post(
        "fees/add/",
        {
          student: parseInt(form.student),
          total_amount: total.toFixed(2),
          paid_amount: paid.toFixed(2),
          remaining_amount: remaining.toFixed(2),
          payment_date: form.payment_date,
          status: derivedStatus,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Fee transaction logged successfully!");
      setForm((prev) => ({ ...prev, paid_amount: "", status: "pending" }));
      
      // Reload logs with current filter parameters
      const feesUrl = filterClass || filterSection
        ? `fees/all/?school_class=${filterClass}&section=${filterSection}`
        : "fees/all/";
      const logsRes = await axios.get(feesUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeesLogs(logsRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to log fee transaction. Please inspect numeric values.");
    }
  };

  const openReceiptModal = (fee) => {
    const studentObj = students.find((s) => s.id === fee.student);
    setSelectedFee({
      ...fee,
      studentDetails: studentObj,
    });
    setShowReceiptModal(true);
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
            <h1>💳 Financial Ledger & Fees</h1>
            <p>Log student tuition fees, monitor pending bills, and print transaction receipts</p>
          </div>
        </div>

        {error && <div className="badge badge-danger btn-block" style={{ padding: "0.75rem", borderRadius: "8px", margin: "1rem 0" }}>{error}</div>}

        {/* Filters Panel */}
        <div className="content-card" style={{ marginBottom: "1.5rem", padding: "1.25rem 2rem" }}>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontWeight: "700", color: "var(--text-secondary)" }}>🔍 Filter Directory & Ledger:</span>
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
                  loadFeesData(val, "");
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
                  loadFeesData(filterClass, val);
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
                  loadFeesData("", "");
                }}
              >
                🧹 Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 2fr", alignItems: "start" }}>
          
          {/* Add / Record Fee Transaction Form Card */}
          <div className="content-card">
            <h2 style={{ marginBottom: "1.5rem" }}>💳 Log Payment</h2>
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
                <label>Total Tuition Bill ($)</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.total_amount}
                  onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Paid Amount ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 2500"
                  className="form-control"
                  value={form.paid_amount}
                  onChange={(e) => setForm({ ...form, paid_amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Transaction Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.payment_date}
                  onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                  required
                />
              </div>

              <div className="info-banner" style={{ fontSize: "0.85rem", marginTop: "1rem" }}>
                💡 Status (Paid, Partial, Pending) is automatically computed based on your paid amount vs total tuition.
              </div>

              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: "1rem" }} disabled={students.length === 0}>
                Record Payment
              </button>
            </form>
          </div>

          {/* Fees Registry Table Card */}
          <div className="content-card">
            <h2 style={{ marginBottom: "1.5rem" }}>📋 Tuition Fees Ledger</h2>
            {loading ? (
              <p>Loading transaction files...</p>
            ) : feesLogs.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No fee records logged in the system.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Total Amount</th>
                      <th>Paid Amount</th>
                      <th>Remaining</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feesLogs.slice(0, displayLimit).map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{log.student_name}</td>
                        <td>${parseFloat(log.total_amount).toFixed(2)}</td>
                        <td style={{ color: "var(--accent)" }}>${parseFloat(log.paid_amount).toFixed(2)}</td>
                        <td style={{ color: parseFloat(log.remaining_amount) > 0 ? "var(--danger)" : "var(--text-muted)" }}>
                          ${parseFloat(log.remaining_amount).toFixed(2)}
                        </td>
                        <td>{log.payment_date}</td>
                        <td>
                          <span
                            className={`badge ${
                              log.status === "paid"
                                ? "badge-success"
                                : log.status === "partial"
                                ? "badge-warning"
                                : "badge-danger"
                            }`}
                            style={{ textTransform: "capitalize" }}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => openReceiptModal(log)}
                            className="btn btn-secondary btn-sm"
                          >
                            🧾 Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {feesLogs.length > displayLimit && (
                  <div style={{ textAlign: "center", marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setDisplayLimit(prev => prev + 100)}>
                      Load More Logs (Showing {displayLimit} of {feesLogs.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Payment Receipt Modal */}
      {showReceiptModal && selectedFee && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h3>🧾 Payment Receipt</h3>
              <button className="close-btn" onClick={() => setShowReceiptModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="report-card-print" style={{ border: "1px dashed var(--text-secondary)", padding: "1.5rem", background: "rgba(255,255,255,0.01)" }}>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  <h2 style={{ margin: "0", fontSize: "1.5rem" }}>ACADEMIX PRO ACADEMY</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Tuition Payment Acknowledgment</p>
                </div>

                <div style={{ margin: "1.5rem 0", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  <div><strong>Transaction ID:</strong> <code>REC-2026-{selectedFee.id}</code></div>
                  <div><strong>Payment Date:</strong> {selectedFee.payment_date}</div>
                  <div><strong>Student Name:</strong> {selectedFee.student_name}</div>
                  {selectedFee.studentDetails && (
                    <>
                      <div><strong>Admission No:</strong> {selectedFee.studentDetails.admission_number}</div>
                      <div><strong>Parent/Guardian:</strong> {selectedFee.studentDetails.parent_name}</div>
                    </>
                  )}
                </div>

                <div style={{ borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", padding: "1rem 0", margin: "1rem 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span>Total Tuition Assessment</span>
                    <strong>${parseFloat(selectedFee.total_amount).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--accent)" }}>
                    <span>Amount Paid (Cash/Card/Online)</span>
                    <strong>${parseFloat(selectedFee.paid_amount).toFixed(2)}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: "700" }}>
                  <span>Outstanding Balance</span>
                  <span style={{ color: parseFloat(selectedFee.remaining_amount) > 0 ? "var(--danger)" : "var(--accent)" }}>
                    ${parseFloat(selectedFee.remaining_amount).toFixed(2)}
                  </span>
                </div>

                <div style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Thank you for your payment. This is a computer-generated receipt.
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowReceiptModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-success" onClick={handlePrint}>
                🖨️ Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Fees;
