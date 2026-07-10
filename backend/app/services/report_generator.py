import os
import json
from datetime import datetime

import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)

from app.services.profiling import profile_dataset
from app.services.quality import score_dataset
from app.services.repair import repair_dataset

UPLOAD_DIR  = "uploads"
REPORTS_DIR = "reports"
os.makedirs(REPORTS_DIR, exist_ok=True)


# ─── Recommendations Engine ───────────────────────────────────────────────────
def generate_recommendations(profile: dict, quality: dict) -> list:
    recs = []
    scores = quality["individual_scores"]

    if scores["completeness"] < 100:
        recs.append("Missing values were found. KNN and Most-Frequent imputation was applied.")
    if scores["uniqueness"] < 100:
        recs.append("Duplicate rows were detected and removed to ensure data uniqueness.")
    if scores["validity"] < 100:
        recs.append("Some column values were out of valid range and have been clipped.")
    if scores["consistency"] < 100:
        recs.append("Data type inconsistencies found. Verify column types match schema.")

    missing = profile["missing_values"]["total_missing"]
    if missing == 0:
        recs.append("No missing values detected — dataset is complete.")

    dupes = profile["duplicates"]["duplicate_rows"]
    if dupes == 0:
        recs.append("No duplicate rows detected — dataset is unique.")

    if quality["overall_score"] >= 90:
        recs.append("Overall data quality is Excellent. Dataset is ready for ML pipelines.")
    elif quality["overall_score"] >= 75:
        recs.append("Overall data quality is Good. Minor issues have been addressed.")
    else:
        recs.append("Data quality needs improvement. Review flagged issues before training models.")

    return recs


