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

@router.post("/speed/web-vitals", status_code=201)
def track_web_vital(payload: schemas.WebVitalsPayload, request: Request, db: Session = Depends(database.get_db)):
    """
    Public, rate-limited endpoint to record client web vitals details.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
        
    now = time.time()
    ip_history = track_rate_limits[f"vital_{client_ip}"]
    ip_history = [t for t in ip_history if now - t < 60]
    track_rate_limits[f"vital_{client_ip}"] = ip_history
    
    if len(ip_history) >= 30:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many web vital reports. Throttled."
        )
        
    track_rate_limits[f"vital_{client_ip}"].append(now)
    
    valid_metrics = ["FCP", "LCP", "CLS", "TTFB", "FID", "INP"]
    metric_name = payload.name.upper().strip()
    if metric_name not in valid_metrics:
        raise HTTPException(status_code=400, detail="Invalid metric name.")
        
    db_vital = models.ClientWebVitalsLog(
        metric_name=metric_name,
        value=payload.value,
        path=(payload.path or "")[:250]
    )
    db.add(db_vital)
    db.commit()
    return {"status": "recorded"}

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
    
    # 4. Speed & Performance Telemetry
    server_logs = db.query(models.ServerSpeedLog).order_by(models.ServerSpeedLog.timestamp.desc()).all()
    total_api_requests = len(server_logs)
    
    avg_latency = 0.0
    slowest_endpoints = []
    
    if total_api_requests > 0:
        avg_latency = sum(l.duration_ms for l in server_logs) / total_api_requests
        
        path_latencies = defaultdict(list)
        for l in server_logs:
            path_latencies[f"{l.method} {l.path}"].append(l.duration_ms)
            
        path_averages = []
        for path_method, durations in path_latencies.items():
            path_averages.append({
                "endpoint": path_method,
                "avg_duration_ms": round(sum(durations) / len(durations), 2),
                "calls": len(durations)
            })
            
        slowest_endpoints = sorted(path_averages, key=lambda x: x["avg_duration_ms"], reverse=True)[:10]
        
    vitals_logs = db.query(models.ClientWebVitalsLog).order_by(models.ClientWebVitalsLog.timestamp.desc()).all()
    
    vitals_by_name = defaultdict(list)
    for v in vitals_logs:
        vitals_by_name[v.metric_name].append(v.value)
        
    vitals_averages = {}
    for name, values in vitals_by_name.items():
        vitals_averages[name] = round(sum(values) / len(values), 3)
        
    try:
        import resource
        import sys
        usage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        mem_mb = usage / (1024.0 * 1024.0) if sys.platform == 'darwin' else usage / 1024.0
        memory_usage_mb = round(mem_mb, 2)
    except Exception:
        memory_usage_mb = 0.0

    # 5. Token Usage metrics
    reports = db.query(models.Report).all()
    total_prompt_tokens = sum(r.prompt_tokens or 0 for r in reports)
    total_completion_tokens = sum(r.completion_tokens or 0 for r in reports)
    total_total_tokens = sum(r.total_tokens or 0 for r in reports)
    
    # Token usage by plan
    from sqlalchemy.sql import func
    token_by_plan = db.query(
        models.Organization.plan,
        func.sum(models.Report.prompt_tokens).label("prompt"),
        func.sum(models.Report.completion_tokens).label("completion"),
        func.sum(models.Report.total_tokens).label("total"),
        func.count(models.Report.id).label("count")
    ).join(
        models.Organization, models.Report.organization_id == models.Organization.id
    ).group_by(models.Organization.plan).all()
    
    token_by_plan_list = [
        {
            "plan": row.plan,
            "prompt_tokens": row.prompt or 0,
            "completion_tokens": row.completion or 0,
            "total_tokens": row.total or 0,
            "report_count": row.count or 0
        }
        for row in token_by_plan
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
        "recent_visitors": recent_visitors,
        "speed_stats": {
            "avg_latency_ms": round(avg_latency, 2),
            "total_api_requests": total_api_requests,
            "slowest_endpoints": slowest_endpoints,
            "vitals_averages": vitals_averages,
            "server_memory_mb": memory_usage_mb
        },
        "token_usage": {
            "total_prompt_tokens": total_prompt_tokens,
            "total_completion_tokens": total_completion_tokens,
            "total_total_tokens": total_total_tokens,
            "by_plan": token_by_plan_list
        }
    }

@router.get("/settings")
def get_settings(db: Session = Depends(database.get_db)):
    """
    Get the currently active App Stage stage configuration. (Public Endpoint)
    """
    stage_setting = db.query(models.AppSetting).filter(models.AppSetting.key == "app_stage").first()
    active_stage = stage_setting.value if stage_setting else os.getenv("APP_STAGE", "development")
    if active_stage == "sandbox":
        active_stage = "development"
    return {"app_stage": active_stage}

@router.post("/settings")
def update_settings(payload: schemas.SettingsUpdatePayload, db: Session = Depends(database.get_db), _admin=Depends(verify_admin)):
    """
    Update the active app stage setting (development or production).
    """
    stage = payload.app_stage.lower().strip()
    if stage == "sandbox":
        stage = "development"
        
    if stage not in ["development", "production"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid app stage. Must be 'development' or 'production'."
        )
        
    setting = db.query(models.AppSetting).filter(models.AppSetting.key == "app_stage").first()
    if not setting:
        setting = models.AppSetting(key="app_stage", value=stage)
        db.add(setting)
    else:
        setting.value = stage
    db.commit()
    return {"status": "success", "app_stage": setting.value}
