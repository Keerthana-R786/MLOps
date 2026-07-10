import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Landing      from "./pages/Landing";
import Login        from "./pages/Login";
import Dashboard    from "./pages/Dashboard";
import Upload       from "./pages/Upload";
import Analysis     from "./pages/Analysis";
import RepairResult from "./pages/RepairResult";
import QualityReport from "./pages/QualityReport";
import Monitoring   from "./pages/Monitoring";
import Settings     from "./pages/Settings";

const WithSidebar = ({ children }) => (
  <div className="layout">
    <Sidebar />
    <div className="main">{children}</div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages — no sidebar */}
        <Route path="/"      element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* App pages — with sidebar */}
        <Route path="/dashboard" element={<WithSidebar><Dashboard /></WithSidebar>} />
        <Route path="/upload"    element={<WithSidebar><Upload /></WithSidebar>} />
        <Route path="/analysis"  element={<WithSidebar><Analysis /></WithSidebar>} />
        <Route path="/repair"    element={<WithSidebar><RepairResult /></WithSidebar>} />
        <Route path="/quality"   element={<WithSidebar><QualityReport /></WithSidebar>} />
        <Route path="/monitoring" element={<WithSidebar><Monitoring /></WithSidebar>} />
        <Route path="/settings"  element={<WithSidebar><Settings /></WithSidebar>} />
      </Routes>
    </BrowserRouter>
  );
}
