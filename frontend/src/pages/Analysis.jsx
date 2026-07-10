import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function Analysis() {
  const navigate = useNavigate();
  const filename = localStorage.getItem("uploadedFile") || "Employee.csv";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get(`/profile/${filename}`);
      setData(res.data.profile);
    } catch (e) {
      setError(e.response?.data?.detail || "Profiling failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const basic = data?.basic_info;
  const missing = data?.missing_values;
  const dupes = data?.duplicates;
  const numStats = data?.numerical_stats;
  const catStats = data?.categorical_stats;

  return (
    <div>
      <h1>Dataset Analysis</h1>
      <p>Profiling: <strong style={{ color: "#7b8cff" }}>{filename}</strong></p>

      {loading && <div className="loading">Profiling dataset...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {data && (
        <>
          {/* Basic Info */}
          <div className="grid3 mt2">
            <div className="stat-card"><div className="value">{basic.rows}</div><div className="label">Rows</div></div>
            <div className="stat-card"><div className="value">{basic.columns}</div><div className="label">Columns</div></div>
            <div className="stat-card"><div className="value">{basic.memory_usage_kb} KB</div><div className="label">Memory Usage</div></div>
            <div className="stat-card"><div className="value">{missing.total_missing}</div><div className="label">Missing Values</div></div>
            <div className="stat-card"><div className="value">{dupes.duplicate_rows}</div><div className="label">Duplicate Rows</div></div>
            <div className="stat-card"><div className="value">{missing.total_missing_percent}%</div><div className="label">Missing %</div></div>
          </div>

          {/* Column Types */}
          <div className="grid2 mt2">
            <div className="stat-card">
              <h3>Numerical Columns</h3>
              {basic.numerical_columns.map(c => <span key={c} className="badge badge-blue" style={{ margin: "0.2rem" }}>{c}</span>)}
            </div>
            <div className="stat-card">
              <h3>Categorical Columns</h3>
              {basic.categorical_columns.map(c => <span key={c} className="badge badge-yellow" style={{ margin: "0.2rem" }}>{c}</span>)}
            </div>
          </div>

          {/* Numerical Stats */}
          {numStats && Object.keys(numStats).length > 0 && (
            <div className="mt2">
              <h2>Numerical Statistics</h2>
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Column</th><th>Mean</th><th>Median</th><th>Std</th>
                      <th>Min</th><th>Max</th><th>Q1</th><th>Q3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(numStats).map(([col, s]) => (
                      <tr key={col}>
                        <td><strong>{col}</strong></td>
                        <td>{s.mean}</td><td>{s.median}</td><td>{s.std}</td>
                        <td>{s.min}</td><td>{s.max}</td><td>{s.q1}</td><td>{s.q3}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Categorical Stats */}
          {catStats && Object.keys(catStats).length > 0 && (
            <div className="mt2">
              <h2>Categorical Statistics</h2>
              <table className="table">
                <thead><tr><th>Column</th><th>Unique Values</th><th>Most Frequent</th><th>Count</th><th>%</th></tr></thead>
                <tbody>
                  {Object.entries(catStats).map(([col, s]) => (
                    <tr key={col}>
                      <td><strong>{col}</strong></td>
                      <td>{s.unique_values}</td>
                      <td>{s.most_frequent}</td>
                      <td>{s.most_frequent_count}</td>
                      <td>{s.most_frequent_percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="gap mt2">
            <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => navigate("/repair")}>Run Repair →</button>
          </div>
        </>
      )}
    </div>
  );
}
