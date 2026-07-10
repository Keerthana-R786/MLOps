export default function Monitoring() {
  return (
    <div>
      <div className="page-header">
        <h1>Monitoring</h1>
        <p>MLflow experiment tracking for all preprocessing runs.</p>
      </div>

      <div className="alert alert-info mb2">
        MLflow runs on a separate process. Start it with the command below then open the UI in your browser.
      </div>

      <div className="card card-md mb2">
        <div className="section-title mb1">Start MLflow UI</div>
        <p className="mb1">Run this in a new terminal from the backend folder:</p>
        <div className="code-block">
          cd backend{"\n"}
          venv\Scripts\activate{"\n"}
          mlflow ui --backend-store-uri sqlite:///mlflow.db --workers 1
        </div>
        <p className="mt1 text-sm">
          Then open:{" "}
          <a href="http://localhost:5000" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
            http://localhost:5000
          </a>
        </p>
      </div>

      <div className="section">
        <div className="section-title">What Gets Tracked Per Run</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Category</th><th>Metrics / Parameters</th></tr></thead>
            <tbody>
              {[
                ["Dataset",        "dataset_name, rows_before, rows_after"],
                ["Missing Values", "numerical_imputed count, categorical_imputed count"],
                ["Duplicates",     "duplicates_found, duplicates_removed"],
                ["Outliers",       "outliers_detected, strategy used"],
                ["Invalid Data",   "invalid_entries_fixed"],
                ["Label Errors",   "label_errors_found, target_column"],
                ["Quality Before", "completeness, uniqueness, validity, consistency, overall"],
                ["Quality After",  "completeness, uniqueness, validity, consistency, overall"],
                ["Performance",    "quality_improvement, execution_time_seconds"],
                ["Artifacts",      "cleaned_dataset.csv, PDF report"],
              ].map(([cat, items]) => (
                <tr key={cat}>
                  <td><strong>{cat}</strong></td>
                  <td className="text-muted text-xs">{items}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Configuration</div>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr><td className="text-muted">Experiment name</td><td><code>Dataset-Repair-Pipeline</code></td></tr>
              <tr><td className="text-muted">Backend store</td><td><code>sqlite:///mlflow.db</code></td></tr>
              <tr><td className="text-muted">Location</td><td><code>backend/mlflow.db</code></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
