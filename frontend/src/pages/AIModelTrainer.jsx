import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ── Simulated AI responses based on project description ─────────────────────
function analyzePrompt(prompt, columns) {
  const p = prompt.toLowerCase();

  let target = null;
  let problemType = null;
  let metric = null;
  let dropCols = [];
  let handleImbalance = false;
  let models = [];
  let domain = "";
  let reasoning = [];

  // Domain detection
  if (p.includes("fraud") || p.includes("transaction") || p.includes("banking")) {
    domain = "Finance / Fraud Detection";
    problemType = "Binary Classification";
    metric = "F1 Score (Precision-Recall AUC)";
    handleImbalance = true;
    models = ["XGBoost", "Random Forest", "Isolation Forest"];
    reasoning.push("Fraud datasets are heavily imbalanced — SMOTE oversampling will be applied.");
    reasoning.push("Precision-Recall AUC is preferred over accuracy for imbalanced fraud detection.");
    target = columns.find(c => /fraud|label|target|class|is_fraud/i.test(c)) || columns[columns.length - 1];
  } else if (p.includes("diabetes") || p.includes("disease") || p.includes("patient") || p.includes("medical") || p.includes("health") || p.includes("cancer") || p.includes("diagnosis")) {
    domain = "Healthcare / Medical Diagnosis";
    problemType = "Binary Classification";
    metric = "Recall / F1 Score";
    handleImbalance = true;
    models = ["Random Forest", "XGBoost", "Logistic Regression", "SVM"];
    reasoning.push("Medical diagnosis prioritizes Recall — missing a positive case is more costly than a false alarm.");
    reasoning.push("Logistic Regression included for interpretability, which is critical in healthcare.");
    target = columns.find(c => /outcome|diagnosis|result|label|target|disease|diabetes|cancer/i.test(c)) || columns[columns.length - 1];
  } else if (p.includes("price") || p.includes("house") || p.includes("real estate") || p.includes("property") || p.includes("salary") || p.includes("cost") || p.includes("revenue")) {
    domain = "Regression / Price Prediction";
    problemType = "Regression";
    metric = "RMSE / R² Score";
    models = ["XGBoost Regressor", "Random Forest Regressor", "Linear Regression", "Ridge Regression"];
    reasoning.push("Regression problem detected — predicting a continuous numerical value.");
    reasoning.push("XGBoost and Random Forest generally outperform linear models on tabular data.");
    target = columns.find(c => /price|salary|cost|revenue|value|amount|income/i.test(c)) || columns[columns.length - 1];
  } else if (p.includes("churn") || p.includes("leave") || p.includes("employee") || p.includes("attrition") || p.includes("resign")) {
    domain = "HR / Employee Retention";
    problemType = "Binary Classification";
    metric = "F1 Score / AUC-ROC";
    models = ["Random Forest", "XGBoost", "Logistic Regression"];
    reasoning.push("Churn prediction is a binary classification problem — will the employee leave or stay.");
    reasoning.push("AUC-ROC is used to evaluate model discrimination ability.");
    target = columns.find(c => /leave|churn|attrition|resign|exit|status/i.test(c)) || columns[columns.length - 1];
  } else if (p.includes("sentiment") || p.includes("review") || p.includes("opinion") || p.includes("rating") || p.includes("feedback")) {
    domain = "NLP / Sentiment Analysis";
    problemType = "Multi-class Classification";
    metric = "Accuracy / Macro F1";
    models = ["Logistic Regression (TF-IDF)", "Naive Bayes", "SVM"];
    reasoning.push("Text-based features detected — TF-IDF vectorization will be applied.");
    reasoning.push("Naive Bayes is a strong baseline for text classification tasks.");
    target = columns.find(c => /sentiment|label|rating|class|category/i.test(c)) || columns[columns.length - 1];
  } else if (p.includes("spam") || p.includes("email") || p.includes("message")) {
    domain = "NLP / Spam Detection";
    problemType = "Binary Classification";
    metric = "Precision / F1 Score";
    models = ["Naive Bayes", "Logistic Regression", "Random Forest"];
    reasoning.push("Spam detection prioritizes Precision — avoid marking legitimate emails as spam.");
    target = columns.find(c => /spam|label|class|category/i.test(c)) || columns[columns.length - 1];
  } else if (p.includes("customer") || p.includes("segment") || p.includes("group") || p.includes("cluster") || p.includes("recommend")) {
    domain = "Customer Segmentation / Clustering";
    problemType = "Clustering (Unsupervised)";
    metric = "Silhouette Score / Inertia";
    models = ["KMeans", "DBSCAN", "Hierarchical Clustering"];
    reasoning.push("No target column needed — this is an unsupervised learning problem.");
    reasoning.push("KMeans will auto-select optimal K using the elbow method.");
    target = null;
  } else {
    domain = "General Machine Learning";
    problemType = "Binary Classification";
    metric = "Accuracy / F1 Score";
    models = ["Random Forest", "XGBoost", "Logistic Regression"];
    reasoning.push("General classification problem detected based on dataset structure.");
    target = columns[columns.length - 1];
  }

  // Detect columns to drop (IDs, names, dates that won't help)
  dropCols = columns.filter(c => /^id$|_id$|name|email|phone|address|date|timestamp|index/i.test(c));
  if (dropCols.length > 0) {
    reasoning.push(`Columns likely to be non-predictive (IDs, names, timestamps) will be dropped: ${dropCols.join(", ")}`);
  }

  const usefulFeatures = columns.filter(c => c !== target && !dropCols.includes(c));

  return { domain, problemType, metric, target, dropCols, usefulFeatures, handleImbalance, models, reasoning };
}

