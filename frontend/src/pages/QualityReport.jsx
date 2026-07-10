import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function QualityReport() {
  const navigate  = useNavigate();
  const filename  = localStorage.getItem("uploadedFile");
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!filename) { setError("No file uploaded yet."); return; }
    fetchQuality();
  }, []);

  const fetchQuality = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get(`/quality/${filename}`);
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Failed to load quality scores.");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (s) => {
    if (s >= 90) return "#2ecc71";
    if (s >= 75) return "#7b8cff";
    if (s >= 60) return "#f0c040";
    return "#ff4d6d";
  };

  const handleDownload = (type) => {
    const base = filename.replace(".csv", "");
    const urls = {
      pdf:  `http://localhost:8000/report/download/pdf/${filename}`,
      json: `http://localhost:8000/report/download/json/${filename}`,
      csv:  `http://localhost:8000/report/download/csv/${filename}`,
    };
    const names = {
      pdf:  `${base}_report.pdf`,
      json: `${base}_summary.json`,
      csv:  `${base}_cleaned.csv`,
    };
    const a = document.createElement("a");
    a.href     = urls[type];
    a.download = names[type];
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!filename) {
    return (
      <div>
        <h1>Quality Report</h1>
        <div className="alert alert-error mt2">
          No file uploaded.{" "}
          <span style={{ color: "#7b8cff", cursor: "pointer" }}
                onClick={() => navigate("/upload")}>Go to Upload →</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Quality Report</h1>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
        <p style={{ margin: 0 }}>File: <strong style={{ color: "#7b8cff" }}>{filename}</strong></p>
        <button className="btn btn-secondary"
                style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                onClick={fetchQuality}>🔄 Refresh</button>
      </div>

      {loading && (
        <div className="loading mt2" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem" }}>📊</div>
          <p>Calculating quality scores...</p>
        </div>
      )}

      {error && <div className="alert alert-error mt2">{error}</div>}

      {data && !loading && (() => {
        const before = data.before;
        const after  = data.after;
        const hasAfter = !!after;

        return (
          <>
            {/* Overall scores */}
            <div className={`mt2 ${hasAfter ? "grid2" : ""}`}>
              <div className="stat-card">
                <h3>Before Repair</h3>
                <div className="value" style={{ color: scoreColor(before.overall_score) }}>
                  {before.overall_score}%
                </div>
                <div className="label">Grade: <strong>{before.grade}</strong></div>
                <div className="score-bar mt1">
                  <div className="score-fill"
                       style={{ width: `${before.overall_score}%`,
                                background: scoreColor(before.overall_score) }} />
                </div>

                {/* Individual scores */}
                <div style={{ marginTop: "1rem" }}>
                  {Object.entries(before.individual_scores).map(([k, v]) => (
                    <div key={k} style={{ marginBottom: "0.6rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between",
                                    fontSize: "0.85rem", marginBottom: "0.2rem" }}>
                        <span style={{ textTransform: "capitalize" }}>{k}</span>
                        <span style={{ color: scoreColor(v) }}>{v}%</span>
                      </div>
                      <div className="score-bar" style={{ margin: 0 }}>
                        <div className="score-fill"
                             style={{ width: `${v}%`, background: scoreColor(v) }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {hasAfter && (
                <div className="stat-card">
                  <h3>After Repair</h3>
                  <div className="value" style={{ color: scoreColor(after.overall_score) }}>
                    {after.overall_score}%
                  </div>
                  <div className="label">Grade: <strong>{after.grade}</strong></div>
                  <div className="score-bar mt1">
                    <div className="score-fill"
                         style={{ width: `${after.overall_score}%`,
                                  background: scoreColor(after.overall_score) }} />
                  </div>
                  {data.improvement > 0 && (
                    <span className="badge badge-green" style={{ marginTop: "0.5rem", display: "inline-block" }}>
                      +{data.improvement}% improvement
                    </span>
                  )}

                  <div style={{ marginTop: "1rem" }}>
                    {Object.entries(after.individual_scores).map(([k, v]) => (
                      <div key={k} style={{ marginBottom: "0.6rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between",
                                      fontSize: "0.85rem", marginBottom: "0.2rem" }}>
                          <span style={{ textTransform: "capitalize" }}>{k}</span>
                          <span style={{ color: scoreColor(v) }}>{v}%</span>
                        </div>
                        <div className="score-bar" style={{ margin: 0 }}>
                          <div className="score-fill"
                               style={{ width: `${v}%`, background: scoreColor(v) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Score comparison table */}
            {hasAfter && (
              <div className="mt2">
                <h2>Score Breakdown</h2>
                <table className="table">
                  <thead>
                    <tr><th>Metric</th><th>Weight</th><th>Before</th><th>After</th><th>Change</th></tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Completeness", key: "completeness", weight: "30%" },
                      { label: "Uniqueness",   key: "uniqueness",   weight: "25%" },
                      { label: "Validity",     key: "validity",     weight: "25%" },
                      { label: "Consistency",  key: "consistency",  weight: "20%" },
                    ].map(({ label, key, weight }) => {
                      const b = before.individual_scores[key];
                      const a = after.individual_scores[key];
                      const diff = (a - b).toFixed(2);
                      return (
                        <tr key={key}>
                          <td>{label}</td>
                          <td><span className="badge badge-blue">{weight}</span></td>
                          <td style={{ color: scoreColor(b) }}>{b}%</td>
                          <td style={{ color: scoreColor(a) }}>{a}%</td>
                          <td>
                            <span className={`badge ${diff > 0 ? "badge-green" : diff < 0 ? "badge-red" : "badge-blue"}`}>
                              {diff > 0 ? "+" : ""}{diff}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ fontWeight: 700 }}>
                      <td><strong>Overall</strong></td>
                      <td><span className="badge badge-blue">100%</span></td>
                      <td style={{ color: scoreColor(before.overall_score) }}>
                        <strong>{before.overall_score}%</strong>
                      </td>
                      <td style={{ color: scoreColor(after.overall_score) }}>
                        <strong>{after.overall_score}%</strong>
                      </td>
                      <td>
                        <span className={`badge ${data.improvement > 0 ? "badge-green" : "badge-blue"}`}>
                          {data.improvement > 0 ? "+" : ""}{data.improvement}%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Downloads */}
            <div className="stat-card mt2">
              <h2>Downloads</h2>
              <p style={{ marginBottom: "1rem" }}>
                {hasAfter
                  ? "Report and cleaned dataset are ready for download."
                  : "Run repair first to generate the cleaned dataset and PDF report."}
              </p>
              <div className="gap" style={{ flexWrap: "wrap" }}>
                {hasAfter && (
                  <>
                    <button className="btn btn-primary" style={{ width: "auto" }}
                            onClick={() => handleDownload("pdf")}>
                      📄 Download PDF Report
                    </button>
                    <button className="btn btn-secondary"
                            onClick={() => handleDownload("json")}>
                      📋 Download JSON Summary
                    </button>
                    <button className="btn btn-success"
                            onClick={() => handleDownload("csv")}>
                      📥 Download Cleaned CSV
                    </button>
                  </>
                )}
                {!hasAfter && (
                  <button className="btn btn-primary" style={{ width: "auto" }}
                          onClick={() => navigate("/repair")}>
                    Run Repair First →
                  </button>
                )}
              </div>
            </div>

            <div className="gap mt2">
              <button className="btn btn-secondary"
                      onClick={() => navigate("/repair")}>
                ← Back to Repair
              </button>
              <button className="btn btn-secondary"
                      onClick={() => navigate("/monitoring")}>
                View MLflow →
              </button>
            </div>
          </>
        );
      })()}
    </div>
  );
}
