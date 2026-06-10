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

@router.get("/")
def get_user_organizations(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    memberships = db.query(models.OrganizationMember).filter(models.OrganizationMember.user_id == current_user.id).all()
    org_ids = [m.organization_id for m in memberships]
    orgs = db.query(models.Organization).filter(models.Organization.id.in_(org_ids)).all()
    return orgs

@router.post("/")
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
