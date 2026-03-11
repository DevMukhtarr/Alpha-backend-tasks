from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Dict, Any

from jinja2 import Environment, FileSystemLoader, select_autoescape

_TEMPLATE_DIR = Path(__file__).resolve().parents[1] / "templates"


class ReportFormatter:
    """Formatter utility for report generation and HTML rendering."""

    def __init__(self) -> None:
        self._env = Environment(
            loader=FileSystemLoader(str(_TEMPLATE_DIR)),
            autoescape=select_autoescape(enabled_extensions=("html", "xml"), default_for_string=True),
        )

    def render_briefing_report(self, briefing_view: Dict[str, Any]) -> str:
        """Render a full briefing report from a view model."""
        template = self._env.get_template("briefing_report.html")
        return template.render(**briefing_view)

    def render_base(self, title: str, body: str) -> str:
        template = self._env.get_template("base.html")
        return template.render(title=title, body=body, generated_at=self.generated_timestamp())

    @staticmethod
    def generated_timestamp() -> str:
        return datetime.now(timezone.utc).isoformat()
    
    @staticmethod
    def format_briefing_to_view(briefing: Any) -> Dict[str, Any]:
        """Transform database briefing record into report view model."""
        metrics_dict = {}
        if briefing.metrics:
            for metric in sorted(briefing.metrics, key=lambda m: m.name):
                metrics_dict[metric.name] = metric.value
        
        key_points = [point.content for point in sorted(briefing.key_points, key=lambda p: p.display_order)]
        risks = [risk.content for risk in sorted(briefing.risks, key=lambda r: r.display_order)]
        
        return {
            "id": briefing.id,
            "company_name": briefing.company_name,
            "ticker": briefing.ticker.upper(),
            "sector": briefing.sector or "N/A",
            "analyst_name": briefing.analyst_name or "Unknown Analyst",
            "summary": briefing.summary,
            "recommendation": briefing.recommendation,
            "key_points": key_points,
            "risks": risks,
            "metrics": metrics_dict,
            "generated_at": briefing.generated_at.isoformat() if briefing.generated_at else "",
            "created_at": briefing.created_at.isoformat() if briefing.created_at else "",
        }
