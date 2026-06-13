from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, database
from .organizations import get_current_user
from datetime import datetime
import pandas as pd
import numpy as np

router = APIRouter(prefix="/analytics", tags=["analytics"])

def calculate_advanced_stats_for_df(df: pd.DataFrame):
    if df.empty or len(df) < 3:
        return {
            "monthly_trend": [],
            "forecast_trend": [],
            "correlations": {},
            "anomalies": [],
            "kpis": {}
        }
        
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df["month_str"] = df["date"].dt.strftime("%b")
    df["month_year"] = df["date"].dt.strftime("%Y-%m")
    
    # 1. Correct Monthly grouping (aggregates by month)
    monthly = df.groupby("month_year").agg({"revenue": "sum", "cost": "sum"}).reset_index().sort_values("month_year")
    monthly["name"] = pd.to_datetime(monthly["month_year"] + "-01").dt.strftime("%b")
    
    monthly_trend = [
        { "name": row["name"], "revenue": round(row["revenue"], 2), "cost": round(row["cost"], 2), "isForecast": False }
        for _, row in monthly.iterrows()
    ]
    
    # 2. Linear Regression monthly forecasts (6 months ahead)
    forecast_trend = []
    if len(monthly) >= 2:
        x = np.arange(len(monthly))
        rev_y = monthly["revenue"].values
        cost_y = monthly["cost"].values
        
        rev_slope, rev_intercept = np.polyfit(x, rev_y, 1)
        cost_slope, cost_intercept = np.polyfit(x, cost_y, 1)
        
        last_x = len(monthly) - 1
        last_month_str = monthly["month_year"].iloc[-1]
        
        for i in range(1, 7):
            proj_x = last_x + i
            proj_rev = max(0.0, float(rev_slope * proj_x + rev_intercept))
            proj_cost = max(0.0, float(cost_slope * proj_x + cost_intercept))
            
            try:
                last_month_dt = pd.to_datetime(last_month_str + "-01")
                proj_month_dt = last_month_dt + pd.DateOffset(months=i)
                proj_month_name = proj_month_dt.strftime("%b") + " (Proj)"
                proj_month_year = proj_month_dt.strftime("%Y-%m")
            except Exception:
                proj_month_name = f"Period +{i} (Proj)"
                proj_month_year = f"FC+{i}"
                
            forecast_trend.append({
                "name": proj_month_name,
                "revenue": round(proj_rev, 2),
                "cost": round(proj_cost, 2),
                "isForecast": True
            })
            
    # 3. Pearson Correlation Coefficients
    correlations = {}
    if len(df) >= 3:
        df["profit"] = df["revenue"] - df["cost"]
        df["unit_price"] = df["revenue"] / df["quantity"]
        df["unit_price"] = df["unit_price"].replace([np.inf, -np.inf], np.nan).fillna(0.0)
        
        try:
            qty_rev = df["quantity"].corr(df["revenue"])
            price_qty = df["unit_price"].corr(df["quantity"])
            cost_rev = df["cost"].corr(df["revenue"])
            rev_profit = df["revenue"].corr(df["profit"])
            
            correlations = {
                "qty_rev": 0.0 if np.isnan(qty_rev) else round(float(qty_rev), 2),
                "price_qty": 0.0 if np.isnan(price_qty) else round(float(price_qty), 2),
                "cost_rev": 0.0 if np.isnan(cost_rev) else round(float(cost_rev), 2),
                "rev_profit": 0.0 if np.isnan(rev_profit) else round(float(rev_profit), 2),
            }
        except Exception:
            correlations = {
                "qty_rev": 0.0,
                "price_qty": 0.0,
                "cost_rev": 0.0,
                "rev_profit": 0.0
            }
            
    # 4. Z-Score Outlier & Abnormality Detection
    anomalies = []
    
    # 4.1 Cost Ratio Spikes
    df["cost_ratio"] = df["cost"] / df["revenue"]
    df["cost_ratio"] = df["cost_ratio"].replace([np.inf, -np.inf], np.nan).fillna(0.0)
    
    if len(df) >= 5:
        mean_ratio = df["cost_ratio"].mean()
        std_ratio = df["cost_ratio"].std()
        if std_ratio > 0.001:
            outliers = df[df["cost_ratio"] > mean_ratio + 1.8 * std_ratio].sort_values("cost_ratio", ascending=False)
            for idx, row in outliers.head(3).iterrows():
                impact = max(0.0, row["cost"] - row["revenue"])
                if impact == 0.0:
                    impact = row["cost"] * 0.25
                anomalies.append({
                    "id": f"anomaly-cost-{idx}",
                    "type": "cost_ratio",
                    "title": f"Cost Ratio Outlier: {row['product']}",
                    "description": f"Cost-to-revenue ratio spiked to {row['cost_ratio']:.2f}x (Avg: {mean_ratio:.2f}x) for customer '{row['customer']}'.",
                    "severity": "critical" if row["cost"] > row["revenue"] else "high",
                    "impact": round(impact, 2),
                    "date": row["date"].strftime("%Y-%m-%d"),
                    "customer": row["customer"],
                    "product": row["product"]
                })
                
    # Direct Loss-makers
    loss_txs = df[df["cost"] > df["revenue"]].sort_values("cost", ascending=False)
    for idx, row in loss_txs.head(3).iterrows():
        exists = any(a["product"] == row["product"] and a["customer"] == row["customer"] and a["date"] == row["date"].strftime("%Y-%m-%d") for a in anomalies)
        if not exists:
            anomalies.append({
                "id": f"anomaly-loss-{idx}",
                "type": "loss_making",
                "title": f"Direct Ledger Loss: {row['product']}",
                "description": f"Transaction resulted in negative margin: Revenue=${row['revenue']:.2f} vs Cost=${row['cost']:.2f} (Loss: -${(row['cost'] - row['revenue']):.2f}).",
                "severity": "critical",
                "impact": round(row["cost"] - row["revenue"], 2),
                "date": row["date"].strftime("%Y-%m-%d"),
                "customer": row["customer"],
                "product": row["product"]
            })
            
    # 4.2 Product Unit Price drifts (discounting/contract drifts)
    for prod in df["product"].unique():
        prod_df = df[df["product"] == prod]
        if len(prod_df) >= 4:
            mean_price = prod_df["unit_price"].mean()
            std_price = prod_df["unit_price"].std()
            if std_price > 0.01:
                price_outliers = prod_df[np.abs(prod_df["unit_price"] - mean_price) > 1.8 * std_price]
                for idx, row in price_outliers.head(2).iterrows():
                    diff = abs(row["unit_price"] - mean_price)
                    anomalies.append({
                        "id": f"anomaly-price-{idx}",
                        "type": "price_drift",
                        "title": f"Unit Price Abnormality: {row['product']}",
                        "description": f"Unit price transacted at ${row['unit_price']:.2f} (Expected: ${mean_price:.2f} ± {std_price:.2f}). Possible invoice error or custom discount.",
                        "severity": "medium",
                        "impact": round(diff * row["quantity"], 2),
                        "date": row["date"].strftime("%Y-%m-%d"),
                        "customer": row["customer"],
                        "product": row["product"]
                    })
                    
    # 4.3 Customer MoM revenue drops
    cust_monthly = df.groupby(["customer", "month_year"])["revenue"].sum().reset_index().sort_values(["customer", "month_year"])
    for cust in cust_monthly["customer"].unique():
        cust_df = cust_monthly[cust_monthly["customer"] == cust]
        if len(cust_df) >= 3:
            cust_df = cust_df.copy()
            cust_df["pct_change"] = cust_df["revenue"].pct_change()
            cust_df = cust_df.dropna()
            mean_change = cust_df["pct_change"].mean()
            std_change = cust_df["pct_change"].std()
            if std_change > 0.01:
                drops = cust_df[cust_df["pct_change"] < mean_change - 1.8 * std_change]
                for _, row in drops.head(2).iterrows():
                    prev_idx = cust_monthly[(cust_monthly["customer"] == cust) & (cust_monthly["month_year"] < row["month_year"])].index
                    prev_rev = cust_monthly.loc[prev_idx[-1]]["revenue"] if len(prev_idx) > 0 else row["revenue"]
                    loss_impact = max(0.0, prev_rev - row["revenue"])
                    anomalies.append({
                        "id": f"anomaly-cust-drop-{row['customer']}-{row['month_year']}",
                        "type": "customer_drop",
                        "title": f"Abnormal Billing Drop: {row['customer']}",
                        "description": f"Monthly revenue from customer '{row['customer']}' fell by {abs(row['pct_change'])*100:.1f}% month-over-month to ${row['revenue']:.2f} (Previous: ${prev_rev:.2f}).",
                        "severity": "high" if loss_impact > 10000 else "medium",
                        "impact": round(loss_impact, 2),
                        "date": row["month_year"] + "-01",
                        "customer": row["customer"],
                        "product": "All Portfolio"
                    })
                    
    # 5. Core KPIs
    kpis = {}
    if not df.empty:
        total_rev = df["revenue"].sum()
        unique_customers = df["customer"].nunique()
        customer_shares = df.groupby("customer")["revenue"].sum() / total_rev if total_rev > 0 else pd.Series(dtype=float)
        hhi = float((customer_shares ** 2).sum()) if not customer_shares.empty else 0.0
        
        aov = float(df["revenue"].mean()) if len(df) > 0 else 0.0
        total_leakage = sum(a["impact"] for a in anomalies if a["severity"] in ["critical", "high"])
        leakage_ratio = float(total_leakage / total_rev) if total_rev > 0 else 0.0
        
        kpis = {
            "aov": round(aov, 2),
            "hhi_dependency": round(hhi, 3),
            "cost_leakage_ratio": round(leakage_ratio, 3)
        }
        
    return {
        "monthly_trend": monthly_trend,
        "forecast_trend": forecast_trend,
        "correlations": correlations,
        "anomalies": anomalies,
        "kpis": kpis
    }

