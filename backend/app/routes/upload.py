import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import UPLOAD_DIR
from app.services.validation import validate_dataset

router = APIRouter()
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file. Please upload a CSV.")

    save_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    validation_result = validate_dataset(save_path)

    return {
        "message":    "File uploaded successfully",
        "filename":   file.filename,
        "saved_at":   save_path,
        "validation": validation_result
    }
