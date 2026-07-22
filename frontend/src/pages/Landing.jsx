import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const features = [
  { n: "01", title: "Upload",        desc: "Upload any CSV dataset up to 50 MB" },
  { n: "02", title: "Profile",       desc: "Automatic statistical analysis and issue detection" },
  { n: "03", title: "Preprocess",    desc: "Missing values, duplicates, outliers, type inference" },
  { n: "04", title: "Quality Score", desc: "Weighted quality score before and after cleaning" },
  { n: "05", title: "Report",        desc: "Downloadable PDF report and cleaned dataset" },
  { n: "06", title: "Tracking",      desc: "MLflow experiment tracking for every run" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

// Scroll-triggered cascade for the Core Modules section: parent fires once at
// 25% in view, children (label -> title -> desc -> each card) stagger off it.
const sectionReveal = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.05 } },
};
const itemReveal = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: "easeOut" } },
};

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Top nav */}
      <div className="top-nav">
        <div className="top-nav-brand text-gradient">DataPrep</div>
        <div className="top-nav-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/dashboard")}>Dashboard</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate("/login")}>Sign In</button>
        </div>
      </div>

      {/* Hero — left-aligned typography, Apple/Linear style */}
      <div className="hero-section">
        <div className="hero-glow" aria-hidden="true" />

        <motion.div className="hero-kicker" {...fadeUp(0)}>
          End-to-End Dataset Repair &amp; MLOps Platform
        </motion.div>

        <motion.h1 className="hero-heading" {...fadeUp(0.08)}>
          <span className="hero-heading-line">Transform</span>
          <span className="hero-heading-line">
            Raw Data Into <span className="text-gradient">Trusted Insights.</span>
          </span>
        </motion.h1>

        <motion.p className="hero-desc" {...fadeUp(0.16)}>
          Upload a raw CSV, get an instant statistical profile, repair missing values,
          duplicates and outliers, then track every run in MLflow and monitor data drift —
          all the way to a production-ready dataset and downloadable quality report.
        </motion.p>

        <motion.div className="hero-cta-row" {...fadeUp(0.22)}>
          <motion.button className="btn btn-primary btn-lg" whileTap={{ scale: 0.97 }} onClick={() => navigate("/login")}>
            Get Started
          </motion.button>
          <motion.button className="btn btn-secondary btn-lg" whileTap={{ scale: 0.97 }} onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </motion.button>
        </motion.div>
      </div>

      {/* Content section — hidden until scrolled into view, then cascades in */}
      <motion.div
        className="landing-content-section"
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <motion.div className="landing-section-label" variants={itemReveal}>Core Modules</motion.div>
        <motion.h2 className="landing-section-title" variants={itemReveal}>
          Everything you need to ship clean data
        </motion.h2>
        <motion.p className="landing-section-desc" variants={itemReveal}>
          One pipeline from raw CSV to a production-ready, ML-safe dataset — with a full audit
          trail of every change made along the way.
        </motion.p>

        <div className="grid3 landing-module-grid">
          {features.map((f) => (
            <motion.div
              className="card landing-module-card"
              key={f.title}
              variants={itemReveal}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="landing-module-number">{f.n}</div>
              <div className="landing-module-title">{f.title}</div>
              <div className="landing-module-desc">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
