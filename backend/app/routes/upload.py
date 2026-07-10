import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.validation import validate_dataset

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Only allow CSV files
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file. Please upload a CSV.")

    save_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save file
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run full validation pipeline
    validation_result = validate_dataset(save_path)

    return {
        "message": "File uploaded successfully",
        "filename": file.filename,
        "saved_at": save_path,
        "validation": validation_result
    }
