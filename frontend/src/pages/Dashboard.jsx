import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function Dashboard() {
  const navigate     = useNavigate();
  const [online,     setOnline]  = useState(null);
  const uploadedFile = localStorage.getItem("uploadedFile");

  useEffect(() => {
    API.get("/").then(() => setOnline(true)).catch(() => setOnline(false));
  }, []);

  const steps = [
    { step: "01", label: "Upload Dataset",    desc: "Upload a CSV file to begin", route: "/upload",   done: !!uploadedFile },
    { step: "02", label: "Analyse",           desc: "View statistical profile",    route: "/analysis", done: !!uploadedFile },
    { step: "03", label: "Preprocess",        desc: "Clean and repair the dataset",route: "/repair",   done: false },
    { step: "04", label: "Download Results",  desc: "Quality report and clean CSV",route: "/quality",  done: false },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Prepare your dataset for machine learning.</p>
      </div>

      {/* Status bar */}
      <div className={`alert ${online === null ? "alert-info" : online ? "alert-success" : "alert-error"}`}>
        {online === null && "Connecting to backend..."}
        {online === true  && "Backend connected — http://localhost:8000"}
        {online === false && "Backend not reachable. Start the server: uvicorn app.main:app --reload --host 0.0.0.0"}
      </div>

      {uploadedFile && (
        <div className="alert alert-info mt1">
          Active file: <strong style={{ color: "var(--accent)" }}>{uploadedFile}</strong>
          <span className="text-muted" style={{ marginLeft: "0.5rem" }}>
            — <span style={{ cursor: "pointer", color: "var(--accent)" }}
                    onClick={() => { localStorage.removeItem("uploadedFile"); window.location.reload(); }}>
                clear
              </span>
          </span>
        </div>
      )}

      {/* Pipeline */}
      <div className="section mt2">
        <div className="section-title">Pipeline</div>
        <div className="grid2" style={{ gap: "0.75rem" }}>
          {steps.map((s) => (
            <div
              key={s.step}
              className="card"
              style={{ cursor: "pointer", borderColor: s.done ? "var(--green)" : "var(--border)" }}
              onClick={() => navigate(s.route)}
            >
              <div className="flex-between mb1">
                <span className="text-xs text-muted mono">STEP {s.step}</span>
                <span className={`badge ${s.done ? "badge-green" : "badge-gray"}`}>
                  {s.done ? "Ready" : "Pending"}
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.2rem" }}>{s.label}</div>
              <div className="text-sm text-muted">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="section">
        <div className="section-title">Quick Actions</div>
        <div className="flex-row flex-wrap">
          <button className="btn btn-primary" onClick={() => navigate("/upload")}>
            {uploadedFile ? "Upload New File" : "Upload Dataset"}
          </button>
          {uploadedFile && (
            <button className="btn btn-secondary" onClick={() => navigate("/analysis")}>
              View Analysis
            </button>
          )}
          {uploadedFile && (
            <button className="btn btn-secondary" onClick={() => navigate("/repair")}>
              Run Preprocessing
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => navigate("/monitoring")}>
            MLflow Runs
          </button>
        </div>
      </div>

      {/* Endpoints reference */}
      <div className="section">
        <div className="section-title">API Reference</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
            </thead>
            <tbody>
              {[
                ["POST", "/upload",               "Upload and validate a CSV file"],
                ["GET",  "/profile/{file}",        "Statistical profiling of the dataset"],
                ["POST", "/repair/{file}",         "Full preprocessing pipeline"],
                ["GET",  "/quality/{file}",        "Quality score before and after"],
                ["POST", "/report/{file}",         "Generate PDF and JSON report"],
                ["GET",  "/report/download/pdf",   "Download PDF report"],
                ["GET",  "/report/download/csv",   "Download cleaned dataset"],
              ].map(([m, e, d]) => (
                <tr key={e}>
                  <td><span className={`badge ${m === "POST" ? "badge-yellow" : "badge-blue"}`}>{m}</span></td>
                  <td><code>{e}</code></td>
                  <td className="text-muted">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt1 text-sm">
          Interactive docs:{" "}
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer"
             style={{ color: "var(--accent)" }}>
            http://localhost:8000/docs
          </a>
        </p>
      </div>
    </div>
  );
}
