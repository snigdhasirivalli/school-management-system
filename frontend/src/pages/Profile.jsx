import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";
import { useToast } from "../context/ToastContext";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      if (!token) {
        navigate("/");
        return;
      }
      const response = await axios.get("profile/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data);
      setForm({
        username: response.data.username || "",
        email: response.data.email || "",
        phone: response.data.phone || "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch profile info.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("access");
      const updateData = {
        username: form.username,
        email: form.email,
        phone: form.phone,
      };
      if (form.password) {
        updateData.password = form.password;
      }

      const response = await axios.put("update-profile/", updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showToast("Profile settings updated successfully!", "success");
      setProfile(response.data.user);
      localStorage.setItem("user_profile", JSON.stringify(response.data.user));
      setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || "Failed to update profile settings.";
      showToast(errMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="content-header">
          <div>
            <h1>⚙️ Profile Settings</h1>
            <p style={{ color: "var(--text-secondary)" }}>Manage your account details and security settings</p>
          </div>
        </div>

        {loading ? (
          <div className="content-card">
            <p>Loading profile settings...</p>
          </div>
        ) : profile ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginTop: "24px" }}>
            
            {/* Account Details Form */}
            <div className="content-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", color: "var(--primary)", fontWeight: "600" }}>
                👤 Personal Details
              </h3>
              
              <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    className="form-control"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    type="text"
                    className="form-control"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new_password">New Password (leave blank to keep current)</label>
                  <input
                    id="new_password"
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>

                {form.password && (
                  <div className="form-group">
                    <label htmlFor="confirm_password">Confirm New Password</label>
                    <input
                      id="confirm_password"
                      type="password"
                      className="form-control"
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: "8px" }}
                  disabled={submitting}
                >
                  {submitting ? "Saving changes..." : "Save Settings"}
                </button>
              </form>
            </div>

            {/* Profile Overview Card */}
            <div className="content-card" style={{ display: "flex", flexDirection: "column", gap: "20px", alignSelf: "start" }}>
              <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", color: "var(--accent)", fontWeight: "600" }}>
                🔒 Portal Role Info
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.95rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Portal Role:</span>
                  <span className={`badge badge-${profile.role === 'admin' ? 'danger' : profile.role === 'teacher' ? 'success' : 'accent'}`} style={{ textTransform: "capitalize" }}>
                    {profile.role}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Verification Status:</span>
                  <span style={{ color: "var(--success)", fontWeight: "bold" }}>✓ Verified User</span>
                </div>

                {profile.role === 'student' && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Admission Number:</span>
                      <span style={{ fontWeight: "600" }}>{profile.admission_number || "N/A"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Class / Section:</span>
                      <span style={{ fontWeight: "600" }}>
                        {profile.class_name ? `Class ${profile.class_name}` : ""} {profile.section_name ? `(Section ${profile.section_name})` : "N/A"}
                      </span>
                    </div>
                  </>
                )}

                {profile.role === 'teacher' && (
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "8px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Employee ID:</span>
                    <span style={{ fontWeight: "600" }}>{profile.employee_id || "N/A"}</span>
                  </div>
                )}
                
                <div style={{ padding: "16px", backgroundColor: "var(--bg-main)", borderRadius: "12px", border: "1px solid var(--border-color)", marginTop: "12px" }}>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                    💡 For security reasons, changes to portal access permissions or classes must be requested from the school system administrator.
                  </p>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="content-card">
            <p>Profile information not available.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
