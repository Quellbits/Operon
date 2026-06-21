"""
Operon COO-Grade Reporting Engine
Generates multi-section, data-rich PDF reports using ReportLab.
All charts and visual elements are drawn natively via canvas primitives.
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    KeepTogether, Flowable, PageBreak
)
from reportlab.lib.units import inch
from datetime import datetime
import os

# ─────────────────────────────────────────────────────────────────────────────
# COLOUR PALETTE
# ─────────────────────────────────────────────────────────────────────────────
C_DARK       = HexColor("#0f172a")   # Near-black navy
C_MID        = HexColor("#1e293b")   # Section header dark
C_INDIGO     = HexColor("#4f46e5")   # Corporate Indigo
C_ORANGE     = HexColor("#4f46e5")   # Replaces orange with indigo
C_ORANGE_LT  = HexColor("#6366f1")   # Lighter Indigo accent
C_SLATE      = HexColor("#334155")   # Body text
C_MUTED      = HexColor("#64748b")   # Captions / muted
C_BORDER     = HexColor("#e2e8f0")   # Grid lines
C_BG_ALT     = HexColor("#f8fafc")   # Alternate row bg
C_GREEN      = HexColor("#10b981")   # Emerald Green
C_RED        = HexColor("#f43f5e")   # Rose Red
C_AMBER      = HexColor("#f59e0b")   # Amber warning
C_WHITE      = colors.white
C_COVER_BG   = HexColor("#090d16")   # Dark carbon background
C_COVER_LINE = HexColor("#4f46e5")   # Cover accent Indigo stripe



# ─────────────────────────────────────────────────────────────────────────────
# CUSTOM FLOWABLES
# ─────────────────────────────────────────────────────────────────────────────

class HRule(Flowable):
    """A thin horizontal rule."""
    def __init__(self, width=504, color=C_BORDER, thickness=0.5):
        super().__init__()
        self.width = width
        self.height = thickness + 2
        self.color = color
        self.thickness = thickness

    def wrap(self, availWidth, availHeight):
        return min(self.width, availWidth), self.height

    def draw(self):
        self.canv.saveState()
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 1, self.width, 1)
        self.canv.restoreState()


class HealthScoreBar(Flowable):
    """Segmented level indicator for business health score."""
    def __init__(self, score: float, width=504, height=12):
        super().__init__()
        self.score = max(0.0, min(100.0, score))
        self.width = width
        self.height = height

    def wrap(self, availWidth, availHeight):
        return min(self.width, availWidth), self.height + 4

    def draw(self):
        self.canv.saveState()
        num_segments = 20
        gap = 2.5
        seg_w = (self.width - (num_segments - 1) * gap) / num_segments
        active_segs = int(round((self.score / 100.0) * num_segments))
        
        bar_color = C_GREEN if self.score >= 70 else C_AMBER if self.score >= 40 else C_RED
        inactive_color = HexColor("#e2e8f0")
        
        for i in range(num_segments):
            x = i * (seg_w + gap)
            color = bar_color if i < active_segs else inactive_color
            self.canv.setFillColor(color)
            self.canv.roundRect(x, 2, seg_w, self.height, 2, fill=1, stroke=0)
            
        self.canv.restoreState()



class KPICard(Flowable):
    """Draws a single KPI metric card with label, value, and optional delta."""
    def __init__(self, label, value, delta=None, width=120, height=58):
        super().__init__()
        self.label = label
        self.value = value
        self.delta = delta
        self.width = width
        self.height = height

    def wrap(self, availWidth, availHeight):
        return self.width, self.height

    def draw(self):
        c = self.canv
        c.saveState()
        # Card background
        c.setFillColor(HexColor("#ffffff"))
        c.setStrokeColor(C_BORDER)
        c.setLineWidth(0.5)
        c.roundRect(0, 0, self.width, self.height, 6, fill=1, stroke=1)
        # Top accent bar
        c.setFillColor(C_INDIGO)
        c.roundRect(0, self.height - 4, self.width, 4, 2, fill=1, stroke=0)
        # Label
        c.setFillColor(C_MUTED)
        c.setFont("Helvetica", 7)
        c.drawString(8, self.height - 16, self.label.upper())
        # Value
        c.setFillColor(C_DARK)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(8, self.height - 34, str(self.value))
        # Delta
        if self.delta is not None:
            is_pos = str(self.delta).startswith("+") or (isinstance(self.delta, (int, float)) and self.delta >= 0)
            c.setFillColor(C_GREEN if is_pos else C_RED)
            c.setFont("Helvetica", 7.5)
            delta_str = str(self.delta) if not isinstance(self.delta, float) else f"{self.delta:+.1f}%"
            c.drawString(8, 8, delta_str)
        c.restoreState()


class KPIRow(Flowable):
    """Renders a horizontal row of 4 KPI cards."""
    def __init__(self, cards, total_width=504):
        super().__init__()
        n = len(cards)
        self.cards = cards
        self.card_width = (total_width - (n - 1) * 8) / n
        self.card_height = 60
        self.total_width = total_width
        self.height = self.card_height

    def wrap(self, availWidth, availHeight):
        return self.total_width, self.height

    def draw(self):
        x = 0
        for label, value, delta in self.cards:
            kpi = KPICard(label, value, delta, width=self.card_width, height=self.card_height)
            kpi.canv = self.canv
            self.canv.saveState()
            self.canv.translate(x, 0)
            kpi.draw()
            self.canv.restoreState()
            x += self.card_width + 8


class InlineBarChart(Flowable):
    """
    Draws a simple grouped/single bar chart using canvas primitives.
    data: list of {"label": str, "value": float, "value2": float (optional)}
    """
    def __init__(self, data, title="", bar_color=C_ORANGE, bar_color2=C_SLATE,
                 width=504, height=140, max_val=None, value_prefix="$", show_legend=True,
                 label2="Cost"):
        super().__init__()
        self.data = data
        self.title = title
        self.bar_color = bar_color
        self.bar_color2 = bar_color2
        self.width = width
        self.height = height
        self.max_val = max_val
        self.value_prefix = value_prefix
        self.show_legend = show_legend
        self.label2 = label2

    def wrap(self, availWidth, availHeight):
        return min(self.width, availWidth), self.height + (30 if self.title else 0)

    def draw(self):
        c = self.canv
        c.saveState()
        if not self.data:
            c.restoreState()
            return

        title_h = 18 if self.title else 0
        legend_h = 14 if self.show_legend else 0
        chart_top = self.height - title_h
        axis_bottom = legend_h + 20   # space for x labels
        chart_area_h = chart_top - axis_bottom

        # Title
        if self.title:
            c.setFont("Helvetica-Bold", 8.5)
            c.setFillColor(C_MID)
            c.drawString(0, chart_top + 4, self.title)

        # Determine max value
        vals = [d.get("value", 0) for d in self.data] + [d.get("value2", 0) for d in self.data]
        max_val = self.max_val or max(vals) or 1

        n = len(self.data)
        has_two = any(d.get("value2") is not None for d in self.data)
        group_w = self.width / n
        bar_gap = group_w * 0.12
        bar_w = (group_w - 2 * bar_gap - (bar_gap if has_two else 0)) / (2 if has_two else 1)
        bar_w = min(bar_w, 28)

        # Background grid lines (4 horizontal)
        c.setStrokeColor(HexColor("#f8fafc"))
        c.setLineWidth(0.3)
        for i in range(1, 5):
            y = axis_bottom + (chart_area_h * i / 4)
            c.line(0, y, self.width, y)

        # Draw bars
        for i, d in enumerate(self.data):
            val = d.get("value", 0) or 0
            val2 = d.get("value2")
            cx = group_w * i + group_w / 2

            if has_two and val2 is not None:
                # Two bars
                x1 = cx - bar_gap / 2 - bar_w
                x2 = cx + bar_gap / 2
            else:
                x1 = cx - bar_w / 2
                x2 = None

            bar_h1 = max((val / max_val) * chart_area_h, 1) if max_val > 0 else 1
            r1 = min(3.0, bar_h1 / 2)
            c.setFillColor(self.bar_color)
            c.roundRect(x1, axis_bottom, bar_w, bar_h1, r1, fill=1, stroke=0)

            if has_two and val2 is not None and x2 is not None:
                bar_h2 = max((val2 / max_val) * chart_area_h, 1) if max_val > 0 else 1
                r2 = min(3.0, bar_h2 / 2)
                c.setFillColor(self.bar_color2)
                c.roundRect(x2, axis_bottom, bar_w, bar_h2, r2, fill=1, stroke=0)

            # X-axis label
            label = d.get("label", "")
            c.setFont("Helvetica", 6.5)
            c.setFillColor(C_MUTED)
            c.drawCentredString(cx, axis_bottom - 10, label[:7])

        # Y-axis value labels
        c.setFont("Helvetica", 6)
        c.setFillColor(C_MUTED)
        for i in range(0, 5):
            y_val = max_val * i / 4
            y_pos = axis_bottom + (chart_area_h * i / 4)
            if y_val >= 1_000_000:
                label = f"{self.value_prefix}{y_val/1_000_000:.1f}M"
            elif y_val >= 1_000:
                label = f"{self.value_prefix}{y_val/1_000:.0f}K"
            else:
                label = f"{self.value_prefix}{y_val:.0f}"
            c.drawRightString(-4, y_pos - 3, label)

        # X-axis baseline
        c.setStrokeColor(HexColor("#e2e8f0"))
        c.setLineWidth(0.5)
        c.line(0, axis_bottom, self.width, axis_bottom)

        # Legend
        if self.show_legend and has_two:
            c.setFillColor(self.bar_color)
            c.roundRect(0, 2, 9, 7, 1.5, fill=1, stroke=0)
            c.setFillColor(C_MID)
            c.setFont("Helvetica", 6.5)
            c.drawString(12, 2, "Revenue")
            c.setFillColor(self.bar_color2)
            c.roundRect(65, 2, 9, 7, 1.5, fill=1, stroke=0)
            c.drawString(77, 2, self.label2)

        c.restoreState()


class MiniTrendLine(Flowable):
    """Sparkline trend chart."""
    def __init__(self, values, width=504, height=60, color=C_ORANGE, fill_color=None, title=""):
        super().__init__()
        self.values = [v for v in values if v is not None]
        self.width = width
        self.height = height
        self.color = color
        self.fill_color = fill_color or HexColor("#fff7ed")
        self.title = title

    def wrap(self, availWidth, availHeight):
        return min(self.width, availWidth), self.height + (16 if self.title else 0)

    def draw(self):
        c = self.canv
        c.saveState()
        if not self.values or len(self.values) < 2:
            c.restoreState()
            return

        title_h = 14 if self.title else 0
        plot_h = self.height
        mn, mx = min(self.values), max(self.values)
        rng = mx - mn if mx != mn else 1

        def y(v): return ((v - mn) / rng) * (plot_h - 10) + 5

        step = self.width / (len(self.values) - 1)
        pts = [(i * step, y(v)) for i, v in enumerate(self.values)]

        # Filled area
        c.setFillColor(self.fill_color)
        path = c.beginPath()
        path.moveTo(0, 5)
        for px, py in pts:
            path.lineTo(px, py)
        path.lineTo(self.width, 5)
        path.close()
        c.drawPath(path, fill=1, stroke=0)

        # Line
        c.setStrokeColor(self.color)
        c.setLineWidth(1.5)
        path2 = c.beginPath()
        path2.moveTo(pts[0][0], pts[0][1])
        for px, py in pts[1:]:
            path2.lineTo(px, py)
        c.drawPath(path2, fill=0, stroke=1)

        # Dots at endpoints
        c.setFillColor(self.color)
        c.circle(pts[0][0], pts[0][1], 2.5, fill=1, stroke=0)
        c.circle(pts[-1][0], pts[-1][1], 2.5, fill=1, stroke=0)

        # Title
        if self.title:
            c.setFont("Helvetica-Bold", 7.5)
            c.setFillColor(C_MID)
            c.drawString(0, plot_h + 4, self.title)

        c.restoreState()


# ─────────────────────────────────────────────────────────────────────────────
# PAGE DECORATIONS
# ─────────────────────────────────────────────────────────────────────────────

def draw_cover_page(canvas, doc):
    """Draws a dark, branded cover page with premium glowing indigo circles."""
    W, H = letter
    canvas.saveState()

    # Dark carbon background
    canvas.setFillColor(C_COVER_BG)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)

    # Natively draw abstract glows using transparency settings
    canvas.setFillAlpha(0.22)
    canvas.setFillColor(HexColor("#1e1b4b")) # Deep Indigo glow top-right
    canvas.circle(W, H, 260, fill=1, stroke=0)
    
    canvas.setFillAlpha(0.12)
    canvas.setFillColor(HexColor("#4f46e5")) # Lighter Indigo glow top-right
    canvas.circle(W, H, 140, fill=1, stroke=0)
    
    canvas.setFillAlpha(0.15)
    canvas.setFillColor(HexColor("#312e81")) # Deep Indigo glow bottom-left
    canvas.circle(0, 0, 200, fill=1, stroke=0)
    
    # Restore full opacity
    canvas.setFillAlpha(1.0)

    # Subtle grid overlay (matching web blueprint grids but extremely faint)
    canvas.setStrokeColor(HexColor("#111827"))
    canvas.setLineWidth(0.3)
    grid_size = 36
    for x in range(0, int(W), grid_size):
        canvas.line(x, 0, x, H)
    for y in range(0, int(H), grid_size):
        canvas.line(0, y, W, y)

    # Elegant double accent bar on the left border (thick Indigo, thin Indigo-light)
    canvas.setFillColor(C_COVER_LINE)
    canvas.rect(0, 0, 5, H, fill=1, stroke=0)
    canvas.setFillColor(HexColor("#6366f1"))
    canvas.rect(5, 0, 1.5, H, fill=1, stroke=0)

    # Branded top-right logo box (clean, sharp border and micro text)
    logo_w, logo_h = 110, 40
    logo_x, logo_y = W - 110 - 54, H - 40 - 54
    canvas.setFillColor(HexColor("#0f172a"))
    canvas.setStrokeColor(HexColor("#1f2937"))
    canvas.setLineWidth(0.8)
    canvas.roundRect(logo_x, logo_y, logo_w, logo_h, 4, fill=1, stroke=1)
    
    canvas.setFont("Helvetica-Bold", 11)
    canvas.setFillColor(C_WHITE)
    canvas.drawString(logo_x + 10, logo_y + 22, "OPERON")
    canvas.setFont("Helvetica-Bold", 6.5)
    canvas.setFillColor(HexColor("#6366f1"))
    canvas.drawString(logo_x + 10, logo_y + 10, "COO INTEL PLATFORM")

    # Decorative dividing thin accent rule on the page
    canvas.setStrokeColor(HexColor("#1f2937"))
    canvas.setLineWidth(0.5)
    canvas.line(54, H - 120, W - 54, H - 120)

    # Upper category tag
    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(HexColor("#6366f1"))
    canvas.drawString(54, H - 110, "SYSTEMIC PERFORMANCE AUDIT REPORT")

    canvas.restoreState()


def draw_inner_page(canvas, doc):
    """Header/footer for pages 2+."""
    W, H = letter
    canvas.saveState()

    # Header line
    canvas.setStrokeColor(C_BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(54, H - 52, W - 54, H - 52)

    # Header left: org brand
    canvas.setFont("Helvetica-Bold", 7)
    canvas.setFillColor(C_INDIGO)
    canvas.drawString(54, H - 46, "OPERON")
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(C_MUTED)
    canvas.drawString(90, H - 46, "| COO OPERATIONS AUDIT")

    # Header right: report date
    canvas.setFont("Helvetica", 7)
    canvas.drawRightString(W - 54, H - 46, datetime.utcnow().strftime("%d %B %Y"))

    # Footer line
    canvas.line(54, 48, W - 54, 48)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(C_MUTED)
    canvas.drawString(54, 36, "CONFIDENTIAL — For Internal Executive Use Only | Operon COO Intelligence")
    canvas.drawRightString(W - 54, 36, f"Page {doc.page}")

    canvas.restoreState()


def draw_first_content_page(canvas, doc):
    """Decorator for page 2 (first content page after cover)."""
    draw_inner_page(canvas, doc)


# ─────────────────────────────────────────────────────────────────────────────
# REPORTING ENGINE
# ─────────────────────────────────────────────────────────────────────────────

class ReportingEngine:
    def __init__(
        self,
        organization_name: str,
        health_score: float,
        summary: str,
        actions: list,
        report_title: str = None,
        pain_points: list = None,
        conclusions: str = None,
        advanced_stats: dict = None,
        health_score_detail: dict = None,
        metrics: dict = None,
        query: str = None,
    ):
        self.org_name = organization_name
        self.score = health_score
        self.summary = summary
        self.actions = actions or []
        self.report_title = report_title or f"Operations Audit Report: {organization_name}"
        self.pain_points = pain_points or []
        self.conclusions = conclusions or ""
        self.advanced_stats = advanced_stats or {}
        self.health_score_detail = health_score_detail or {}
        self.metrics = metrics or {}
        self.query = query or ""
        self.generated_at = datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")

    # ── helpers ────────────────────────────────────────────────────────────

    def _styles(self):
        base = getSampleStyleSheet()
        def S(name, **kw):
            parent = kw.pop("parent", "Normal")
            return ParagraphStyle(name, parent=base[parent], **kw)

        return {
            "title": S("DocTitle", parent="Title",
                        fontName="Helvetica-Bold", fontSize=22, leading=26,
                        textColor=C_WHITE, alignment=0, spaceAfter=6),
            "subtitle": S("DocSubtitle",
                           fontName="Helvetica", fontSize=11, leading=14,
                           textColor=HexColor("#94a3b8"), spaceAfter=4),
            "h1": S("DocH1", parent="Heading1",
                    fontName="Helvetica-Bold", fontSize=13, leading=17,
                    textColor=C_ORANGE, spaceBefore=16, spaceAfter=8,
                    keepWithNext=True),
            "h2": S("DocH2", parent="Heading2",
                    fontName="Helvetica-Bold", fontSize=10, leading=13,
                    textColor=C_MID, spaceBefore=10, spaceAfter=6,
                    keepWithNext=True),
            "normal": S("DocNormal",
                         fontName="Helvetica", fontSize=9.5, leading=14,
                         textColor=C_SLATE, spaceAfter=8),
            "bullet": S("DocBullet",
                         fontName="Helvetica", fontSize=9.5, leading=14,
                         textColor=C_SLATE, leftIndent=16, firstLineIndent=-10,
                         spaceAfter=5),
            "caption": S("DocCaption",
                          fontName="Helvetica", fontSize=7.5, leading=10,
                          textColor=C_MUTED, spaceAfter=6, alignment=1),
            "th": S("DocTH",
                    fontName="Helvetica-Bold", fontSize=8.5, leading=11,
                    textColor=C_WHITE),
            "td": S("DocTD",
                    fontName="Helvetica", fontSize=8.5, leading=11,
                    textColor=C_DARK),
            "td_small": S("DocTDSmall",
                           fontName="Helvetica", fontSize=7.5, leading=10,
                           textColor=C_DARK),
            "cover_label": S("CoverLabel",
                              fontName="Helvetica-Bold", fontSize=8, leading=10,
                              textColor=HexColor("#64748b")),
            "kpi_label": S("KpiLabel",
                            fontName="Helvetica", fontSize=7.5, leading=9,
                            textColor=C_MUTED),
        }

    def _table_style(self, stripe=True):
        ts = [
            ("BACKGROUND",   (0, 0), (-1, 0),  C_MID),
            ("ALIGN",        (0, 0), (-1, -1), "LEFT"),
            ("VALIGN",       (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING",   (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
            ("LEFTPADDING",  (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("GRID",         (0, 0), (-1, -1), 0.4, C_BORDER),
            ("LINEBELOW",    (0, 0), (-1, 0),  0.8, C_ORANGE),
        ]
        if stripe:
            ts.append(("ROWBACKGROUNDS", (0, 1), (-1, -1),
                        [HexColor("#ffffff"), C_BG_ALT]))
        return TableStyle(ts)

    def _fmt_val(self, v, prefix="$", suffix=""):
        if v is None:
            return "N/A"
        if isinstance(v, float):
            if abs(v) >= 1_000_000:
                return f"{prefix}{v/1_000_000:.2f}M{suffix}"
            elif abs(v) >= 1_000:
                return f"{prefix}{v/1_000:.1f}K{suffix}"
            return f"{prefix}{v:,.2f}{suffix}"
        return f"{prefix}{v}{suffix}"

    # ── cover page (blank except decorations drawn by callback) ────────────

    def _build_section_header(self, title: str, styles: dict):
        """Builds a beautiful custom section header with an Indigo vertical accent bar and light gray background."""
        header_style = ParagraphStyle(
            "SectionHeaderStyle",
            parent=styles["h1"],
            spaceBefore=0,
            spaceAfter=0,
            textColor=C_MID
        )
        bar_table = Table(
            [[ "", Paragraph(title.upper(), header_style) ]],
            colWidths=[4, 500]
        )
        bar_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), C_INDIGO), # Indigo accent bar
            ('BACKGROUND', (1, 0), (1, 0), HexColor("#f8fafc")), # Light grey background
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (1, 0), (1, 0), 10),
            ('RIGHTPADDING', (1, 0), (1, 0), 6),
        ]))
        return KeepTogether([Spacer(1, 14), bar_table, Spacer(1, 8)])

    def _build_cover(self, styles):
        els = []
        # Push content down past the logo/header line
        els.append(Spacer(1, 150))

        # Title
        title_style = ParagraphStyle(
            "CoverTitle",
            fontName="Helvetica-Bold", fontSize=26, leading=30,
            textColor=C_WHITE, spaceAfter=8
        )
        # Subtitle
        sub_style = ParagraphStyle(
            "CoverSub",
            fontName="Helvetica", fontSize=10.5, leading=14,
            textColor=HexColor("#94a3b8"), spaceAfter=18
        )
        # Organization
        org_style = ParagraphStyle(
            "CoverOrg",
            fontName="Helvetica-Bold", fontSize=12, leading=16,
            textColor=HexColor("#6366f1"), spaceAfter=35
        )

        els.append(Paragraph(self.report_title.upper(), title_style))
        els.append(Paragraph("Systematic operations audit and performance risk analytics dashboard.", sub_style))
        els.append(Paragraph(f"AUDIT SPECIFICATION FOR:  {self.org_name.upper()}", org_style))
        
        # Divider line
        els.append(HRule(width=504, color=HexColor("#1f2937"), thickness=0.8))
        els.append(Spacer(1, 20))

        # Cover metadata table
        score_label = (
            "CRITICAL EXPOSURE" if self.score < 40 else
            "MARGIN COMPRESSION RISK" if self.score < 60 else
            "STABLE PARAMETERS" if self.score < 80 else "OPTIMAL EFFICIENCY"
        )
        score_color = "#f43f5e" if self.score < 40 else "#ea580c" if self.score < 60 else "#10b981"
        
        cover_rows = [
            ["REPORT GENERATION DATE", self.generated_at],
            ["SECURITY CLASSIFICATION", "CONFIDENTIAL // INTERNAL EXECUTIVE DISTRIBUTION ONLY"],
            ["COMPOSITE HEALTH SCORE", f"{self.score:.1f} / 100   (<font color='{score_color}'><b>{score_label}</b></font>)"],
            ["SYSTEM AUDITOR ENGINE", "OPERON COGNITIVE PLATFORM (v2.1 EXECUTIVE AGENT)"],
        ]
        if self.query:
            truncated_query = self.query[:80] + ("..." if len(self.query) > 80 else "")
            cover_rows.append(["INPUT BUSINESS QUERY", truncated_query.upper()])

        lbl_st = ParagraphStyle("cl", fontName="Helvetica-Bold", fontSize=7.5, textColor=HexColor("#4f46e5"))
        val_st = ParagraphStyle("cv", fontName="Helvetica-Bold", fontSize=8, textColor=HexColor("#e2e8f0"))
        
        rows = [[Paragraph(r[0], lbl_st), Paragraph(r[1], val_st)] for r in cover_rows]
        t = Table(rows, colWidths=[150, 354])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), HexColor("#0c1017")),
            ("TOPPADDING",    (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING",   (0, 0), (-1, -1), 12),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
            ("ALIGN",         (0, 0), (-1, -1), "LEFT"),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("GRID",          (0, 0), (-1, -1), 0.5, HexColor("#1f2937")),
        ]))
        
        els.append(KeepTogether([t]))
        els.append(PageBreak())
        return els

    # ── KPI Scorecards ─────────────────────────────────────────────────────

    def _build_kpi_row(self):
        rev = self.metrics.get("revenue", {})
        cost = self.metrics.get("cost", {})
        cust = self.metrics.get("customers", {})
        kpis = self.advanced_stats.get("kpis", {})

        total_rev   = rev.get("total_revenue", 0)
        total_cost  = cost.get("total_cost", 0)
        gm          = cost.get("gross_margin", 0) * 100
        growth      = rev.get("revenue_growth", 0) * 100
        net         = total_rev - total_cost
        n_cust      = int(cust.get("total_customers", 0))
        aov         = kpis.get("aov", 0)

        cards = [
            ("Total Revenue",     self._fmt_val(total_rev),          f"{growth:+.1f}%"),
            ("Net Contribution",  self._fmt_val(net),                 None),
            ("Gross Margin",      f"{gm:.1f}%",                       None),
            ("Avg Order Value",   self._fmt_val(aov),                 None),
        ]
        return KPIRow(cards, total_width=504)

    def _build_kpi_row2(self):
        cost = self.metrics.get("cost", {})
        cust = self.metrics.get("customers", {})
        kpis = self.advanced_stats.get("kpis", {})
        rev  = self.metrics.get("revenue", {})

        top_conc    = cust.get("top_customer_concentration", 0) * 100
        n_cust      = int(cust.get("total_customers", 0))
        leakage     = kpis.get("cost_leakage_ratio", 0) * 100
        n_anom      = len(self.advanced_stats.get("anomalies", []))
        total_cost  = cost.get("total_cost", 0)
        total_rev   = rev.get("total_revenue", 0)

        cards = [
            ("Unique Customers",  str(n_cust),                        None),
            ("Top Acct Conc.",    f"{top_conc:.1f}%",                  "+risk" if top_conc > 40 else ""),
            ("Cost Leakage",      f"{leakage:.1f}%",                   "+risk" if leakage > 5 else ""),
            ("Anomalies Found",   str(n_anom),                         "+review" if n_anom > 0 else ""),
        ]
        return KPIRow(cards, total_width=504)

    # ── Revenue & Cost Chart ───────────────────────────────────────────────

    def _build_monthly_chart(self):
        monthly = self.advanced_stats.get("monthly_trend", [])
        if not monthly:
            return None
        data = [
            {
                "label": m.get("name", "")[:5],
                "value": m.get("revenue", 0),
                "value2": m.get("cost", 0)
            }
            for m in monthly[-12:]
        ]
        max_v = max((d["value"] for d in data), default=1)
        max_v = max(max_v, max((d["value2"] for d in data), default=1))
        return InlineBarChart(
            data,
            title="Monthly Revenue vs Cost  (Last 12 Months)",
            bar_color=C_ORANGE,
            bar_color2=HexColor("#334155"),
            width=504, height=130,
            max_val=max_v * 1.1,
            value_prefix="$",
            show_legend=True,
            label2="Cost"
        )

    def _build_forecast_chart(self):
        forecast = self.advanced_stats.get("forecast_trend", [])
        if not forecast:
            return None
        data = [
            {
                "label": f.get("name", "")[:5],
                "value": f.get("revenue", 0),
                "value2": f.get("cost", 0)
            }
            for f in forecast[:6]
        ]
        max_v = max((max(d["value"], d["value2"]) for d in data), default=1)
        return InlineBarChart(
            data,
            title="6-Month Revenue & Cost Forecast  (Linear Regression)",
            bar_color=HexColor("#16a34a"),
            bar_color2=HexColor("#dc2626"),
            width=504, height=110,
            max_val=max_v * 1.15,
            value_prefix="$",
            show_legend=True,
            label2="Est. Cost"
        )

    def _build_revenue_sparkline(self):
        monthly = self.advanced_stats.get("monthly_trend", [])
        if len(monthly) < 3:
            return None
        vals = [m.get("revenue", 0) for m in monthly[-12:]]
        return MiniTrendLine(
            vals, width=504, height=50,
            color=C_ORANGE, fill_color=HexColor("#fff7ed"),
            title="Revenue Trend Sparkline"
        )

    # ── Summary Section ────────────────────────────────────────────────────

    def _build_summary_section(self, styles):
        els = []
        els.append(Paragraph("Executive Summary", styles["h1"]))
        els.append(HRule())
        for para in self.summary.split("\n\n"):
            para = para.strip()
            if para:
                lines = para.split("\n")
                if any(line.strip().startswith(('•', '-', '*')) for line in lines):
                    for line in lines:
                        line_strip = line.strip()
                        if line_strip.startswith(('•', '-', '*')):
                            clean_line = line_strip.lstrip('•-* ').strip()
                            els.append(Paragraph(clean_line, styles["bullet"]))
                        else:
                            els.append(Paragraph(line_strip, styles["normal"]))
                else:
                    els.append(Paragraph(para, styles["normal"]))
        els.append(Spacer(1, 6))
        return els

    # ── Pain Points ────────────────────────────────────────────────────────

    def _build_pain_points(self, styles):
        if not self.pain_points:
            return []
        els = []
        els.append(Paragraph("Identified Operational Pain Points", styles["h1"]))
        els.append(HRule())
        for i, pt in enumerate(self.pain_points, 1):
            els.append(Paragraph(f"<b>{i}.</b>&nbsp;&nbsp;{pt}", styles["bullet"]))
        els.append(Spacer(1, 6))
        return els

    # ── Recommendations ────────────────────────────────────────────────────

    def _build_actions(self, styles):
        if not self.actions:
            return []
        els = []
        els.append(Paragraph("Strategic Implementation Roadmap", styles["h1"]))
        els.append(HRule())
        
        # Group actions by operational phase
        phases = [
            ("PHASE 1: Immediate Containment (Days 1–30)", [act for i, act in enumerate(self.actions) if i < 2], "#dc2626"),
            ("PHASE 2: Tactical Optimization (Days 31–60)", [act for i, act in enumerate(self.actions) if 2 <= i < 5], "#ea580c"),
            ("PHASE 3: Structural Leverage (Days 61–90)", [act for i, act in enumerate(self.actions) if i >= 5], "#16a34a"),
        ]
        
        rows = []
        for phase_title, phase_actions, p_color in phases:
            if not phase_actions:
                continue
            # Phase Title Header Row
            rows.append([
                Paragraph(f"<font color='{p_color}'><b>{phase_title}</b></font>", styles["th"]),
                Paragraph("", styles["th"])
            ])
            # Actions under this phase
            for act in phase_actions:
                bullet_pt = f"<font color='{p_color}'><b>•</b></font>"
                rows.append([
                    Paragraph(bullet_pt, styles["td_small"]),
                    Paragraph(act, styles["td"])
                ])
                
        t = Table(rows, colWidths=[20, 484])
        ts = TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("LINEBELOW", (0, 0), (-1, -1), 0.5, C_BORDER),
        ])
        
        row_idx = 0
        for phase_title, phase_actions, p_color in phases:
            if not phase_actions:
                continue
            ts.add("SPAN", (0, row_idx), (1, row_idx))
            ts.add("BACKGROUND", (0, row_idx), (-1, row_idx), HexColor("#f8fafc"))
            ts.add("LINEBELOW", (0, row_idx), (-1, row_idx), 1, p_color)
            row_idx += len(phase_actions) + 1
            
        t.setStyle(ts)
        els.append(t)
        els.append(Spacer(1, 10))
        return els

    # ── Conclusions ────────────────────────────────────────────────────────

    def _build_conclusions(self, styles):
        if not self.conclusions:
            return []
        els = []
        els.append(Paragraph("Conclusions & Strategic Outlook", styles["h1"]))
        els.append(HRule())
        for para in self.conclusions.split("\n\n"):
            para = para.strip()
            if para:
                lines = para.split("\n")
                if any(line.strip().startswith(('•', '-', '*')) for line in lines):
                    for line in lines:
                        line_strip = line.strip()
                        if line_strip.startswith(('•', '-', '*')):
                            clean_line = line_strip.lstrip('•-* ').strip()
                            els.append(Paragraph(clean_line, styles["bullet"]))
                        else:
                            els.append(Paragraph(line_strip, styles["normal"]))
                else:
                    els.append(Paragraph(para, styles["normal"]))
        els.append(Spacer(1, 8))
        return els

    # ── Advanced Analytics ─────────────────────────────────────────────────

    def _build_projections_table(self, styles):
        projections = self.advanced_stats.get("forecast_trend", [])
        els = []
        els.append(Paragraph("6-Month Financial Projections  (Linear Regression Model)", styles["h2"]))

        if not projections:
            els.append(Paragraph("<i>Insufficient time-series data to construct regression projections.</i>", styles["normal"]))
            return els

        rows = [[
            Paragraph("<b>Period</b>", styles["th"]),
            Paragraph("<b>Proj. Revenue</b>", styles["th"]),
            Paragraph("<b>Est. Cost</b>", styles["th"]),
            Paragraph("<b>Net Margin</b>", styles["th"]),
            Paragraph("<b>Margin %</b>", styles["th"]),
            Paragraph("<b>YoY Signal</b>", styles["th"]),
        ]]
        for i, item in enumerate(projections[:6]):
            rev  = item.get("revenue", 0) or 0
            cost = item.get("cost", 0) or 0
            net  = rev - cost
            m_pct = (net / rev * 100) if rev > 0 else 0
            signal = "▲ Growth" if i > 0 and rev > projections[i-1].get("revenue", 0) else "▼ Decline"
            sig_color = "#16a34a" if "Growth" in signal else "#dc2626"

            rows.append([
                Paragraph(item.get("name", "N/A"), styles["td"]),
                Paragraph(self._fmt_val(rev), styles["td"]),
                Paragraph(self._fmt_val(cost), styles["td"]),
                Paragraph(self._fmt_val(net), styles["td"]),
                Paragraph(f"{m_pct:.1f}%", styles["td"]),
                Paragraph(f"<font color='{sig_color}'>{signal}</font>", styles["td"]),
            ])

        t = Table(rows, colWidths=[72, 80, 80, 80, 60, 132])
        t.setStyle(self._table_style())
        els.append(t)
        return els

    def _build_correlation_table(self, styles):
        corr_data = self.advanced_stats.get("correlations", {})
        els = []
        els.append(Paragraph("Pearson Correlation Analysis  (Key Financial Relationships)", styles["h2"]))

        relations = [
            ("qty_rev",   "Quantity Sold → Revenue",
             "Measures demand scaling behaviour — high positive correlation confirms price-driven volume elasticity is the primary revenue growth lever."),
            ("price_qty", "Unit Price → Quantity Sold",
             "A negative value confirms standard inverse price-demand dynamics; high negative suggests aggressive volume discounting may be occurring."),
            ("cost_rev",  "Total Cost → Revenue",
             "Measures variable cost coupling — a high positive value (>0.85) indicates near-fully variable cost structure with minimal fixed-cost operating leverage."),
            ("rev_profit","Revenue → Net Profit",
             "Confirms whether top-line growth converts proportionally to bottom-line; low values indicate margin leakage is absorbing revenue gains."),
        ]

        if not corr_data:
            els.append(Paragraph("<i>Correlation analysis requires sufficient numerical data across multiple columns.</i>", styles["normal"]))
            return els

        rows = [[
            Paragraph("<b>Financial Relationship</b>", styles["th"]),
            Paragraph("<b>Pearson r</b>", styles["th"]),
            Paragraph("<b>Strength Classification</b>", styles["th"]),
            Paragraph("<b>Analytical Interpretation</b>", styles["th"]),
        ]]
        for key, name, desc in relations:
            val = corr_data.get(key)
            if val is None:
                continue
            abs_v = abs(val)
            if abs_v >= 0.7:
                strength = "Strong Positive" if val > 0 else "Strong Negative"
                color    = "#16a34a" if (key == "rev_profit" and val > 0) else "#dc2626" if (key == "cost_rev" and val > 0.85) else "#334155"
            elif abs_v >= 0.4:
                strength = "Moderate Positive" if val > 0 else "Moderate Negative"
                color    = "#ea580c"
            else:
                strength = "Weak / Negligible"
                color    = "#64748b"

            rows.append([
                Paragraph(name, styles["td"]),
                Paragraph(f"<b>{val:+.3f}</b>", styles["td"]),
                Paragraph(f"<font color='{color}'><b>{strength}</b></font>", styles["td_small"]),
                Paragraph(desc, styles["td_small"]),
            ])

        t = Table(rows, colWidths=[120, 60, 100, 224])
        t.setStyle(self._table_style())
        els.append(t)
        return els

    def _build_kpi_detail_table(self, styles):
        kpis = self.advanced_stats.get("kpis", {})
        if not kpis:
            return []

        els = []
        els.append(Paragraph("Derived KPI Reference Table", styles["h2"]))

        rev  = self.metrics.get("revenue", {})
        cost = self.metrics.get("cost", {})
        cust = self.metrics.get("customers", {})
        total_rev  = rev.get("total_revenue", 0)
        total_cost = cost.get("total_cost", 0)
        net        = total_rev - total_cost

        kpi_definitions = [
            ("Total Revenue",              self._fmt_val(total_rev),
             "Aggregate of all recognised revenue transactions in the review period."),
            ("Total Operating Cost",       self._fmt_val(total_cost),
             "Sum of all direct and indirect cost line items recorded in the ledger."),
            ("Net Operating Contribution", self._fmt_val(net),
             "Revenue minus all direct costs before G&A and tax adjustments."),
            ("Gross Margin %",             f"{cost.get('gross_margin', 0)*100:.2f}%",
             "Net contribution as a percentage of total revenue — primary profitability indicator."),
            ("Revenue Growth (MoM)",       f"{rev.get('revenue_growth', 0)*100:+.2f}%",
             "Period-over-period top-line revenue movement comparing the latest two tracked months."),
            ("Average Order Value (AOV)",  self._fmt_val(kpis.get("aov", 0)),
             "Mean transaction value; benchmark for pricing adequacy and upsell performance."),
            ("HHI Customer Dependency",    f"{kpis.get('hhi_dependency', 0):.4f}",
             "Herfindahl-Hirschman Index for revenue concentration — >0.25 signals high client risk."),
            ("Cost Leakage Ratio",         f"{kpis.get('cost_leakage_ratio', 0)*100:.2f}%",
             "Share of transactions exhibiting abnormal cost-to-revenue ratios (Z-score outliers)."),
            ("Top Customer Concentration", f"{cust.get('top_customer_concentration', 0)*100:.1f}%",
             "Revenue share attributable to the single largest client — key revenue-at-risk metric."),
        ]

        rows = [[
            Paragraph("<b>KPI Metric</b>", styles["th"]),
            Paragraph("<b>Measured Value</b>", styles["th"]),
            Paragraph("<b>Definition & Operational Relevance</b>", styles["th"]),
        ]]
        for kpi_name, kpi_val, kpi_def in kpi_definitions:
            rows.append([
                Paragraph(f"<b>{kpi_name}</b>", styles["td"]),
                Paragraph(kpi_val, styles["td"]),
                Paragraph(kpi_def, styles["td_small"]),
            ])

        t = Table(rows, colWidths=[140, 100, 264])
        t.setStyle(self._table_style())
        els.append(t)
        return els

    def _build_anomaly_table(self, styles):
        anomalies = self.advanced_stats.get("anomalies", [])
        els = []
        els.append(Paragraph("Anomaly Detection Log  (Z-Score Statistical Outliers)", styles["h2"]))
        els.append(Paragraph(
            "The following ledger entries were flagged as statistical anomalies using Z-score analysis "
            "(|Z| > 2.0 threshold). Each entry represents a data point deviating significantly from the "
            "population mean, indicating potential billing errors, pricing deviations, cost overruns, or fraud risk.",
            styles["normal"]
        ))

        rows = [[
            Paragraph("<b>Date</b>", styles["th"]),
            Paragraph("<b>Product / Customer</b>", styles["th"]),
            Paragraph("<b>Anomaly Type</b>", styles["th"]),
            Paragraph("<b>Severity</b>", styles["th"]),
            Paragraph("<b>Est. Impact</b>", styles["th"]),
            Paragraph("<b>Statistical Finding</b>", styles["th"]),
        ]]

        if not anomalies:
            rows.append([
                Paragraph("—", styles["td"]),
                Paragraph("No anomalies detected across the dataset", styles["td"]),
                Paragraph("—", styles["td"]),
                Paragraph("<font color='#16a34a'><b>CLEAN</b></font>", styles["td"]),
                Paragraph("$0.00", styles["td"]),
                Paragraph(
                    "Statistical Z-score analysis did not identify any unit price, cost ratio, or billing outliers "
                    "exceeding the ±2σ detection threshold in the filtered transaction ledger.",
                    styles["td_small"]
                ),
            ])
        else:
            for anom in anomalies[:8]:
                sev       = anom.get("severity", "medium").upper()
                sev_color = "#dc2626" if sev == "CRITICAL" else "#ea580c" if sev == "HIGH" else "#d97706"
                impact    = anom.get("impact", 0)
                product   = anom.get("product") or "–"
                customer  = anom.get("customer") or "–"
                target    = f"{product}<br/><font color='#64748b'>{customer}</font>"

                rows.append([
                    Paragraph(str(anom.get("date", "N/A")), styles["td_small"]),
                    Paragraph(target, styles["td_small"]),
                    Paragraph(anom.get("title", "Outlier"), styles["td_small"]),
                    Paragraph(f"<font color='{sev_color}'><b>{sev}</b></font>", styles["td_small"]),
                    Paragraph(f"${impact:,.2f}" if impact else "N/A", styles["td_small"]),
                    Paragraph(anom.get("description", "No details")[:160], styles["td_small"]),
                ])

        t = Table(rows, colWidths=[56, 90, 80, 56, 60, 162])
        t.setStyle(self._table_style())
        els.append(t)
        return els

    def _build_monthly_breakdown_table(self, styles):
        monthly = self.advanced_stats.get("monthly_trend", [])
        if not monthly:
            return []
        els = []
        els.append(Paragraph("Historical Monthly Performance Breakdown", styles["h2"]))

        rows = [[
            Paragraph("<b>Period</b>", styles["th"]),
            Paragraph("<b>Revenue</b>", styles["th"]),
            Paragraph("<b>Cost</b>", styles["th"]),
            Paragraph("<b>Net Margin</b>", styles["th"]),
            Paragraph("<b>Margin %</b>", styles["th"]),
            Paragraph("<b>MoM Δ Revenue</b>", styles["th"]),
        ]]
        prev_rev = None
        for m in monthly:
            rev  = m.get("revenue", 0) or 0
            cost = m.get("cost", 0) or 0
            net  = rev - cost
            m_pct = (net / rev * 100) if rev > 0 else 0
            if prev_rev is not None and prev_rev > 0:
                delta_pct = (rev - prev_rev) / prev_rev * 100
                delta_str = f"<font color='{'#16a34a' if delta_pct >= 0 else '#dc2626'}'>{delta_pct:+.1f}%</font>"
            else:
                delta_str = "—"
            prev_rev = rev

            rows.append([
                Paragraph(m.get("name", ""), styles["td"]),
                Paragraph(self._fmt_val(rev), styles["td"]),
                Paragraph(self._fmt_val(cost), styles["td"]),
                Paragraph(self._fmt_val(net), styles["td"]),
                Paragraph(f"{m_pct:.1f}%", styles["td"]),
                Paragraph(delta_str, styles["td"]),
            ])

        t = Table(rows, colWidths=[72, 80, 80, 80, 62, 130])
        t.setStyle(self._table_style())
        els.append(t)
        return els

    def _build_health_score_breakdown(self, styles):
        cats = self.health_score_detail.get("categories", {})
        els = []
        els.append(Paragraph("Health Score Component Analysis", styles["h2"]))

        rows = [[
            Paragraph("<b>Category</b>", styles["th"]),
            Paragraph("<b>Score</b>", styles["th"]),
            Paragraph("<b>Benchmark</b>", styles["th"]),
            Paragraph("<b>Status</b>", styles["th"]),
            Paragraph("<b>Interpretation</b>", styles["th"]),
        ]]

        cat_meta = {
            "revenue":   ("Revenue Performance",   25, "Top-line growth, revenue trend, and consistency."),
            "customers": ("Customer Health",        25, "Concentration risk, unique client count, and churn."),
            "costs":     ("Cost Efficiency",        25, "Margin compression, leakage ratio, and COGS structure."),
            "products":  ("Product Performance",    25, "SKU diversification, product-level margin variance."),
        }
        for key, (label, max_score, interp) in cat_meta.items():
            score = cats.get(key, 0)
            ratio = score / max_score if max_score else 0
            status  = "HEALTHY" if ratio >= 0.7 else "AT RISK" if ratio >= 0.4 else "CRITICAL"
            s_color = "#16a34a" if ratio >= 0.7 else "#ea580c" if ratio >= 0.4 else "#dc2626"
            rows.append([
                Paragraph(f"<b>{label}</b>", styles["td"]),
                Paragraph(f"<b>{score:.1f}</b>/{max_score}", styles["td"]),
                Paragraph(f"{max_score}/100", styles["td"]),
                Paragraph(f"<font color='{s_color}'><b>{status}</b></font>", styles["td"]),
                Paragraph(interp, styles["td_small"]),
            ])

        # Totals row
        total_score = sum(cats.get(k, 0) for k in cat_meta)
        rows.append([
            Paragraph("<b>COMPOSITE SCORE</b>", styles["th"]),
            Paragraph(f"<b>{total_score:.1f}</b>/100", styles["th"]),
            Paragraph("100/100", styles["th"]),
            Paragraph("", styles["th"]),
            Paragraph("", styles["th"]),
        ])

        t = Table(rows, colWidths=[120, 70, 70, 80, 164])
        ts = self._table_style()
        ts.add("BACKGROUND", (0, len(rows)-1), (-1, len(rows)-1), HexColor("#1e293b"))
        t.setStyle(ts)
        els.append(t)
        return els

    # ── MAIN GENERATE ──────────────────────────────────────────────────────

    # ── MAIN GENERATE ──────────────────────────────────────────────────────

    def generate_pdf(self, output_path: str):
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            leftMargin=54,
            rightMargin=54,
            topMargin=70,
            bottomMargin=70
        )
        styles = self._styles()
        els    = []

        # ── COVER PAGE ──────────────────────────────────────────────────────
        els += self._build_cover(styles)

        # ── SECTION 1: KPI SNAPSHOT ──────────────────────────────────────
        els.append(self._build_section_header("Section 1 — Executive KPI Snapshot", styles))
        els.append(Paragraph(
            "The following Key Performance Indicators were derived mathematically from the full filtered transaction ledger. "
            "Values represent the aggregate position for the review period covered by this audit.",
            styles["normal"]
        ))
        els.append(Spacer(1, 8))
        els.append(self._build_kpi_row())
        els.append(Spacer(1, 8))
        els.append(self._build_kpi_row2())
        els.append(Spacer(1, 14))

        # Health Score Bar
        els.append(Paragraph(f"Composite Business Health Score: <b>{self.score:.1f}/100</b>", styles["h2"]))
        els.append(HealthScoreBar(self.score, width=504, height=16))
        els.append(Spacer(1, 4))
        cat_scores = self.health_score_detail.get("categories", {})
        els.append(Paragraph(
            f"Breakdown — Revenue: {cat_scores.get('revenue', 0):.1f}/25 | "
            f"Customers: {cat_scores.get('customers', 0):.1f}/25 | "
            f"Costs: {cat_scores.get('costs', 0):.1f}/25 | "
            f"Products: {cat_scores.get('products', 0):.1f}/25",
            styles["caption"]
        ))
        els.append(Spacer(1, 10))

        # ── SECTION 2: EXECUTIVE SUMMARY ────────────────────────────────
        els.append(self._build_section_header("Section 2 — Executive Summary", styles))
        els += self._build_summary_section(styles)[2:]  # skip duplicate h1 & hrule

        # ── SECTION 3: CHARTS ────────────────────────────────────────────
        monthly_chart = self._build_monthly_chart()
        if monthly_chart:
            chart_els = [
                self._build_section_header("Section 3 — Revenue & Cost Visualisation", styles),
                monthly_chart,
                Paragraph(
                    "Figure 1: Monthly Revenue (indigo) vs Operating Cost (dark) for the trailing 12-month period. "
                    "The vertical gap between bars represents gross margin generation per period.",
                    styles["caption"]
                ),
                Spacer(1, 10)
            ]
            spark = self._build_revenue_sparkline()
            if spark:
                chart_els += [
                    spark,
                    Paragraph(
                        "Figure 2: Revenue trend sparkline — trajectory and directional momentum across the review window.",
                        styles["caption"]
                    )
                ]
            els.append(KeepTogether(chart_els))
            els.append(Spacer(1, 12))

        # Forecast chart
        fc_chart = self._build_forecast_chart()
        if fc_chart:
            fc_els = [
                self._build_section_header("Section 4 — Forward-Looking Revenue Forecast", styles),
                Paragraph(
                    "The 6-month forward projections below are generated using ordinary least squares (OLS) linear regression "
                    "fitted to the historical monthly revenue and cost series. These projections assume continuation of "
                    "current structural trends and do not account for extraordinary market events.",
                    styles["normal"]
                ),
                Spacer(1, 8),
                fc_chart,
                Paragraph(
                    "Figure 3: 6-month linear regression forecast — projected revenue (green) vs estimated cost (red). "
                    "Widening gaps indicate margin expansion; converging bars signal compression risk.",
                    styles["caption"]
                )
            ]
            els.append(KeepTogether(fc_els))
            els.append(Spacer(1, 10))
            els += self._build_projections_table(styles)
            els.append(Spacer(1, 10))

        # ── SECTION 5: PAIN POINTS ───────────────────────────────────────
        if self.pain_points:
            pain_els = [
                self._build_section_header("Section 5 — Identified Operational Pain Points", styles)
            ]
            for i, pt in enumerate(self.pain_points, 1):
                pain_els.append(Paragraph(f"<b>{i}.</b>&nbsp;&nbsp;{pt}", styles["bullet"]))
            els.append(KeepTogether(pain_els))
            els.append(Spacer(1, 10))

        # ── SECTION 6: HEALTH SCORE BREAKDOWN ───────────────────────────
        if cat_scores:
            health_els = [
                self._build_section_header("Section 6 — Health Score Component Breakdown", styles)
            ]
            health_els += self._build_health_score_breakdown(styles)[1:]
            els.append(KeepTogether(health_els))
            els.append(Spacer(1, 10))

        # ── SECTION 7: ADVANCED ANALYTICS ───────────────────────────────
        els.append(self._build_section_header("Section 7 — Advanced Quantitative Analysis", styles))
        els.append(Paragraph(
            "This section presents the full suite of statistical computations performed against the filtered ledger. "
            "All calculations are executed in Python using NumPy and SciPy; the AI is used exclusively for "
            "interpreting results, not for generating figures.",
            styles["normal"]
        ))
        els.append(Spacer(1, 8))

        # KPI Detail
        els.append(KeepTogether([
            Paragraph("<b>KPI Calculation Detail</b>", styles["h2"]),
            Spacer(1, 4)
        ] + self._build_kpi_detail_table(styles)))
        els.append(Spacer(1, 10))

        # Monthly Breakdown Table
        els.append(KeepTogether([
            Paragraph("<b>Historical Monthly Breakdown</b>", styles["h2"]),
            Spacer(1, 4)
        ] + self._build_monthly_breakdown_table(styles)))
        els.append(Spacer(1, 10))

        # Correlation Table
        els.append(KeepTogether([
            Paragraph("<b>Pearson Correlation Analysis</b>", styles["h2"]),
            Spacer(1, 4)
        ] + self._build_correlation_table(styles)))
        els.append(Spacer(1, 10))

        # Anomaly Table
        els.append(KeepTogether([
            Paragraph("<b>Statistical Transaction Anomalies</b>", styles["h2"]),
            Spacer(1, 4)
        ] + self._build_anomaly_table(styles)))
        els.append(Spacer(1, 10))

        # ── SECTION 8: STRATEGIC RECOMMENDATIONS ────────────────────────
        if self.actions:
            rec_els = [
                self._build_section_header("Section 8 — Strategic Recommendations & Action Plan", styles)
            ]
            rec_els += self._build_actions(styles)[2:]  # skip duplicate h1 & hrule
            els.append(KeepTogether(rec_els))
            els.append(Spacer(1, 8))

        # ── SECTION 9: CONCLUSIONS ───────────────────────────────────────
        if self.conclusions:
            conclusion_els = [
                self._build_section_header("Section 9 — Conclusions & Strategic Outlook", styles)
            ]
            conclusion_els += self._build_conclusions(styles)[2:]  # skip duplicate h1 & hrule
            els.append(KeepTogether(conclusion_els))

        # ── DISCLAIMER FOOTER ─────────────────────────────────────────────
        els.append(Spacer(1, 20))
        els.append(HRule(color=HexColor("#334155")))
        els.append(Spacer(1, 6))
        els.append(Paragraph(
            "<b>Disclaimer:</b> This report was generated by the Operon COO Intelligence Platform using statistical "
            "analysis of uploaded ledger data. Projections are based on linear regression models and historical trends. "
            "All financial figures are sourced directly from the organisation's uploaded dataset. "
            "This document is classified as confidential and intended for internal executive use only. "
            "Operon accepts no liability for decisions made solely on the basis of this automated analysis.",
            ParagraphStyle("Disclaimer", fontName="Helvetica", fontSize=7.5, leading=10,
                           textColor=C_MUTED, spaceAfter=4)
        ))

        # ── BUILD ──────────────────────────────────────────────────────────
        page_counter = [0]

        def on_page(canvas, doc):
            page_counter[0] += 1
            if page_counter[0] == 1:
                draw_cover_page(canvas, doc)
            else:
                draw_inner_page(canvas, doc)

        doc.build(els, onFirstPage=on_page, onLaterPages=on_page)
        return output_path
