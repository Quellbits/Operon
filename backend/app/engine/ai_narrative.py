import os
from openai import OpenAI
from typing import Dict, List

class AINarrativeLayer:
    def __init__(self, metrics: Dict, insights: List[Dict], health_score: Dict):
        self.metrics = metrics
        self.insights = insights
        self.health_score = health_score
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "mock-key"))

    def generate_executive_summary(self) -> str:
        # In production, this would call OpenAI
        # We'll simulate the response for logic demonstration
        
        prompt = f"""
        Generate an executive summary for a business with the following data:
        Health Score: {self.health_score['overall']}
        Metrics: {self.metrics}
        Insights: {self.insights}
        """
        
        # Mocking OpenAI response
        summary = f"The business is currently operating with a health score of {self.health_score['overall']}/100. "
        if self.health_score['overall'] < 50:
            summary += "Immediate intervention is required to address revenue and customer risks."
        else:
            summary += "Operations are stable, but optimization opportunities exist in cost management."
            
        return summary

    def generate_action_plan(self) -> List[str]:
        actions = []
        for insight in self.insights:
            if insight['severity'] == 'critical':
                actions.append(f"Diversify customer base to mitigate {insight['title']}")
            elif insight['severity'] == 'high':
                actions.append(f"Investigate cause of {insight['title']} and implement recovery strategy")
        
        if not actions:
            actions.append("Conduct a deep dive into product-level profitability.")
            
        return actions
