from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from .. import models, database, schemas
from .organizations import get_current_user
import os
import json
import uuid
import pandas as pd
from pydantic import BaseModel
from typing import Optional, List
from ..engine.metrics import MetricsEngine
from ..engine.health_score import HealthScoreEngine
from ..engine.reporting import ReportingEngine
from ..engine.ai_narrative import AINarrativeLayer
from .analytics import calculate_advanced_stats_for_df


class ReportGenerateRequest(BaseModel):
    query: str


router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/", response_model=list[schemas.ReportResponse])
def get_reports(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    memberships = db.query(models.OrganizationMember).filter(
        models.OrganizationMember.user_id == current_user.id
    ).all()
    org_ids = [m.organization_id for m in memberships]

    reports = db.query(models.Report).filter(
        models.Report.organization_id.in_(org_ids),
        models.Report.is_saved == True
    ).order_by(models.Report.generated_at.desc()).all()
    return reports


@router.get("/{report_id}", response_model=schemas.ReportResponse)
def get_report_details(
    report_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    is_member = db.query(models.OrganizationMember).filter(
        models.OrganizationMember.user_id == current_user.id,
        models.OrganizationMember.organization_id == report.organization_id
    ).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to view this report")

    return report


@router.get("/{report_id}/pdf")
def get_report_pdf(
    report_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    is_member = db.query(models.OrganizationMember).filter(
        models.OrganizationMember.user_id == current_user.id,
        models.OrganizationMember.organization_id == report.organization_id
    ).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to view this report")

    if not report.pdf_url or not os.path.exists(report.pdf_url):
        raise HTTPException(status_code=404, detail="PDF report file not found on server")

    return FileResponse(
        report.pdf_url,
        media_type="application/pdf",
        filename=f"operon_coo_report_{report_id}.pdf"
    )


@router.post("/{report_id}/save")
def save_report(
    report_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    is_member = db.query(models.OrganizationMember).filter(
        models.OrganizationMember.user_id == current_user.id,
        models.OrganizationMember.organization_id == report.organization_id
    ).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to modify this report")

    report.is_saved = True
    db.commit()
    db.refresh(report)
    return {"status": "success", "message": "Report saved to dashboard successfully", "report_id": report.id}


@router.post("/generate", response_model=schemas.ReportResponse)
def generate_custom_report(
    req: ReportGenerateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    # ── 1. Resolve organization ─────────────────────────────────────────
    membership = db.query(models.OrganizationMember).filter(
        models.OrganizationMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=400, detail="User is not associated with any organization")
    org_id = membership.organization_id

    # ── 2. Load full ledger ─────────────────────────────────────────────
    txs = db.query(models.Transaction).filter(
        models.Transaction.organization_id == org_id
    ).all()
    if not txs:
        raise HTTPException(
            status_code=400,
            detail="No ledger data available. Please upload transactional files first."
        )

    df = pd.DataFrame([{
        "id":       tx.id,
        "date":     tx.date,
        "product":  tx.product,
        "customer": tx.customer,
        "revenue":  tx.revenue or 0.0,
        "cost":     tx.cost or 0.0,
        "quantity": tx.quantity or 1.0,
        "location": tx.location
    } for tx in txs])

    # ── 3. Extract scope/filters from the query via OpenAI ──────────────
    api_key = os.getenv("OPENAI_API_KEY", "")
    has_api = bool(api_key and not api_key.startswith("sk-your-openai-api-key"))

    filter_data = {"product": None, "customer": None, "location": None}
    report_title = "COO Operations Audit Report"

    if has_api:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            system_prompt = (
                "You are a senior COO advisor. Extract filter scope and a formal report title "
                "from the user's business query.\n"
                "Output ONLY a JSON object with exactly these two keys:\n"
                "- \"filter\": {\"product\": string|null, \"customer\": string|null, \"location\": string|null}\n"
                "- \"report_title\": a precise, formal corporate report title\n\n"
                "Example:\n"
                "Query: \"Why is revenue declining in seals and gaskets for Client A?\"\n"
                "Output: {\"filter\": {\"product\": \"Seals & Gaskets\", \"customer\": \"Client A\", \"location\": null}, "
                "\"report_title\": \"Revenue Decline Root-Cause Audit: Seals & Gaskets — Client A Account\"}\n\n"
                "Respond ONLY with valid JSON."
            )
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"User query: '{req.query}'"}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            res_json = json.loads(response.choices[0].message.content)
            filter_data  = res_json.get("filter", filter_data)
            report_title = res_json.get("report_title", report_title)
        except Exception as e:
            print(f"OpenAI filter extraction error: {e}")

    # Fallback keyword-based filter extraction
    if not any(filter_data.values()):
        q_lower = req.query.lower()
        if "pump" in q_lower:
            filter_data["product"] = "Industrial Pumps"
            report_title = "Operational Audit: Industrial Pumps Focus"
        elif "seal" in q_lower or "gasket" in q_lower:
            filter_data["product"] = "Seals & Gaskets"
            report_title = "Operational Audit: Seals & Gaskets Leakage Focus"
        elif "kit" in q_lower or "maintenance" in q_lower:
            filter_data["product"] = "Maintenance Kits"
            report_title = "Operational Audit: Maintenance Kits Performance Focus"
        if "client a" in q_lower:
            filter_data["customer"] = "Client A"
        elif "client b" in q_lower:
            filter_data["customer"] = "Client B"

    # ── 4. Apply dataset filters ─────────────────────────────────────────
    fp = filter_data.get("product")
    fc = filter_data.get("customer")
    fl = filter_data.get("location")
    if fp:
        m = df[df["product"].str.contains(fp, case=False, na=False)]
        if not m.empty:
            df = m
    if fc:
        m = df[df["customer"].str.contains(fc, case=False, na=False)]
        if not m.empty:
            df = m
    if fl:
        m = df[df["location"].str.contains(fl, case=False, na=False)]
        if not m.empty:
            df = m

    # ── 5. Compute metrics & health score ────────────────────────────────
    metrics_eng      = MetricsEngine(df)
    computed_metrics = metrics_eng.calculate_all()

    health_score_detail = {"overall": 75.0, "categories": {}}
    health_score        = 75.0
    if computed_metrics:
        health_eng          = HealthScoreEngine(computed_metrics)
        health_score_detail = health_eng.calculate_score()
        health_score        = health_score_detail.get("overall", 75.0)

    # ── 6. Advanced statistical analytics ────────────────────────────────
    stats = calculate_advanced_stats_for_df(df)

    # ── 7. AI Narrative generation ───────────────────────────────────────
    insights = computed_metrics.get("insights", []) if computed_metrics else []
    narrative = AINarrativeLayer(
        metrics=computed_metrics or {},
        insights=insights,
        health_score=health_score_detail,
        advanced_stats=stats
    )
    summary     = narrative.generate_executive_summary()
    pain_points = narrative.generate_pain_points()
    actions     = narrative.generate_action_plan()
    conclusions = narrative.generate_conclusions()

    # ── 8. Generate PDF ──────────────────────────────────────────────────
    os.makedirs("reports_pdf", exist_ok=True)
    report_uuid = uuid.uuid4().hex
    pdf_path    = f"reports_pdf/report_custom_{report_uuid}.pdf"

    org      = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    org_name = org.name if org else "Operon Client"

    engine = ReportingEngine(
        organization_name=org_name,
        health_score=health_score,
        summary=summary,
        actions=actions,
        report_title=report_title,
        pain_points=pain_points,
        conclusions=conclusions,
        advanced_stats=stats,
        health_score_detail=health_score_detail,
        metrics=computed_metrics or {},
        query=req.query
    )
    engine.generate_pdf(pdf_path)

    # ── 9. Persist report record ─────────────────────────────────────────
    db_report = models.Report(
        organization_id=org_id,
        report_type="Dynamic Custom COO Audit",
        pdf_url=pdf_path,
        summary=(summary[:500] if summary else ""),
        health_score=health_score,
        actions=actions,
        is_saved=True
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report
