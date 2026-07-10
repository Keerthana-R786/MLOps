import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    API.get("/").then((r) => setStatus(r.data.message)).catch(() => setStatus("Backend not reachable"));
  }, []);

  const stats = [
    { label: "Backend Status", value: status ? "Online" : "...", icon: "🟢" },
    { label: "Datasets Uploaded", value: "—", icon: "📂" },
    { label: "Repairs Completed", value: "—", icon: "🛠️" },
    { label: "Avg Quality Score", value: "—", icon: "📊" },
  ];

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to the Dataset Repair Platform.</p>

      {status && <div className="alert alert-info" style={{ marginTop: "1rem" }}>🔗 {status}</div>}

      <div className="grid2 mt2">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div style={{ fontSize: "1.8rem" }}>{s.icon}</div>
            <div className="value">{s.value}</div>
            <div className="label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt2">
        <h2>Quick Actions</h2>
        <div className="gap mt1">
          <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => navigate("/upload")}>Upload Dataset</button>
          <button className="btn btn-secondary" onClick={() => navigate("/monitoring")}>View MLflow Runs</button>
        </div>
      </div>
    </div>
  );
}
