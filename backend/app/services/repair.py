import os
import numpy as np
import pandas as pd
from sklearn.impute import KNNImputer, SimpleImputer
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from app.config import UPLOAD_DIR, REPORTS_DIR

os.makedirs(REPORTS_DIR, exist_ok=True)


# ─── Module 1 — Missing Value Repair ─────────────────────────────────────────
def repair_missing_values(df: pd.DataFrame) -> tuple:
    report = {"numerical_imputed": [], "categorical_imputed": []}

    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

    if num_cols:
        missing_num = df[num_cols].isnull().sum()
        cols_with_missing = missing_num[missing_num > 0].index.tolist()
        if cols_with_missing:
            imputer = KNNImputer(n_neighbors=5)
            df[num_cols] = imputer.fit_transform(df[num_cols])
            # Safely round integer-like columns
            for col in num_cols:
                try:
                    if df[col].dropna().apply(lambda x: float(x) == int(float(x))).all():
                        df[col] = df[col].round().astype(int)
                except Exception:
                    pass
            report["numerical_imputed"] = cols_with_missing

    if cat_cols:
        missing_cat = df[cat_cols].isnull().sum()
        cols_with_missing = missing_cat[missing_cat > 0].index.tolist()
        if cols_with_missing:
            imputer = SimpleImputer(strategy="most_frequent")
            df[cat_cols] = imputer.fit_transform(df[cat_cols])
            report["categorical_imputed"] = cols_with_missing

    return df, report


# ─── Module 2 — Duplicate Removal ────────────────────────────────────────────
def remove_duplicates(df: pd.DataFrame) -> tuple:
    original = len(df)
    dupes    = int(df.duplicated().sum())
    df       = df.drop_duplicates().reset_index(drop=True)
    return df, {
        "duplicates_found":   dupes,
        "duplicates_removed": dupes,
        "rows_before":        original,
        "rows_after":         len(df)
    }


# ─── Module 3 — Outlier Detection (IsolationForest) ──────────────────────────
def handle_outliers(df: pd.DataFrame, action: str = "flag") -> tuple:
    num_cols     = df.select_dtypes(include=[np.number]).columns.tolist()
    feature_cols = [c for c in num_cols if c not in ["is_outlier", "label_issue"]]
    report       = {"outliers_detected": 0, "action": action}

    if len(feature_cols) < 2:
        return df, report

    iso   = IsolationForest(contamination=0.05, random_state=42)
    preds = iso.fit_predict(df[feature_cols].fillna(df[feature_cols].median()))

    mask  = preds == -1
    count = int(mask.sum())
    report["outliers_detected"] = count

    if action == "remove":
        df = df[~mask].reset_index(drop=True)
        report["rows_after_removal"] = len(df)
    else:
        df = df.copy()
        df["is_outlier"] = mask.astype(int)

    return df, report


# ─── Module 4 — Invalid Data (IQR-based, dynamic) ────────────────────────────
def fix_invalid_data(df: pd.DataFrame) -> tuple:
    report = {"invalid_rows_found": {}, "total_invalid": 0}

    for col in df.select_dtypes(include=[np.number]).columns:
        if col in ["is_outlier", "label_issue"]:
            continue
        series = df[col].dropna()
        if series.empty:
            continue
        q1, q3 = series.quantile(0.25), series.quantile(0.75)
        iqr    = q3 - q1
        lower  = q1 - 3.0 * iqr
        upper  = q3 + 3.0 * iqr
        mask   = (df[col] < lower) | (df[col] > upper)
        count  = int(mask.sum())
        if count > 0:
            report["invalid_rows_found"][col] = count
            report["total_invalid"] += count
            df[col] = df[col].clip(lower=lower, upper=upper)

    return df, report


# ─── Module 5 — Label Error Detection (CleanLab) ─────────────────────────────
def detect_label_errors(df: pd.DataFrame) -> tuple:
    report = {"label_errors_found": 0, "skipped": False}

    # Find a binary target column automatically
    target_col = None
    for col in df.columns:
        if col in ["is_outlier", "label_issue"]:
            continue
        unique_vals = df[col].dropna().unique()
        if len(unique_vals) == 2 and set(unique_vals).issubset({0, 1, "0", "1"}):
            target_col = col
            break

    if target_col is None:
        report["skipped"] = True
        report["reason"]  = "No binary target column found for label error detection."
        return df, report

    try:
        from cleanlab.classification import CleanLearning

        feature_cols = [c for c in df.columns if c not in [target_col, "is_outlier", "label_issue"]]
        X = df[feature_cols].copy()
        y = df[target_col].astype(int).values

        for col in X.select_dtypes(exclude=[np.number]).columns:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))

        X = X.fillna(X.median(numeric_only=True)).values

        clf = LogisticRegression(max_iter=1000, random_state=42)
        cl  = CleanLearning(clf=clf)
        cl.fit(X, y)
        issues = cl.find_label_issues(X, y)

        mask  = issues["is_label_issue"].values
        count = int(mask.sum())
        report["label_errors_found"] = count
        report["target_column"]      = target_col
        df = df.copy()
        df["label_issue"] = mask.astype(int)

    except Exception as e:
        report["skipped"] = True
        report["reason"]  = f"CleanLab skipped: {str(e)}"

    return df, report


# ─── Module 6 — Master Repair Pipeline ───────────────────────────────────────
def repair_dataset(filepath: str, outlier_action: str = "flag") -> dict:
    df             = pd.read_csv(filepath)
    original_shape = df.shape
    repair_log     = {}

    df, r1 = repair_missing_values(df)
    repair_log["missing_values"] = r1

    df, r2 = remove_duplicates(df)
    repair_log["duplicates"] = r2

    df, r3 = handle_outliers(df, action=outlier_action)
    repair_log["outliers"] = r3

    df, r4 = fix_invalid_data(df)
    repair_log["invalid_data"] = r4

    df, r5 = detect_label_errors(df)
    repair_log["label_errors"] = r5

    # Save cleaned file (drop flag columns before saving)
    clean_df = df.drop(columns=[c for c in ["is_outlier", "label_issue"] if c in df.columns])
    base     = os.path.splitext(os.path.basename(filepath))[0]
    cleaned_path = os.path.join(UPLOAD_DIR, f"{base}_cleaned.csv")
    clean_df.to_csv(cleaned_path, index=False)

    return {
        "status":         "Repair complete",
        "original_shape": {"rows": original_shape[0], "columns": original_shape[1]},
        "cleaned_shape":  {"rows": len(clean_df), "columns": len(clean_df.columns)},
        "cleaned_file":   f"{base}_cleaned.csv",
        "repair_log":     repair_log,
    }
