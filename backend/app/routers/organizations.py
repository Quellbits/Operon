from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, database, schemas
from .auth import oauth2_scheme, SECRET_KEY, ALGORITHM
from jose import jwt

router = APIRouter(prefix="/organizations", tags=["organizations"])

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/", response_model=list[schemas.OrganizationResponse])
def get_user_organizations(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    memberships = db.query(models.OrganizationMember).filter(models.OrganizationMember.user_id == current_user.id).all()
    org_ids = [m.organization_id for m in memberships]
    orgs = db.query(models.Organization).filter(models.Organization.id.in_(org_ids)).all()
    return orgs

@router.post("/", response_model=schemas.OrganizationResponse)
def create_organization(name: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    new_org = models.Organization(name=name)
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    
    # Add user as owner
    member = models.OrganizationMember(user_id=current_user.id, organization_id=new_org.id, role="owner")
    db.add(member)
    db.commit()
    
    return new_org

from sqlalchemy import func
from pydantic import BaseModel

class PlanUpdatePayload(BaseModel):
    plan: str

@router.get("/active")
def get_active_organization(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
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
    
    plan_limits = {
        "SANDBOX_INIT": 10.0,
        "AUDIT_PROFESSIONAL": 100.0,
        "ENTERPRISE_COMMAND": 1000.0,
        "QUANT_INTELLIGENCE": 10000.0,
    }
    
    limit = plan_limits.get(org.plan, 10.0)
    
    return {
        "id": org.id,
        "name": org.name,
        "plan": org.plan,
        "storage_used": round(org.storage_used, 4),
        "storage_limit": limit
    }

@router.post("/plan")
def update_organization_plan(payload: PlanUpdatePayload, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    membership = db.query(models.OrganizationMember).filter(models.OrganizationMember.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=400, detail="User is not associated with any organization")
        
    org = db.query(models.Organization).filter(models.Organization.id == membership.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    valid_plans = ["SANDBOX_INIT", "AUDIT_PROFESSIONAL", "ENTERPRISE_COMMAND", "QUANT_INTELLIGENCE"]
    if payload.plan not in valid_plans:
        raise HTTPException(status_code=400, detail="Invalid plan name. Must be one of SANDBOX_INIT, AUDIT_PROFESSIONAL, ENTERPRISE_COMMAND, QUANT_INTELLIGENCE.")
        
    org.plan = payload.plan
    
    # Log simulated plan purchase payment
    prices = {
        "AUDIT_PROFESSIONAL": 15.0,
        "ENTERPRISE_COMMAND": 49.0,
        "QUANT_INTELLIGENCE": 99.0,
        "SANDBOX_INIT": 0.0
    }
    amount = prices.get(payload.plan, 0.0)
    if amount > 0.0:
        db_payment = models.PaymentLog(
            organization_id=org.id,
            amount=amount,
            plan_name=payload.plan,
            status="completed"
        )
        db.add(db_payment)
        
    db.commit()
    db.refresh(org)
    
    return {"status": "success", "plan": org.plan, "message": f"Successfully updated subscription plan to {org.plan}."}

