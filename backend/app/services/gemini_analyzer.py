"""
gemini_analyzer.py
Uses Groq (Llama 3.3 70B) to intelligently analyze the developer's project
description and dataset to determine the optimal ML training configuration.
"""

import json
import re
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)
MODEL  = "llama-3.3-70b-versatile"


def analyze_project(prompt: str, columns: list, sample_rows: list, dtypes: dict) -> dict:
    """
    Send the developer's project description + actual dataset info to Groq LLM.
    Returns a structured config dict for ML model training.
    No hardcoded rules — fully LLM-driven decision making.
    """

    column_info = "\n".join([
        f"  - {col} | dtype: {dtypes.get(col, 'unknown')} | "
        f"sample values: {[str(r.get(col, '')) for r in sample_rows[:3]]}"
        for col in columns
    ])

    system_msg = """You are a senior ML engineer. You will receive:
1. A developer's project description
2. Dataset column names, data types, and sample values

Your job is to return a precise JSON configuration for training the best ML model.
Return ONLY raw JSON — no markdown, no explanation, no code fences. Just the JSON object."""

    user_msg = f"""Developer's project description:
"{prompt}"

Dataset columns with dtypes and sample values:
{column_info}

Return a JSON object with exactly these fields:
{{
  "domain": "short domain label e.g. Healthcare / Fraud Detection / Real Estate",
  "problem_type": "one of: binary_classification | multiclass_classification | regression | clustering",
  "target_column": "exact column name to predict — must exactly match one column name above, or null for clustering",
  "drop_columns": ["list of column names that are IDs, primary keys, names, emails — useless for prediction"],
  "feature_columns": ["columns to use as input features — exclude target_column and drop_columns — must be from the list above"],
  "handle_imbalance": true or false,
  "evaluation_metric": "primary metric: f1_score | accuracy | rmse | r2 | silhouette",
  "models_to_train": ["2 to 3 model class names — choose from: RandomForestClassifier, XGBClassifier, LogisticRegression, SVC, RandomForestRegressor, XGBRegressor, LinearRegression, Ridge, KMeans, DBSCAN"],
  "reasoning": ["3 to 5 short sentences explaining why you chose this configuration based on the actual data"],
  "preprocessing_notes": "any domain-specific preprocessing advice based on the actual column values"
}}

Critical rules:
- target_column MUST exactly match one column name from the list provided, or null
- feature_columns MUST only contain column names from the list, excluding target and drop columns
- Look at the actual sample values to infer what each column contains
- For medical, fraud, or churn tasks, check if target is imbalanced (set handle_imbalance accordingly)
- Choose models appropriate for the problem type — do not mix classifier with regressor models"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user",   "content": user_msg},
            ],
            max_tokens=1024,
            temperature=0.1,
        )

        raw = response.choices[0].message.content.strip()

        # Strip markdown code fences if LLM added them
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
        raw = re.sub(r"\s*```\s*$",       "", raw, flags=re.MULTILINE)
        raw = raw.strip()

        config = json.loads(raw)

        # Validate target column exists in dataset (case-insensitive fallback)
        if config.get("target_column") and config["target_column"] not in columns:
            match = next(
                (c for c in columns if c.lower() == config["target_column"].lower()), None
            )
            config["target_column"] = match if match else columns[-1]

        # Validate feature columns — only keep ones that actually exist
        valid_features = [c for c in config.get("feature_columns", []) if c in columns]
        if not valid_features:
            target = config.get("target_column")
            valid_features = [c for c in columns if c != target]
        config["feature_columns"] = valid_features

        # Validate drop columns
        config["drop_columns"] = [c for c in config.get("drop_columns", []) if c in columns]

        return {"success": True, "config": config}

    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error":   f"LLM returned invalid JSON: {str(e)}",
            "raw":     raw if "raw" in dir() else ""
        }
    except Exception as e:
        return {"success": False, "error": f"Groq API error: {str(e)}"}