# ─── PDF Generator ────────────────────────────────────────────────────────────
def build_pdf(filename: str, profile: dict, quality_before: dict,
              quality_after: dict, repair_log: dict,
              recommendations: list, pdf_path: str):

    doc = SimpleDocTemplate(pdf_path, pagesize=A4,
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    title_style   = ParagraphStyle("Title",   fontSize=18, spaceAfter=6,
                                   textColor=colors.HexColor("#1a1a2e"), fontName="Helvetica-Bold")
    heading_style = ParagraphStyle("Heading", fontSize=13, spaceAfter=4, spaceBefore=10,
                                   textColor=colors.HexColor("#16213e"), fontName="Helvetica-Bold")
    body_style    = ParagraphStyle("Body",    fontSize=10, spaceAfter=4,
                                   textColor=colors.HexColor("#333333"), fontName="Helvetica")
    sub_style     = ParagraphStyle("Sub",     fontSize=9,  spaceAfter=2,
                                   textColor=colors.HexColor("#555555"), fontName="Helvetica")

    content = []

    # ── Title ──────────────────────────────────────────────────────────────────
    content.append(Paragraph("Dataset Quality Report", title_style))
    content.append(Paragraph(f"File: {filename}", body_style))
    content.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", sub_style))
    content.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cccccc")))
    content.append(Spacer(1, 0.3*cm))

    # ── 1. Dataset Summary ─────────────────────────────────────────────────────
    content.append(Paragraph("1. Dataset Summary", heading_style))
    basic = profile["basic_info"]
    summary_data = [
        ["Metric", "Value"],
        ["Rows",              str(basic["rows"])],
        ["Columns",           str(basic["columns"])],
        ["Memory Usage",      f"{basic['memory_usage_kb']} KB"],
        ["Numerical Columns", ", ".join(basic["numerical_columns"])],
        ["Categorical Columns", ", ".join(basic["categorical_columns"])],
    ]
    content.append(_make_table(summary_data))
    content.append(Spacer(1, 0.3*cm))

    # ── 2. Issues Found ────────────────────────────────────────────────────────
    content.append(Paragraph("2. Issues Found", heading_style))
    missing   = profile["missing_values"]
    dupes     = profile["duplicates"]
    issues_data = [
        ["Issue",              "Count",         "Percentage"],
        ["Missing Values",     str(missing["total_missing"]),
                               f"{missing['total_missing_percent']}%"],
        ["Duplicate Rows",     str(dupes["duplicate_rows"]),
                               f"{dupes['duplicate_percent']}%"],
        ["Invalid Data Entries",
         str(quality_before["details"]["validity"].get("invalid_entries", 0)), "-"],
        ["Type Inconsistencies",
         str(quality_before["details"]["consistency"]["failed_checks"]), "-"],
    ]
    content.append(_make_table(issues_data))
    content.append(Spacer(1, 0.3*cm))

    # ── 3. Issues Fixed ────────────────────────────────────────────────────────
    content.append(Paragraph("3. Issues Fixed (Repair Log)", heading_style))
    fixed_data = [["Module", "Detail"]]

    m = repair_log.get("missing_values", {})
    fixed_data.append(["Missing Values (Numerical)",
                       ", ".join(m.get("numerical_imputed", [])) or "None"])
    fixed_data.append(["Missing Values (Categorical)",
                       ", ".join(m.get("categorical_imputed", [])) or "None"])

    d = repair_log.get("duplicates", {})
    fixed_data.append(["Duplicates Removed",
                       str(d.get("duplicates_removed", 0))])

    o = repair_log.get("outliers", {})
    fixed_data.append(["Outliers Detected",
                       f"{o.get('outliers_detected', 0)} ({o.get('action', 'flag')})"])

    iv = repair_log.get("invalid_data", {})
    fixed_data.append(["Invalid Values Clipped",
                       str(iv.get("total_invalid", 0))])

    lb = repair_log.get("label_errors", {})
    fixed_data.append(["Label Errors Found",
                       str(lb.get("label_errors_found", 0))])

    content.append(_make_table(fixed_data))
    content.append(Spacer(1, 0.3*cm))

    # ── 4. Quality Score ───────────────────────────────────────────────────────
    content.append(Paragraph("4. Quality Score", heading_style))
    score_data = [
        ["Metric",         "Before",   "After"],
        ["Completeness",
         f"{quality_before['individual_scores']['completeness']}%",
         f"{quality_after['individual_scores']['completeness']}%"],
        ["Uniqueness",
         f"{quality_before['individual_scores']['uniqueness']}%",
         f"{quality_after['individual_scores']['uniqueness']}%"],
        ["Validity",
         f"{quality_before['individual_scores']['validity']}%",
         f"{quality_after['individual_scores']['validity']}%"],
        ["Consistency",
         f"{quality_before['individual_scores']['consistency']}%",
         f"{quality_after['individual_scores']['consistency']}%"],
        ["Overall Score",
         f"{quality_before['overall_score']}%",
         f"{quality_after['overall_score']}%"],
        ["Grade",
         quality_before['grade'],
         quality_after['grade']],
    ]
    content.append(_make_table(score_data, highlight_last=True))
    content.append(Spacer(1, 0.3*cm))

    # ── 5. Recommendations ─────────────────────────────────────────────────────
    content.append(Paragraph("5. Recommendations", heading_style))
    for i, rec in enumerate(recommendations, 1):
        content.append(Paragraph(f"{i}. {rec}", body_style))
    content.append(Spacer(1, 0.3*cm))

    # ── Footer ─────────────────────────────────────────────────────────────────
    content.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cccccc")))
    content.append(Paragraph("Generated by Dataset Repair Platform — MLOps Project", sub_style))

    doc.build(content)


def _make_table(data: list, highlight_last: bool = False) -> Table:
    col_count  = len(data[0])
    col_width  = 15 * cm / col_count

    table = Table(data, colWidths=[col_width] * col_count)
    style = [
        ("BACKGROUND",  (0, 0), (-1, 0),  colors.HexColor("#16213e")),
        ("TEXTCOLOR",   (0, 0), (-1, 0),  colors.white),
        ("FONTNAME",    (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1),
         [colors.HexColor("#f5f5f5"), colors.white]),
        ("GRID",        (0, 0), (-1, -1), 0.4, colors.HexColor("#cccccc")),
        ("TOPPADDING",  (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]
    if highlight_last:
        style.append(("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#e8f5e9")))
        style.append(("FONTNAME",   (0, -1), (-1, -1), "Helvetica-Bold"))

    table.setStyle(TableStyle(style))
    return table


# ─── summary.json Generator ───────────────────────────────────────────────────
def build_summary_json(filename: str, profile: dict, quality_before: dict,
                       quality_after: dict, repair_log: dict,
                       recommendations: list, json_path: str):
    summary = {
        "generated_at":    datetime.now().isoformat(),
        "filename":        filename,
        "dataset_summary": {
            "rows":                profile["basic_info"]["rows"],
            "columns":             profile["basic_info"]["columns"],
            "memory_usage_kb":     profile["basic_info"]["memory_usage_kb"],
            "numerical_columns":   profile["basic_info"]["numerical_columns"],
            "categorical_columns": profile["basic_info"]["categorical_columns"],
        },
        "issues_found": {
            "total_missing":       profile["missing_values"]["total_missing"],
            "duplicate_rows":      profile["duplicates"]["duplicate_rows"],
            "invalid_entries":     quality_before["details"]["validity"]["invalid_entries"],
            "type_inconsistencies": quality_before["details"]["consistency"]["failed_checks"],
        },
        "repair_log":        repair_log,
        "quality_before":    quality_before["individual_scores"] | {"overall": quality_before["overall_score"], "grade": quality_before["grade"]},
        "quality_after":     quality_after["individual_scores"]  | {"overall": quality_after["overall_score"],  "grade": quality_after["grade"]},
        "improvement":       round(quality_after["overall_score"] - quality_before["overall_score"], 2),
        "recommendations":   recommendations,
    }

    with open(json_path, "w") as f:
        json.dump(summary, f, indent=2)


# ─── Master Report Function ───────────────────────────────────────────────────
def generate_report(filename: str) -> dict:
    filepath = os.path.join(UPLOAD_DIR, filename)
    base     = os.path.splitext(filename)[0]

    # Paths
    cleaned_filename = f"{base}_cleaned.csv"
    cleaned_path     = os.path.join(UPLOAD_DIR, cleaned_filename)
    pdf_path         = os.path.join(REPORTS_DIR, f"{base}_report.pdf")
    json_path        = os.path.join(REPORTS_DIR, f"{base}_summary.json")

    # Run repair if cleaned file doesn't exist yet
    repair_log = {}
    if not os.path.exists(cleaned_path):
        result     = repair_dataset(filepath)
        repair_log = result["repair_log"]
    else:
        # Load existing repair log from summary if available
        if os.path.exists(json_path):
            with open(json_path) as f:
                old = json.load(f)
                repair_log = old.get("repair_log", {})

    # Profile original dataset
    profile        = profile_dataset(filepath)
    quality_before = score_dataset(filepath)
    quality_after  = score_dataset(cleaned_path)

    # Recommendations
    recommendations = generate_recommendations(profile, quality_after)

    # Generate PDF
    build_pdf(filename, profile, quality_before, quality_after,
              repair_log, recommendations, pdf_path)

    # Generate summary.json
    build_summary_json(filename, profile, quality_before, quality_after,
                       repair_log, recommendations, json_path)

    return {
        "status":            "Report generated successfully",
        "pdf_report":        pdf_path,
        "summary_json":      json_path,
        "cleaned_dataset":   cleaned_path,
        "quality_before":    quality_before["overall_score"],
        "quality_after":     quality_after["overall_score"],
        "improvement":       round(quality_after["overall_score"] - quality_before["overall_score"], 2),
        "recommendations":   recommendations,
    }
