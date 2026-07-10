import os
from fastapi import APIRouter, HTTPException
from app.config import UPLOAD_DIR
from app.services.profiling import profile_dataset

router = APIRouter()


@router.get("/profile/{filename}")
def profile_file(filename: str):
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found. Upload it first.")

    result = profile_dataset(filepath)
    return {"message": "Dataset profiled successfully", "filename": filename, "profile": result}
