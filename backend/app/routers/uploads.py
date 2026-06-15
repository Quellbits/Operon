from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, database
from ..engine.schema_detector import SchemaDetector
from .organizations import get_current_user
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from jose import jwt
from .auth import SECRET_KEY, ALGORITHM

security_scheme = HTTPBearer(auto_error=False)

def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(database.get_db)
):
    if not credentials:
        return None
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        user = db.query(models.User).filter(models.User.email == email).first()
        return user
    except Exception:
        return None

from ..engine.normalization import Normalizer
from ..engine.metrics import MetricsEngine
from ..engine.insights import InsightsEngine
from ..engine.health_score import HealthScoreEngine
from ..engine.ai_narrative import AINarrativeLayer
from ..engine.reporting import ReportingEngine
import pandas as pd
import io
import os
from datetime import datetime

router = APIRouter(prefix="/uploads", tags=["uploads"])

@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(database.get_db)
):
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    contents = await file.read()
    file_size_mb = len(contents) / (1024.0 * 1024.0)
    
    # Storage limit validation
    plan_limits = {
        "SANDBOX_INIT": 10.0,
        "AUDIT_PROFESSIONAL": 100.0,
        "ENTERPRISE_COMMAND": 1000.0,
        "QUANT_INTELLIGENCE": 10000.0,
    }
    
    org_id = None
    if current_user:
        membership = db.query(models.OrganizationMember).filter(models.OrganizationMember.user_id == current_user.id).first()
        if membership:
            org_id = membership.organization_id
            org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
            if org:
                from sqlalchemy import func
                total_used = db.query(func.sum(models.Upload.file_size)).filter(models.Upload.organization_id == org_id).scalar() or 0.0
                limit = plan_limits.get(org.plan, 10.0)
                if total_used + file_size_mb > limit:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Upload limit exceeded. Your plan ({org.plan}) allows up to {limit} MB. You have currently used {total_used:.4f} MB. This file is {file_size_mb:.4f} MB."
                    )
    else:
        # Anonymous user limit (guest sandbox)
        if file_size_mb > 10.0:
            raise HTTPException(
                status_code=400,
                detail=f"Upload limit exceeded for guest sessions. File size is {file_size_mb:.4f} MB, which exceeds the guest limit of 10.0 MB. Please register to upgrade storage."
            )
            
    if file.filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))
        
    detector = SchemaDetector(df)
    mappings = detector.detect_mappings()
    
    # Store in database (Layer 2)
    db_upload = models.Upload(
        organization_id=org_id,
        filename=file.filename,
        file_type=file.filename.split('.')[-1],
        status=models.UploadStatus.UPLOADED.value,
        file_size=file_size_mb,
        mapping_json=mappings
    )
    db.add(db_upload)
    db.commit()
    db.refresh(db_upload)
    
    # Save the file on disk programmatically
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{db_upload.id}.{db_upload.file_type}"
    with open(file_path, "wb") as f:
        f.write(contents)
        
    return {
        "id": db_upload.id,
        "filename": db_upload.filename,
        "detected_mappings": mappings,
        "sample_data": detector.get_sample_data(3)
    }

