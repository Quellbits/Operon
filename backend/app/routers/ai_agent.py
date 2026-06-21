from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from sqlalchemy.orm import Session
from .. import models, database
from jose import jwt
from .auth import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/ai", tags=["ai-agent"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

ARIA_SYSTEM_PROMPT = """You are ARIA (Automated Revenue & Intelligence Analyst), Operon's embedded senior operations analyst AI.

You have deep, executive-level expertise in:
- P&L analysis and revenue cycle management
- Cost leakage detection and containment
- Vendor contract drift and procurement anomalies  
- Operational KPI benchmarking and health scoring
- Cash flow optimization and working capital efficiency
- Customer churn risk and revenue concentration analysis
- Inventory and supply chain cost inefficiencies
- Time-series linear regression forecasting, Pearson correlation modeling, and Z-score outlier detection

Your communication style:
- Concise, structured, and data-driven
- Use bullet points and numbered lists for clarity
- Reference specific numbers and percentages from the context when available
- Lead with the most critical finding or answer
- Suggest concrete, actionable next steps
- Use operational/financial terminology appropriately (e.g. "COGS creep", "DSO deterioration", "margin compression", "regression slope", "Pearson correlation", "Z-score outlier")
- Avoid vague statements — be specific and quantified

When business context data is provided to you, analyze it thoroughly and reference actual figures.
When no data is available, provide general operational best practice guidance.

Always end complex analyses with a prioritized "RECOMMENDED ACTIONS" section.

--- ADVANCED PREDICTIVE & ANOMALY ANALYSIS ---
When the business context block includes "ADVANCED DATA SCIENCE & FORECASTING CONTEXT", you have access to precise statistical computations (next 6-month linear regression projections, Z-score ledger outliers, Pearson correlations, and high-level KPIs). Use these figures to explain performance, highlight abnormalities, and trace correlations. Relate different factors:
- Relate Quantity-to-Revenue and Price Elasticity (Price to Quantity Pearson correlation): explain how unit price shifts correlate with transaction volumes, showing how elastic customer demand is to pricing changes.
- Relate Cost-to-Revenue and Revenue-to-Profit correlations to explain how cost creep or margin stability affects operational profitability.
- Trace Z-score outliers (> 1.8 standard deviations) in cost ratios, product pricing drifts, and monthly customer billing drops. Explain their operational cause, financial impact, and suggest steps to resolve them.
- When referring to a specific anomaly (e.g., "Cost Ratio Outlier: Seals & Gaskets"), append the command [CMD:HIGHLIGHT_ANOMALY="AnomalyTitle"] to focus the dashboard on that specific anomaly node. Do not hallucinate calculations; strictly reference the pre-computed metrics.

--- INTERACTIVE DASHBOARD REAL-TIME CONTROLS ---
You can manipulate the user's dashboard simulation state in real time by outputting command blocks. When a user asks you to modify thresholds, filter products, run hypothetical scenarios, mitigate leakages, or focus on specific risk categories, append the appropriate command block(s) to your response. The dashboard will intercept these commands, adjust the UI controls, highlight cards, and run multi-factor simulation calculations in real time.

You MUST use the exact syntax: [CMD:COMMAND_NAME=VALUE] (with no spaces inside the bracket, except inside double quotes for string values).
Available Commands:
- [CMD:SET_MARGIN=X] : Sets target pricing/margin slider to X (X: 0 to 100). E.g. [CMD:SET_MARGIN=55]
- [CMD:SET_COST_COMPRESSION=X] : Sets cost compression factor slider to X% (X: 0 to 100). E.g. [CMD:SET_COST_COMPRESSION=20]
- [CMD:SET_REVENUE_EXPANSION=X] : Sets revenue growth factor slider to X% (X: -50 to 100). E.g. [CMD:SET_REVENUE_EXPANSION=10]
- [CMD:SET_LEAKAGE_TOLERANCE=X] : Sets leakage tolerance threshold slider to $X (X: 0 to 50000). E.g. [CMD:SET_LEAKAGE_TOLERANCE=15000]
- [CMD:SET_SUCCESS_INVESTMENT=X] : Sets customer/user success investment budget to $X (X: 0 to 10000) to mitigate churn risk. E.g. [CMD:SET_SUCCESS_INVESTMENT=4500]
- [CMD:SET_TOP_CUSTOMER_LOSS=X] : Simulates percentage loss of top customer/signature category (X: 0 to 100) to stress test revenue concentration. E.g. [CMD:SET_TOP_CUSTOMER_LOSS=30]
- [CMD:SET_SHIPPING_CONSOLIDATION=X] : Sets freight/optimization consolidation factor to X% (X: 0 to 50). E.g. [CMD:SET_SHIPPING_CONSOLIDATION=15]
- [CMD:FILTER_PRODUCT="ProductCategory"] : Filters metrics to "ProductCategory" (exact category string, e.g. "Industrial Pumps", "Seals & Gaskets", or "ALL" to clear). E.g. [CMD:FILTER_PRODUCT="Industrial Pumps"]
- [CMD:SET_FOCUS_TOPIC="Topic"] : Focuses and highlights a dashboard card or section (Topic can be: "REVENUE", "COSTS", "CUSTOMERS", "CONCENTRATION", "SHIPPING", or "NONE"). E.g. [CMD:SET_FOCUS_TOPIC="CONCENTRATION"]
- [CMD:HIGHLIGHT_ANOMALY="AnomalyTitle"] : Highlights a specific Z-score anomaly node/card. E.g. [CMD:HIGHLIGHT_ANOMALY="Cost Ratio Outlier: Seals & Gaskets"]
- [CMD:RESOLVE_ALL_LEAKAGES=true] : Simulates resolving all active profit leakages (true or false). E.g. [CMD:RESOLVE_ALL_LEAKAGES=true]
- [CMD:RESET_SIMULATION=true] : Resets all simulation parameters back to their baseline defaults. E.g. [CMD:RESET_SIMULATION=true]

--- STRICT DELEGATION OF MATHEMATICAL OPERATIONS ---
You must NEVER attempt to perform mathematical calculations, arithmetic operations, trends, or hypothetical simulations yourself. All calculations (e.g., linear regression forecasts, Z-score outliers, Pearson correlations, and simulation health scores) are performed programmatically in Python on the backend or in the React core. 
Your role is strictly to interpret, analyze, and decide based on the results of these mathematical operations:
1. If the user asks a hypothetical "what if" question (e.g., "What if we increase cost compression to 30%?"), DO NOT calculate or guess the scores yourself. Instead, output the corresponding command block (e.g., [CMD:SET_COST_COMPRESSION=30]). Explain to the user that the console will update in real time to calculate the exact numbers, and that you will analyze the result once computed.
2. Rely entirely on the pre-computed metrics provided in "LIVE BUSINESS CONTEXT DATA" or "ADVANCED DATA SCIENCE & FORECASTING CONTEXT". Never try to extrapolate, multiply, or sum values in your text. If a number is not in the context, state that it is not available.

--- INDUSTRY-SPECIFIC ADAPTIVE PROFILES ---
The dashboard automatically adapts all KPI labels, headers, sliders, math models, and stress widgets based on the classification of the uploaded transaction data. Align your analysis style, terminology, and recommendations to the active profile:
1. GENERAL (Default Operations): KPIs: Gross Margin, Costs Index, Customer concentration. Terminology: COGS compression, success budgets.
2. RESTAURANT: KPIs: Rest Health, Ticket Sales, Food Cost Index, Guest Satisfaction, Menu Diversity. Terminology: Menu Price Markups, Labor Hours Compression, Spoilage waste, Ingredient Quality.
3. LOGISTICS: KPIs: Fleet Health, Billing Rates, Fuel & Maint, On-Time Delivery (OTD), Route Coverage. Terminology: Fuel Surcharge, fleet maintenance optimization, Hub-and-Spoke consolidation, Driver retention.
4. ECOMMERCE: KPIs: E-Comm Index, AOV, Cart Abandonment, Return Rate. Terminology: acquisition budgets, discount rates, warehouse bottlenecks, CPC inflation.
5. SAAS: KPIs: SaaS Health, MRR, Net Retention (NRR), Trial Conversion, User Churn %. Terminology: Subscription pricing, sales commissions, server/infrastructure overhead, R&D Ratios.
6. HEALTHCARE: KPIs: Clinic Health, Patient Billing, Patient Satisfaction, Bed/Equipment Utilization, Understaffing Index. Terminology: Consultation fees, scheduling optimization, nurse staffing compression, telehealth.

Examples:
- User: "Simulate a cost reduction of 15% and set margin to 60"
  Response: "Adjusting variables: cost compression to 15% and target gross margin to 60%. [CMD:SET_COST_COMPRESSION=15] [CMD:SET_MARGIN=60]"
- User: "What happens if we lose 40% of our top customer?"
  Response: "Simulating a 40% reduction in top customer volume to stress test our dependency. [CMD:SET_TOP_CUSTOMER_LOSS=40] [CMD:SET_FOCUS_TOPIC="CONCENTRATION"]"
- User: "Focus on freight leakages and set shipping consolidation to 20%"
  Response: "Focusing on freight logs and setting shipping consolidation to 20%. [CMD:SET_SHIPPING_CONSOLIDATION=20] [CMD:SET_FOCUS_TOPIC="SHIPPING"]"
- User: "Reset all parameters"
  Response: "Resetting the operations console parameters. [CMD:RESET_SIMULATION=true]"

Keep commands clean so the dashboard parsing engine can execute them seamlessly. Always append them to the end of your response."""


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[dict] = None
    mode: Optional[str] = "dashboard"  # "dashboard" or "report"


