import pandas as pd
from typing import Dict
from datetime import datetime

class Normalizer:
    def __init__(self, df: pd.DataFrame, mapping: Dict[str, str]):
        self.df = df
        self.mapping = mapping

    def normalize_transactions(self, organization_id: int):
        """Transforms raw data into a list of Transaction models."""
        normalized_data = []
        
        # Rename columns to canonical names
        reverse_mapping = {v: k for k, v in self.mapping.items()}
        
        for _, row in self.df.iterrows():
            record = {
                "organization_id": organization_id,
                "date": self._parse_date(row.get(reverse_mapping.get("date"))),
                "customer": row.get(reverse_mapping.get("customer"), "Unknown"),
                "product": row.get(reverse_mapping.get("product"), "Default"),
                "revenue": self._parse_float(row.get(reverse_mapping.get("revenue"), 0)),
                "cost": self._parse_float(row.get(reverse_mapping.get("cost"), 0)),
                "quantity": self._parse_float(row.get(reverse_mapping.get("quantity"), 1)),
                "location": row.get(reverse_mapping.get("location"), "Primary"),
            }
            normalized_data.append(record)
            
        return normalized_data

    def _parse_date(self, val):
        if pd.isna(val):
            return datetime.utcnow()
        try:
            return pd.to_datetime(val)
        except:
            return datetime.utcnow()

    def _parse_float(self, val):
        try:
            return float(val) if not pd.isna(val) else 0.0
        except:
            return 0.0
