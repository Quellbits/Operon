import pandas as pd
from typing import List, Dict

class MetricsEngine:
    def __init__(self, transactions_df: pd.DataFrame):
        self.df = transactions_df
        if not self.df.empty:
            self.df['date'] = pd.to_datetime(self.df['date'])

    def calculate_all(self) -> Dict:
        if self.df.empty:
            return {}

        results = {
            "revenue": self._revenue_metrics(),
            "customers": self._customer_metrics(),
            "products": self._product_metrics(),
            "cost": self._cost_metrics(),
        }
        return results

    def _revenue_metrics(self):
        total_rev = self.df['revenue'].sum()
        # Simple trend (group by month)
        trend = self.df.set_index('date').resample('M')['revenue'].sum().to_dict()
        growth = 0
        if len(trend) > 1:
            vals = list(trend.values())
            growth = (vals[-1] - vals[-2]) / vals[-2] if vals[-2] != 0 else 0
            
        return {
            "total_revenue": total_rev,
            "monthly_trend": {str(k.date()): v for k, v in trend.items()},
            "revenue_growth": growth
        }

    def _customer_metrics(self):
        unique_customers = self.df['customer'].nunique()
        customer_rev = self.df.groupby('customer')['revenue'].sum()
        top_customer_share = (customer_rev.max() / customer_rev.sum()) if not customer_rev.empty else 0
        
        return {
            "total_customers": unique_customers,
            "top_customer_concentration": top_customer_share
        }

    def _product_metrics(self):
        product_rev = self.df.groupby('product')['revenue'].sum().sort_values(ascending=False)
        return {
            "top_products": product_rev.head(5).to_dict()
        }

    def _cost_metrics(self):
        total_cost = self.df['cost'].sum()
        margin = (self.df['revenue'].sum() - total_cost) / self.df['revenue'].sum() if self.df['revenue'].sum() != 0 else 0
        return {
            "total_cost": total_cost,
            "gross_margin": margin
        }
