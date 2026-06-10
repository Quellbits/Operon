import pandas as pd
import re
from typing import List, Dict, Tuple

CANONICAL_FIELDS = {
    "date": ["date", "time", "day", "period", "transaction_date", "invoice_date"],
    "revenue": ["revenue", "sales", "net_sales", "amount", "price", "total", "income"],
    "cost": ["cost", "cogs", "expense", "purchase_price", "unit_cost"],
    "customer": ["customer", "client", "buyer", "user", "name"],
    "product": ["product", "item", "sku", "description", "service"],
    "quantity": ["quantity", "qty", "count", "units", "amount"],
    "inventory": ["inventory", "stock", "on_hand", "available"],
    "expense": ["expense", "bill", "cost_center"],
    "employee": ["employee", "staff", "user", "agent"],
    "location": ["location", "store", "region", "warehouse", "branch"],
}

class SchemaDetector:
    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.columns = df.columns.tolist()

    def detect_mappings(self) -> Dict[str, str]:
        """Maps file columns to canonical fields and returns a dictionary."""
        mappings = {}
        for col in self.columns:
            clean_col = col.lower().strip().replace(" ", "_")
            
            best_match = None
            max_score = 0
            
            for canonical, aliases in CANONICAL_FIELDS.items():
                for alias in aliases:
                    # Simple fuzzy matching / score
                    if clean_col == alias:
                        score = 1.0
                    elif alias in clean_col:
                        score = 0.8
                    else:
                        score = 0
                    
                    if score > max_score:
                        max_score = score
                        best_match = canonical
            
            if best_match and max_score >= 0.5:
                # Avoid mapping multiple columns to the same canonical field 
                # (unless we handle that in normalization)
                mappings[col] = best_match
        
        return mappings

    def get_sample_data(self, limit: int = 5) -> List[Dict]:
        """Returns sample rows for UI preview."""
        return self.df.head(limit).to_dict(orient="records")
