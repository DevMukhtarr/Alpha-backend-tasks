from datetime import datetime
from typing import List
from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Briefing(Base):
    __tablename__ = "briefings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    ticker: Mapped[str] = mapped_column(String(20), nullable=False)
    sector: Mapped[str | None] = mapped_column(String(100), nullable=True)
    analyst_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    recommendation: Mapped[str] = mapped_column(Text, nullable=False)
    generated: Mapped[bool] = mapped_column(default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    html_content: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    key_points: Mapped[List["BriefingPoint"]] = relationship(
        "BriefingPoint", back_populates="briefing", cascade="all, delete-orphan"
    )
    risks: Mapped[List["BriefingRisk"]] = relationship(
        "BriefingRisk", back_populates="briefing", cascade="all, delete-orphan"
    )
    metrics: Mapped[List["BriefingMetric"]] = relationship(
        "BriefingMetric", back_populates="briefing", cascade="all, delete-orphan"
    )