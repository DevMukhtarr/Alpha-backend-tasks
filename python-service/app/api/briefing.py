from typing import Annotated

from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.briefing import BriefingCreate, BriefingRead
from app.services.briefing_service import (
    create_briefing,
    get_briefing,
    generate_briefing_report,
    get_briefing_html,
)


router = APIRouter(prefix="/briefings", tags=["briefings"])


@router.post("", response_model=BriefingRead, status_code=status.HTTP_201_CREATED)
def create_briefing_controller(
    payload: BriefingCreate,
    db: Session = Depends(get_db),
):
    """Create a new briefing."""
    briefing = create_briefing(db, payload)
    return briefing


@router.get("/{briefing_id}", response_model=BriefingRead)
def retrieve_briefing_controller(
    briefing_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve a briefing by ID."""
    briefing = get_briefing(db, briefing_id)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return briefing


@router.post("/{briefing_id}/generate", response_model=BriefingRead)
def generate_report_controller(
    briefing_id: int,
    db: Session = Depends(get_db),
):
    """Generate HTML report for a briefing."""
    try:
        briefing = generate_briefing_report(db, briefing_id)
        return briefing
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{briefing_id}/html", response_class=HTMLResponse)
def get_html_controller(
    briefing_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve rendered HTML for a briefing."""
    try:
        html_content = get_briefing_html(db, briefing_id)
        return html_content
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))