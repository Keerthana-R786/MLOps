import os
import time
import mlflow

# ─── MLflow Setup ─────────────────────────────────────────────────────────────
MLFLOW_TRACKING_URI  = "sqlite:///mlflow.db"   # SQLite backend (MLflow 3.x)
EXPERIMENT_NAME      = "Dataset-Repair-Pipeline"

mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
mlflow.set_experiment(EXPERIMENT_NAME)


# ─── Main Tracker Function ────────────────────────────────────────────────────
def track_repair_run(
    filename:       str,
    repair_log:     dict,
    quality_before: dict,
    quality_after:  dict,
    cleaned_path:   str,
    pdf_path:       str,
) -> dict:
    """
    Start an MLflow run and log everything about the repair pipeline.
    Returns the run_id so it can be included in the API response.
    """

    start_time = time.time()

    with mlflow.start_run(run_name=f"repair_{filename}") as run:
        run_id = run.info.run_id

        # ── Tags ───────────────────────────────────────────────────────────────
        mlflow.set_tags({
            "dataset_name":    filename,
            "pipeline_stage":  "repair",
            "platform":        "Dataset Repair Platform",
        })

        # ── Dataset Info Params ────────────────────────────────────────────────
        mlflow.log_param("dataset_name",     filename)
        mlflow.log_param("repair_method_missing_numerical",    "KNNImputer")
        mlflow.log_param("repair_method_missing_categorical",  "MostFrequent")
        mlflow.log_param("repair_method_outliers",
                         repair_log.get("outliers", {}).get("action", "flag"))
        mlflow.log_param("repair_method_invalid",  "clip_to_range")
        mlflow.log_param("repair_method_labels",   "cleanlab")

        # ── Missing Values ─────────────────────────────────────────────────────
        m = repair_log.get("missing_values", {})
        mlflow.log_metric("missing_numerical_cols_imputed",
                          len(m.get("numerical_imputed", [])))
        mlflow.log_metric("missing_categorical_cols_imputed",
                          len(m.get("categorical_imputed", [])))

        # ── Duplicates ─────────────────────────────────────────────────────────
        d = repair_log.get("duplicates", {})
        mlflow.log_metric("duplicates_found",    d.get("duplicates_found", 0))
        mlflow.log_metric("duplicates_removed",  d.get("duplicates_removed", 0))
        mlflow.log_metric("rows_before",         d.get("rows_before", 0))
        mlflow.log_metric("rows_after_dedup",    d.get("rows_after", 0))

        # ── Outliers ───────────────────────────────────────────────────────────
        o = repair_log.get("outliers", {})
        mlflow.log_metric("outliers_detected",   o.get("outliers_detected", 0))

        # ── Invalid Data ───────────────────────────────────────────────────────
        iv = repair_log.get("invalid_data", {})
        mlflow.log_metric("invalid_entries_fixed", iv.get("total_invalid", 0))

        # ── Label Errors ───────────────────────────────────────────────────────
        lb = repair_log.get("label_errors", {})
        mlflow.log_metric("label_errors_found",  lb.get("label_errors_found", 0))

        # ── Quality Scores Before ──────────────────────────────────────────────
        before = quality_before.get("individual_scores", {})
        mlflow.log_metric("quality_before_completeness",  before.get("completeness", 0))
        mlflow.log_metric("quality_before_uniqueness",    before.get("uniqueness", 0))
        mlflow.log_metric("quality_before_validity",      before.get("validity", 0))
        mlflow.log_metric("quality_before_consistency",   before.get("consistency", 0))
        mlflow.log_metric("quality_before_overall",       quality_before.get("overall_score", 0))

        # ── Quality Scores After ───────────────────────────────────────────────
        after = quality_after.get("individual_scores", {})
        mlflow.log_metric("quality_after_completeness",   after.get("completeness", 0))
        mlflow.log_metric("quality_after_uniqueness",     after.get("uniqueness", 0))
        mlflow.log_metric("quality_after_validity",       after.get("validity", 0))
        mlflow.log_metric("quality_after_consistency",    after.get("consistency", 0))
        mlflow.log_metric("quality_after_overall",        quality_after.get("overall_score", 0))

        # ── Improvement ────────────────────────────────────────────────────────
        improvement = round(
            quality_after.get("overall_score", 0) -
            quality_before.get("overall_score", 0), 2
        )
        mlflow.log_metric("quality_improvement", improvement)

        # ── Execution Time ─────────────────────────────────────────────────────
        execution_time = round(time.time() - start_time, 2)
        mlflow.log_metric("execution_time_seconds", execution_time)

        # ── Artifacts ─────────────────────────────────────────────────────────
        if os.path.exists(cleaned_path):
            mlflow.log_artifact(cleaned_path, artifact_path="cleaned_dataset")

        if os.path.exists(pdf_path):
            mlflow.log_artifact(pdf_path, artifact_path="reports")

    return {
        "run_id":           run_id,
        "experiment":       EXPERIMENT_NAME,
        "tracking_uri":     MLFLOW_TRACKING_URI,
        "execution_time":   execution_time,
        "quality_before":   quality_before.get("overall_score", 0),
        "quality_after":    quality_after.get("overall_score", 0),
        "improvement":      improvement,
    }