@router.post("/{upload_id}/process")
def process_upload(
    upload_id: int,
    mapping_config: dict,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(database.get_db)
):
    upload = db.query(models.Upload).filter(models.Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
        
    if current_user:
        membership = db.query(models.OrganizationMember).filter(models.OrganizationMember.user_id == current_user.id).first()
        if not membership:
            raise HTTPException(status_code=400, detail="User is not a member of any organization")
          
        org_id = membership.organization_id
    else:
        # Create a new guest Organization for this anonymous session with unique name
        org_name = "Guest Org"
        base_name = org_name
        counter = 1
        while db.query(models.Organization).filter(models.Organization.name == org_name).first():
            org_name = f"{base_name} ({counter})"
            counter += 1
        guest_org = models.Organization(name=org_name)
        db.add(guest_org)
        db.commit()
        db.refresh(guest_org)
        org_id = guest_org.id
        
    upload.organization_id = org_id
    if mapping_config:
        upload.mapping_json = mapping_config
    upload.status = models.UploadStatus.PROCESSING.value
    db.commit()
    
    file_path = f"uploads/{upload.id}.{upload.file_type}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Upload source file not found on disk")
        
    try:
        if upload.file_type == 'csv':
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
            
        # 1. Normalize data
        normalizer = Normalizer(df, mapping_config)
        transactions_data = normalizer.normalize_transactions(org_id)
        
        # Clear existing transactions for this SPECIFIC upload (prevent duplicate entries if rerun)
        db.query(models.Transaction).filter(models.Transaction.upload_id == upload_id).delete()
        
        # Save Transaction entities
        for tx in transactions_data:
            db_tx = models.Transaction(
                organization_id=tx["organization_id"],
                upload_id=upload.id,
                date=tx["date"],
                customer=tx["customer"],
                product=tx["product"],
                revenue=tx["revenue"],
                cost=tx["cost"],
                quantity=tx["quantity"],
                location=tx["location"]
            )
            db.add(db_tx)
            
        # Populate Customer entities
        distinct_customers = set(tx["customer"] for tx in transactions_data if tx["customer"] != "Unknown")
        for cust_name in distinct_customers:
            exists = db.query(models.Customer).filter(models.Customer.organization_id == org_id, models.Customer.name == cust_name).first()
            if not exists:
                db_cust = models.Customer(
                    organization_id=org_id,
                    name=cust_name,
                    first_seen=datetime.utcnow(),
                    last_seen=datetime.utcnow()
                )
                db.add(db_cust)
            
        # Populate Product entities
        distinct_products = set(tx["product"] for tx in transactions_data if tx["product"] != "Default")
        for prod_name in distinct_products:
            exists = db.query(models.Product).filter(models.Product.organization_id == org_id, models.Product.name == prod_name).first()
            if not exists:
                db_prod = models.Product(
                    organization_id=org_id,
                    name=prod_name,
                    category="General"
                )
                db.add(db_prod)
            
        db.commit()
        
        # Query ALL transaction records back (accumulated financial memory) as a DataFrame for clean metrics calculations
        org_txs_data = db.query(
            models.Transaction.date,
            models.Transaction.customer,
            models.Transaction.product,
            models.Transaction.revenue,
            models.Transaction.cost,
            models.Transaction.quantity,
            models.Transaction.location
        ).filter(models.Transaction.organization_id == org_id).all()
        txs_df = pd.DataFrame(org_txs_data, columns=["date", "customer", "product", "revenue", "cost", "quantity", "location"])
        
        # 2. Compute Deterministic Metrics over accumulated data
        metrics_engine = MetricsEngine(txs_df)
        computed_metrics = metrics_engine.calculate_all()
        
        # Save metrics
        db.query(models.Metric).filter(models.Metric.organization_id == org_id).delete()
        if computed_metrics:
            db.add(models.Metric(organization_id=org_id, metric_name="total_revenue", metric_value=float(computed_metrics["revenue"]["total_revenue"]), period="all"))
            db.add(models.Metric(organization_id=org_id, metric_name="revenue_growth", metric_value=float(computed_metrics["revenue"]["revenue_growth"]), period="all"))
            db.add(models.Metric(organization_id=org_id, metric_name="total_customers", metric_value=float(computed_metrics["customers"]["total_customers"]), period="all"))
            db.add(models.Metric(organization_id=org_id, metric_name="top_customer_concentration", metric_value=float(computed_metrics["customers"]["top_customer_concentration"]), period="all"))
            db.add(models.Metric(organization_id=org_id, metric_name="total_cost", metric_value=float(computed_metrics["cost"]["total_cost"]), period="all"))
            db.add(models.Metric(organization_id=org_id, metric_name="gross_margin", metric_value=float(computed_metrics["cost"]["gross_margin"]), period="all"))
            
        # 3. Detect Insights & Profit Leakages
        insights_engine = InsightsEngine(computed_metrics)
        detected_insights = insights_engine.generate_insights()
        
        # Save insights
        db.query(models.Insight).filter(models.Insight.organization_id == org_id).delete()
        for ins in detected_insights:
            db_ins = models.Insight(
                organization_id=org_id,
                severity=ins["severity"],
                category=ins["category"],
                title=ins["title"],
                description=ins["description"],
                impact=ins["impact"]
            )
            db.add(db_ins)
            
        # 4. Calculate Business Health Score
        health_engine = HealthScoreEngine(computed_metrics)
        health_score_data = health_engine.calculate_score()
        
        # 5. Generate AI Executive Summary & Actions
        ai_narrative = AINarrativeLayer(computed_metrics, detected_insights, health_score_data)
        summary = ai_narrative.generate_executive_summary()
        actions = ai_narrative.generate_action_plan()
        
        # 6. Generate PDF Report via ReportLab
        os.makedirs("reports_pdf", exist_ok=True)
        pdf_path = f"reports_pdf/report_{upload.id}.pdf"
        
        org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
        org_name = org.name if org else "Operon Client"
        
        from .analytics import calculate_advanced_stats
        adv_data = calculate_advanced_stats(org_id, db)
        
        reporting_engine = ReportingEngine(
            organization_name=org_name,
            health_score=health_score_data["overall"],
            summary=summary,
            actions=actions,
            advanced_stats=adv_data
        )
        reporting_engine.generate_pdf(pdf_path)
        
        # Save Report record (only clear unsaved reports to retain previous saved ones)
        db.query(models.Report).filter(models.Report.organization_id == org_id, models.Report.is_saved == False).delete()
        db_report = models.Report(
            organization_id=org_id,
            report_type="Executive COO Audit",
            pdf_url=pdf_path,
            summary=summary,
            health_score=health_score_data["overall"],
            actions=actions,
            is_saved=False
        )
        db.add(db_report)
        
        # Mark Upload as completed
        upload.status = models.UploadStatus.COMPLETED.value
        db.commit()
        
        # Update organization storage used
        from sqlalchemy import func
        storage_used_sum = db.query(func.sum(models.Upload.file_size)).filter(models.Upload.organization_id == org_id).scalar() or 0.0
        org.storage_used = float(storage_used_sum)
        db.commit()
        
        # Flatten health score keys for test assertion compatibility while keeping categories
        flat_health_score = {
            "overall": health_score_data["overall"],
            "revenue": health_score_data["categories"]["revenue"],
            "costs": health_score_data["categories"]["costs"],
            "customers": health_score_data["categories"]["customers"],
            "products": health_score_data["categories"]["products"],
            "categories": health_score_data["categories"]
        }
        
        return {
            "status": "success",
            "health_score": flat_health_score,
            "summary": summary,
            "actions": actions,
            "report_id": db_report.id
        }
    except Exception as e:
        upload.status = models.UploadStatus.FAILED.value
        db.commit()
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


