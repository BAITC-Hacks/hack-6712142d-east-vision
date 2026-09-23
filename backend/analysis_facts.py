from data import INDICATORS, INITIATIVES

RECOMMENDATION_IDS = {
    "T1": ("M1", "M2", "M3"),
    "T2": ("M1", "M3"),
    "E1": ("M4", "M6"),
    "E2": ("M5", "M6", "M3", "M4"),
    "S1": ("M7", "M9"),
    "S2": ("M8", "M9"),
    "B1": ("M10", "M9"),
    "B2": ("M11", "M10", "M2"),
    "C1": ("M13", "M14", "M5"),
    "C2": ("M12", "M14"),
}


def build_analysis_facts(simulation_result: dict) -> dict:
    decisions = [
        decision.model_dump() if hasattr(decision, "model_dump") else decision
        for decision in simulation_result["decisions"]
    ]
    selected_ids = {decision["initiative_id"] for decision in decisions}
    positive_changes = []
    negative_changes = []

    for district, indicators in simulation_result["changes"].items():
        for code, change in indicators.items():
            fact = {
                "district": district,
                "indicator": code,
                "indicator_name": INDICATORS.get(code, code),
                "before": change["before"],
                "after": change["after"],
                "delta": change["delta"],
            }
            if change["delta"] > 0:
                positive_changes.append(fact)
            elif change["delta"] < 0:
                negative_changes.append(fact)

    positive_changes.sort(
        key=lambda item: (-item["delta"], item["district"], item["indicator"])
    )
    negative_changes.sort(
        key=lambda item: (item["delta"], item["district"], item["indicator"])
    )

    critical_problems = [
        {
            "district": item["district"],
            "indicator": item["indicator"],
            "indicator_name": INDICATORS.get(item["indicator"], item["indicator"]),
            "value": item["value"],
        }
        for item in simulation_result["critical_indicators"]
    ]
    untouched_critical = [
        problem
        for problem in critical_problems
        if simulation_result["changes"][problem["district"]][problem["indicator"]][
            "delta"
        ]
        == 0
    ]

    return {
        "score_change": {
            "baseline": simulation_result["baseline_score"],
            "final": simulation_result["final_score"],
            "delta": simulation_result["score_delta"],
            "used_budget": simulation_result["used_budget"],
            "remaining_budget": simulation_result["remaining_budget"],
        },
        "top_improvements": positive_changes[:3],
        "critical_problems": critical_problems,
        "negative_changes": negative_changes,
        "applied_synergies": _synergy_facts(
            simulation_result["applied_synergies"]
        ),
        "untouched_critical_problems": untouched_critical,
        "available_recommendations": _recommendation_facts(
            critical_problems,
            selected_ids,
        ),
    }


def _synergy_facts(synergies: list[dict]) -> list[dict]:
    return [
        {
            "initiative_ids": synergy["initiatives"],
            "initiative_names": [
                INITIATIVES[initiative_id]["name"]
                for initiative_id in synergy["initiatives"]
            ],
            "district": synergy["district"],
            "indicator": synergy["indicator"],
            "indicator_name": INDICATORS.get(
                synergy["indicator"], synergy["indicator"]
            ),
            "bonus": synergy["bonus"],
        }
        for synergy in synergies
    ]


def _recommendation_facts(
    critical_problems: list[dict],
    selected_ids: set[str],
) -> list[dict]:
    recommendations = []
    used_ids = set()

    for problem in critical_problems:
        for initiative_id in RECOMMENDATION_IDS.get(problem["indicator"], ()):
            if initiative_id in selected_ids or initiative_id in used_ids:
                continue
            initiative = INITIATIVES[initiative_id]
            effect = initiative["effects"].get(problem["indicator"], 0)
            if effect <= 0:
                continue
            recommendations.append(
                {
                    "initiative_id": initiative_id,
                    "initiative_name": initiative["name"],
                    "scope": initiative["type"],
                    "district": (
                        problem["district"]
                        if initiative["type"] == "district"
                        else None
                    ),
                    "problem_district": problem["district"],
                    "indicator": problem["indicator"],
                    "indicator_name": problem["indicator_name"],
                    "current_value": problem["value"],
                    "catalog_effect": effect,
                }
            )
            used_ids.add(initiative_id)
            break
        if len(recommendations) == 3:
            break

    return recommendations
