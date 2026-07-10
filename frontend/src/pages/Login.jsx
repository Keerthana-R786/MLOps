import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple demo auth — replace with real auth later
    if (form.email && form.password) {
      localStorage.setItem("user", form.email);
      navigate("/dashboard");
    } else {
      setError("Please enter email and password.");
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h2 style={{ textAlign: "center", color: "#7b8cff" }}>Login</h2>
        <p style={{ textAlign: "center", marginBottom: "1.5rem" }}>Sign in to your account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input type="email" placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />

          <label>Password</label>
          <input type="password" placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />

          <button className="btn btn-primary" type="submit">Sign In</button>
        </form>

        <hr className="divider" />
        <p className="text-center" style={{ fontSize: "0.85rem" }}>
          Don't have an account?{" "}
          <span style={{ color: "#7b8cff", cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
            Continue as Demo
          </span>
        </p>
      </div>
    </div>
  );
}
