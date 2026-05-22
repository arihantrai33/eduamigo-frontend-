import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roles = [
  { id: "student", label: "Student", emoji: "🎒" },
  { id: "parent", label: "Parent", emoji: "👨‍👩‍👧" },
  { id: "teacher", label: "Teacher", emoji: "📚" },
  { id: "admin", label: "Admin", emoji: "🛡️" },
];

const getFieldConfig = (role) => {
  if (role === "student") {
    return { label: "REGISTRATION NUMBER", placeholder: "e.g. STU2024001", type: "text" };
  }
  return { label: "EMAIL", placeholder: "e.g. teacher@school.edu.in", type: "email" };
};

export default function Login() {
  const [selectedRole, setSelectedRole] = useState("student");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const fieldConfig = getFieldConfig(selectedRole);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setUserId("");
    setError("");
  };

  const handleLogin = async () => {
    if (!userId || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userId, password, role: selectedRole })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        login(data.user);
        setTimeout(() => navigate(`/${selectedRole}/home`), 100);
      } else {
        setError(data.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: "100vh",
      background: "linear-gradient(160deg, #1a73e8 0%, #6c63ff 100%)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      fontFamily: "sans-serif"
    }}>
      <div style={{ flex: 1 }} />
      <div style={{
        background: "white",
        borderRadius: "28px 28px 0 0",
        padding: "32px 24px 40px",
        boxShadow: "0 -4px 32px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: "700" }}>
          Welcome Back 🎓
        </h2>
        <p style={{ margin: "0 0 24px", color: "#888", fontSize: "14px" }}>
          Select your role to continue
        </p>
        <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleRoleChange(role.id)}
              style={{
                flex: 1, padding: "10px 4px", borderRadius: "12px",
                border: selectedRole === role.id ? "2px solid #1a73e8" : "2px solid #eee",
                background: selectedRole === role.id ? "#f0f7ff" : "white",
                color: selectedRole === role.id ? "#1a73e8" : "#666",
                fontWeight: "600", fontSize: "12px", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "4px"
              }}
            >
              <span style={{ fontSize: "20px" }}>{role.emoji}</span>
              {role.label}
            </button>
          ))}
        </div>
        <label style={{ fontSize: "11px", fontWeight: "700", color: "#999", letterSpacing: "1px" }}>
          {fieldConfig.label}
        </label>
        <input
          type={fieldConfig.type}
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder={fieldConfig.placeholder}
          style={{
            width: "100%", padding: "14px 16px", borderRadius: "12px",
            border: "1.5px solid #eee", fontSize: "15px", marginTop: "8px",
            marginBottom: "16px", outline: "none", boxSizing: "border-box",
            color: "#111", background: "white"
          }}
        />
        <label style={{ fontSize: "11px", fontWeight: "700", color: "#999", letterSpacing: "1px" }}>
          PASSWORD
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={{
            width: "100%", padding: "14px 16px", borderRadius: "12px",
            border: "1.5px solid #eee", fontSize: "15px", marginTop: "8px",
            marginBottom: "8px", outline: "none", boxSizing: "border-box",
            color: "#111", background: "white"
          }}
        />
        {error && (
          <p style={{ color: "red", fontSize: "13px", marginBottom: "12px" }}>{error}</p>
        )}
        <div style={{ marginBottom: "24px" }} />
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%", padding: "16px", borderRadius: "14px", border: "none",
            background: loading ? "#aaa" : "linear-gradient(135deg, #1a73e8, #6c63ff)",
            color: "white", fontSize: "16px", fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.5px"
          }}
        >
          {loading ? "Logging in..." : "Login to EduAmigo →"}
        </button>
        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "#888" }}>
          Forgot password?{" "}
          <span style={{ color: "#1a73e8", fontWeight: "600", cursor: "pointer" }}>
            Reset here
          </span>
        </p>
      </div>
    </div>
  );
}