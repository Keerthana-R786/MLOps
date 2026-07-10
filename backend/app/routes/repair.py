import os
from fastapi import APIRouter, HTTPException, Query
from app.services.repair import repair_dataset
from app.services.quality import score_dataset
from app.services.report_generator import generate_report
from app.services.mlflow_tracker import track_repair_run

router = APIRouter()

UPLOAD_DIR  = "uploads"
REPORTS_DIR = "reports"


@router.post("/repair/{filename}")
def repair_file(
    filename: str,
    outlier_action: str = Query(default="flag", enum=["flag", "remove"])
):
    filepath = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=404,
            detail=f"File '{filename}' not found. Please upload it first."
        )

    # Step 1 — Run repair pipeline
    result = repair_dataset(filepath, outlier_action=outlier_action)

    # Step 2 — Score before and after
    base          = os.path.splitext(filename)[0]
    cleaned_path  = os.path.join(UPLOAD_DIR, f"{base}_cleaned.csv")
    pdf_path      = os.path.join(REPORTS_DIR, f"{base}_report.pdf")

    quality_before = score_dataset(filepath)
    quality_after  = score_dataset(cleaned_path)

    # Step 3 — Generate report (PDF + JSON)
    generate_report(filename)

    # Step 4 — Log to MLflow
    mlflow_result = track_repair_run(
        filename       = filename,
        repair_log     = result["repair_log"],
        quality_before = quality_before,
        quality_after  = quality_after,
        cleaned_path   = cleaned_path,
        pdf_path       = pdf_path,
    )

    return {
        "message":       "Dataset repaired, report generated and logged to MLflow",
        "filename":      filename,
        "result":        result,
        "quality_before": quality_before["overall_score"],
        "quality_after":  quality_after["overall_score"],
        "improvement":    mlflow_result["improvement"],
        "mlflow":         mlflow_result,
    }
