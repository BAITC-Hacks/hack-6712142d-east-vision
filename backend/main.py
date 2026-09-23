from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from ai_service import analyze_simulation
from data import BUDGET, DISTRICTS, INDICATORS, INITIATIVES
from models import DataResponse, SimulateRequest, SimulateResponse
from score import calculate_baseline_score, calculate_score
from simulation import (
    get_applied_synergies,
    get_initiative_contributions,
    run_simulation,
)
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
    baseline_score = calculate_baseline_score()

    simulation_result = {
        "valid": True,
        "used_budget": used_budget,
        "remaining_budget": BUDGET - used_budget,
        "baseline_score": baseline_score["score"],
        "final_score": score["score"],
        "score_delta": round(score["score"] - baseline_score["score"], 2),
        "decisions": decisions,
        "final_districts": final_districts,
        "changes": _build_changes(final_districts),
        "critical_indicators": _find_critical_indicators(final_districts),
        "applied_synergies": get_applied_synergies(decisions),
        "initiative_contributions": get_initiative_contributions(decisions),
        "score": score,
    }
    ai_analysis = analyze_simulation(simulation_result)
    return {
        **simulation_result,
        "ai_summary": ai_analysis.summary,
        "ai_analysis": ai_analysis,
    }


def _build_changes(final_districts: dict) -> dict:
    return {
        district_name: {
            indicator: {
                "before": initial_value,
                "after": round(final_districts[district_name]["indicators"][indicator], 2),
                "delta": round(
                    final_districts[district_name]["indicators"][indicator]
                    - initial_value,
                    2,
                ),
            }
            for indicator, initial_value in district["indicators"].items()
        }
        for district_name, district in DISTRICTS.items()
    }


def _find_critical_indicators(final_districts: dict) -> list[dict]:
    return [
        {
            "district": district_name,
            "indicator": indicator,
            "value": round(value, 2),
        }
        for district_name, district in final_districts.items()
        for indicator, value in district["indicators"].items()
        if value < 40
    ]
