import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function Dashboard() {
  const navigate  = useNavigate();
  const [status,  setStatus]  = useState("Checking...");
  const [online,  setOnline]  = useState(false);
  const uploadedFile = localStorage.getItem("uploadedFile");

  useEffect(() => {
    API.get("/")
      .then((r) => { setStatus(r.data.message); setOnline(true); })
      .catch(() => { setStatus("Backend not reachable at http://localhost:8000"); setOnline(false); });
  }, []);

  const steps = [
    { label: "Upload Dataset",   route: "/upload",     done: !!uploadedFile,  icon: "📤" },
    { label: "Profile & Analyse",route: "/analysis",   done: !!uploadedFile,  icon: "🔍" },
    { label: "Repair Dataset",   route: "/repair",     done: false,            icon: "🛠️" },
    { label: "Quality Report",   route: "/quality",    done: false,            icon: "📊" },
  ];

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to the Dataset Repair Platform.</p>

      {/* Backend status */}
      <div className={`alert ${online ? "alert-success" : "alert-error"} mt2`}>
        {online ? "🟢" : "🔴"} {status}
      </div>

      {/* Current file */}
      {uploadedFile && (
        <div className="alert alert-info mt1">
          📂 Active file: <strong>{uploadedFile}</strong>
        </div>
      )}

      {/* Pipeline steps */}
      <div className="mt2">
        <h2>Pipeline</h2>
        <div className="grid2 mt1">
          {steps.map((s, i) => (
            <div
              key={s.label}
              className="stat-card"
              style={{ cursor: "pointer", border: `1px solid ${s.done ? "#2ecc71" : "#2a2a4a"}` }}
              onClick={() => navigate(s.route)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "1.5rem" }}>{s.icon}</span>
                <span className={`badge ${s.done ? "badge-green" : "badge-blue"}`}>
                  {s.done ? "Ready" : `Step ${i + 1}`}
                </span>
              </div>
              <div style={{ fontWeight: 600, marginTop: "0.5rem" }}>{s.label}</div>
              <div style={{ fontSize: "0.85rem", color: "#aaa", marginTop: "0.2rem" }}>
                Click to open →
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick start */}
      <div className="mt2">
        <h2>Quick Start</h2>
        <div className="gap mt1">
          <button className="btn btn-primary" style={{ width: "auto" }}
                  onClick={() => navigate("/upload")}>
            {uploadedFile ? "Upload New File" : "Upload Dataset"}
          </button>
          {uploadedFile && (
            <button className="btn btn-secondary"
                    onClick={() => navigate("/analysis")}>
              View Analysis
            </button>
          )}
          <button className="btn btn-secondary"
                  onClick={() => navigate("/monitoring")}>
            MLflow Runs
          </button>
        </div>
      </div>

      {/* API info */}
      <div className="stat-card mt2">
        <h3>API Endpoints</h3>
        <table className="table" style={{ marginTop: "0.5rem" }}>
          <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
          <tbody>
            {[
              ["POST", "/upload",              "Upload & validate CSV"],
              ["GET",  "/profile/{file}",      "Profile dataset"],
              ["POST", "/repair/{file}",       "Run full repair pipeline"],
              ["GET",  "/quality/{file}",      "Quality score before/after"],
              ["POST", "/report/{file}",       "Generate PDF + JSON report"],
              ["GET",  "/report/download/pdf", "Download PDF report"],
              ["GET",  "/report/download/csv", "Download cleaned CSV"],
            ].map(([m, e, d]) => (
              <tr key={e}>
                <td><span className={`badge ${m === "POST" ? "badge-yellow" : "badge-blue"}`}>{m}</span></td>
                <td><code style={{ color: "#7b8cff" }}>{e}</code></td>
                <td style={{ color: "#aaa", fontSize: "0.85rem" }}>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: "0.8rem", fontSize: "0.85rem" }}>
          Full Swagger UI:{" "}
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer"
             style={{ color: "#7b8cff" }}>http://localhost:8000/docs</a>
        </p>
      </div>
    </div>
  );
}
