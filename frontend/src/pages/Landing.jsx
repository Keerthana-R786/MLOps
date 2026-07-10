import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="page" style={{ background: "linear-gradient(135deg,#0f0f1a,#1a1a2e)" }}>
      <div style={{ textAlign: "center", maxWidth: 600 }}>
        <h1 style={{ fontSize: "2.8rem", color: "#7b8cff" }}>Dataset Repair Platform</h1>
        <p style={{ fontSize: "1.1rem", margin: "1rem 0 2rem" }}>
          Upload your CSV dataset, automatically detect issues, repair them, and get a full quality report — powered by ML.
        </p>
        <div className="gap" style={{ justifyContent: "center" }}>
          <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => navigate("/login")}>Get Started</button>
          <button className="btn btn-secondary" onClick={() => navigate("/dashboard")}>View Demo</button>
        </div>

        <div className="grid3" style={{ marginTop: "3rem" }}>
          {[
            { icon: "📤", title: "Upload", desc: "Upload any CSV dataset" },
            { icon: "🔍", title: "Analyse", desc: "Profile & validate automatically" },
            { icon: "🛠️", title: "Repair", desc: "Fix missing, duplicates, outliers" },
            { icon: "📊", title: "Score", desc: "Get a quality score before & after" },
            { icon: "📄", title: "Report", desc: "Download PDF + JSON report" },
            { icon: "📈", title: "Track", desc: "MLflow experiment tracking" },
          ].map((f) => (
            <div className="stat-card" key={f.title}>
              <div style={{ fontSize: "1.8rem" }}>{f.icon}</div>
              <h3 style={{ marginTop: "0.5rem" }}>{f.title}</h3>
              <p style={{ fontSize: "0.85rem" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
