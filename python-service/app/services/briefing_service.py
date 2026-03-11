from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.briefing import Briefing
from app.models.briefing_point import BriefingPoint
from app.models.briefing_risk import BriefingRisk
from app.models.briefing_metric import BriefingMetric
from app.schemas.briefing import BriefingCreate
from app.services.report_formatter import ReportFormatter


def create_briefing(db: Session, briefing_in: BriefingCreate) -> Briefing:
    """Create a new briefing with related points, risks, and metrics."""
    briefing = Briefing(
        company_name=briefing_in.companyName,
        ticker=briefing_in.ticker.upper(),
        sector=briefing_in.sector,
        analyst_name=briefing_in.analystName,
        summary=briefing_in.summary,
        recommendation=briefing_in.recommendation,
        key_points=[BriefingPoint(content=c) for c in briefing_in.keyPoints],
        risks=[BriefingRisk(content=c) for c in briefing_in.risks],
        metrics=[BriefingMetric(name=m["name"], value=m["value"]) for m in briefing_in.metrics] if briefing_in.metrics else [],
    )
    db.add(briefing)
    db.commit()
    db.refresh(briefing)
    return briefing


def get_briefing(db: Session, briefing_id: int) -> Briefing:
    """Retrieve a briefing by ID."""
    return db.query(Briefing).filter(Briefing.id == briefing_id).first()


def generate_briefing_report(db: Session, briefing_id: int) -> Briefing:
    """Generate and render HTML report for a briefing."""
    briefing = get_briefing(db, briefing_id)
    if not briefing:
        raise ValueError(f"Briefing with id {briefing_id} not found")
    
    # Update briefing with generated flag and timestamp
    briefing.generated = True
    briefing.generated_at = datetime.now(timezone.utc)
    
    # Create formatter and transform briefing data
    formatter = ReportFormatter()
    view_model = formatter.format_briefing_to_view(briefing)
    
    # Render HTML
    html_content = formatter.render_briefing_report(view_model)
    
    briefing.html_content = html_content
    
    db.add(briefing)
    db.commit()
    db.refresh(briefing)
    
    return briefing


def get_briefing_html(db: Session, briefing_id: int) -> str:
    """Retrieve the rendered HTML for a briefing."""
    briefing = get_briefing(db, briefing_id)
    if not briefing:
        raise ValueError(f"Briefing with id {briefing_id} not found")
    
    if not briefing.generated or not hasattr(briefing, 'html_content') or not briefing.html_content:
        raise ValueError(f"Briefing {briefing_id} has not been generated yet. Call generate endpoint first.")
    
    return briefing.html_content