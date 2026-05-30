import React from "react";

function StudentDetailsModal({ student, onClose }) {
  if (!student) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: "600px" }}>
        <div className="modal-header">
          <h3>🎓 Student Profile Details</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Header summary info */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1.25rem" }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "var(--primary)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.75rem",
              fontWeight: "bold"
            }}>
              {student.user_details?.username ? student.user_details.username.substring(0, 2).toUpperCase() : "ST"}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: "700", color: "var(--text-primary)" }}>
                {student.user_details?.username || "N/A"}
              </h2>
              <p style={{ margin: "0.25rem 0 0 0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Admission Number: <code style={{ fontSize: "0.95rem" }}>{student.admission_number}</code>
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {/* Academic Assignment */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <h4 style={{ margin: 0, color: "var(--primary)", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Academic Status</h4>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)" }}>Class & Section</label>
                <span className="badge badge-info" style={{ display: "inline-block", marginTop: "0.25rem", fontSize: "0.9rem", fontWeight: "600" }}>
                  {student.class_name || "N/A"} - Section {student.section_name || "N/A"}
                </span>
              </div>
            </div>

            {/* Account Role */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <h4 style={{ margin: 0, color: "var(--primary)", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Identity</h4>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)" }}>Role / ID</label>
                <span style={{ fontWeight: "600", fontSize: "0.95rem", textTransform: "capitalize" }}>
                  Student (UID: {student.user_details?.id || "N/A"})
                </span>
              </div>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: 0 }} />

          {/* Personal Information */}
          <div>
            <h4 style={{ margin: "0 0 1rem 0", color: "var(--primary)", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Personal Details</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)" }}>Email Address</label>
                <span style={{ fontWeight: "500" }}>{student.user_details?.email || "N/A"}</span>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)" }}>Contact Number</label>
                <span style={{ fontWeight: "500" }}>{student.user_details?.phone || "N/A"}</span>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)" }}>Date of Birth</label>
                <span style={{ fontWeight: "500" }}>{student.date_of_birth || "N/A"}</span>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)" }}>Gender</label>
                <span className={`badge ${student.gender === "male" ? "badge-info" : "badge-success"}`} style={{ display: "inline-block", marginTop: "0.25rem", textTransform: "capitalize" }}>
                  {student.gender || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: 0 }} />

          {/* Parents Information */}
          <div>
            <h4 style={{ margin: "0 0 1rem 0", color: "var(--primary)", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Guardian Details</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)" }}>Parent / Guardian Name</label>
                <span style={{ fontWeight: "500" }}>{student.parent_name || "N/A"}</span>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)" }}>Guardian Phone</label>
                <span style={{ fontWeight: "500" }}>{student.parent_phone || "N/A"}</span>
              </div>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: 0 }} />

          {/* Address Information */}
          <div>
            <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--primary)", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Residential Address</h4>
            <div style={{
              padding: "0.75rem",
              borderRadius: "6px",
              backgroundColor: "rgba(0,0,0,0.02)",
              border: "1px solid var(--border-color)",
              fontSize: "0.95rem",
              lineHeight: "1.4",
              color: "var(--text-primary)"
            }}>
              {student.address || "No address provided."}
            </div>
          </div>

        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close Profile</button>
        </div>
      </div>
    </div>
  );
}

export default StudentDetailsModal;
