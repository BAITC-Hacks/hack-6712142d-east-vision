from typing import Any, Literal

from pydantic import BaseModel, Field


class Decision(BaseModel):
    initiative_id: str
    district: str | None = None


class SimulateRequest(BaseModel):
    decisions: list[Decision]


class Initiative(BaseModel):
    id: str
    category: str
    name: str
    type: Literal["district", "city"]
    cost: int
    lag: int
    effects: dict[str, float]


class DataResponse(BaseModel):
    districts: dict[str, Any]
    indicators: dict[str, str]
    initiatives: list[Initiative]
    budget: int


class ScoreResponse(BaseModel):
    district_scores: dict[str, float]
    d_avg: float
    n_crit: int
    score: float


class IndicatorChange(BaseModel):
    before: float
    after: float
    delta: float


class CriticalIndicator(BaseModel):
    district: str
    indicator: str
    value: float


class AppliedSynergy(BaseModel):
    initiatives: list[str]
    district: str
    indicator: str
    bonus: float


class InitiativeContribution(BaseModel):
    initiative_id: str
    initiative_name: str
    district: str | None
    scope: Literal["district", "city"]
    applied_effects: dict[str, float]


class AIAnalysis(BaseModel):
    summary: str
    strengths: list[str] = Field(max_length=3)
    risks: list[str] = Field(max_length=3)
    tradeoffs: list[str] = Field(max_length=3)
    recommendations: list[str] = Field(max_length=3)


class SimulateResponse(BaseModel):
    valid: bool
    used_budget: int
    remaining_budget: int
    baseline_score: float
    final_score: float
    score_delta: float
    decisions: list[Decision]
    final_districts: dict[str, Any]
    changes: dict[str, dict[str, IndicatorChange]]
    critical_indicators: list[CriticalIndicator]
    applied_synergies: list[AppliedSynergy]
    initiative_contributions: list[InitiativeContribution]
    score: ScoreResponse
    ai_summary: str
    ai_analysis: AIAnalysis
