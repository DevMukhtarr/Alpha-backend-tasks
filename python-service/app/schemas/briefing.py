from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from typing import List, Optional, Annotated, Any

class BriefingRead(BaseModel):
    id: int                       
    company_name: str
    ticker: str
    sector: str
    analyst_name: str
    summary: str
    recommendation: str
    key_points: List[str]
    risks: List[str]
    metrics: Optional[dict] = None

    model_config = {"from_attributes": True}

    @field_validator("key_points", mode="before")
    @classmethod
    def extract_key_points(cls, v: Any) -> List[str]:
        if v and not isinstance(v[0], str):
            return [point.content for point in v]
        return v

    @field_validator("risks", mode="before")
    @classmethod
    def extract_risks(cls, v: Any) -> List[str]:
        if v and not isinstance(v[0], str):
            return [risk.content for risk in v]
        return v

    @field_validator("metrics", mode="before")
    @classmethod
    def extract_metrics(cls, v: Any) -> Optional[dict]:
        if isinstance(v, list) and v:
            return {m.name: m.value for m in v}
        return v

class BriefingCreate(BaseModel):
    companyName: str
    ticker: str
    sector: str
    analystName: str
    summary: str
    recommendation: str
    keyPoints: List[str] = Field(..., min_length=2)
    risks: List[str] = Field(..., min_length=1)
    metrics: Optional[List[dict]] = None

    model_config = ConfigDict(populate_by_name=True)

    # Normalize ticker to uppercase
    @field_validator("ticker")
    @classmethod
    def ticker_uppercase(cls, v: str) -> str:
        if not v:
            raise ValueError("Ticker is required")
        return v.upper()
    
    @model_validator(mode="after")
    def validate_metrics_unique(self):
        if self.metrics:
            metric_names = [m.get("name") for m in self.metrics if "name" in m]
            if len(metric_names) != len(set(metric_names)):
                raise ValueError("Metric names must be unique")
        return self