from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
import os

class ReportingEngine:
    def __init__(self, organization_name: str, health_score: float, summary: str, actions: list):
        self.org_name = organization_name
        self.score = health_score
        self.summary = summary
        self.actions = actions

    def generate_pdf(self, output_path: str):
        doc = SimpleDocTemplate(output_path, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        elements.append(Paragraph(f"Executive Business Report: {self.org_name}", styles['Title']))
        elements.append(Spacer(1, 12))

        # Health Score
        score_color = colors.green if self.score > 70 else colors.orange if self.score > 40 else colors.red
        elements.append(Paragraph(f"Business Health Score: {self.score}/100", styles['Heading2']))
        elements.append(Spacer(1, 12))

        # Executive Summary
        elements.append(Paragraph("Executive Summary", styles['Heading2']))
        elements.append(Paragraph(self.summary, styles['Normal']))
        elements.append(Spacer(1, 12))

        # Actions
        elements.append(Paragraph("Recommended Actions", styles['Heading2']))
        for action in self.actions:
            elements.append(Paragraph(f"• {action}", styles['Normal']))
        
        doc.build(elements)
        return output_path