// ── Fake training steps ──────────────────────────────────────────────────────
const TRAINING_STEPS = [
  "Loading cleaned dataset...",
  "Encoding categorical features...",
  "Splitting into train / validation / test sets (70 / 15 / 15)...",
  "Applying SMOTE for class imbalance...",
  "Scaling numerical features...",
  "Training Model 1: Random Forest...",
  "Training Model 2: XGBoost...",
  "Training Model 3: Logistic Regression...",
  "Evaluating models on validation set...",
  "Selecting best model by F1 Score...",
  "Generating feature importance...",
  "Saving model as .pkl...",
  "Logging run to MLflow...",
  "Done.",
];

const FAKE_RESULTS = {
  "Random Forest":         { accuracy: 91.4, f1: 89.2, precision: 90.1, recall: 88.4 },
  "XGBoost":               { accuracy: 93.7, f1: 92.5, precision: 93.0, recall: 92.1 },
  "Logistic Regression":   { accuracy: 86.2, f1: 84.9, precision: 85.3, recall: 84.5 },
  "SVM":                   { accuracy: 88.1, f1: 87.0, precision: 87.5, recall: 86.6 },
  "XGBoost Regressor":     { accuracy: null, f1: null, rmse: 12340, r2: 0.91 },
  "Random Forest Regressor": { accuracy: null, f1: null, rmse: 14210, r2: 0.88 },
  "Linear Regression":     { accuracy: null, f1: null, rmse: 22100, r2: 0.79 },
  "KMeans":                { accuracy: null, f1: null, silhouette: 0.68, clusters: 4 },
  "DBSCAN":                { accuracy: null, f1: null, silhouette: 0.61, clusters: 6 },
};

const SAMPLE_COLUMNS = ["Age", "JoiningYear", "City", "PaymentTier", "Gender", "EverBenched", "ExperienceInCurrentDomain", "LeaveOrNot"];