from .. import schemas

@router.post("/process-batch")
def process_upload_batch(
    payload: schemas.BatchProcessPayload,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(database.get_db)
):
    upload_ids = payload.upload_ids
    if not upload_ids:
        raise HTTPException(status_code=400, detail="No upload IDs provided")
        
    uploads = db.query(models.Upload).filter(models.Upload.id.in_(upload_ids)).all()
    if len(uploads) != len(upload_ids):
        raise HTTPException(status_code=404, detail="One or more uploads not found")
        
    if current_user:
        membership = db.query(models.OrganizationMember).filter(models.OrganizationMember.user_id == current_user.id).first()
        if not membership:
            raise HTTPException(status_code=400, detail="User is not a member of any organization")
        org_id = membership.organization_id
    else:
        # Create a new guest Organization for this anonymous session with unique name
        org_name = "Guest Org"
        base_name = org_name
        counter = 1
        while db.query(models.Organization).filter(models.Organization.name == org_name).first():
            org_name = f"{base_name} ({counter})"
            counter += 1
        guest_org = models.Organization(name=org_name)
        db.add(guest_org)
        db.commit()
        db.refresh(guest_org)
        org_id = guest_org.id
        
    # Clear existing transactions for all uploads in this batch
    db.query(models.Transaction).filter(models.Transaction.upload_id.in_(upload_ids)).delete()
    
    all_transactions_data = []
    
    # Process each upload
    for upload in uploads:
        upload.organization_id = org_id
        upload.status = models.UploadStatus.PROCESSING.value
        db.commit()
        
        file_path = f"uploads/{upload.id}.{upload.file_type}"
        if not os.path.exists(file_path):
            upload.status = models.UploadStatus.FAILED.value
            db.commit()
            raise HTTPException(status_code=404, detail=f"Upload source file {upload.id} not found on disk")
            
        try:
            if upload.file_type == 'csv':
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)
                
            # Normalize data using its saved mapping_json (detected at upload stage)
            mapping_config = upload.mapping_json or {}
            normalizer = Normalizer(df, mapping_config)
            transactions_data = normalizer.normalize_transactions(org_id)
            for tx in transactions_data:
                tx["upload_id"] = upload.id
            all_transactions_data.extend(transactions_data)
            
        except Exception as e:
            upload.status = models.UploadStatus.FAILED.value
            db.commit()
            raise HTTPException(status_code=500, detail=f"Processing file {upload.id} failed: {str(e)}")
            
    # Save Transaction entities
    for tx in all_transactions_data:
        db_tx = models.Transaction(
            organization_id=tx["organization_id"],
            upload_id=tx["upload_id"],
            date=tx["date"],
            customer=tx["customer"],
            product=tx["product"],
            revenue=tx["revenue"],
            cost=tx["cost"],
            quantity=tx["quantity"],
            location=tx["location"]
        )
        db.add(db_tx)
        
    # Populate Customer entities
    distinct_customers = set(tx["customer"] for tx in all_transactions_data if tx["customer"] != "Unknown")
    for cust_name in distinct_customers:
        exists = db.query(models.Customer).filter(models.Customer.organization_id == org_id, models.Customer.name == cust_name).first()
        if not exists:
            db_cust = models.Customer(
                organization_id=org_id,
                name=cust_name,
                first_seen=datetime.utcnow(),
                last_seen=datetime.utcnow()
            )
            db.add(db_cust)
        
    # Populate Product entities
    distinct_products = set(tx["product"] for tx in all_transactions_data if tx["product"] != "Default")
    for prod_name in distinct_products:
        exists = db.query(models.Product).filter(models.Product.organization_id == org_id, models.Product.name == prod_name).first()
        if not exists:
            db_prod = models.Product(
                organization_id=org_id,
                name=prod_name,
                category="General"
            )
            db.add(db_prod)
        
    db.commit()
    
    # Query transaction records back as a DataFrame for clean metrics calculations
    org_txs_data = db.query(
        models.Transaction.date,
        models.Transaction.customer,
        models.Transaction.product,
        models.Transaction.revenue,
        models.Transaction.cost,
        models.Transaction.quantity,
        models.Transaction.location
    ).filter(models.Transaction.organization_id == org_id).all()
    txs_df = pd.DataFrame(org_txs_data, columns=["date", "customer", "product", "revenue", "cost", "quantity", "location"])
    
    try:
        # Compute Deterministic Metrics over combined dataset
        metrics_engine = MetricsEngine(txs_df)
        computed_metrics = metrics_engine.calculate_all()
        
        # Save metrics
        db.query(models.Metric).filter(models.Metric.organization_id == org_id).delete()
        if computed_metrics:
            db.add(models.Metric(organization_id=org_id, metric_name="total_revenue", metric_value=float(computed_metrics["revenue"]["total_revenue"]), period="all"))
            db.add(models.Metric(organization_id=org_id, metric_name="revenue_growth", metric_value=float(computed_metrics["revenue"]["revenue_growth"]), period="all"))
            db.add(models.Metric(organization_id=org_id, metric_name="total_customers", metric_value=float(computed_metrics["customers"]["total_customers"]), period="all"))
            db.add(models.Metric(organization_id=org_id, metric_name="top_customer_concentration", metric_value=float(computed_metrics["customers"]["top_customer_concentration"]), period="all"))
            db.add(models.Metric(organization_id=org_id, metric_name="total_cost", metric_value=float(computed_metrics["cost"]["total_cost"]), period="all"))
            db.add(models.Metric(organization_id=org_id, metric_name="gross_margin", metric_value=float(computed_metrics["cost"]["gross_margin"]), period="all"))
            
        # Detect Insights
        insights_engine = InsightsEngine(computed_metrics)
        detected_insights = insights_engine.generate_insights()
        
        # Save insights
        db.query(models.Insight).filter(models.Insight.organization_id == org_id).delete()
        for ins in detected_insights:
            db_ins = models.Insight(
                organization_id=org_id,
                severity=ins["severity"],
                category=ins["category"],
                title=ins["title"],
                description=ins["description"],
                impact=ins["impact"]
            )
            db.add(db_ins)
            
        # Health Score
        health_engine = HealthScoreEngine(computed_metrics)
        health_score_data = health_engine.calculate_score()
        
        # AI Narrative
        ai_narrative = AINarrativeLayer(computed_metrics, detected_insights, health_score_data)
        summary = ai_narrative.generate_executive_summary()
        actions = ai_narrative.generate_action_plan()
        
        # Generate PDF Report
        os.makedirs("reports_pdf", exist_ok=True)
        pdf_path = f"reports_pdf/report_{uploads[0].id}.pdf"
        
        org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
        org_name = org.name if org else "Operon Client"
        
        from .analytics import calculate_advanced_stats
        adv_data = calculate_advanced_stats(org_id, db)
        
        reporting_engine = ReportingEngine(
            organization_name=org_name,
            health_score=health_score_data["overall"],
            summary=summary,
            actions=actions,
            advanced_stats=adv_data
        )
        reporting_engine.generate_pdf(pdf_path)
        
        # Save Report record (only clear unsaved reports to retain previous saved ones)
        db.query(models.Report).filter(models.Report.organization_id == org_id, models.Report.is_saved == False).delete()
        db_report = models.Report(
            organization_id=org_id,
            report_type="Executive COO Audit",
            pdf_url=pdf_path,
            summary=summary,
            health_score=health_score_data["overall"],
            actions=actions,
            is_saved=False
        )
        db.add(db_report)
        
        # Mark all Uploads in the batch as completed
        for upload in uploads:
            upload.status = models.UploadStatus.COMPLETED.value
        db.commit()
        
        # Update organization storage used
        from sqlalchemy import func
        storage_used_sum = db.query(func.sum(models.Upload.file_size)).filter(models.Upload.organization_id == org_id).scalar() or 0.0
        org.storage_used = float(storage_used_sum)
        db.commit()
        
        # Flatten health score keys for test assertion compatibility while keeping categories
        flat_health_score = {
            "overall": health_score_data["overall"],
            "revenue": health_score_data["categories"]["revenue"],
            "costs": health_score_data["categories"]["costs"],
            "customers": health_score_data["categories"]["customers"],
            "products": health_score_data["categories"]["products"],
            "categories": health_score_data["categories"]
        }
        
        return {
            "status": "success",
            "health_score": flat_health_score,
            "summary": summary,
            "actions": actions,
            "report_id": db_report.id
        }
    except Exception as e:
        for upload in uploads:
            upload.status = models.UploadStatus.FAILED.value
        db.commit()
        raise HTTPException(status_code=500, detail=f"Processing batch failed: {str(e)}")
