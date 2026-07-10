import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [form,  setForm]  = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }
    localStorage.setItem("user", form.email);
    navigate("/dashboard");
  };

  return (
    <div className="page-center">
      <div className="card card-sm" style={{ width: "100%" }}>
        <div style={{ marginBottom: "1.75rem" }}>
          <h1 style={{ fontSize: "1.2rem" }}>Sign in</h1>
          <p>Access the DataPrep platform</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="Enter password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button className="btn btn-primary btn-full" type="submit">Sign In</button>
        </form>

        <div className="divider" />
        <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          No account?{" "}
          <span style={{ color: "var(--accent)", cursor: "pointer" }}
                onClick={() => navigate("/dashboard")}>
            Continue as guest
          </span>
        </div>
      </div>
    </div>
  );
}