def build_context_block(context: Optional[dict], mode: str) -> str:
    if not context:
        return ""
    
    lines = ["\n\n--- LIVE BUSINESS CONTEXT DATA ---"]
    
    # Check if we have the advanced interactive simulation context
    if "marginTarget" in context:
        lines.append("ACTIVE SIMULATION PARAMETERS:")
        lines.append(f"  - Target Gross Margin: {context.get('marginTarget')}%")
        lines.append(f"  - Cost Compression: {context.get('costCompression')}%")
        lines.append(f"  - Revenue Expansion: {context.get('revenueExpansion')}%")
        lines.append(f"  - Leakage Tolerance: ${context.get('leakageTolerance'):,}")
        lines.append(f"  - CS Success Investment: ${context.get('customerSuccessInvestment'):,}")
        lines.append(f"  - Shipping Consolidation: {context.get('shippingConsolidation')}%")
        lines.append(f"  - Top customer loss stress: {context.get('topCustomerLossPct')}%")
        lines.append(f"  - Product Filter: {context.get('productFilter')}")
        lines.append(f"  - Resolution Override: {context.get('resolveAll')}")
        
        lines.append("CALCULATED SIMULATION OUTCOMES (DETERMINISTIC MATH):")
        lines.append(f"  - Simulated Overall Health Score: {context.get('simulatedOverallScore')}/100")
        lines.append(f"  - Simulated Revenue Score: {context.get('simulatedRevenueScore')}/100")
        lines.append(f"  - Simulated Costs Score: {context.get('simulatedCostsScore')}/100")
        lines.append(f"  - Simulated Customer Satisfaction Score: {context.get('simulatedCustomersScore')}/100")
        lines.append(f"  - Total Active Leakage: ${context.get('totalLeakageAmount'):,}")
        lines.append(f"  - Mitigated/Recovered Leakage: ${context.get('mitigatedLeakageAmount'):,}")
        lines.append(f"  - Remaining Leakages Count: {context.get('activeLeakagesCount')}")
        lines.append(f"  - Simulated Monthly Revenue: ${context.get('totalSimulatedRevenue'):,}")
        lines.append(f"  - Simulated Monthly Cost: ${context.get('totalSimulatedCost'):,}")
        lines.append(f"  - Simulated Gross Margin: {context.get('simulatedGrossMargin')}%")
        lines.append(f"  - Simulated Net Profit: ${max(0.0, float(context.get('totalSimulatedRevenue', 0) - context.get('totalSimulatedCost', 0))):,}")
    
    else:
        # Fallback to standard context properties
        if "health_score" in context:
            hs = context["health_score"]
            if isinstance(hs, dict):
                lines.append(f"Health Scores: Overall={hs.get('overall')}/100 | Revenue={hs.get('revenue')}/100 | Customers={hs.get('customers')}/100 | Costs={hs.get('costs')}/100")
        
        if "summary" in context:
            lines.append(f"Executive Summary: {context['summary']}")
        
        if "insights" in context:
            lines.append("Active Insights:")
            for i in context["insights"][:5]:
                lines.append(f"  [{i.get('severity','').upper()}] {i.get('title')}: {i.get('description')} (Impact: {i.get('impact')})")
        
        if "actions" in context:
            lines.append("Recommended Actions from System:")
            for idx, a in enumerate(context["actions"][:4], 1):
                lines.append(f"  {idx}. {a}")

    if "report_data" in context:
        lines.append(f"Report Data: {json.dumps(context['report_data'])[:2000]}")

    lines.append("--- END CONTEXT ---")
    return "\n".join(lines)


