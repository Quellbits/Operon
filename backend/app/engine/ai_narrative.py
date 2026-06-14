import os
import json
from openai import OpenAI
from typing import Dict, List

class AINarrativeLayer:
    def __init__(self, metrics: Dict, insights: List[Dict], health_score: Dict, advanced_stats: Dict = None):
        self.metrics = metrics
        self.insights = insights
        self.health_score = health_score
        self.advanced_stats = advanced_stats or {}
        api_key = os.getenv("OPENAI_API_KEY", "")
        if api_key and not api_key.startswith("sk-your-openai-api-key"):
            try:
                self.client = OpenAI(api_key=api_key)
                self.api_available = True
            except Exception:
                self.client = None
                self.api_available = False
        else:
            self.client = None
            self.api_available = False

    def _build_data_context(self) -> str:
        """Build a rich, numeric-dense context string from all available metrics."""
        rev = self.metrics.get("revenue", {})
        cust = self.metrics.get("customers", {})
        cost = self.metrics.get("cost", {})
        
        total_revenue = rev.get("total_revenue", 0)
        revenue_growth = rev.get("revenue_growth", 0)
        total_cost = cost.get("total_cost", 0)
        gross_margin = cost.get("gross_margin", 0)
        total_customers = cust.get("total_customers", 0)
        top_conc = cust.get("top_customer_concentration", 0)
        
        kpis = self.advanced_stats.get("kpis", {})
        aov = kpis.get("aov", 0)
        hhi = kpis.get("hhi_dependency", 0)
        leakage_ratio = kpis.get("cost_leakage_ratio", 0)
        
        corr = self.advanced_stats.get("correlations", {})
        anomalies = self.advanced_stats.get("anomalies", [])
        monthly_trend = self.advanced_stats.get("monthly_trend", [])
        forecast_trend = self.advanced_stats.get("forecast_trend", [])
        
        net_profit = total_revenue - total_cost
        
        ctx = f"""
=== BUSINESS OPERATIONS DATASET ===
Organization Health Score: {self.health_score.get('overall', 0):.1f}/100
Revenue Health: {self.health_score.get('categories', {}).get('revenue', 0):.1f}/25
Customer Health: {self.health_score.get('categories', {}).get('customers', 0):.1f}/25
Cost Health: {self.health_score.get('categories', {}).get('costs', 0):.1f}/25

REVENUE METRICS:
- Total Revenue: ${total_revenue:,.2f}
- Total Cost: ${total_cost:,.2f}
- Net Profit: ${net_profit:,.2f}
- Gross Margin: {gross_margin*100:.1f}%
- Revenue Growth (MoM): {revenue_growth*100:+.1f}%

CUSTOMER METRICS:
- Total Unique Customers: {int(total_customers)}
- Top Customer Revenue Concentration: {top_conc*100:.1f}%
- Average Order Value (AOV): ${aov:,.2f}
- Herfindahl-Hirschman Index (HHI): {hhi:.3f} (>0.25 = high concentration risk)

COST LEAK INDICATORS:
- Cost Leakage Ratio: {leakage_ratio*100:.1f}%
- Total Anomalies Detected: {len(anomalies)}
- Critical/High Severity Anomalies: {len([a for a in anomalies if a.get('severity') in ['critical','high']])}

CORRELATION MATRIX:
- Qty vs Revenue: {corr.get('qty_rev', 'N/A')} (demand elasticity)
- Unit Price vs Qty: {corr.get('price_qty', 'N/A')} (price sensitivity)
- Cost vs Revenue: {corr.get('cost_rev', 'N/A')} (cost leverage risk)
- Revenue vs Profit: {corr.get('rev_profit', 'N/A')} (margin conversion)

HISTORICAL MONTHLY PERFORMANCE:
{chr(10).join([f"  - {m.get('name')}: Revenue ${m.get('revenue',0):,.0f} | Cost ${m.get('cost',0):,.0f} | Margin ${m.get('revenue',0)-m.get('cost',0):,.0f}" for m in monthly_trend[-6:]])}

6-MONTH FORECAST (Linear Regression):
{chr(10).join([f"  - {f.get('name')}: Rev ${f.get('revenue',0):,.0f} | Cost ${f.get('cost',0):,.0f}" for f in forecast_trend[:6]])}

DETECTED ANOMALIES:
{chr(10).join([f"  [{a.get('severity','?').upper()}] {a.get('title','')} — Impact: ${a.get('impact',0):,.2f} — {a.get('description','')[:120]}" for a in anomalies[:5]])}

INSIGHT FLAGS:
{chr(10).join([f"  [{i.get('severity','?').upper()}] {i.get('title','')}: {i.get('description','')}" for i in self.insights])}
"""
        return ctx

    def generate_executive_summary(self) -> str:
        ctx = self._build_data_context()
        if not self.api_available:
            return self._fallback_summary()
        try:
            resp = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": """You are a senior operations specialist. Write a concise, high-impact executive summary for an operations audit report.
