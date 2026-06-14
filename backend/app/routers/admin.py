from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from .. import models, database, schemas
import os
import hashlib
import time
from collections import defaultdict
from typing import Optional

router = APIRouter(prefix="/admin", tags=["admin"])

# Sliding window rate limiter: IP -> list of timestamps
track_rate_limits = defaultdict(list)

def verify_admin(request: Request):
    """
    Zero-Trust authorization checking X-Admin-Token against Render environment variable.
    """
    admin_token = request.headers.get("X-Admin-Token")
    actual_pwd = os.getenv("ADMIN_PASSWORD", "admin123")  # default if not set
    if not actual_pwd or admin_token != actual_pwd:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access denied. Invalid credentials."
        )

@router.post("/login")
def admin_login(payload: schemas.AdminLoginPayload):
    """
    Verify admin password and return token.
    """
    actual_pwd = os.getenv("ADMIN_PASSWORD", "admin123")
    if payload.password != actual_pwd:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin password."
        )
    return {"status": "success", "token": actual_pwd}

@router.post("/track", status_code=201)
def track_visit(payload: schemas.VisitorTrackPayload, request: Request, db: Session = Depends(database.get_db)):
    """
    Public, rate-limited endpoint to track visitor details securely.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    # Check forward headers from Vercel/Render proxies
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
        
    # Rate limiter check: Max 10 tracking events per IP per minute
    now = time.time()
    ip_history = track_rate_limits[client_ip]
    ip_history = [t for t in ip_history if now - t < 60]
    track_rate_limits[client_ip] = ip_history
    
    if len(ip_history) >= 10:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Tracking event throttled."
        )
        
    track_rate_limits[client_ip].append(now)
    
    # SHA-256 IP address anonymization with a salt
    salt = os.getenv("ADMIN_PASSWORD", "default_salt")
    ip_hash = hashlib.sha256(f"{client_ip}-{salt}".encode('utf-8')).hexdigest()
    
    # Truncate and sanitize inputs to prevent overflows or XSS
    path = (payload.path or "")[:250]
    user_agent = (payload.user_agent or "")[:500]
    referrer = (payload.referrer or "")[:500]
    
    db_log = models.VisitorLog(
        ip_address=ip_hash,
        user_agent=user_agent,
        referrer=referrer if referrer.startswith(("http://", "https://")) else None,
        path=path
    )
    db.add(db_log)
    db.commit()
    return {"status": "tracked"}

@router.get("/analytics")
def get_admin_analytics(db: Session = Depends(database.get_db), _admin=Depends(verify_admin)):
    """
    Gather waitlist metrics, traffic numbers, plan counts, and payment ledger details.
    """
    # 1. Waitlist registrations
    signups = db.query(models.WaitlistEmail).order_by(models.WaitlistEmail.created_at.desc()).all()
    total_signups = len(signups)
    
    signup_trends = defaultdict(int)
    for s in signups:
        date_str = s.created_at.strftime("%Y-%m-%d")
        signup_trends[date_str] += 1
    signup_trends_list = [{"date": k, "count": v} for k, v in sorted(signup_trends.items())]
    
    # 2. Traffic logs
    visitor_logs = db.query(models.VisitorLog).order_by(models.VisitorLog.timestamp.desc()).all()
    total_visitors = len(visitor_logs)
    unique_ips = len(set(v.ip_address for v in visitor_logs))
    
    referrers = defaultdict(int)
    for v in visitor_logs:
        if v.referrer:
            try:
                domain = v.referrer.split("//")[1].split("/")[0]
                referrers[domain] += 1
            except Exception:
                referrers[v.referrer] += 1
        else:
            referrers["Direct / None"] += 1
    referrers_list = [{"referrer": k, "count": v} for k, v in sorted(referrers.items(), key=lambda x: x[1], reverse=True)]
    
    # 3. Revenue Metrics
    payments = db.query(models.PaymentLog).order_by(models.PaymentLog.timestamp.desc()).all()
    total_revenue = sum(p.amount for p in payments)
    
    # Active plan counts
    orgs = db.query(models.Organization).all()
    plan_counts = defaultdict(int)
    for o in orgs:
        plan_counts[o.plan] += 1
    plan_counts_list = [{"plan": k, "count": v} for k, v in plan_counts.items()]
    
    # Formatted details lists (sliced to prevent payload inflation)
    recent_signups = [
        {"id": s.id, "email": s.email, "created_at": s.created_at.strftime("%Y-%m-%d %H:%M:%S")}
        for s in signups[:50]
    ]
    
    recent_payments = []
    for p in payments[:50]:
        org = db.query(models.Organization).filter(models.Organization.id == p.organization_id).first()
        org_name = org.name if org else f"Organization #{p.organization_id}"
        recent_payments.append({
            "id": p.id,
            "org_name": org_name,
            "plan_name": p.plan_name,
            "amount": p.amount,
            "timestamp": p.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "status": p.status
        })
        
    recent_visitors = [
        {
            "id": v.id,
            "ip_hash": v.ip_address[:12] + "...",
            "user_agent": v.user_agent,
            "referrer": v.referrer,
            "path": v.path,
            "timestamp": v.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        }
        for v in visitor_logs[:100]
    ]
    
    return {
        "total_signups": total_signups,
        "total_visitors": total_visitors,
        "unique_visitors": unique_ips,
        "total_revenue": round(total_revenue, 2),
        "signup_trends": signup_trends_list,
        "referrers": referrers_list,
        "plan_counts": plan_counts_list,
        "recent_signups": recent_signups,
        "recent_payments": recent_payments,
        "recent_visitors": recent_visitors
    }

@router.get("/settings")
def get_settings(db: Session = Depends(database.get_db), _admin=Depends(verify_admin)):
    """
    Get the currently active App Stage stage configuration.
    """
    stage_setting = db.query(models.AppSetting).filter(models.AppSetting.key == "app_stage").first()
    active_stage = stage_setting.value if stage_setting else os.getenv("APP_STAGE", "sandbox")
    return {"app_stage": active_stage}

@router.post("/settings")
def update_settings(payload: schemas.SettingsUpdatePayload, db: Session = Depends(database.get_db), _admin=Depends(verify_admin)):
    """
    Update the active app stage setting (sandbox or production).
    """
    if payload.app_stage not in ["sandbox", "production"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid app stage. Must be 'sandbox' or 'production'."
        )
        
    setting = db.query(models.AppSetting).filter(models.AppSetting.key == "app_stage").first()
    if not setting:
        setting = models.AppSetting(key="app_stage", value=payload.app_stage)
        db.add(setting)
    else:
        setting.value = payload.app_stage
    db.commit()
    return {"status": "success", "app_stage": setting.value}
