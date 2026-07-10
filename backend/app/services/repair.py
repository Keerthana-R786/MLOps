import os
import numpy as np
import pandas as pd
from sklearn.impute import KNNImputer, SimpleImputer
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder
from cleanlab.classification import CleanLearning
from sklearn.linear_model import LogisticRegression


# ─── Constants ────────────────────────────────────────────────────────────────
UPLOAD_DIR  = "uploads"
REPORTS_DIR = "reports"
os.makedirs(REPORTS_DIR, exist_ok=True)

# Validation rules for the Employee dataset
VALIDATION_RULES = {
    "Age":                       {"min": 18,   "max": 70},
    "JoiningYear":               {"min": 1980, "max": 2025},
    "PaymentTier":               {"min": 1,    "max": 3},
    "ExperienceInCurrentDomain": {"min": 0,    "max": 50},
    "LeaveOrNot":                {"min": 0,    "max": 1},
}


# ─── Module 1 — Missing Value Repair ─────────────────────────────────────────
def repair_missing_values(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    report = {"numerical_imputed": [], "categorical_imputed": []}

    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(include=["object", "category", "string"]).columns.tolist()

    # Numerical — KNN Imputer
    if num_cols:
        missing_num = df[num_cols].isnull().sum()
        cols_with_missing = missing_num[missing_num > 0].index.tolist()
        if cols_with_missing:
            imputer = KNNImputer(n_neighbors=5)
            df[num_cols] = imputer.fit_transform(df[num_cols])
            # Round integer-like columns back to int
            for col in num_cols:
                if df[col].dropna().apply(float.is_integer).all():
                    df[col] = df[col].round().astype(int)
            report["numerical_imputed"] = cols_with_missing

    # Categorical — Most Frequent Imputer
    if cat_cols:
        missing_cat = df[cat_cols].isnull().sum()
        cols_with_missing = missing_cat[missing_cat > 0].index.tolist()
        if cols_with_missing:
            imputer = SimpleImputer(strategy="most_frequent")
            df[cat_cols] = imputer.fit_transform(df[cat_cols])
            report["categorical_imputed"] = cols_with_missing

    return df, report


# ─── Module 2 — Duplicate Removal ────────────────────────────────────────────
def remove_duplicates(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    original_count  = len(df)
    duplicate_count = int(df.duplicated().sum())
    df = df.drop_duplicates().reset_index(drop=True)

    report = {
        "duplicates_found":   duplicate_count,
        "duplicates_removed": duplicate_count,
        "rows_before":        original_count,
        "rows_after":         len(df)
    }
    return df, report


# ─── Module 3 — Outlier Detection ────────────────────────────────────────────
def handle_outliers(df: pd.DataFrame, action: str = "flag") -> tuple[pd.DataFrame, dict]:
    """
    action: 'flag' adds an 'outlier' column
            'remove' drops outlier rows
    """
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    # Exclude binary/target columns from outlier detection
    exclude = ["LeaveOrNot", "PaymentTier"]
    feature_cols = [c for c in num_cols if c not in exclude]

    report = {"outliers_detected": 0, "action": action}

    if not feature_cols:
        return df, report

    iso = IsolationForest(contamination=0.05, random_state=42)
    preds = iso.fit_predict(df[feature_cols])

    outlier_mask = preds == -1
    outlier_count = int(outlier_mask.sum())
    report["outliers_detected"] = outlier_count

    if action == "remove":
        df = df[~outlier_mask].reset_index(drop=True)
        report["rows_after_removal"] = len(df)
    else:
        df["is_outlier"] = outlier_mask.astype(int)

    return df, report


# ─── Module 4 — Invalid Data Detection ───────────────────────────────────────
def fix_invalid_data(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    report = {"invalid_rows_found": {}, "total_invalid": 0}

    for col, rules in VALIDATION_RULES.items():
        if col not in df.columns:
            continue

        invalid_mask = pd.Series([False] * len(df), index=df.index)

        if "min" in rules:
            invalid_mask |= df[col] < rules["min"]
        if "max" in rules:
            invalid_mask |= df[col] > rules["max"]

        invalid_count = int(invalid_mask.sum())
        if invalid_count > 0:
            report["invalid_rows_found"][col] = invalid_count
            report["total_invalid"] += invalid_count

            # Clip values to valid range
            if "min" in rules and "max" in rules:
                df[col] = df[col].clip(lower=rules["min"], upper=rules["max"])

    return df, report


# ─── Module 5 — Label Error Detection (CleanLab) ─────────────────────────────
def detect_label_errors(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    report = {"label_errors_found": 0, "label_errors_corrected": 0, "skipped": False}

    target_col = "LeaveOrNot"
    if target_col not in df.columns:
        report["skipped"] = True
        report["reason"] = "Target column 'LeaveOrNot' not found."
        return df, report

    # Prepare features — encode categorical columns
    feature_cols = [c for c in df.columns if c != target_col and c != "is_outlier"]
    X = df[feature_cols].copy()
    y = df[target_col].values

    # Encode categorical columns for model
    for col in X.select_dtypes(include=["object", "category", "string"]).columns:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))

    X = X.values

    try:
        base_clf = LogisticRegression(max_iter=1000, random_state=42)
        cl = CleanLearning(clf=base_clf)
        cl.fit(X, y)
        label_issues = cl.find_label_issues(X, y)

        error_mask = label_issues["is_label_issue"].values
        error_count = int(error_mask.sum())
        report["label_errors_found"] = error_count

        # Flag label errors in the dataset
        df["label_issue"] = error_mask.astype(int)
        report["label_errors_corrected"] = 0  # flagged only, not auto-corrected

    except Exception as e:
        report["skipped"] = True
        report["reason"] = f"CleanLab could not run: {str(e)}"

    return df, report


# ─── Module 6 — Run Full Repair Pipeline ─────────────────────────────────────
def repair_dataset(filepath: str, outlier_action: str = "flag") -> dict:
    df = pd.read_csv(filepath)
    original_shape = df.shape
    repair_log = {}

    # Module 1 — Missing values
    df, missing_report = repair_missing_values(df)
    repair_log["missing_values"] = missing_report

    # Module 2 — Duplicates
    df, duplicate_report = remove_duplicates(df)
    repair_log["duplicates"] = duplicate_report

    # Module 3 — Outliers
    df, outlier_report = handle_outliers(df, action=outlier_action)
    repair_log["outliers"] = outlier_report

    # Module 4 — Invalid data
    df, invalid_report = fix_invalid_data(df)
    repair_log["invalid_data"] = invalid_report

    # Module 5 — Label errors
    df, label_report = detect_label_errors(df)
    repair_log["label_errors"] = label_report

    # Module 6 — Save cleaned dataset
    base_name = os.path.splitext(os.path.basename(filepath))[0]
    cleaned_filename = f"{base_name}_cleaned.csv"
    cleaned_path = os.path.join(UPLOAD_DIR, cleaned_filename)
    df.to_csv(cleaned_path, index=False)

    return {
        "status": "Repair complete",
        "original_shape": {"rows": original_shape[0], "columns": original_shape[1]},
        "cleaned_shape":  {"rows": len(df), "columns": len(df.columns)},
        "cleaned_file":   cleaned_filename,
        "repair_log":     repair_log
    }
