from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Enum, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

Base = declarative_base()

class UserRole(enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    VIEWER = "viewer"

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    plan = Column(String, default="SANDBOX_INIT")
    storage_used = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    members = relationship("OrganizationMember", back_populates="organization")
    uploads = relationship("Upload", back_populates="organization")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    
    memberships = relationship("OrganizationMember", back_populates="user")

class OrganizationMember(Base):
    __tablename__ = "organization_members"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    organization_id = Column(Integer, ForeignKey("organizations.id"), index=True)
    role = Column(String, default=UserRole.VIEWER.value)
    
    user = relationship("User", back_populates="memberships")
    organization = relationship("Organization", back_populates="members")

class UploadStatus(enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class Upload(Base):
    __tablename__ = "uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), index=True)
    filename = Column(String)
    file_type = Column(String)
    status = Column(String, default=UploadStatus.UPLOADED.value)
    file_size = Column(Float, default=0.0)
    mapping_json = Column(JSON, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    organization = relationship("Organization", back_populates="uploads")

# Normalized Data Tables
class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), index=True)
    upload_id = Column(Integer, ForeignKey("uploads.id"), nullable=True)
    date = Column(DateTime)
    customer = Column(String)
    product = Column(String)
    revenue = Column(Float)
    cost = Column(Float)
    quantity = Column(Float)
    location = Column(String)

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), index=True)
    name = Column(String)
    first_seen = Column(DateTime)
    last_seen = Column(DateTime)

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), index=True)
    name = Column(String)
    category = Column(String)

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), index=True)
    date = Column(DateTime)
    category = Column(String)
    amount = Column(Float)

class Metric(Base):
    __tablename__ = "metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), index=True)
    metric_name = Column(String)
    metric_value = Column(Float)
    period = Column(String) # e.g. "2023-Q1"

class Insight(Base):
    __tablename__ = "insights"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), index=True)
    severity = Column(String) # low, medium, high, critical
    category = Column(String)
    title = Column(String)
    description = Column(String)
    impact = Column(String)

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), index=True)
    generated_at = Column(DateTime, default=datetime.utcnow)
    report_type = Column(String)
    pdf_url = Column(String)
    summary = Column(String, nullable=True)
    health_score = Column(Float, nullable=True)
    actions = Column(JSON, nullable=True)
    is_saved = Column(Boolean, default=False)

class WaitlistEmail(Base):
    __tablename__ = "waitlist_emails"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AppSetting(Base):
    __tablename__ = "app_settings"
    
    key = Column(String, primary_key=True, index=True)
    value = Column(String)

class VisitorLog(Base):
    __tablename__ = "visitor_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String)  # Will store SHA-256 hashed/anonymized IPs
    user_agent = Column(String)
    referrer = Column(String, nullable=True)
    path = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class PaymentLog(Base):
    __tablename__ = "payment_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    amount = Column(Float)
    plan_name = Column(String)
    status = Column(String, default="completed")
    timestamp = Column(DateTime, default=datetime.utcnow)

class ClientWebVitalsLog(Base):
    __tablename__ = "client_web_vitals_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    metric_name = Column(String, index=True)  # e.g., TTFB, FCP, LCP, CLS, INP
    value = Column(Float)
    path = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class ServerSpeedLog(Base):
    __tablename__ = "server_speed_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    path = Column(String, index=True)
    method = Column(String)
    duration_ms = Column(Float)
    status_code = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)


