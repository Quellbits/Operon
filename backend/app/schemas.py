from pydantic import BaseModel
from typing import Optional, List

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    guest_upload_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    class Config:
        from_attributes = True

class OrganizationResponse(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

from datetime import datetime

class ReportResponse(BaseModel):
    id: int
    organization_id: int
    generated_at: datetime
    report_type: str
    pdf_url: str
    summary: Optional[str] = None
    health_score: Optional[float] = None
    actions: Optional[List[str]] = None
    class Config:
        from_attributes = True

class BatchProcessPayload(BaseModel):
    upload_ids: List[int]

class WaitlistCreate(BaseModel):
    email: str

class VisitorTrackPayload(BaseModel):
    path: str
    user_agent: Optional[str] = None
    referrer: Optional[str] = None

class AdminLoginPayload(BaseModel):
    password: str

class SettingsUpdatePayload(BaseModel):
    app_stage: str

class WebVitalsPayload(BaseModel):
    name: str  # e.g. "FCP", "LCP", "TTFB", etc.
    value: float
    path: str