export default function AIModelTrainer() {
  const navigate    = useNavigate();
  const filename    = localStorage.getItem("uploadedFile");
  const [prompt,    setPrompt]    = useState("");
  const [analysis,  setAnalysis]  = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [stepIdx,   setStepIdx]   = useState(0);
  const [training,  setTraining]  = useState(false);
  const [done,      setDone]      = useState(false);
  const [logs,      setLogs]      = useState([]);
  const logRef = useRef(null);

  const columns = SAMPLE_COLUMNS; // In real: fetched from backend profile

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const handleAnalyze = () => {
    if (!prompt.trim()) return;
    const result = analyzePrompt(prompt, columns);
    setAnalysis(result);
    setConfirmed(false);
    setDone(false);
    setLogs([]);
    setStepIdx(0);
  };

  const handleTrain = () => {
    setConfirmed(true);
    setTraining(true);
    setLogs([]);
    setStepIdx(0);
    setDone(false);

    let i = 0;
    const steps = analysis.problemType === "Clustering (Unsupervised)"
      ? TRAINING_STEPS.filter(s => !s.includes("SMOTE") && !s.includes("Selecting best"))
      : TRAINING_STEPS;

    // Replace generic model names with actual ones from analysis
    const resolvedSteps = steps.map((s, idx) => {
      if (s.includes("Model 1") && analysis.models[0]) return s.replace("Random Forest", analysis.models[0]);
      if (s.includes("Model 2") && analysis.models[1]) return s.replace("XGBoost", analysis.models[1]);
      if (s.includes("Model 3") && analysis.models[2]) return s.replace("Logistic Regression", analysis.models[2]);
      return s;
    });

    const interval = setInterval(() => {
      setLogs((prev) => [...prev, resolvedSteps[i]]);
      setStepIdx(i);
      i++;
      if (i >= resolvedSteps.length) {
        clearInterval(interval);
        setTraining(false);
        setDone(true);
      }
    }, 600);
  };

  // Best model for results
  const bestModel = analysis?.models?.[1] || analysis?.models?.[0];
  const bestMetrics = FAKE_RESULTS[bestModel] || {};
  const isRegression = analysis?.problemType === "Regression";
  const isClustering = analysis?.problemType?.includes("Clustering");

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>AI Model Trainer</h1>
            <p>Describe your project — the platform will configure and train the right model for you.</p>
          </div>
          {filename && (
            <span className="badge badge-green">Dataset: {filename}</span>
          )}
        </div>
      </div>

      {/* Step 1 — Prompt */}
      <div className="card card-md mb2">
        <div className="section-title mb1">Step 1 — Describe your project</div>
        <div className="form-group">
          <label htmlFor="prompt">What are you building? Be specific.</label>
          <textarea
            id="prompt"
            rows={4}
            placeholder="e.g. I am building a healthcare app to predict whether a patient has diabetes based on their medical test results."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>
        <div className="flex-row">
          <button className="btn btn-primary" onClick={handleAnalyze} disabled={!prompt.trim()}>
            Analyze Project
          </button>
          {analysis && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setAnalysis(null); setDone(false); setLogs([]); setPrompt(""); }}>
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Step 2 — Analysis result */}
      {analysis && !done && (
        <div className="card card-md mb2">
          <div className="section-title mb1">Step 2 — AI Analysis</div>

          <div className="table-wrap mb2">
            <table>
              <tbody>
                <tr>
                  <td className="text-muted" style={{ width: 180 }}>Domain detected</td>
                  <td><strong>{analysis.domain}</strong></td>
                </tr>
                <tr>
                  <td className="text-muted">Problem type</td>
                  <td><span className="badge badge-blue">{analysis.problemType}</span></td>
                </tr>
                <tr>
                  <td className="text-muted">Target column</td>
                  <td>
                    {analysis.target
                      ? <code>{analysis.target}</code>
                      : <span className="text-muted">None (unsupervised)</span>}
                  </td>
                </tr>
                <tr>
                  <td className="text-muted">Evaluation metric</td>
                  <td><code>{analysis.metric}</code></td>
                </tr>
                <tr>
                  <td className="text-muted">Handle imbalance</td>
                  <td>
                    {analysis.handleImbalance
                      ? <span className="badge badge-yellow">Yes — SMOTE oversampling</span>
                      : <span className="badge badge-gray">Not required</span>}
                  </td>
                </tr>
                <tr>
                  <td className="text-muted">Columns to drop</td>
                  <td>
                    {analysis.dropCols.length > 0
                      ? <div className="tag-list">{analysis.dropCols.map(c => <span key={c} className="badge badge-red">{c}</span>)}</div>
                      : <span className="text-muted">None</span>}
                  </td>
                </tr>
                <tr>
                  <td className="text-muted">Features to use</td>
                  <td>
                    <div className="tag-list">
                      {analysis.usefulFeatures.map(c => <span key={c} className="badge badge-gray">{c}</span>)}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="text-muted">Models to train</td>
                  <td>
                    <div className="tag-list">
                      {analysis.models.map(m => <span key={m} className="badge badge-blue">{m}</span>)}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Reasoning */}
          <div className="section-title mb1">Why these choices?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.25rem" }}>
            {analysis.reasoning.map((r, i) => (
              <div key={i} style={{ fontSize: "0.83rem", color: "var(--text-muted)", paddingLeft: "0.75rem", borderLeft: "2px solid var(--border)" }}>
                {r}
              </div>
            ))}
          </div>

          {!confirmed && (
            <div className="flex-row">
              <button className="btn btn-primary" onClick={handleTrain}>
                Confirm and Train Model
              </button>
              <button className="btn btn-secondary" onClick={() => setAnalysis(null)}>
                Change Description
              </button>
            </div>
          )}

          {/* Training log */}
          {confirmed && (
            <div>
              <div className="section-title mb1">Training Log</div>
              <div
                ref={logRef}
                className="code-block"
                style={{ height: 240, overflowY: "auto", lineHeight: 1.8 }}
              >
                {logs.map((line, i) => (
                  <div key={i} style={{ color: line === "Done." ? "var(--green)" : "var(--text-muted)" }}>
                    {line === "Done." ? "" : "› "}{line}
                  </div>
                ))}
                {training && (
                  <div style={{ color: "var(--accent)" }}>▌</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Results */}
      {done && (
        <div className="card card-md mb2">
          <div className="section-title mb1">Step 3 — Training Complete</div>
          <div className="alert alert-success mb2">
            Best model selected: <strong>{bestModel}</strong>
          </div>

          {/* Metrics */}
          <div className="stat-grid mb2">
            {!isRegression && !isClustering && (
              <>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: "var(--green)" }}>{bestMetrics.accuracy}%</div>
                  <div className="stat-label">Accuracy</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: "var(--green)" }}>{bestMetrics.f1}%</div>
                  <div className="stat-label">F1 Score</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{bestMetrics.precision}%</div>
                  <div className="stat-label">Precision</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{bestMetrics.recall}%</div>
                  <div className="stat-label">Recall</div>
                </div>
              </>
            )}
            {isRegression && (
              <>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: "var(--green)" }}>{bestMetrics.r2}</div>
                  <div className="stat-label">R² Score</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{bestMetrics.rmse?.toLocaleString()}</div>
                  <div className="stat-label">RMSE</div>
                </div>
              </>
            )}
            {isClustering && (
              <>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: "var(--green)" }}>{bestMetrics.silhouette}</div>
                  <div className="stat-label">Silhouette Score</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{bestMetrics.clusters}</div>
                  <div className="stat-label">Clusters Found</div>
                </div>
              </>
            )}
          </div>

          {/* Model comparison */}
          <div className="section-title mb1">Model Comparison</div>
          <div className="table-wrap mb2">
            <table>
              <thead>
                <tr>
                  <th>Model</th>
                  <th>{isRegression ? "R²" : isClustering ? "Silhouette" : "Accuracy"}</th>
                  <th>{isRegression ? "RMSE" : isClustering ? "Clusters" : "F1 Score"}</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {analysis.models.map((m, i) => {
                  const met = FAKE_RESULTS[m] || {};
                  const isBest = m === bestModel;
                  return (
                    <tr key={m}>
                      <td><strong>{m}</strong></td>
                      <td>{isRegression ? met.r2 : isClustering ? met.silhouette : `${(met.accuracy || 85 - i * 3).toFixed(1)}%`}</td>
                      <td>{isRegression ? met.rmse?.toLocaleString() : isClustering ? met.clusters : `${(met.f1 || 83 - i * 3).toFixed(1)}%`}</td>
                      <td>
                        {isBest
                          ? <span className="badge badge-green">Best</span>
                          : <span className="badge badge-gray">Evaluated</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Starter code */}
          <div className="section-title mb1">Generated Inference Code</div>
          <div className="code-block mb2" style={{ fontSize: "0.78rem", lineHeight: 1.7 }}>
{`import pickle
import pandas as pd

# Load trained model
with open("${bestModel.replace(/ /g, "_").toLowerCase()}.pkl", "rb") as f:
    model = pickle.load(f)

# Prepare your input (same columns as training data)
data = pd.DataFrame({
${analysis.usefulFeatures.slice(0, 4).map(c => `    "${c}": [value],`).join("\n")}
    # ... add all feature columns
})

# Predict
${isRegression
  ? `prediction = model.predict(data)\nprint("Predicted value:", prediction[0])`
  : isClustering
    ? `cluster = model.predict(data)\nprint("Cluster:", cluster[0])`
    : `prediction = model.predict(data)\nproba = model.predict_proba(data)\nprint("Prediction:", prediction[0])\nprint("Confidence:", proba[0].max())`
}`}
          </div>

          {/* Download buttons */}
          <div className="section-title mb1">Downloads</div>
          <div className="flex-row flex-wrap">
            <button className="btn btn-primary" onClick={() => alert("In production: downloads the trained .pkl model file")}>
              Download Model (.pkl)
            </button>
            <button className="btn btn-secondary" onClick={() => alert("In production: downloads the inference Python script")}>
              Download Inference Code
            </button>
            <button className="btn btn-ghost" onClick={() => alert("In production: downloads full training report PDF")}>
              Download Training Report
            </button>
          </div>

          <div className="flex-row mt2">
            <button className="btn btn-secondary" onClick={() => { setDone(false); setConfirmed(false); setAnalysis(null); setPrompt(""); setLogs([]); }}>
              Train Another Model
            </button>
            <button className="btn btn-ghost" onClick={() => navigate("/monitoring")}>
              View MLflow Run
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
