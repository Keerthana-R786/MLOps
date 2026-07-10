import os
import pandas as pd
import pandera.pandas as pa
from pandera.pandas import Column, DataFrameSchema, Check
from fastapi import HTTPException

# ─── Constants ────────────────────────────────────────────────────────────────
MIN_ROWS = 10
MIN_COLUMNS = 2
MAX_FILE_SIZE_MB = 50

REQUIRED_COLUMNS = [
    "Education", "JoiningYear", "City", "PaymentTier",
    "Age", "Gender", "EverBenched", "ExperienceInCurrentDomain", "LeaveOrNot"
]

# ─── Pandera Schema ────────────────────────────────────────────────────────────
employee_schema = DataFrameSchema(
    columns={
        "Education":                  Column(str, nullable=False),
        "JoiningYear":                Column(int, Check.greater_than(1900), nullable=False),
        "City":                       Column(str, nullable=False),
        "PaymentTier":                Column(int, Check.isin([1, 2, 3]), nullable=False),
        "Age":                        Column(int, Check.in_range(18, 70), nullable=False),
        "Gender":                     Column(str, Check.isin(["Male", "Female"]), nullable=False),
        "EverBenched":                Column(str, Check.isin(["Yes", "No"]), nullable=False),
        "ExperienceInCurrentDomain":  Column(int, Check.greater_than_or_equal_to(0), nullable=False),
        "LeaveOrNot":                 Column(int, Check.isin([0, 1]), nullable=False),
    },
    strict=False  # allow extra columns without error
)


# ─── Step 4.1 — Read Dataset ──────────────────────────────────────────────────
def read_dataset(filepath: str) -> pd.DataFrame:
    try:
        df = pd.read_csv(filepath)
        return df
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File could not be read: {str(e)}")


# ─── Step 4.2 — File Validation ───────────────────────────────────────────────
def validate_file(filepath: str) -> list:
    errors = []

    # File exists
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found.")

    # Extension check
    if not filepath.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file. Please upload a CSV.")

    # File size check
    size_mb = os.path.getsize(filepath) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        errors.append(f"File size {size_mb:.2f}MB exceeds limit of {MAX_FILE_SIZE_MB}MB.")

    # Readable check
    try:
        with open(filepath, "r") as f:
            f.read(1)
    except Exception:
        errors.append("File is not readable.")

    return errors


# ─── Step 4.3 — Dataset Validation ───────────────────────────────────────────
def validate_dataset_structure(df: pd.DataFrame) -> list:
    errors = []

    # Not empty
    if df.empty:
        errors.append("Dataset is empty.")
        return errors  # no point continuing

    # Minimum rows
    if len(df) < MIN_ROWS:
        errors.append(f"Dataset has {len(df)} rows. Minimum required is {MIN_ROWS}.")

    # Minimum columns
    if len(df.columns) < MIN_COLUMNS:
        errors.append(f"Dataset has {len(df.columns)} columns. Minimum required is {MIN_COLUMNS}.")

    # Duplicate column names
    dupes = [col for col in df.columns if list(df.columns).count(col) > 1]
    if dupes:
        errors.append(f"Duplicate column names found: {list(set(dupes))}")

    # Empty column names
    empty_col_names = [col for col in df.columns if str(col).strip() == ""]
    if empty_col_names:
        errors.append(f"Empty column names found at positions: {empty_col_names}")

    return errors


# ─── Step 4.4 — Schema Validation (Pandera) ───────────────────────────────────
def validate_schema(df: pd.DataFrame) -> list:
    errors = []

    # Check required columns exist first
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        errors.append(f"Missing required columns: {missing}")
        return errors  # can't run schema check without required columns

    # Run pandera schema validation
    try:
        employee_schema.validate(df, lazy=True)
    except pa.errors.SchemaErrors as e:
        for _, row in e.failure_cases.iterrows():
            errors.append(f"Column '{row['column']}': {row['check']} failed — got value '{row['failure_case']}'")
    except Exception as e:
        errors.append(f"Schema validation error: {str(e)}")

    return errors


# ─── Step 4.5 — Master Validation Function ───────────────────────────────────
def validate_dataset(filepath: str) -> dict:
    all_errors = []

    # Step 4.2 — file level checks
    file_errors = validate_file(filepath)
    all_errors.extend(file_errors)

    # Step 4.1 — read dataset
    df = read_dataset(filepath)

    # Step 4.3 — dataset structure checks
    structure_errors = validate_dataset_structure(df)
    all_errors.extend(structure_errors)

    # Step 4.4 — schema validation (only if structure is fine)
    if not structure_errors:
        schema_errors = validate_schema(df)
        all_errors.extend(schema_errors)

    # Step 4.5 — return result
    return {
        "status": "Valid" if not all_errors else "Invalid",
        "rows": len(df),
        "columns": len(df.columns),
        "errors": all_errors
    }
