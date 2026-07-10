import { useState, useEffect } from "react";
import API from "../api";

export default function QualityReport() {
  const filename = localStorage.getItem("uploadedFile") || "Employee.csv";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    API.get(`/quality/${filename}`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.detail || "Failed to load quality scores."))
      .finally(() => setLoading(false));
  }, []);

  const scoreColor = (s) => s >= 90 ? "#2ecc71" : s >= 75 ? "#7b8cff" : s >= 60 ? "#f0c040" : "#ff4d6d";

  const ScoreRow = ({ label, before, after }) => (
    <tr>
      <td>{label}</td>
      <td style={{ color: scoreColor(before) }}>{before}%</td>
      <td style={{ color: scoreColor(after) }}>{after}%</td>
      <td><span className={`badge ${after > before ? "badge-green" : "badge-blue"}`}>
        {after >= before ? "+" : ""}{(after - before).toFixed(2)}%
      </span></td>
    </tr>
  );

  const handleDownload = async (type) => {
    const base = filename.replace(".csv", "");
    const url = `/report/download/${type}/${filename}`;
    const link = document.createElement("a");
    link.href = `http://localhost:8000${url}`;
    link.download = type === "pdf" ? `${base}_report.pdf` : type === "json" ? `${base}_summary.json` : `${base}_cleaned.csv`;
    link.click();
  };

  return (
    <div>
      <h1>Quality Report</h1>
      <p>File: <strong style={{ color: "#7b8cff" }}>{filename}</strong></p>

      {loading && <div className="loading">Loading quality scores...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {data && (
        <>
          {/* Overall scores */}
          <div className="grid2 mt2">
            <div className="stat-card">
              <h3>Before Repair</h3>
              <div className="value" style={{ color: scoreColor(data.before.overall_score) }}>
                {data.before.overall_score}%
              </div>
              <div className="label">Grade: {data.before.grade}</div>
              <div className="score-bar">
                <div className="score-fill" style={{ width: `${data.before.overall_score}%` }} />
              </div>
            </div>

            {data.after && (
              <div className="stat-card">
                <h3>After Repair</h3>
                <div className="value" style={{ color: scoreColor(data.after.overall_score) }}>
                  {data.after.overall_score}%
                </div>
                <div className="label">Grade: {data.after.grade}</div>
                <div className="score-bar">
                  <div className="score-fill" style={{ width: `${data.after.overall_score}%` }} />
                </div>
                {data.improvement > 0 && (
                  <span className="badge badge-green mt1">+{data.improvement}% improvement</span>
                )}
              </div>
            )}
          </div>

          {/* Score breakdown */}
          {data.after && (
            <div className="mt2">
              <h2>Score Breakdown</h2>
              <table className="table">
                <thead><tr><th>Metric</th><th>Before</th><th>After</th><th>Change</th></tr></thead>
                <tbody>
                  <ScoreRow label="Completeness" before={data.before.individual_scores.completeness} after={data.after.individual_scores.completeness} />
                  <ScoreRow label="Uniqueness"   before={data.before.individual_scores.uniqueness}   after={data.after.individual_scores.uniqueness} />
                  <ScoreRow label="Validity"     before={data.before.individual_scores.validity}     after={data.after.individual_scores.validity} />
                  <ScoreRow label="Consistency"  before={data.before.individual_scores.consistency}  after={data.after.individual_scores.consistency} />
                  <ScoreRow label="Overall"      before={data.before.overall_score}                  after={data.after.overall_score} />
                </tbody>
              </table>
            </div>
          )}

          {/* Downloads */}
          <div className="mt2">
            <h2>Downloads</h2>
            <div className="gap mt1">
              <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => handleDownload("pdf")}>📄 Download PDF Report</button>
              <button className="btn btn-secondary" onClick={() => handleDownload("json")}>📋 Download JSON Summary</button>
              <button className="btn btn-success" onClick={() => handleDownload("csv")}>📥 Download Cleaned CSV</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