Format requirements:
- DO NOT write long paragraphs or block text.
- Use 1-2 short, focused paragraphs (max 3 sentences each) for the opening synthesis.
- Use a bulleted list of "Critical Takeaways" (3-4 points) highlighting key metrics in bold (e.g., gross margins, concentration, leakage ratio).
- Identify the main operational risks and bottlenecks directly.
- Sound like a senior human specialist drafting a memo: crisp, data-dense, and highly actionable.
- Use professional terminology (e.g., COGS exposure, pricing discipline, operational leverage)."""},
                    {"role": "user", "content": f"Write the executive summary for this operations audit:\n{ctx}"}
                ],
                temperature=0.3,
                max_tokens=600
            )
            return resp.choices[0].message.content.strip()
        except Exception:
            return self._fallback_summary()

    def _fallback_summary(self) -> str:
        rev = self.metrics.get("revenue", {})
        cost = self.metrics.get("cost", {})
        cust = self.metrics.get("customers", {})
        total_rev = rev.get("total_revenue", 0)
        total_cost = cost.get("total_cost", 0)
        gross_margin = cost.get("gross_margin", 0) * 100
        growth = rev.get("revenue_growth", 0) * 100
        top_conc = cust.get("top_customer_concentration", 0) * 100
        score = self.health_score.get("overall", 0)
        net = total_rev - total_cost
        kpis = self.advanced_stats.get("kpis", {})
        aov = kpis.get("aov", 0)

        return (
            f"Operations audit synthesized from ledger records. The organization recorded revenues of "
            f"${total_rev:,.2f} against operating costs of ${total_cost:,.2f}, yielding a net profit of "
            f"${net:,.2f} and a gross margin of {gross_margin:.1f}%.\n\n"
            f"Critical Takeaways:\n"
            f"• Revenue Trajectory: Period MoM change is {growth:+.1f}%, indicating "
            f"{'stable growth parameters' if growth >= 0 else 'underlying margin contraction requiring mitigation'}.\n"
            f"• Concentration Risk: Top-customer account concentration is at {top_conc:.1f}%, introducing "
            f"{'elevated exposure thresholds' if top_conc > 35 else 'manageable customer diversification'}.\n"
            f"• Average Order Value: Pricing baseline registers at ${aov:,.2f} per transaction.\n"
            f"• Ledger Deviations: Anomaly detection isolated {len(self.advanced_stats.get('anomalies', []))} cost and pricing outliers "
            f"representing profit leakage."
        )

    def generate_action_plan(self) -> List[str]:
        ctx = self._build_data_context()
        if not self.api_available:
            return self._fallback_actions()
        try:
            resp = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": """You are a senior COO advisor. Generate exactly 6 specific, data-backed strategic action items for a corporate operations improvement plan.
