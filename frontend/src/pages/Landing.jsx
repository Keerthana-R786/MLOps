import { useNavigate } from "react-router-dom";

const features = [
  { title: "Upload",        desc: "Upload any CSV dataset up to 50 MB" },
  { title: "Profile",       desc: "Automatic statistical analysis and issue detection" },
  { title: "Preprocess",    desc: "Missing values, duplicates, outliers, type inference" },
  { title: "Quality Score", desc: "Weighted quality score before and after cleaning" },
  { title: "Report",        desc: "Downloadable PDF report and cleaned dataset" },
  { title: "Tracking",      desc: "MLflow experiment tracking for every run" },
];

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="page-center">
      <div style={{ maxWidth: 680, width: "100%", textAlign: "center" }}>
        <div style={{
          display: "inline-block",
          background: "var(--accent-dim)",
          color: "var(--accent)",
          fontSize: "0.75rem",
          fontWeight: 600,
          padding: "0.25rem 0.75rem",
          borderRadius: 20,
          marginBottom: "1.25rem",
          border: "1px solid var(--accent-dim)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}>
          ML Data Quality Platform
        </div>

        <h1 style={{ fontSize: "2.2rem", fontWeight: 700, color: "var(--text)", lineHeight: 1.2, marginBottom: "1rem" }}>
          Clean your dataset.<br />Train better models.
        </h1>

        <p style={{ fontSize: "1rem", color: "var(--text-muted)", marginBottom: "2rem", lineHeight: 1.7 }}>
          Upload any CSV, detect and fix quality issues automatically, and download a
          production-ready dataset in minutes.
        </p>

        <div className="flex-row" style={{ justifyContent: "center", marginBottom: "3rem" }}>
          <button className="btn btn-primary" style={{ padding: "0.65rem 1.5rem", fontSize: "0.95rem" }}
                  onClick={() => navigate("/login")}>
            Get Started
          </button>
          <button className="btn btn-secondary" style={{ padding: "0.65rem 1.5rem", fontSize: "0.95rem" }}
                  onClick={() => navigate("/dashboard")}>
            Skip to Dashboard
          </button>
        </div>

        <div className="grid3" style={{ textAlign: "left", gap: "0.75rem" }}>
          {features.map((f) => (
            <div className="card" key={f.title}>
              <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.35rem", color: "var(--text)" }}>
                {f.title}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
