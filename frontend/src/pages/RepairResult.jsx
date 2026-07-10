import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function RepairResult() {
  const navigate       = useNavigate();
  const filename       = localStorage.getItem("uploadedFile");
  const [outlierAction, setOutlierAction] = useState("flag");
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState("");

  if (!filename) {
    return (
      <div>
        <h1>Repair Dataset</h1>
        <div className="alert alert-error mt2">
          No file uploaded yet.{" "}
          <span style={{ color: "#7b8cff", cursor: "pointer" }}
                onClick={() => navigate("/upload")}>Go to Upload →</span>
        </div>
      </div>
    );
  }

  const runRepair = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await API.post(`/repair/${filename}?outlier_action=${outlierAction}`);
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Repair failed.");
    } finally {
      setLoading(false);
    }
  };

  const log = result?.result?.repair_log;

  return (
    <div>
      <h1>Repair Dataset</h1>
      <p>File: <strong style={{ color: "#7b8cff" }}>{filename}</strong></p>

      {/* Config */}
      <div className="stat-card mt2" style={{ maxWidth: 500 }}>
        <h3>Repair Options</h3>
        <label style={{ marginTop: "1rem" }}>Outlier Handling</label>
        <select value={outlierAction} onChange={(e) => setOutlierAction(e.target.value)}>
          <option value="flag">Flag outliers (add is_outlier column)</option>
          <option value="remove">Remove outlier rows</option>
        </select>
        <button className="btn btn-primary" onClick={runRepair} disabled={loading}>
          {loading ? "⏳ Running Repair Pipeline..." : "▶ Run Full Repair Pipeline"}
        </button>
      </div>

      {loading && (
        <div className="loading mt2" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem" }}>🛠️</div>
          <p>Running repair pipeline — this may take 30-60 seconds (CleanLab is running)...</p>
        </div>
      )}

      {error && <div className="alert alert-error mt2">{error}</div>}

      {result && !loading && (
        <>
          <div className="alert alert-success mt2">✅ {result.message}</div>

          {/* Quality before vs after */}
          <div className="grid2 mt2">
            <div className="stat-card">
              <h3>Quality Before Repair</h3>
              <div className="value" style={{ color: "#f0c040" }}>
                {result.quality_before}%
              </div>
              <div className="score-bar mt1">
                <div className="score-fill" style={{ width: `${result.quality_before}%` }} />
              </div>
            </div>
            <div className="stat-card">
              <h3>Quality After Repair</h3>
              <div className="value" style={{ color: "#2ecc71" }}>
                {result.quality_after}%
              </div>
              <div className="score-bar mt1">
                <div className="score-fill" style={{ width: `${result.quality_after}%`, background: "#2ecc71" }} />
              </div>
              <span className="badge badge-green mt1">
                +{result.improvement}% improvement
              </span>
            </div>
          </div>

          {/* Dataset shape */}
          <div className="grid2 mt2">
            <div className="stat-card">
              <h3>Original Dataset</h3>
              <div className="value">{result.result?.original_shape?.rows?.toLocaleString()}</div>
              <div className="label">rows × {result.result?.original_shape?.columns} columns</div>
            </div>
            <div className="stat-card">
              <h3>Cleaned Dataset</h3>
              <div className="value" style={{ color: "#2ecc71" }}>
                {result.result?.cleaned_shape?.rows?.toLocaleString()}
              </div>
              <div className="label">rows × {result.result?.cleaned_shape?.columns} columns</div>
            </div>
          </div>

          {/* Repair log */}
          {log && (
            <div className="mt2">
              <h2>Repair Log</h2>
              <table className="table">
                <thead>
                  <tr><th>Module</th><th>Action</th><th>Result</th></tr>
                </thead>
                <tbody>
                  {/* Missing values */}
                  <tr>
                    <td>Missing Values — Numerical</td>
                    <td>KNN Imputer</td>
                    <td>
                      {log.missing_values?.numerical_imputed?.length > 0
                        ? log.missing_values.numerical_imputed.join(", ")
                        : <span className="badge badge-green">None found</span>}
                    </td>
                  </tr>
                  <tr>
                    <td>Missing Values — Categorical</td>
                    <td>Most Frequent</td>
                    <td>
                      {log.missing_values?.categorical_imputed?.length > 0
                        ? log.missing_values.categorical_imputed.join(", ")
                        : <span className="badge badge-green">None found</span>}
                    </td>
                  </tr>
                  {/* Duplicates */}
                  <tr>
                    <td>Duplicate Rows</td>
                    <td>Removed</td>
                    <td>
                      {log.duplicates?.duplicates_removed > 0
                        ? <span className="badge badge-yellow">
                            {log.duplicates.duplicates_removed} removed
                            ({log.duplicates.rows_before} → {log.duplicates.rows_after} rows)
                          </span>
                        : <span className="badge badge-green">None found</span>}
                    </td>
                  </tr>
                  {/* Outliers */}
                  <tr>
                    <td>Outliers</td>
                    <td>Isolation Forest ({outlierAction})</td>
                    <td>
                      {log.outliers?.outliers_detected > 0
                        ? <span className="badge badge-yellow">
                            {log.outliers.outliers_detected} detected
                          </span>
                        : <span className="badge badge-green">None found</span>}
                    </td>
                  </tr>
                  {/* Invalid data */}
                  <tr>
                    <td>Invalid Values</td>
                    <td>IQR Clipping</td>
                    <td>
                      {log.invalid_data?.total_invalid > 0
                        ? <span className="badge badge-yellow">
                            {log.invalid_data.total_invalid} clipped
                          </span>
                        : <span className="badge badge-green">None found</span>}
                    </td>
                  </tr>
                  {/* Label errors */}
                  <tr>
                    <td>Label Errors</td>
                    <td>CleanLab</td>
                    <td>
                      {log.label_errors?.skipped
                        ? <span className="badge badge-blue">{log.label_errors.reason}</span>
                        : log.label_errors?.label_errors_found > 0
                          ? <span className="badge badge-yellow">
                              {log.label_errors.label_errors_found} flagged in {log.label_errors.target_column}
                            </span>
                          : <span className="badge badge-green">None found</span>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* MLflow info */}
          {result.mlflow && (
            <div className="stat-card mt2">
              <h3>📈 MLflow Run Logged</h3>
              <table className="table" style={{ marginTop: "0.5rem" }}>
                <tbody>
                  <tr><td>Run ID</td>
                      <td><code style={{ fontSize: "0.8rem", color: "#7b8cff" }}>{result.mlflow.run_id}</code></td>
                  </tr>
                  <tr><td>Experiment</td><td>{result.mlflow.experiment}</td></tr>
                  <tr><td>Execution Time</td><td>{result.mlflow.execution_time}s</td></tr>
                  <tr><td>Quality Improvement</td>
                      <td><span className="badge badge-green">+{result.mlflow.improvement}%</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="gap mt2">
            <button className="btn btn-primary" style={{ width: "auto" }}
                    onClick={() => navigate("/quality")}>
              View Quality Report →
            </button>
            <button className="btn btn-secondary" onClick={() => navigate("/analysis")}>
              ← Back to Analysis
            </button>
          </div>
        </>
      )}
    </div>
  );
}