Each action item must:
- Be one sentence, direct and imperative in tone
- Reference a specific metric, threshold, or finding from the data
- Include a measurable outcome or target where possible
- Be realistic operational directives, not generic advice
Output as a JSON array of 6 strings."""},
                    {"role": "user", "content": f"Generate the strategic action plan from this operations data:\n{ctx}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=600
            )
            parsed = json.loads(resp.choices[0].message.content)
            actions = parsed.get("actions", parsed.get("items", list(parsed.values())[0] if parsed else []))
            if isinstance(actions, list) and len(actions) >= 3:
                return actions[:7]
        except Exception:
            pass
        return self._fallback_actions()

    def _fallback_actions(self) -> List[str]:
        rev = self.metrics.get("revenue", {})
        cost = self.metrics.get("cost", {})
        cust = self.metrics.get("customers", {})
        total_rev = rev.get("total_revenue", 0)
        gross_margin = cost.get("gross_margin", 0) * 100
        growth = rev.get("revenue_growth", 0) * 100
        top_conc = cust.get("top_customer_concentration", 0) * 100
        kpis = self.advanced_stats.get("kpis", {})
        leakage = kpis.get("cost_leakage_ratio", 0) * 100
        anomalies = self.advanced_stats.get("anomalies", [])
        corr = self.advanced_stats.get("correlations", {})

        actions = []

        if top_conc > 35:
            actions.append(
                f"Immediately initiate a customer diversification programme targeting {top_conc:.0f}% top-account concentration — "
                f"set a 90-day target to onboard at least 3 new accounts each exceeding 10% of current revenue baseline."
            )
        if growth < 0:
            actions.append(
                f"Conduct a product-level revenue decline root-cause analysis to address the {abs(growth):.1f}% MoM contraction — "
                f"identify whether pricing, volume, or mix shift is the primary driver within 30 days."
            )
        if gross_margin < 35:
            actions.append(
                f"Launch a gross margin recovery initiative targeting a minimum {gross_margin + 5:.0f}% margin threshold — "
                f"begin by renegotiating the top-3 supplier contracts which collectively drive the majority of variable COGS."
            )
        if leakage > 5:
            actions.append(
                f"Deploy a cost leakage containment protocol addressing the {leakage:.1f}% leakage ratio detected — "
                f"prioritise review of transactions flagged as Z-score outliers to recover estimated impact within current quarter."
            )
        if corr.get("cost_rev", 0) > 0.85:
            actions.append(
                f"Restructure cost architecture to reduce the cost-revenue correlation coefficient of {corr.get('cost_rev', 0):+.2f} — "
                f"introduce fixed-cost components and volume-based supplier rebates to decouple cost growth from revenue scaling."
            )
        if anomalies:
            crit = [a for a in anomalies if a.get("severity") == "critical"]
            if crit:
                actions.append(
                    f"Escalate {len(crit)} critical-severity billing anomaly(ies) to finance leadership for immediate investigation — "
                    f"freeze affected accounts pending audit completion to prevent further margin erosion."
                )
        actions.append(
            f"Establish a monthly operations review cadence against the KPI thresholds defined in this report — "
            f"track health score trajectory, AOV movement, and customer concentration index on a rolling 90-day basis."
        )

        return actions[:7] if actions else [
            "Conduct a comprehensive product-level profitability audit against the current cost structure.",
            "Implement monthly financial review cadence aligned to the KPIs identified in this report.",
            "Review the top customer accounts for contract renewal terms and pricing adequacy."
        ]

    def generate_pain_points(self) -> List[str]:
        ctx = self._build_data_context()
        if not self.api_available:
            return self._fallback_pain_points()
        try:
            resp = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": """You are a senior operations analyst. Identify 4-5 specific operational pain points from the data.
