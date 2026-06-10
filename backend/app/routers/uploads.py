from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, database
from ..engine.schema_detector import SchemaDetector
import pandas as pd
import io

router = APIRouter(prefix="/uploads", tags=["uploads"])

@router.post("/")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    contents = await file.read()
    if file.filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))
        
    detector = SchemaDetector(df)
    mappings = detector.detect_mappings()
    
    # Store in database (Layer 2)
    db_upload = models.Upload(
        filename=file.filename,
        file_type=file.filename.split('.')[-1],
        status=models.UploadStatus.UPLOADED.value,
        mapping_json=mappings
    )
    db.add(db_upload)
    db.commit()
    db.refresh(db_upload)
    
    return {
        "id": db_upload.id,
        "filename": db_upload.filename,
        "detected_mappings": mappings,
        "sample_data": detector.get_sample_data(3)
    }
