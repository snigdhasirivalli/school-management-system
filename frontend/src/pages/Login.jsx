import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await axios.post("login/", {
        email,
        password,
      });

      const token = response.data.access;
      localStorage.setItem("access", token);

      // Fetch user profile info immediately
      const profileResponse = await axios.get("profile/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.setItem("role", profileResponse.data.role);
      localStorage.setItem("user_profile", JSON.stringify(profileResponse.data));

      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      if (error.response && error.response.data) {
        setError(error.response.data.detail || "Invalid email or password.");
      } else {
        setError("Network Error. Please make sure the server is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🏫 Academix Pro</h1>
          <p>Sign in to your School Portal</p>
        </div>

        {error && (
          <div
            className="badge badge-danger"
            style={{
              width: "100%",
              marginBottom: "1.5rem",
              display: "block",
              textAlign: "center",
              padding: "0.6rem",
              borderRadius: "6px"
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="e.g., snigdha@test.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            style={{ marginTop: "1.5rem" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;