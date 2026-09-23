from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from ai_service import build_ai_summary
from data import BUDGET, DISTRICTS, INDICATORS, INITIATIVES
from models import DataResponse, SimulateRequest, SimulateResponse
from score import calculate_score
from simulation import run_simulation
from validator import DecisionValidationError, validate_decisions

app = FastAPI(title="Аким на 5 часов")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/data", response_model=DataResponse)
def get_data() -> dict:
    return {
        "districts": DISTRICTS,
        "indicators": INDICATORS,
        "initiatives": list(INITIATIVES.values()),
        "budget": BUDGET,
    }


@app.post("/api/simulate", response_model=SimulateResponse)
def simulate(payload: SimulateRequest) -> dict:
    try:
        decisions, used_budget = validate_decisions(payload.decisions)
    except DecisionValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    final_districts = run_simulation(decisions)
    score = calculate_score(final_districts)

    return {
        "valid": True,
        "used_budget": used_budget,
        "remaining_budget": BUDGET - used_budget,
        "decisions": decisions,
        "final_districts": final_districts,
        "score": score,
        "ai_summary": build_ai_summary(decisions=decisions, score=score),
    }
