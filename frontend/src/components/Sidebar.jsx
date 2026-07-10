import { NavLink, useNavigate } from "react-router-dom";

const nav = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/upload",    label: "Upload" },
  { to: "/analysis",  label: "Analysis" },
  { to: "/repair",    label: "Preprocessing" },
  { to: "/quality",   label: "Quality Report" },
  { to: "/monitoring",label: "Monitoring" },
  { to: "/settings",  label: "Settings" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const file     = localStorage.getItem("uploadedFile");

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <h1>DataPrep</h1>
        <p>ML Dataset Platform</p>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Navigation</span>
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) => isActive ? "active" : ""}
          >
            <span className="sidebar-dot" />
            {n.label}
          </NavLink>
        ))}
      </nav>

      {file && (
        <div className="sidebar-footer">
          <div className="text-xs text-muted mb1">Active file</div>
          <div style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "0.5rem 0.6rem",
            fontSize: "0.75rem",
            color: "var(--text)",
            wordBreak: "break-all",
          }}>
            {file}
          </div>
        </div>
      )}
    </div>
  );
}