def calculate_advanced_stats(org_id: int, db: Session):
    txs = db.query(models.Transaction).filter(models.Transaction.organization_id == org_id).all()
    if not txs or len(txs) < 3:
        return None
        
    df = pd.DataFrame([{
        "id": tx.id,
        "date": tx.date,
        "product": tx.product,
        "customer": tx.customer,
        "revenue": tx.revenue or 0.0,
        "cost": tx.cost or 0.0,
        "quantity": tx.quantity or 1.0,
        "location": tx.location
    } for tx in txs])
    
    return calculate_advanced_stats_for_df(df)

@router.get("/overview")
def get_overview(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    membership = db.query(models.OrganizationMember).filter(models.OrganizationMember.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=400, detail="User is not associated with any organization")
    org_id = membership.organization_id
    
    report = db.query(models.Report).filter(models.Report.organization_id == org_id).order_by(models.Report.generated_at.desc()).first()
    insights = db.query(models.Insight).filter(models.Insight.organization_id == org_id).all()
    uploads = db.query(models.Upload).filter(models.Upload.organization_id == org_id).order_by(models.Upload.uploaded_at.desc()).all()
    
    # Calculate health score breakdown based on metrics
    metrics = db.query(models.Metric).filter(models.Metric.organization_id == org_id).all()
    metrics_dict = {m.metric_name: m.metric_value for m in metrics}
    
    # Build a nice response
    health_breakdown = {
        "overall": report.health_score if report else 0,
        "revenue": round(min(max(12.5 + (metrics_dict.get("revenue_growth", 0) * 25), 0), 25) * 4, 1) if metrics_dict else 0,
        "customers": round(min(max(25 - (metrics_dict.get("top_customer_concentration", 0) * 25), 0), 25) * 4, 1) if metrics_dict else 0,
        "products": 80.0 if metrics_dict else 0,  # static placeholder diversity
        "costs": round(min(max((metrics_dict.get("gross_margin", 0) / 0.4) * 25, 0), 25) * 4, 1) if metrics_dict else 0,
    }
    
    return {
        "health_score": health_breakdown,
        "summary": report.summary if report else "Welcome to Operon, your operations copilot. Please upload your transaction files in the 'Upload Data' tab to begin automated profit leakage and P&L analysis.",
        "actions": report.actions if report else [
            "Upload sales, revenue, or cost Excel/CSV spreadsheets.",
            "Run automated schema detection and confirm mappings.",
            "Review operations executive recommendations and audits."
        ],
        "insights": [
            {
                "severity": ins.severity,
                "category": ins.category,
                "title": ins.title,
                "description": ins.description,
                "impact": ins.impact
            } for ins in insights
        ] if insights else [
            {
                "severity": "low",
                "category": "system",
                "title": "Awaiting Data Ingestion",
                "description": "No operational transaction data has been normalized yet.",
                "impact": "Operon Operations Engine is currently operating on idle mode."
            }
        ],
        "uploads": [
            {
                "name": up.filename,
                "status": up.status,
                "date": up.uploaded_at.strftime("%Y-%m-%d %H:%M")
            } for up in uploads
        ]
    }

@router.get("/metrics")
def get_metrics_data(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    membership = db.query(models.OrganizationMember).filter(models.OrganizationMember.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=400, detail="User is not associated with any organization")
    org_id = membership.organization_id
    
    txs = db.query(models.Transaction).filter(models.Transaction.organization_id == org_id).all()
    if not txs:
        # Return default mock values if no transactions are uploaded yet (for clean dashboard experience)
        return {
            "monthly_trend": [
                { "name": "Jan", "revenue": 42000, "cost": 28000, "isForecast": False },
                { "name": "Feb", "revenue": 45000, "cost": 29000, "isForecast": False },
                { "name": "Mar", "revenue": 58000, "cost": 34000, "isForecast": False },
                { "name": "Apr", "revenue": 62000, "cost": 38000, "isForecast": False },
                { "name": "May", "revenue": 54000, "cost": 33000, "isForecast": False },
                { "name": "Jun", "revenue": 48000, "cost": 31000, "isForecast": False },
            ],
            "forecast_trend": [
                { "name": "Jul (Proj)", "revenue": 51000, "cost": 32000, "isForecast": True },
                { "name": "Aug (Proj)", "revenue": 53500, "cost": 33200, "isForecast": True },
                { "name": "Sep (Proj)", "revenue": 56000, "cost": 34500, "isForecast": True },
                { "name": "Oct (Proj)", "revenue": 58200, "cost": 35600, "isForecast": True },
                { "name": "Nov (Proj)", "revenue": 61000, "cost": 37000, "isForecast": True },
                { "name": "Dec (Proj)", "revenue": 63400, "cost": 38100, "isForecast": True },
            ],
            "product_distribution": [
                { "name": "Industrial Pumps", "value": 45 },
                { "name": "Seals & Gaskets", "value": 25 },
                { "name": "Maintenance Kits", "value": 20 },
                { "name": "Other", "value": 10 },
            ],
            "period_performance": [
                { "month": "Jun 2026", "rev": "$48,290", "growth": "-12%", "margin": "35%", "status": "Warning" },
                { "month": "May 2026", "rev": "$54,100", "growth": "-8%", "margin": "38%", "status": "Stable" },
                { "month": "Apr 2026", "rev": "$62,400", "growth": "+14%", "margin": "42%", "status": "Peak" },
                { "month": "Mar 2026", "rev": "$58,000", "growth": "+22%", "margin": "40%", "status": "Healthy" },
            ],
            "correlations": {
                "qty_rev": 0.85,
                "price_qty": -0.65,
                "cost_rev": 0.90,
                "rev_profit": 0.72
            },
            "anomalies": [
                {
                    "id": "mock-anomaly-1",
                    "type": "cost_ratio",
                    "title": "Cost Ratio Outlier: Seals & Gaskets",
                    "description": "Cost-to-revenue ratio spiked to 1.82x (Avg: 0.62x) for customer 'Client B' on 2026-05-15.",
                    "severity": "high",
                    "impact": 8400,
                    "date": "2026-05-15",
                    "customer": "Client B",
                    "product": "Seals & Gaskets"
                },
                {
                    "id": "mock-anomaly-2",
                    "type": "price_drift",
                    "title": "Unit Price Abnormality: Industrial Pumps",
                    "description": "Industrial Pumps unit price transacted at $15,000 (Expected: $11,000). Potential contract billing drift.",
                    "severity": "medium",
                    "impact": 4000,
                    "date": "2026-06-01",
                    "customer": "Client A",
                    "product": "Industrial Pumps"
                }
            ],
            "kpis": {
                "aov": 3450.0,
                "hhi_dependency": 0.58,
                "cost_leakage_ratio": 0.18
            }
        }
        
    # Build dataframe
    df = pd.DataFrame([{
        "date": tx.date,
        "product": tx.product,
        "revenue": tx.revenue,
        "cost": tx.cost
    } for tx in txs])
    df["date"] = pd.to_datetime(df["date"])
    df["month_str"] = df["date"].dt.strftime("%b")
    df["month_year"] = df["date"].dt.strftime("%b %Y")
    
    # Calculate advanced stats using our unified function
    adv_data = calculate_advanced_stats(org_id, db)
    
    # Product distribution
    product_rev = df.groupby("product")["revenue"].sum().reset_index()
    total_rev = product_rev["revenue"].sum()
    product_rev["share"] = (product_rev["revenue"] / total_rev * 100).round(1) if total_rev > 0 else 0
    product_rev = product_rev.sort_values("share", ascending=False)
    
    product_distribution = [
        { "name": row["product"], "value": float(row["share"]) }
        for _, row in product_rev.iterrows()
    ]
    
    # Period performance
    perf = df.groupby(["date", "month_year"]).agg({"revenue": "sum", "cost": "sum"}).reset_index().sort_values("date", ascending=False)
    # Correct group-by for monthly performance sorting
    df_perf = df.copy()
    df_perf["month_dt"] = df_perf["date"].dt.to_period("M")
    perf_monthly = df_perf.groupby("month_dt").agg({"revenue": "sum", "cost": "sum"}).reset_index().sort_values("month_dt", ascending=False)
    
    period_performance = []
    for idx, row in perf_monthly.iterrows():
        rev_val = row["revenue"]
        cost_val = row["cost"]
        margin = round((rev_val - cost_val) / rev_val * 100, 1) if rev_val > 0 else 0
        
        # Calculate growth
        growth_str = "0%"
        # Find next row in sorted dataframe
        current_loc = perf_monthly.index.get_loc(idx)
        if current_loc + 1 < len(perf_monthly):
            prev_rev = perf_monthly.iloc[current_loc + 1]["revenue"]
            if prev_rev > 0:
                growth_pct = round((rev_val - prev_rev) / prev_rev * 100, 1)
                growth_str = f"+{growth_pct}%" if growth_pct >= 0 else f"{growth_pct}%"
                
        status = "Healthy"
        if margin < 25:
            status = "Warning"
        elif margin > 40:
            status = "Peak"
        elif growth_str.startswith("-"):
            status = "Stable"
            
        month_name = pd.to_datetime(str(row["month_dt"]) + "-01").strftime("%b %Y")
        period_performance.append({
            "month": month_name,
            "rev": f"${round(rev_val, 2):,}",
            "growth": growth_str,
            "margin": f"{margin}%",
            "status": status
        })
        
    return {
        "monthly_trend": adv_data["monthly_trend"] if adv_data else [],
        "forecast_trend": adv_data["forecast_trend"] if adv_data else [],
        "product_distribution": product_distribution,
        "period_performance": period_performance,
        "correlations": adv_data["correlations"] if adv_data else {},
        "anomalies": adv_data["anomalies"] if adv_data else [],
        "kpis": adv_data["kpis"] if adv_data else {}
    }

