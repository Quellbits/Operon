from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from .. import models, database, schemas
import os

SECRET_KEY = os.getenv("JWT_SECRET", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
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
    if os.getenv("APP_STAGE", "sandbox").lower() != "production":
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
