from fastapi import APIRouter, HTTPException

from data import BUDGET, DISTRICTS, INDICATORS, INITIATIVES
from models import DataResponse, SimulateRequest, SimulateResponse
from scenario_service import simulate_scenario
from validator import DecisionValidationError

router = APIRouter()


@router.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@router.get("/api/data", response_model=DataResponse)
def get_data() -> dict:
    return {
        "districts": DISTRICTS,
        "indicators": INDICATORS,
        "initiatives": list(INITIATIVES.values()),
        "budget": BUDGET,
    }


@router.post("/api/simulate", response_model=SimulateResponse)
def simulate(payload: SimulateRequest) -> dict:
    try:
        return simulate_scenario(payload.decisions)
    except DecisionValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
