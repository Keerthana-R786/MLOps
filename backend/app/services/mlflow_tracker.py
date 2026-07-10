import os
import time
import mlflow
from app.config import MLFLOW_TRACKING_URI, MLFLOW_EXPERIMENT

mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
mlflow.set_experiment(MLFLOW_EXPERIMENT)

execution_time = 0  # default — prevents UnboundLocalError


def track_repair_run(filename, repair_log, quality_before, quality_after,
                     cleaned_path, pdf_path) -> dict:
    global execution_time
    execution_time = 0
    start_time = time.time()

    try:
        with mlflow.start_run(run_name=f"repair_{filename}") as run:
            run_id = run.info.run_id

            mlflow.set_tags({
                "dataset_name":   filename,
                "pipeline_stage": "repair",
                "platform":       "Dataset Repair Platform",
            })

            mlflow.log_param("dataset_name",                      filename)
            mlflow.log_param("repair_method_missing_numerical",   "KNNImputer")
            mlflow.log_param("repair_method_missing_categorical",  "MostFrequent")
            mlflow.log_param("repair_method_outliers",
                             repair_log.get("outliers", {}).get("action", "flag"))
            mlflow.log_param("repair_method_invalid",  "IQR_clip")
            mlflow.log_param("repair_method_labels",   "cleanlab")

            m = repair_log.get("missing_values", {})
            mlflow.log_metric("missing_numerical_imputed",   len(m.get("numerical_imputed", [])))
            mlflow.log_metric("missing_categorical_imputed", len(m.get("categorical_imputed", [])))

            d = repair_log.get("duplicates", {})
            mlflow.log_metric("duplicates_found",    d.get("duplicates_found",   d.get("duplicates_removed", 0)))
            mlflow.log_metric("duplicates_removed",  d.get("duplicates_removed", 0))
            mlflow.log_metric("rows_before",         d.get("rows_before", 0))
            mlflow.log_metric("rows_after_dedup",    d.get("rows_after",   0))

            o = repair_log.get("outliers", {})
            mlflow.log_metric("outliers_detected",
                              o.get("outliers_detected",
                              o.get("rows_removed",
                              o.get("outliers_flagged", 0))))

            iv = repair_log.get("invalid_data", {})
            mlflow.log_metric("invalid_entries_fixed", iv.get("total_invalid", 0))

            lb = repair_log.get("label_errors", {})
            mlflow.log_metric("label_errors_found",  lb.get("label_errors_found", 0))

            before = quality_before.get("individual_scores", {})
            mlflow.log_metric("quality_before_completeness", before.get("completeness", 0))
            mlflow.log_metric("quality_before_uniqueness",   before.get("uniqueness", 0))
            mlflow.log_metric("quality_before_validity",     before.get("validity", 0))
            mlflow.log_metric("quality_before_consistency",  before.get("consistency", 0))
            mlflow.log_metric("quality_before_overall",      quality_before.get("overall_score", 0))

            after = quality_after.get("individual_scores", {})
            mlflow.log_metric("quality_after_completeness",  after.get("completeness", 0))
            mlflow.log_metric("quality_after_uniqueness",    after.get("uniqueness", 0))
            mlflow.log_metric("quality_after_validity",      after.get("validity", 0))
            mlflow.log_metric("quality_after_consistency",   after.get("consistency", 0))
            mlflow.log_metric("quality_after_overall",       quality_after.get("overall_score", 0))

            improvement = round(
                quality_after.get("overall_score", 0) - quality_before.get("overall_score", 0), 2
            )
            mlflow.log_metric("quality_improvement", improvement)

            execution_time = round(time.time() - start_time, 2)
            mlflow.log_metric("execution_time_seconds", execution_time)

            if os.path.exists(cleaned_path):
                mlflow.log_artifact(cleaned_path, artifact_path="cleaned_dataset")
            if os.path.exists(pdf_path):
                mlflow.log_artifact(pdf_path, artifact_path="reports")

    except Exception as e:
        run_id      = "error"
        improvement = 0
        execution_time = round(time.time() - start_time, 2)
        print(f"MLflow logging error: {e}")

    return {
        "run_id":         run_id,
        "experiment":     MLFLOW_EXPERIMENT,
        "tracking_uri":   MLFLOW_TRACKING_URI,
        "execution_time": execution_time,
        "quality_before": quality_before.get("overall_score", 0),
        "quality_after":  quality_after.get("overall_score", 0),
        "improvement":    improvement,
    }
