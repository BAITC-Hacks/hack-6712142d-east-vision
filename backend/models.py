from typing import Any, Literal

from pydantic import BaseModel


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


class SimulateResponse(BaseModel):
    valid: bool
    used_budget: int
    remaining_budget: int
    decisions: list[Decision]
    final_districts: dict[str, Any]
    score: ScoreResponse
    ai_summary: str
