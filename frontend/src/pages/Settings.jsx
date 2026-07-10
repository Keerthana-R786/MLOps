import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();
  const [apiUrl, setApiUrl] = useState("http://localhost:8000");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("apiUrl", apiUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div>
      <h1>Settings</h1>
      <p>Configure your platform settings.</p>

      <div className="card mt2">
        <h3>Backend API</h3>
        <label>API Base URL</label>
        <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
        {saved && <div className="alert alert-success">Settings saved.</div>}
        <button className="btn btn-primary" onClick={handleSave}>Save Settings</button>
      </div>

      <div className="card mt2">
        <h3>MLflow</h3>
        <p>MLflow backend store location:</p>
        <input value="sqlite:///mlflow.db" readOnly style={{ opacity: 0.6 }} />
        <p style={{ fontSize: "0.85rem" }}>To view runs: run <code style={{ color: "#7b8cff" }}>mlflow ui --backend-store-uri sqlite:///mlflow.db</code> in the backend folder.</p>
      </div>

      <div className="card mt2">
        <h3>Session</h3>
        <p>Currently logged in as: <strong>{localStorage.getItem("user") || "Demo User"}</strong></p>
        <button className="btn btn-danger mt1" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
