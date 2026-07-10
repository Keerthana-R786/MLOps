import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function Analysis() {
  const navigate  = useNavigate();
  const filename  = localStorage.getItem("uploadedFile");
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!filename) {
      setError("No file uploaded yet. Please upload a dataset first.");
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get(`/profile/${filename}`);
      setData(res.data.profile);
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || "Profiling failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Score bar helper ──────────────────────────────────────────────────────
  const pct = (val, total) => total > 0 ? ((val / total) * 100).toFixed(1) : 0;

  if (!filename) {
    return (
      <div>
        <h1>Dataset Analysis</h1>
        <div className="alert alert-error mt2">
          No file uploaded yet.{" "}
          <span style={{ color: "#7b8cff", cursor: "pointer" }}
                onClick={() => navigate("/upload")}>Go to Upload →</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Dataset Analysis</h1>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
        <p style={{ margin: 0 }}>
          File: <strong style={{ color: "#7b8cff" }}>{filename}</strong>
        </p>
        <button className="btn btn-secondary" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                onClick={fetchProfile}>
          🔄 Refresh
        </button>
      </div>

      {loading && (
        <div className="loading" style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "2rem" }}>🔍</div>
          <p>Profiling dataset...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error mt2">
          {error}
          <div className="mt1">
            <button className="btn btn-secondary" style={{ width: "auto" }}
                    onClick={() => navigate("/upload")}>← Back to Upload</button>
          </div>
        </div>
      )}

      {data && !loading && (() => {
        const basic   = data.basic_info;
        const missing = data.missing_values;
        const dupes   = data.duplicates;
        const numStats = data.numerical_stats || {};
        const catStats = data.categorical_stats || {};
        const corr     = data.correlation_matrix || {};

        return (
          <>
            {/* ── Overview cards ─────────────────────────────────────── */}
            <div className="grid3 mt2">
              <div className="stat-card">
                <div className="value">{basic.rows.toLocaleString()}</div>
                <div className="label">Total Rows</div>
              </div>
              <div className="stat-card">
                <div className="value">{basic.columns}</div>
                <div className="label">Total Columns</div>
              </div>
              <div className="stat-card">
                <div className="value">{basic.memory_usage_kb} KB</div>
                <div className="label">Memory Usage</div>
              </div>
              <div className="stat-card">
                <div className="value" style={{ color: missing.total_missing > 0 ? "#f0c040" : "#2ecc71" }}>
                  {missing.total_missing.toLocaleString()}
                </div>
                <div className="label">Missing Values ({missing.total_missing_percent}%)</div>
              </div>
              <div className="stat-card">
                <div className="value" style={{ color: dupes.duplicate_rows > 0 ? "#f0c040" : "#2ecc71" }}>
                  {dupes.duplicate_rows.toLocaleString()}
                </div>
                <div className="label">Duplicate Rows ({dupes.duplicate_percent}%)</div>
              </div>
              <div className="stat-card">
                <div className="value">{basic.numerical_columns.length} / {basic.categorical_columns.length}</div>
                <div className="label">Numerical / Categorical</div>
              </div>
            </div>

            {/* ── Column type badges ─────────────────────────────────── */}
            <div className="grid2 mt2">
              <div className="stat-card">
                <h3>Numerical Columns</h3>
                <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {basic.numerical_columns.length > 0
                    ? basic.numerical_columns.map(c =>
                        <span key={c} className="badge badge-blue">{c}</span>)
                    : <span style={{ color: "#aaa" }}>None</span>}
                </div>
              </div>
              <div className="stat-card">
                <h3>Categorical Columns</h3>
                <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {basic.categorical_columns.length > 0
                    ? basic.categorical_columns.map(c =>
                        <span key={c} className="badge badge-yellow">{c}</span>)
                    : <span style={{ color: "#aaa" }}>None</span>}
                </div>
              </div>
            </div>

            {/* ── Missing value breakdown ───────────────────────────── */}
            <div className="stat-card mt2">
              <h3>Missing Values per Column</h3>
              <table className="table" style={{ marginTop: "0.5rem" }}>
                <thead>
                  <tr><th>Column</th><th>Type</th><th>Missing</th><th>%</th><th>Visual</th></tr>
                </thead>
                <tbody>
                  {Object.entries(missing.per_column).map(([col, v]) => (
                    <tr key={col}>
                      <td><strong>{col}</strong></td>
                      <td>
                        <span className={`badge ${basic.numerical_columns.includes(col) ? "badge-blue" : "badge-yellow"}`}>
                          {basic.numerical_columns.includes(col) ? "num" : "cat"}
                        </span>
                      </td>
                      <td>{v.missing_count}</td>
                      <td>{v.missing_percent}%</td>
                      <td style={{ width: "120px" }}>
                        <div className="score-bar" style={{ margin: 0 }}>
                          <div className="score-fill"
                               style={{ width: `${100 - v.missing_percent}%`,
                                        background: v.missing_percent > 0 ? "#f0c040" : "#2ecc71" }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Numerical Stats ───────────────────────────────────── */}
            {Object.keys(numStats).length > 0 && (
              <div className="mt2">
                <h2>Numerical Statistics</h2>
                <div style={{ overflowX: "auto" }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Column</th><th>Mean</th><th>Median</th><th>Std Dev</th>
                        <th>Min</th><th>Max</th><th>Q1 (25%)</th><th>Q3 (75%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(numStats).map(([col, s]) => (
                        <tr key={col}>
                          <td><strong>{col}</strong></td>
                          <td>{Number(s.mean).toFixed(4)}</td>
                          <td>{Number(s.median).toFixed(4)}</td>
                          <td>{Number(s.std).toFixed(4)}</td>
                          <td>{s.min}</td>
                          <td>{s.max}</td>
                          <td>{s.q1}</td>
                          <td>{s.q3}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Categorical Stats ─────────────────────────────────── */}
            {Object.keys(catStats).length > 0 && (
              <div className="mt2">
                <h2>Categorical Statistics</h2>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Column</th><th>Unique</th><th>Most Frequent</th>
                      <th>Count</th><th>%</th><th>Top 5 Values</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(catStats).map(([col, s]) => (
                      <tr key={col}>
                        <td><strong>{col}</strong></td>
                        <td>{s.unique_values}</td>
                        <td><span className="badge badge-green">{s.most_frequent}</span></td>
                        <td>{s.most_frequent_count}</td>
                        <td>{s.most_frequent_percent}%</td>
                        <td style={{ fontSize: "0.8rem", color: "#aaa" }}>
                          {s.value_counts
                            ? Object.entries(s.value_counts).slice(0, 5)
                                .map(([k, v]) => `${k}: ${v}`).join(" | ")
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Correlation Matrix ────────────────────────────────── */}
            {Object.keys(corr).length > 0 && (
              <div className="mt2">
                <h2>Correlation Matrix</h2>
                <div style={{ overflowX: "auto" }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Column</th>
                        {Object.keys(corr).map(c => <th key={c}>{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(corr).map(([row, vals]) => (
                        <tr key={row}>
                          <td><strong>{row}</strong></td>
                          {Object.values(vals).map((v, i) => {
                            const abs = Math.abs(v);
                            const bg  = v === 1
                              ? "#1a1a3a"
                              : abs > 0.7 ? "#2a1a1a"
                              : abs > 0.4 ? "#1a2a1a"
                              : "transparent";
                            const color = abs > 0.4 ? "#fff" : "#aaa";
                            return (
                              <td key={i} style={{ background: bg, color, textAlign: "center", fontSize: "0.85rem" }}>
                                {Number(v).toFixed(3)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Column data types ────────────────────────────────── */}
            <div className="stat-card mt2">
              <h3>Column Data Types</h3>
              <table className="table" style={{ marginTop: "0.5rem" }}>
                <thead><tr><th>Column</th><th>Dtype</th><th>Category</th></tr></thead>
                <tbody>
                  {Object.entries(basic.dtypes).map(([col, dtype]) => (
                    <tr key={col}>
                      <td><strong>{col}</strong></td>
                      <td><code style={{ color: "#7b8cff" }}>{dtype}</code></td>
                      <td>
                        <span className={`badge ${basic.numerical_columns.includes(col) ? "badge-blue" : "badge-yellow"}`}>
                          {basic.numerical_columns.includes(col) ? "Numerical" : "Categorical"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="gap mt2">
              <button className="btn btn-primary" style={{ width: "auto" }}
                      onClick={() => navigate("/repair")}>
                Run Repair →
              </button>
              <button className="btn btn-secondary"
                      onClick={() => navigate("/upload")}>
                ← Upload New File
              </button>
            </div>
          </>
        );
      })()}
    </div>
  );
}
