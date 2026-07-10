import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function Upload() {
  const navigate  = useNavigate();
  const fileRef   = useRef();
  const [file,     setFile]     = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState("");

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith(".csv")) {
      setError("Only CSV files are allowed.");
      setFile(null);
      return;
    }
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
      const res = await API.post("/upload", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(res.data);
      // Store filename for use in subsequent pages
      localStorage.setItem("uploadedFile", res.data.filename);
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || "Upload failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const v = result?.validation;

  return (
    <div>
      <h1>Upload Dataset</h1>
      <p>Upload a CSV file to begin the repair pipeline.</p>

      <div style={{ maxWidth: 700, marginTop: "1.5rem" }}>

        {/* Drop zone */}
        <div
          className={`upload-zone ${dragging ? "dragging" : ""}`}
          onClick={() => fileRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files[0]);
          }}
        >
          <div style={{ fontSize: "3rem" }}>📂</div>
          {file ? (
            <>
              <p style={{ color: "#7b8cff", fontWeight: 600 }}>{file.name}</p>
              <p style={{ fontSize: "0.85rem" }}>
                {(file.size / 1024).toFixed(1)} KB — click to change
              </p>
            </>
          ) : (
            <>
              <p>Drag & drop your CSV here</p>
              <p style={{ fontSize: "0.85rem" }}>or click to browse</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>

        {error && <div className="alert alert-error mt1">{error}</div>}

        <button
          className="btn btn-primary mt1"
          onClick={handleUpload}
          disabled={loading || !file}
          style={{ opacity: !file ? 0.6 : 1 }}
        >
          {loading ? "Uploading & Validating..." : "Upload & Validate"}
        </button>

        {/* Result */}
        {result && v && (
          <div className="mt2">
            <div className={`alert ${v.status === "Valid" ? "alert-success" : "alert-error"}`}>
              {v.status === "Valid" ? "✅ Validation Passed" : "❌ Validation Failed"}
            </div>

            <div className="stat-card mt1">
              <table className="table">
                <tbody>
                  <tr><td>Filename</td><td><strong>{result.filename}</strong></td></tr>
                  <tr><td>Rows</td><td>{v.rows?.toLocaleString()}</td></tr>
                  <tr><td>Columns</td><td>{v.columns}</td></tr>
                  <tr><td>Column Names</td>
                      <td style={{ fontSize: "0.85rem", color: "#aaa" }}>
                        {v.column_names?.join(", ")}
                      </td>
                  </tr>
                  <tr>
                    <td>Status</td>
                    <td>
                      <span className={`badge ${v.status === "Valid" ? "badge-green" : "badge-red"}`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {v.errors?.length > 0 && (
              <div className="alert alert-error mt1">
                <strong>Issues found:</strong>
                {v.errors.map((e, i) => <div key={i} style={{ marginTop: "0.3rem" }}>• {e}</div>)}
              </div>
            )}

            {v.status === "Valid" && (
              <div className="gap mt1">
                <button
                  className="btn btn-primary"
                  style={{ width: "auto" }}
                  onClick={() => navigate("/analysis")}
                >
                  Profile Dataset →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
