import pandas as pd
import numpy as np
from fastapi import HTTPException


def get_basic_info(df: pd.DataFrame) -> dict:
    return {
        "rows":            int(len(df)),
        "columns":         int(len(df.columns)),
        "memory_usage_kb": round(df.memory_usage(deep=True).sum() / 1024, 2),
        "dtypes":          {col: str(dtype) for col, dtype in df.dtypes.items()}
    }


def get_missing_values(df: pd.DataFrame) -> dict:
    missing = df.isnull().sum()
    pct     = (missing / len(df) * 100).round(2)
    return {
        "total_missing":         int(missing.sum()),
        "total_missing_percent": round(float(missing.sum()) / (len(df) * len(df.columns)) * 100, 2),
        "per_column": {
            col: {"missing_count": int(missing[col]), "missing_percent": float(pct[col])}
            for col in df.columns
        }
    }


def get_duplicate_info(df: pd.DataFrame) -> dict:
    dup = int(df.duplicated().sum())
    return {
        "duplicate_rows":    dup,
        "duplicate_percent": round(dup / len(df) * 100, 2)
    }


def get_numerical_stats(df: pd.DataFrame) -> dict:
    num_df = df.select_dtypes(include=[np.number])
    if num_df.empty:
        return {}
    desc  = num_df.describe().round(4)
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


def get_categorical_stats(df: pd.DataFrame) -> dict:
    cat_df = df.select_dtypes(exclude=[np.number])
    if cat_df.empty:
        return {}
    stats = {}
    for col in cat_df.columns:
        vc = df[col].value_counts()
        if vc.empty:
            continue
        top = vc.idxmax()
        stats[col] = {
            "unique_values":          int(df[col].nunique()),
            "most_frequent":          str(top),
            "most_frequent_count":    int(vc.max()),
            "most_frequent_percent":  round(int(vc.max()) / len(df) * 100, 2),
            "value_counts":           {str(k): int(v) for k, v in vc.head(10).items()}
        }
    return stats


def get_correlation_matrix(df: pd.DataFrame) -> dict:
    num_df = df.select_dtypes(include=[np.number])
    if num_df.shape[1] < 2:
        return {}
    corr = num_df.corr().round(4)
    return {
        col: {other: float(corr.loc[col, other]) for other in corr.columns}
        for col in corr.index
    }


def profile_dataset(filepath: str) -> dict:
    try:
        df = pd.read_csv(filepath)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot read file: {str(e)}")

    num_cols = list(df.select_dtypes(include=[np.number]).columns)
    cat_cols = list(df.select_dtypes(exclude=[np.number]).columns)

    return {
        "basic_info": {
            **get_basic_info(df),
            "numerical_columns":   num_cols,
            "categorical_columns": cat_cols,
        },
        "missing_values":     get_missing_values(df),
        "duplicates":         get_duplicate_info(df),
        "numerical_stats":    get_numerical_stats(df),
        "categorical_stats":  get_categorical_stats(df),
        "correlation_matrix": get_correlation_matrix(df),
    }