Each pain point must:
- Reference a specific measured metric or anomaly
- Explain the downstream business impact
- Be 1-2 sentences
Output as a JSON array of strings called 'pain_points'."""},
                    {"role": "user", "content": f"Identify the key pain points from this operations data:\n{ctx}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=400
            )
            parsed = json.loads(resp.choices[0].message.content)
            pts = parsed.get("pain_points", [])
            if isinstance(pts, list) and len(pts) >= 2:
                return pts[:5]
        except Exception:
            pass
        return self._fallback_pain_points()

    def _fallback_pain_points(self) -> List[str]:
        rev = self.metrics.get("revenue", {})
        cost = self.metrics.get("cost", {})
        cust = self.metrics.get("customers", {})
        kpis = self.advanced_stats.get("kpis", {})
        corr = self.advanced_stats.get("correlations", {})
        anomalies = self.advanced_stats.get("anomalies", [])

        pts = []
        growth = rev.get("revenue_growth", 0) * 100
        top_conc = cust.get("top_customer_concentration", 0) * 100
        gross_margin = cost.get("gross_margin", 0) * 100
        leakage = kpis.get("cost_leakage_ratio", 0) * 100
        cost_corr = corr.get("cost_rev", 0)

        if growth < 0:
            pts.append(f"Revenue contraction of {abs(growth):.1f}% month-over-month indicates demand erosion or pricing pressure not yet addressed at the account level.")
        if top_conc > 35:
            pts.append(f"Top-customer revenue concentration at {top_conc:.1f}% creates a critical single-point-of-failure in the revenue model — loss of this account would immediately impair operating viability.")
        if gross_margin < 40:
            pts.append(f"Gross margin of {gross_margin:.1f}% remains below the 40% operational threshold, indicating insufficient pricing power or elevated variable costs relative to the revenue base.")
        if leakage > 3:
            pts.append(f"Cost leakage ratio of {leakage:.1f}% represents a systematic profit drain detectable in the transaction ledger across cost-ratio outliers and direct margin-negative entries.")
        if cost_corr > 0.85:
            pts.append(f"A cost-revenue Pearson correlation of {cost_corr:+.2f} confirms that cost structure is nearly fully variable — any revenue softness directly propagates into margin compression with minimal fixed-cost buffer.")
        if anomalies:
            pts.append(f"{len(anomalies)} statistical anomalies detected in billing data including unit price deviations and customer billing drops, each representing an unrecovered financial risk to the P&L.")

        return pts[:5] if pts else [
            "Insufficient transaction volume to fully isolate margin compression drivers at the product level.",
            "Customer base concentration creates revenue model fragility requiring active diversification planning.",
            "Cost structures exhibit high variability relative to revenue, limiting operating leverage."
        ]

    def generate_conclusions(self) -> str:
        ctx = self._build_data_context()
        if not self.api_available:
            return self._fallback_conclusions()
        try:
            resp = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": """You are a senior operations specialist. Write a concise "Conclusions & Operational Outlook" section.
Format requirements:
- DO NOT write long paragraphs.
- Write 1 short, crisp introductory paragraph (max 3 sentences).
- Provide a bulleted list of "Strategic Action Gates" (3 points) showing immediate target metrics (e.g., target margin recovery, leak containment).
- End with a single, high-impact outlook sentence.
- Sound like a human executive drafting a brief memo, not an AI essay."""},
                    {"role": "user", "content": f"Write the conclusions and strategic outlook:\n{ctx}"}
                ],
                temperature=0.3,
                max_tokens=400
            )
            return resp.choices[0].message.content.strip()
        except Exception:
            return self._fallback_conclusions()

    def _fallback_conclusions(self) -> str:
        score = self.health_score.get("overall", 0)
        rev = self.metrics.get("revenue", {})
        cost = self.metrics.get("cost", {})
        kpis = self.advanced_stats.get("kpis", {})
        total_rev = rev.get("total_revenue", 0)
        gross_margin = cost.get("gross_margin", 0) * 100
        leakage = kpis.get("cost_leakage_ratio", 0) * 100
        forecast = self.advanced_stats.get("forecast_trend", [])

        fwd_rev = forecast[2].get("revenue", 0) if len(forecast) > 2 else total_rev
        fwd_cost = forecast[2].get("cost", 0) if len(forecast) > 2 else 0
        net_fwd = fwd_rev - fwd_cost

        return (
            f"Audit conclusions indicate a composite operational score of {score:.1f}/100, driven by a "
            f"{gross_margin:.1f}% gross margin and a {leakage:.1f}% cost leakage ratio. The 3-month predictive "
            f"regression models project forward revenue of ${fwd_rev:,.0f} against costs of ${fwd_cost:,.0f}, "
            f"implying a forward net margin of ${net_fwd:,.0f}.\n\n"
            f"Strategic Action Gates:\n"
            f"• Customer Diversification: Onboard 3 new client accounts to lower concentration below 25%.\n"
            f"• Contract Renegotiation: Address variable cost leakage in Z-score outlier categories.\n"
            f"• Pricing Floor Implementation: Anchor new product price quotes to the AOV baseline.\n\n"
            f"Execution of these targets is estimated to recover 5-12 percentage points of gross margin."
        )
