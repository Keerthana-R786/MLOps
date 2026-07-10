import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard",  label: "🏠 Dashboard" },
  { to: "/upload",     label: "📤 Upload" },
  { to: "/analysis",   label: "🔍 Analysis" },
  { to: "/repair",     label: "🛠️ Repair" },
  { to: "/quality",    label: "📊 Quality Report" },
  { to: "/monitoring", label: "📈 Monitoring" },
  { to: "/settings",   label: "⚙️ Settings" },
];

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h2>🧠 DataRepair</h2>
      {links.map((l) => (
        <NavLink key={l.to} to={l.to}
          className={({ isActive }) => isActive ? "active" : ""}>
          {l.label}
        </NavLink>
      ))}
    </div>
  );
}
