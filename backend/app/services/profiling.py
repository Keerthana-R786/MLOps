import pandas as pd
import numpy as np


# ─── Step 5.1 — Basic Information ─────────────────────────────────────────────
def get_basic_info(df: pd.DataFrame) -> dict:
    return {
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
        "memory_usage_kb": round(df.memory_usage(deep=True).sum() / 1024, 2),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()}
    }


# ─── Step 5.2 — Missing Value Analysis ───────────────────────────────────────
def get_missing_values(df: pd.DataFrame) -> dict:
    missing_per_column = df.isnull().sum()
    missing_percent = (missing_per_column / len(df) * 100).round(2)

    return {
        "total_missing": int(missing_per_column.sum()),
        "total_missing_percent": round(float(missing_per_column.sum()) / (len(df) * len(df.columns)) * 100, 2),
        "per_column": {
            col: {
                "missing_count": int(missing_per_column[col]),
                "missing_percent": float(missing_percent[col])
            }
            for col in df.columns
        }
    }


# ─── Step 5.3 — Duplicate Analysis ───────────────────────────────────────────
def get_duplicate_info(df: pd.DataFrame) -> dict:
    duplicate_count = int(df.duplicated().sum())
    return {
        "duplicate_rows": duplicate_count,
        "duplicate_percent": round(duplicate_count / len(df) * 100, 2)
    }


# ─── Step 5.4 — Numerical Statistics ─────────────────────────────────────────
def get_numerical_stats(df: pd.DataFrame) -> dict:
    num_df = df.select_dtypes(include=[np.number])
    if num_df.empty:
        return {}

    desc = num_df.describe().round(2)
    stats = {}

    for col in num_df.columns:
        stats[col] = {
            "mean":   float(desc.loc["mean", col]),
            "median": float(num_df[col].median()),
            "std":    float(desc.loc["std", col]),
            "min":    float(desc.loc["min", col]),
            "max":    float(desc.loc["max", col]),
            "q1":     float(desc.loc["25%", col]),
            "q2":     float(desc.loc["50%", col]),
            "q3":     float(desc.loc["75%", col]),
        }

    return stats


# ─── Step 5.5 — Categorical Statistics ───────────────────────────────────────
def get_categorical_stats(df: pd.DataFrame) -> dict:
    cat_df = df.select_dtypes(include=["object", "category", "string"])
    if cat_df.empty:
        return {}

    stats = {}
    for col in cat_df.columns:
        top_value = df[col].value_counts().idxmax() if not df[col].value_counts().empty else None
        stats[col] = {
            "unique_values":      int(df[col].nunique()),
            "most_frequent":      str(top_value),
            "most_frequent_count": int(df[col].value_counts().max()) if top_value else 0,
            "most_frequent_percent": round(
                int(df[col].value_counts().max()) / len(df) * 100, 2
            ) if top_value else 0.0
        }

    return stats


# ─── Step 5.6 — Correlation Matrix ───────────────────────────────────────────
def get_correlation_matrix(df: pd.DataFrame) -> dict:
    num_df = df.select_dtypes(include=[np.number])
    if num_df.shape[1] < 2:
        return {}

    corr = num_df.corr().round(4)
    return {
        col: {other: float(corr.loc[col, other]) for other in corr.columns}
        for col in corr.index
    }


# ─── Step 5.7 — Master Profiling Report ──────────────────────────────────────
def profile_dataset(filepath: str) -> dict:
    df = pd.read_csv(filepath)

    basic        = get_basic_info(df)
    missing      = get_missing_values(df)
    duplicates   = get_duplicate_info(df)
    num_stats    = get_numerical_stats(df)
    cat_stats    = get_categorical_stats(df)
    correlation  = get_correlation_matrix(df)

    numerical_cols   = list(df.select_dtypes(include=[np.number]).columns)
    categorical_cols = list(df.select_dtypes(include=["object", "category", "string"]).columns)

    return {
        "basic_info": {
            "rows":               basic["rows"],
            "columns":            basic["columns"],
            "memory_usage_kb":    basic["memory_usage_kb"],
            "numerical_columns":  numerical_cols,
            "categorical_columns": categorical_cols,
            "dtypes":             basic["dtypes"]
        },
        "missing_values": missing,
        "duplicates":     duplicates,
        "numerical_stats":    num_stats,
        "categorical_stats":  cat_stats,
        "correlation_matrix": correlation
    }
