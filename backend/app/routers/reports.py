from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, database, schemas
from .organizations import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/")
def get_reports(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    # Get all reports for organizations where user is a member
    memberships = db.query(models.OrganizationMember).filter(models.OrganizationMember.user_id == current_user.id).all()
    org_ids = [m.organization_id for m in memberships]
    
    reports = db.query(models.Report).filter(models.Report.organization_id.in_(org_ids)).all()
    return reports

@router.get("/{report_id}")
def get_report_details(report_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # Check membership
    is_member = db.query(models.OrganizationMember).filter(
        models.OrganizationMember.user_id == current_user.id,
        models.OrganizationMember.organization_id == report.organization_id
    ).first()
    
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to view this report")
        
    return report
