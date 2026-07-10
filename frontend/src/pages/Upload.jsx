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
    if (!f.name.endsWith(".csv")) { setError("Only CSV files are supported."); return; }
    setFile(f);
    setError("");
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) { setError("Select a file first."); return; }
    setLoading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await API.post("/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(res.data);
      localStorage.setItem("uploadedFile", res.data.filename);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const v = result?.validation;

  return (
    <div>
      <div className="page-header">
        <h1>Upload Dataset</h1>
        <p>Upload a CSV file to begin the preprocessing pipeline.</p>
      </div>

      <div style={{ maxWidth: 640 }}>
        {/* Drop zone */}
        <div
          className={`upload-zone ${dragging ? "dragging" : ""}`}
          onClick={() => fileRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        >
          <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          {file ? (
            <>
              <p style={{ color: "var(--text)", fontWeight: 500 }}>{file.name}</p>
              <p className="text-sm mt1">{(file.size / 1024).toFixed(1)} KB — click to change</p>
            </>
          ) : (
            <>
              <p style={{ color: "var(--text)" }}>Drop your CSV file here</p>
              <p className="text-sm mt1">or click to browse — up to 50 MB</p>
            </>
          )}
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }}
                 onChange={(e) => handleFile(e.target.files[0])} />
        </div>

        {error && <div className="alert alert-error mt1">{error}</div>}

        <button
          className="btn btn-primary btn-full mt1"
          onClick={handleUpload}
          disabled={loading || !file}
        >
          {loading ? "Uploading..." : "Upload and Validate"}
        </button>

        {result && v && (
          <div className="mt2">
            <div className={`alert ${v.status === "Valid" ? "alert-success" : "alert-error"}`}>
              {v.status === "Valid" ? "Validation passed" : "Validation failed"}
            </div>

            <div className="card mt1">
              <div className="section-title mb1">File Summary</div>
              <div className="table-wrap">
                <table>
                  <tbody>
                    <tr><td className="text-muted">Filename</td><td><strong>{result.filename}</strong></td></tr>
                    <tr><td className="text-muted">Rows</td><td>{v.rows?.toLocaleString()}</td></tr>
                    <tr><td className="text-muted">Columns</td><td>{v.columns}</td></tr>
                    <tr>
                      <td className="text-muted">Columns detected</td>
                      <td>
                        <div className="tag-list">
                          {v.column_names?.map((c) => (
                            <span key={c} className="badge badge-gray">{c}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Status</td>
                      <td><span className={`badge ${v.status === "Valid" ? "badge-green" : "badge-red"}`}>{v.status}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {v.errors?.length > 0 && (
              <div className="alert alert-error mt1">
                {v.errors.map((e, i) => <div key={i}>— {e}</div>)}
              </div>
            )}

            {v.status === "Valid" && (
              <div className="flex-row mt2">
                <button className="btn btn-primary" onClick={() => navigate("/analysis")}>
                  View Analysis
                </button>
                <button className="btn btn-secondary" onClick={() => navigate("/repair")}>
                  Run Preprocessing
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
