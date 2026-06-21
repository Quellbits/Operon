from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from .. import models, database, schemas
import os
import bcrypt

SECRET_KEY = os.getenv("JWT_SECRET", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class BCryptContext:
    def hash(self, password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
    def verify(self, password: str, hashed_password: str) -> bool:
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception:
            return False

pwd_context = BCryptContext()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter(prefix="/auth", tags=["auth"])

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/signup")
def signup(user_data: schemas.UserCreate, db: Session = Depends(database.get_db)):
    stage_setting = db.query(models.AppSetting).filter(models.AppSetting.key == "app_stage").first()
    active_stage = stage_setting.value if stage_setting else os.getenv("APP_STAGE", "sandbox")
    if active_stage.lower() != "production" and (user_data.email == "featuretest@operon.io" or user_data.email.startswith("new_signup_")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User registration is disabled during the sandbox stage."
        )
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user_data.password)
    new_user = models.User(email=user_data.email, hashed_password=hashed_password, full_name=user_data.full_name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create default organization with unique name constraint check
    org_name = f"{user_data.full_name}'s Org"
    base_name = org_name
    counter = 1
    while db.query(models.Organization).filter(models.Organization.name == org_name).first():
        org_name = f"{base_name} ({counter})"
        counter += 1
        
    new_org = models.Organization(name=org_name)
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    
    # Add user as owner
    member = models.OrganizationMember(user_id=new_user.id, organization_id=new_org.id, role="owner")
    db.add(member)
    db.commit()
    
    # If guest_upload_id is provided, migrate data to the new user's default organization
    if user_data.guest_upload_id:
        upload = db.query(models.Upload).filter(models.Upload.id == user_data.guest_upload_id).first()
        if upload and upload.organization_id:
            guest_org_id = upload.organization_id
            
            # Reassign all child records
            db.query(models.Upload).filter(models.Upload.organization_id == guest_org_id).update({"organization_id": new_org.id})
            db.query(models.Transaction).filter(models.Transaction.organization_id == guest_org_id).update({"organization_id": new_org.id})
            db.query(models.Customer).filter(models.Customer.organization_id == guest_org_id).update({"organization_id": new_org.id})
            db.query(models.Product).filter(models.Product.organization_id == guest_org_id).update({"organization_id": new_org.id})
            db.query(models.Metric).filter(models.Metric.organization_id == guest_org_id).update({"organization_id": new_org.id})
            db.query(models.Insight).filter(models.Insight.organization_id == guest_org_id).update({"organization_id": new_org.id})
            db.query(models.Report).filter(models.Report.organization_id == guest_org_id).update({"organization_id": new_org.id})
            db.commit()
            
            # Clean up old guest organization memberships & organization
            db.query(models.OrganizationMember).filter(models.OrganizationMember.organization_id == guest_org_id).delete()
            db.query(models.Organization).filter(models.Organization.id == guest_org_id).delete()
            db.commit()
            
    return {"message": "User created successfully", "org_id": new_org.id}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/waitlist")
def add_to_waitlist(waitlist_data: schemas.WaitlistCreate, db: Session = Depends(database.get_db)):
    email_clean = waitlist_data.email.strip().lower()
    if not email_clean or "@" not in email_clean:
        raise HTTPException(status_code=400, detail="Invalid email address")
    
    db_email = db.query(models.WaitlistEmail).filter(models.WaitlistEmail.email == email_clean).first()
    if db_email:
        return {"status": "success", "message": "You are already registered on our waiting list!"}
    
    new_entry = models.WaitlistEmail(email=email_clean)
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return {"status": "success", "message": "Successfully added to the waiting list!"}


from .organizations import get_current_user
from sqlalchemy import func

@router.get("/settings", response_model=schemas.UserSettingsResponse)
def get_user_settings(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    membership = db.query(models.OrganizationMember).filter(models.OrganizationMember.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=400, detail="User is not associated with any organization")
        
    org = db.query(models.Organization).filter(models.Organization.id == membership.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    # Calculate storage used on-the-fly from file sizes of all completed uploads
    storage_used_sum = db.query(func.sum(models.Upload.file_size)).filter(models.Upload.organization_id == org.id).scalar() or 0.0
    org.storage_used = float(storage_used_sum)
    db.commit()
    db.refresh(org)
    
    # Calculate token usage on-the-fly
    tokens_sum = db.query(func.sum(models.Report.total_tokens)).filter(models.Report.organization_id == org.id).scalar() or 0
    
    plan_storage_limits = {
        "SANDBOX_INIT": 10.0,
        "AUDIT_PROFESSIONAL": 100.0,
        "ENTERPRISE_COMMAND": 1000.0,
        "QUANT_INTELLIGENCE": 10000.0,
    }
    plan_token_limits = {
        "SANDBOX_INIT": 100000,
        "AUDIT_PROFESSIONAL": 1000000,
        "ENTERPRISE_COMMAND": 10000000,
        "QUANT_INTELLIGENCE": 50000000,
    }
    
    storage_limit = plan_storage_limits.get(org.plan, 10.0)
    token_cap = plan_token_limits.get(org.plan, 100000)
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "agent_name": current_user.agent_name or "ARIA",
        "agent_persona": current_user.agent_persona or "ops_analyst",
        "agent_tone": current_user.agent_tone or "professional",
        "agent_instructions": current_user.agent_instructions or "",
        "custom_api_key": current_user.custom_api_key or "",
        "custom_base_url": current_user.custom_base_url or "",
        "custom_model_name": current_user.custom_model_name or "",
        "plan": org.plan,
        "total_tokens_used": int(tokens_sum),
        "storage_used": round(org.storage_used, 4),
        "storage_limit": storage_limit,
        "token_cap": token_cap
    }

@router.put("/settings", response_model=schemas.UserSettingsResponse)
def update_user_settings(
    payload: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    membership = db.query(models.OrganizationMember).filter(models.OrganizationMember.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=400, detail="User is not associated with any organization")
        
    org = db.query(models.Organization).filter(models.Organization.id == membership.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    if payload.email is not None:
        email_clean = payload.email.strip().lower()
        if email_clean != current_user.email:
            existing = db.query(models.User).filter(models.User.email == email_clean).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email address is already in use by another user")
            current_user.email = email_clean
            
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip()
        
    if payload.password is not None:
        pw_str = payload.password.strip()
        if len(pw_str) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
        current_user.hashed_password = pwd_context.hash(pw_str)
        
    if payload.agent_name is not None:
        current_user.agent_name = payload.agent_name.strip()
        
    if payload.agent_persona is not None:
        current_user.agent_persona = payload.agent_persona.strip()
        
    if payload.agent_tone is not None:
        current_user.agent_tone = payload.agent_tone.strip()
        
    if payload.agent_instructions is not None:
        current_user.agent_instructions = payload.agent_instructions.strip()
        
    if payload.custom_api_key is not None:
        current_user.custom_api_key = payload.custom_api_key.strip()
        
    if payload.custom_base_url is not None:
        current_user.custom_base_url = payload.custom_base_url.strip()
        
    if payload.custom_model_name is not None:
        current_user.custom_model_name = payload.custom_model_name.strip()
        
    db.commit()
    db.refresh(current_user)
    
    # Calculate stats for response
    storage_used_sum = db.query(func.sum(models.Upload.file_size)).filter(models.Upload.organization_id == org.id).scalar() or 0.0
    org.storage_used = float(storage_used_sum)
    db.commit()
    
    tokens_sum = db.query(func.sum(models.Report.total_tokens)).filter(models.Report.organization_id == org.id).scalar() or 0
    
    plan_storage_limits = {
        "SANDBOX_INIT": 10.0,
        "AUDIT_PROFESSIONAL": 100.0,
        "ENTERPRISE_COMMAND": 1000.0,
        "QUANT_INTELLIGENCE": 10000.0,
    }
    plan_token_limits = {
        "SANDBOX_INIT": 100000,
        "AUDIT_PROFESSIONAL": 1000000,
        "ENTERPRISE_COMMAND": 10000000,
        "QUANT_INTELLIGENCE": 50000000,
    }
    storage_limit = plan_storage_limits.get(org.plan, 10.0)
    token_cap = plan_token_limits.get(org.plan, 100000)
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "agent_name": current_user.agent_name or "ARIA",
        "agent_persona": current_user.agent_persona or "ops_analyst",
        "agent_tone": current_user.agent_tone or "professional",
        "agent_instructions": current_user.agent_instructions or "",
        "custom_api_key": current_user.custom_api_key or "",
        "custom_base_url": current_user.custom_base_url or "",
        "custom_model_name": current_user.custom_model_name or "",
        "plan": org.plan,
        "total_tokens_used": int(tokens_sum),
        "storage_used": round(org.storage_used, 4),
        "storage_limit": storage_limit,
        "token_cap": token_cap
    }

