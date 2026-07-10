import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function RepairResult() {
  const navigate = useNavigate();
  const filename = localStorage.getItem("uploadedFile") || "Employee.csv";
  const [outlierAction, setOutlierAction] = useState("flag");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const runRepair = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.post(`/repair/${filename}?outlier_action=${outlierAction}`);
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || "Repair failed.");
    } finally {
      setLoading(false);
    }
  };

  const r = result?.result;
  const log = r?.repair_log;

  return (
    <div>
      <h1>Repair Dataset</h1>
      <p>Running repair pipeline on: <strong style={{ color: "#7b8cff" }}>{filename}</strong></p>

      <div className="stat-card mt2" style={{ maxWidth: 500 }}>
        <h3>Outlier Handling</h3>
        <select value={outlierAction} onChange={(e) => setOutlierAction(e.target.value)}>
          <option value="flag">Flag outliers (add column)</option>
          <option value="remove">Remove outlier rows</option>
        </select>
        <button className="btn btn-primary" onClick={runRepair} disabled={loading}>
          {loading ? "Repairing..." : "▶ Run Repair Pipeline"}
        </button>
      </div>

      {error && <div className="alert alert-error mt1">{error}</div>}

      {result && (
        <>
          <div className="alert alert-success mt2">✅ {result.message}</div>

          {/* Score comparison */}
          <div className="grid2 mt2">
            <div className="stat-card">
              <h3>Quality Before</h3>
              <div className="value">{result.quality_before}%</div>
              <div className="score-bar"><div className="score-fill" style={{ width: `${result.quality_before}%` }} /></div>
            </div>
            <div className="stat-card">
              <h3>Quality After</h3>
              <div className="value" style={{ color: "#2ecc71" }}>{result.quality_after}%</div>
              <div className="score-bar"><div className="score-fill" style={{ width: `${result.quality_after}%` }} /></div>
              <span className="badge badge-green">+{result.improvement}% improvement</span>
            </div>
          </div>

          {/* Repair log */}
          {log && (
            <div className="mt2">
              <h2>Repair Log</h2>
              <table className="table">
                <thead><tr><th>Module</th><th>Result</th></tr></thead>
                <tbody>
                  <tr><td>Missing Values (Numerical)</td><td>{log.missing_values?.numerical_imputed?.join(", ") || "None"}</td></tr>
                  <tr><td>Missing Values (Categorical)</td><td>{log.missing_values?.categorical_imputed?.join(", ") || "None"}</td></tr>
                  <tr><td>Duplicates Removed</td><td>{log.duplicates?.duplicates_removed ?? 0}</td></tr>
                  <tr><td>Outliers Detected</td><td>{log.outliers?.outliers_detected ?? 0} ({log.outliers?.action})</td></tr>
                  <tr><td>Invalid Values Fixed</td><td>{log.invalid_data?.total_invalid ?? 0}</td></tr>
                  <tr><td>Label Errors Found</td><td>{log.label_errors?.label_errors_found ?? 0}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {/* MLflow */}
          {result.mlflow && (
            <div className="stat-card mt2">
              <h3>MLflow Tracking</h3>
              <table className="table">
                <tbody>
                  <tr><td>Run ID</td><td style={{ fontSize: "0.8rem" }}>{result.mlflow.run_id}</td></tr>
                  <tr><td>Experiment</td><td>{result.mlflow.experiment}</td></tr>
                  <tr><td>Execution Time</td><td>{result.mlflow.execution_time}s</td></tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="gap mt2">
            <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => navigate("/quality")}>View Quality Report →</button>
          </div>
        </>
      )}
    </div>
  );
}
