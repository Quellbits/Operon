from typing import Dict

class HealthScoreEngine:
    def __init__(self, metrics: Dict):
        self.metrics = metrics

    def calculate_score(self) -> Dict:
        # Components (0-25 each)
        rev_score = self._score_revenue()
        cust_score = self._score_customers()
        prod_score = self._score_products()
        cost_score = self._score_costs()
        
        total = rev_score + cust_score + prod_score + cost_score
        
        return {
            "overall": round(total, 1),
            "categories": {
                "revenue": round(rev_score, 1),
                "customers": round(cust_score, 1),
                "products": round(prod_score, 1),
                "costs": round(cost_score, 1)
            }
        }

    def _score_revenue(self) -> float:
        growth = self.metrics.get("revenue", {}).get("revenue_growth", 0)
        # 12.5 base + growth factor
        score = 12.5 + (growth * 25)
        return max(min(score, 25), 0)

    def _score_customers(self) -> float:
        concentration = self.metrics.get("customers", {}).get("top_customer_concentration", 0)
        # Higher concentration lower score
        score = 25 - (concentration * 25)
        return max(min(score, 25), 0)

    def _score_products(self) -> float:
        # Placeholder for product diversity/growth
        return 20.0

    def _score_costs(self) -> float:
        margin = self.metrics.get("cost", {}).get("gross_margin", 0)
        # Margin 0.4+ is perfect 25
        score = (margin / 0.4) * 25
        return max(min(score, 25), 0)
