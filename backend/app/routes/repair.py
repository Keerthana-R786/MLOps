import os
from fastapi import APIRouter, HTTPException, Query
from app.config import UPLOAD_DIR, REPORTS_DIR
from app.services.preprocessing import preprocess_dataset
from app.services.quality import score_dataset
from app.services.report_generator import generate_report
from app.services.mlflow_tracker import track_repair_run

router = APIRouter()


@router.post("/repair/{filename}")
def repair_file(
    filename: str,
    outlier_strategy: str = Query(
        default="clip",
        enum=["clip", "remove", "flag"],
        description="clip=IQR clipping (recommended), remove=drop outlier rows, flag=mark but keep"
    )
):
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found. Upload it first.")

    # Step 1 — Full preprocessing pipeline
    result = preprocess_dataset(filepath, outlier_strategy=outlier_strategy)

    base         = os.path.splitext(filename)[0]
    cleaned_path = os.path.join(UPLOAD_DIR, f"{base}_cleaned.csv")
    pdf_path     = os.path.join(REPORTS_DIR, f"{base}_report.pdf")

    # Step 2 — Quality scores before and after
    quality_before = score_dataset(filepath)
    quality_after  = score_dataset(cleaned_path)

    # Step 3 — Generate report
    generate_report(filename, repair_log=result["audit"])

    # Step 4 — Log to MLflow
    mlflow_result = track_repair_run(
        filename       = filename,
        repair_log     = result["audit"],
        quality_before = quality_before,
        quality_after  = quality_after,
        cleaned_path   = cleaned_path,
        pdf_path       = pdf_path,
    )

    return {
        "message":        "Preprocessing complete. Dataset is ready for model training.",
        "filename":       filename,
        "result":         result,
        "quality_before": quality_before["overall_score"],
        "quality_after":  quality_after["overall_score"],
        "improvement":    mlflow_result["improvement"],
        "mlflow":         mlflow_result,
    }
