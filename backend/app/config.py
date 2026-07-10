import os
from pathlib import Path

# ── Base paths (always relative to this file, not CWD) ───────────────────────
BASE_DIR    = Path(__file__).resolve().parent.parent   # backend/
UPLOAD_DIR  = str(BASE_DIR / "uploads")
REPORTS_DIR = str(BASE_DIR / "reports")

os.makedirs(UPLOAD_DIR,  exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

# ── MLflow ────────────────────────────────────────────────────────────────────
MLFLOW_DB_PATH       = str(BASE_DIR / "mlflow.db")
MLFLOW_TRACKING_URI  = f"sqlite:///{MLFLOW_DB_PATH}"
MLFLOW_EXPERIMENT    = "Dataset-Repair-Pipeline"

# ── Validation ────────────────────────────────────────────────────────────────
MIN_ROWS        = 10
MIN_COLUMNS     = 2
MAX_FILE_SIZE_MB = 50
