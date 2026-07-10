export default function Monitoring() {
  return (
    <div>
      <h1>MLflow Monitoring</h1>
      <p>Track all experiment runs, metrics and artifacts.</p>

      <div className="alert alert-info mt2">
        MLflow UI runs on a separate port. Start it with the command below and open in your browser.
      </div>

      <div className="stat-card mt2">
        <h3>Start MLflow UI</h3>
        <p>Run this in your terminal from the backend folder:</p>
        <code style={{ display: "block", background: "#0f0f1a", padding: "1rem", borderRadius: 8, color: "#7b8cff", marginTop: "0.5rem" }}>
          venv\Scripts\activate<br />
          mlflow ui --backend-store-uri sqlite:///mlflow.db
        </code>
        <p style={{ marginTop: "1rem" }}>Then open:</p>
        <a href="http://localhost:5000" target="_blank" rel="noreferrer"
          style={{ color: "#7b8cff" }}>http://localhost:5000</a>
      </div>

      <div className="grid2 mt2">
        {[
          { label: "Experiment", value: "Dataset-Repair-Pipeline" },
          { label: "Backend Store", value: "sqlite:///mlflow.db" },
          { label: "Tracked Metrics", value: "15+ per run" },
          { label: "Artifacts", value: "PDF + Cleaned CSV" },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="label">{s.label}</div>
            <div style={{ color: "#7b8cff", fontWeight: 600, marginTop: "0.3rem" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt2">
        <h2>Logged Metrics per Run</h2>
        <table className="table">
          <thead><tr><th>Category</th><th>Metrics</th></tr></thead>
          <tbody>
            <tr><td>Missing Values</td><td>numerical_cols_imputed, categorical_cols_imputed</td></tr>
            <tr><td>Duplicates</td><td>duplicates_found, duplicates_removed, rows_before, rows_after</td></tr>
            <tr><td>Outliers</td><td>outliers_detected</td></tr>
            <tr><td>Invalid Data</td><td>invalid_entries_fixed</td></tr>
            <tr><td>Labels</td><td>label_errors_found</td></tr>
            <tr><td>Quality Before</td><td>completeness, uniqueness, validity, consistency, overall</td></tr>
            <tr><td>Quality After</td><td>completeness, uniqueness, validity, consistency, overall</td></tr>
            <tr><td>Performance</td><td>quality_improvement, execution_time_seconds</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