async def stream_openai_response(
    messages_payload: list,
    custom_api_key: Optional[str] = None,
    custom_base_url: Optional[str] = None,
    custom_model_name: Optional[str] = None
):
    """Stream tokens from OpenAI or custom LLM endpoint."""
    try:
        from openai import AsyncOpenAI
        
        # Determine API key, base URL, and model name
        api_key = custom_api_key.strip() if custom_api_key else ""
        if not api_key:
            api_key = os.getenv("OPENAI_API_KEY", "")
            
        base_url = custom_base_url.strip() if custom_base_url else None
        model = custom_model_name.strip() if custom_model_name else "gpt-4o"
        
        client_kwargs = {}
        if api_key:
            client_kwargs["api_key"] = api_key
        if base_url:
            client_kwargs["base_url"] = base_url
            
        client = AsyncOpenAI(**client_kwargs)

        stream = await client.chat.completions.create(
            model=model,
            messages=messages_payload,
            stream=True,
            max_tokens=1024,
            temperature=0.4,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                # SSE format: data: <token>\n\n
                yield f"data: {json.dumps({'token': delta.content})}\n\n"

        yield "data: [DONE]\n\n"

    except ImportError:
        yield f"data: {json.dumps({'error': 'OpenAI package not installed.'})}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as e:
        error_msg = str(e)
        if "api_key" in error_msg.lower() or "authentication" in error_msg.lower() or "invalid" in error_msg.lower():
            yield f"data: {json.dumps({'error': 'Invalid API Key or authentication error. Please verify your credentials in System Settings.'})}\n\n"
        else:
            yield f"data: {json.dumps({'error': f'AI service error: {error_msg[:200]}'})}\n\n"
        yield "data: [DONE]\n\n"


def get_current_user_from_token(token: str, db: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return db.query(models.User).filter(models.User.email == email).first()
    except Exception:
        return None

def calculate_advanced_data_context(org_id: int, db: Session) -> str:
    """Perform advanced statistical analysis: linear regressions, correlations, and z-score anomaly detections."""
    try:
        from .analytics import calculate_advanced_stats
        stats = calculate_advanced_stats(org_id, db)
        if not stats:
            return ""
            
        projections = []
        for p in stats.get("forecast_trend", []):
            proj_margin = ((p["revenue"] - p["cost"]) / p["revenue"] * 100) if p["revenue"] > 0 else 0.0
            projections.append(f"  - {p['name']}: Projected Revenue=${p['revenue']:,.2f} | Projected Cost=${p['cost']:,.2f} | Margin={proj_margin:.1f}%")
            
        anomalies = []
        for a in stats.get("anomalies", []):
            if a["type"] == "cost_ratio":
                anomalies.append(f"  - [COST-RATIO OUTLIER] Date={a['date']} | Customer={a['customer']} | Product={a['product']} | Impact=${a['impact']:.2f} | Details: {a['description']}")
            elif a["type"] == "loss_making":
                anomalies.append(f"  - [LOSS-MAKING ANOMALY] Date={a['date']} | Customer={a['customer']} | Product={a['product']} | Impact=${a['impact']:.2f} | Details: {a['description']}")
            elif a["type"] == "price_drift":
                anomalies.append(f"  - [PRICE-DRIFT OUTLIER] Date={a['date']} | Customer={a['customer']} | Product={a['product']} | Est. Leakage=${a['impact']:.2f} | Details: {a['description']}")
            elif a["type"] == "customer_drop":
                anomalies.append(f"  - [CUSTOMER-MoM-DROP] Date={a['date']} | Customer={a['customer']} | Revenue Drop=${a['impact']:.2f} | Details: {a['description']}")
                
        correlations = []
        c = stats.get("correlations", {})
        if c:
            correlations.append(f"  - Quantity to Revenue Pearson correlation: {c.get('qty_rev', 0):.2f}")
            correlations.append(f"  - Price to Quantity (Elasticity) Pearson correlation: {c.get('price_qty', 0):.2f}")
            correlations.append(f"  - Supplier Cost to Customer Revenue Pearson correlation: {c.get('cost_rev', 0):.2f}")
            correlations.append(f"  - Revenue to Gross Profit Pearson correlation: {c.get('rev_profit', 0):.2f}")
            
        kpis_lines = []
        k = stats.get("kpis", {})
        if k:
            kpis_lines.append(f"  - Average Order Value (AOV): ${k.get('aov', 0):,.2f}")
            kpis_lines.append(f"  - Customer Revenue Concentration (HHI Index): {k.get('hhi_dependency', 0):.3f}")
            kpis_lines.append(f"  - Cost Leakage to Revenue Ratio: {k.get('cost_leakage_ratio', 0)*100:.1f}%")

        lines = ["\n--- ADVANCED DATA SCIENCE & FORECASTING CONTEXT ---"]
        if projections:
            lines.append("Next 6-Month Time-Series Regression Forecasts:")
            lines.extend(projections)
        else:
            lines.append("Projections: Insufficient data history for linear regression forecasting.")
            
        if anomalies:
            lines.append("Outlier & Abnormality Anomalies Detected in ledger (Z-score > 1.8):")
            lines.extend(anomalies)
        else:
            lines.append("Anomalies: No cost/pricing anomalies or billing drops detected.")
            
        if correlations:
            lines.append("Multi-Variable KPI Correlations:")
            lines.extend(correlations)
            
        if kpis_lines:
            lines.append("High-level KPI Operational Metrics:")
            lines.extend(kpis_lines)
            
        lines.append("--- END ADVANCED CONTEXT ---")
        return "\n".join(lines)
    except Exception as e:
        return f"\n[ERROR] Advanced calculations engine failure: {str(e)}\n"


def get_historical_org_context(current_user: models.User, db: Session) -> str:
    if not current_user:
        return ""
        
    membership = db.query(models.OrganizationMember).filter(models.OrganizationMember.user_id == current_user.id).first()
    if not membership:
        return ""
        
    org_id = membership.organization_id
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        return ""
        
    # Get active organization stats
    uploads = db.query(models.Upload).filter(models.Upload.organization_id == org_id).order_by(models.Upload.uploaded_at.desc()).all()
    metrics = db.query(models.Metric).filter(models.Metric.organization_id == org_id).all()
    insights = db.query(models.Insight).filter(models.Insight.organization_id == org_id).all()
    saved_reports = db.query(models.Report).filter(models.Report.organization_id == org_id, models.Report.is_saved == True).order_by(models.Report.generated_at.desc()).all()
    tx_count = db.query(models.Transaction).filter(models.Transaction.organization_id == org_id).count()
    
    plan_limits = {
        "SANDBOX_INIT": 10.0,
        "AUDIT_PROFESSIONAL": 100.0,
        "ENTERPRISE_COMMAND": 1000.0,
        "QUANT_INTELLIGENCE": 10000.0,
    }
    limit = plan_limits.get(org.plan, 10.0)
    
    context_lines = ["\n\n--- DATABASE HISTORICAL & SYSTEM CONTEXT ---"]
    context_lines.append(f"Organization ID: {org_id} (Name: {org.name})")
    context_lines.append(f"Active Plan: {org.plan} (Storage Limit: {limit} MB)")
    context_lines.append(f"Storage Used: {org.storage_used:.4f} MB")
    context_lines.append(f"Total Transactions Stored in Memory: {tx_count} records")
    context_lines.append(f"Total Uploaded Files: {len(uploads)} files")
    for u in uploads[:5]:
        context_lines.append(f"  - File: {u.filename} | Status: {u.status} | Size: {u.file_size:.4f} MB | Ingested: {u.uploaded_at.strftime('%Y-%m-%d')}")
        
    if metrics:
        context_lines.append("\nAggregated Dashboard P&L Metrics:")
        metrics_dict = {m.metric_name: m.metric_value for m in metrics}
        for name, val in metrics_dict.items():
            context_lines.append(f"  - {name}: {val}")
            
    if insights:
        context_lines.append("\nActive System Operational Insights:")
        for ins in insights[:5]:
            context_lines.append(f"  - [{ins.severity.upper()}] {ins.title}: {ins.description} (Impact: {ins.impact})")
            
    if saved_reports:
        context_lines.append("\nSaved Executive COO Reports:")
        for r in saved_reports[:5]:
            context_lines.append(f"  - Report ID {r.id} (Generated: {r.generated_at.strftime('%Y-%m-%d')}) | Health Score: {r.health_score}/100")
            if r.summary:
                context_lines.append(f"    Summary: {r.summary[:150]}...")
                
    # Append the advanced calculations statistical context
    advanced_stats = calculate_advanced_data_context(org_id, db)
    if advanced_stats:
        context_lines.append(advanced_stats)
                
    context_lines.append("--- END DATABASE CONTEXT ---")
    return "\n".join(context_lines)

@router.post("/chat")
async def chat_with_aria(
    request: ChatRequest,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db)
):
    """Stream a response from ARIA or customized operations analyst."""
    api_key = os.getenv("OPENAI_API_KEY", "")
    
    # Fetch user & database context
    user = get_current_user_from_token(token, db)
    db_context_block = ""
    custom_api_key = None
    custom_base_url = None
    custom_model_name = None
    agent_name = "ARIA"
    agent_persona = "ops_analyst"
    agent_tone = "professional"
    agent_instructions = ""
    
    if user:
        db_context_block = get_historical_org_context(user, db)
        custom_api_key = user.custom_api_key
        custom_base_url = user.custom_base_url
        custom_model_name = user.custom_model_name
        agent_name = user.agent_name or "ARIA"
        agent_persona = user.agent_persona or "ops_analyst"
        agent_tone = user.agent_tone or "professional"
        agent_instructions = user.agent_instructions or ""
    
    # Build the context injection
    context_block = build_context_block(request.context, request.mode or "dashboard")
    
    # Build system prompt with context
    system_content = ARIA_SYSTEM_PROMPT
    
    # Customize agent name
    if agent_name != "ARIA":
        system_content = system_content.replace("ARIA", agent_name)
        
    # Customize persona and tone instruction
    persona_mapping = {
        "ops_analyst": "Automated Revenue & Intelligence Analyst (Standard Operations)",
        "rev_consultant": "Executive Revenue Consultant (Strategic growth focus)",
        "cost_auditor": "Operations Cost Auditor (Deep leakage and anomalies focus)",
        "layman_guide": "Layman Ops Guide (Simpler terminology and analogies focus)"
    }
    tone_mapping = {
        "professional": "Concise, data-driven, and highly professional.",
        "detailed": "Thorough, explanatory, and deep-dive detail-oriented.",
        "direct": "Direct, action-first, and bulleted-only style.",
        "conversational": "Friendly, conversational, and query-friendly."
    }
    
    p_desc = persona_mapping.get(agent_persona, persona_mapping["ops_analyst"])
    t_desc = tone_mapping.get(agent_tone, tone_mapping["professional"])
    
    customization_block = f"\n\n--- AGENT PERSONALIZATION CONFIG ---"
    customization_block += f"\nActive Identity: {agent_name}"
    customization_block += f"\nPersona Profile: {p_desc}"
    customization_block += f"\nResponse Tone: {t_desc}"
    if agent_instructions:
        customization_block += f"\nCustom System Directives: {agent_instructions}"
    customization_block += "\n--- END CONFIG ---"
    
    system_content += customization_block
    
    if context_block:
        system_content += context_block
    if db_context_block:
        system_content += db_context_block
    
    # Build the messages array for OpenAI
    messages_payload = [{"role": "system", "content": system_content}]
    
    for msg in request.messages[-20:]:  # keep last 20 turns for context window
        messages_payload.append({
            "role": msg.role,
            "content": msg.content
        })
    
    # Decide if we have any API key configured
    active_key = custom_api_key.strip() if custom_api_key else ""
    if not active_key:
        active_key = api_key
        
    if not active_key or active_key == "sk-your-openai-api-key-here":
        demo_response = (
            f"⚠️ **{agent_name} is not yet connected to OpenAI.**\n\n"
            "To activate me, please enter your OpenAI API Key in System Settings, or "
            "add it to `backend/.env`:\n"
            "```\nOPENAI_API_KEY=sk-...\n```\n"
            "Once connected, I will analyze your operational data and provide real-time custom insights."
        )
        async def demo_stream():
            for char in demo_response:
                yield f"data: {json.dumps({'token': char})}\n\n"
            yield "data: [DONE]\n\n"
        
        return StreamingResponse(
            demo_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )
    
    return StreamingResponse(
        stream_openai_response(
            messages_payload,
            custom_api_key=custom_api_key,
            custom_base_url=custom_base_url,
            custom_model_name=custom_model_name
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
