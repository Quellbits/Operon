from typing import List, Dict

class InsightsEngine:
    def __init__(self, metrics: Dict):
        self.metrics = metrics

    def generate_insights(self) -> List[Dict]:
        insights = []
        
        # Revenue Insights
        rev = self.metrics.get("revenue", {})
        if rev.get("revenue_growth", 0) < -0.1:
            insights.append({
                "severity": "high",
                "category": "revenue",
                "title": "Significant Revenue Decline",
                "description": f"Revenue has decreased by {abs(rev['revenue_growth']):.1%}.",
                "impact": "Current burn rate might be unsustainable."
            })
            
        # Customer Insights
        cust = self.metrics.get("customers", {})
        if cust.get("top_customer_concentration", 0) > 0.4:
            insights.append({
                "severity": "critical",
                "category": "risk",
                "title": "Revenue Concentration Risk",
                "description": f"A single customer contributes {cust['top_customer_concentration']:.1%} of total revenue.",
                "impact": "Losing this customer would be catastrophic for the business."
            })
            
        # Margin Insights
        cost = self.metrics.get("cost", {})
        if cost.get("gross_margin", 0) < 0.2:
            insights.append({
                "severity": "medium",
                "category": "efficiency",
                "title": "Low Gross Margin",
                "description": f"Overall gross margin is at {cost['gross_margin']:.1%}.",
                "impact": "Limited room for operational errors or price fluctuations."
            })
            
        return insights
