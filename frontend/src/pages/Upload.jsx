import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function Upload() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFile = (f) => {
    if (!f.name.endsWith(".csv")) { setError("Only CSV files are allowed."); return; }
    setFile(f);
    setError("");
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) { setError("Please select a file first."); return; }
    setLoading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await API.post("/upload", form);
      setResult(res.data);
      localStorage.setItem("uploadedFile", file.name);
    } catch (e) {
      setError(e.response?.data?.detail || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const v = result?.validation;

  return (
    <div>
      <h1>Upload Dataset</h1>
      <p>Upload a CSV file to begin the repair pipeline.</p>

      <div className="card-wide mt2">
        {/* Drop zone */}
        <div
          className={`upload-zone ${dragging ? "dragging" : ""}`}
          onClick={() => fileRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        >
          <div style={{ fontSize: "3rem" }}>📂</div>
          <p style={{ marginTop: "0.5rem" }}>{file ? file.name : "Drag & drop CSV here or click to browse"}</p>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])} />
        </div>

        {error && <div className="alert alert-error mt1">{error}</div>}

        <button className="btn btn-primary mt1" onClick={handleUpload} disabled={loading}>
          {loading ? "Uploading..." : "Upload & Validate"}
        </button>

        {/* Result */}
        {result && (
          <div className="mt2">
            <div className={`alert ${v.status === "Valid" ? "alert-success" : "alert-error"}`}>
              {v.status === "Valid" ? "✅ Validation Passed" : "❌ Validation Failed"}
            </div>

            <table className="table">
              <tbody>
                <tr><td>Filename</td><td>{result.filename}</td></tr>
                <tr><td>Rows</td><td>{v.rows}</td></tr>
                <tr><td>Columns</td><td>{v.columns}</td></tr>
                <tr><td>Status</td><td><span className={`badge ${v.status === "Valid" ? "badge-green" : "badge-red"}`}>{v.status}</span></td></tr>
              </tbody>
            </table>

            {v.errors.length > 0 && (
              <div className="alert alert-error mt1">
                {v.errors.map((e, i) => <div key={i}>• {e}</div>)}
              </div>
            )}

            {v.status === "Valid" && (
              <div className="gap mt1">
                <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => navigate("/analysis")}>Profile Dataset →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
