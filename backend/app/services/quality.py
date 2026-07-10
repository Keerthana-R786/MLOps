import numpy as np
import pandas as pd


# ─── Constants ────────────────────────────────────────────────────────────────
# Weights for overall score (must sum to 1.0)
WEIGHTS = {
    "completeness":  0.30,
    "uniqueness":    0.25,
    "validity":      0.25,
    "consistency":   0.20,
}

# Validation rules for the Employee dataset
VALIDATION_RULES = {
    "Age":                       {"min": 18,   "max": 70},
    "JoiningYear":               {"min": 1980, "max": 2025},
    "PaymentTier":               {"min": 1,    "max": 3},
    "ExperienceInCurrentDomain": {"min": 0,    "max": 50},
    "LeaveOrNot":                {"min": 0,    "max": 1},
}

# Expected dtypes per column
EXPECTED_TYPES = {
    "JoiningYear":               "numeric",
    "PaymentTier":               "numeric",
    "Age":                       "numeric",
    "ExperienceInCurrentDomain": "numeric",
    "LeaveOrNot":                "numeric",
    "Education":                 "text",
    "City":                      "text",
    "Gender":                    "text",
    "EverBenched":               "text",
}


# ─── Score 1 — Completeness ───────────────────────────────────────────────────
def completeness_score(df: pd.DataFrame) -> dict:
    total_cells   = df.shape[0] * df.shape[1]
    missing_cells = int(df.isnull().sum().sum())
    filled_cells  = total_cells - missing_cells
    score         = round((filled_cells / total_cells) * 100, 2)

    return {
        "score":         score,
        "total_cells":   total_cells,
        "missing_cells": missing_cells,
        "filled_cells":  filled_cells,
    }


# ─── Score 2 — Uniqueness ─────────────────────────────────────────────────────
def uniqueness_score(df: pd.DataFrame) -> dict:
    total_rows     = len(df)
    duplicate_rows = int(df.duplicated().sum())
    unique_rows    = total_rows - duplicate_rows
    score          = round((unique_rows / total_rows) * 100, 2)

    return {
        "score":          score,
        "total_rows":     total_rows,
        "duplicate_rows": duplicate_rows,
        "unique_rows":    unique_rows,
    }


# ─── Score 3 — Validity ───────────────────────────────────────────────────────
def validity_score(df: pd.DataFrame) -> dict:
    total_rows    = len(df)
    invalid_count = 0
    invalid_detail = {}

    for col, rules in VALIDATION_RULES.items():
        if col not in df.columns:
            continue
        mask = pd.Series([False] * total_rows, index=df.index)
        if "min" in rules:
            mask |= df[col] < rules["min"]
        if "max" in rules:
            mask |= df[col] > rules["max"]
        col_invalid = int(mask.sum())
        if col_invalid > 0:
            invalid_detail[col] = col_invalid
            invalid_count += col_invalid

    # Score is based on rows that are fully valid
    valid_rows = total_rows - min(invalid_count, total_rows)
    score      = round((valid_rows / total_rows) * 100, 2)

    return {
        "score":           score,
        "total_rows":      total_rows,
        "invalid_entries": invalid_count,
        "invalid_detail":  invalid_detail,
    }


# ─── Score 4 — Consistency ────────────────────────────────────────────────────
def consistency_score(df: pd.DataFrame) -> dict:
    total_checks  = len(EXPECTED_TYPES)
    passed_checks = 0
    type_issues   = {}

    for col, expected in EXPECTED_TYPES.items():
        if col not in df.columns:
            type_issues[col] = "Column missing"
            continue

        actual = str(df[col].dtype)
        if expected == "numeric":
            if "int" in actual or "float" in actual:
                passed_checks += 1
            else:
                type_issues[col] = f"Expected numeric, got {actual}"
        elif expected == "text":
            if "object" in actual or "string" in actual or "str" in actual:
                passed_checks += 1
            else:
                type_issues[col] = f"Expected text, got {actual}"

    score = round((passed_checks / total_checks) * 100, 2)

    return {
        "score":          score,
        "total_checks":   total_checks,
        "passed_checks":  passed_checks,
        "failed_checks":  total_checks - passed_checks,
        "type_issues":    type_issues,
    }


# ─── Overall Score ────────────────────────────────────────────────────────────
def calculate_overall_score(scores: dict) -> float:
    overall = (
        scores["completeness"]["score"] * WEIGHTS["completeness"] +
        scores["uniqueness"]["score"]   * WEIGHTS["uniqueness"]   +
        scores["validity"]["score"]     * WEIGHTS["validity"]      +
        scores["consistency"]["score"]  * WEIGHTS["consistency"]
    )
    return round(overall, 2)


def grade(score: float) -> str:
    if score >= 90:
        return "Excellent"
    elif score >= 75:
        return "Good"
    elif score >= 60:
        return "Fair"
    else:
        return "Poor"


# ─── Master Quality Score Function ───────────────────────────────────────────
def score_dataset(filepath: str) -> dict:
    df = pd.read_csv(filepath)

    scores = {
        "completeness": completeness_score(df),
        "uniqueness":   uniqueness_score(df),
        "validity":     validity_score(df),
        "consistency":  consistency_score(df),
    }

    overall = calculate_overall_score(scores)

    return {
        "overall_score":   overall,
        "grade":           grade(overall),
        "weights_used":    WEIGHTS,
        "individual_scores": {
            "completeness":  scores["completeness"]["score"],
            "uniqueness":    scores["uniqueness"]["score"],
            "validity":      scores["validity"]["score"],
            "consistency":   scores["consistency"]["score"],
        },
        "details": scores
    }
