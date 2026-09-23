from copy import deepcopy

from data import DISTRICTS, INITIATIVES, SIMULATION_HORIZON, SYNERGIES
from models import Decision


def run_simulation(decisions: list[Decision]) -> dict:
    districts = deepcopy(DISTRICTS)

    for decision in decisions:
        initiative = INITIATIVES[decision.initiative_id]
        multiplier = (SIMULATION_HORIZON - initiative["lag"]) / SIMULATION_HORIZON

        if initiative["type"] == "city":
            target_districts = districts.keys()
        else:
            target_districts = [decision.district]

        for district_name in target_districts:
            _apply_effects(
                districts[district_name]["indicators"],
                initiative["effects"],
                multiplier,
            )

    _apply_synergies(districts, decisions)
    _clip_all_indicators(districts)
    return districts


def get_applied_synergies(decisions: list[Decision]) -> list[dict]:
    applied = []
    selected_ids = {decision.initiative_id for decision in decisions}

    for synergy in SYNERGIES:
        if not set(synergy["requires"]).issubset(selected_ids):
            continue

        for decision in decisions:
            if decision.initiative_id != synergy["source"] or not decision.district:
                continue
            for indicator, bonus in synergy["effects"].items():
                applied.append(
                    {
                        "initiatives": list(synergy["requires"]),
                        "district": decision.district,
                        "indicator": indicator,
                        "bonus": bonus,
                    }
                )

    return applied


def get_initiative_contributions(decisions: list[Decision]) -> list[dict]:
    contributions = []

    for decision in decisions:
        initiative = INITIATIVES[decision.initiative_id]
        multiplier = (SIMULATION_HORIZON - initiative["lag"]) / SIMULATION_HORIZON
        contributions.append(
            {
                "initiative_id": initiative["id"],
                "initiative_name": initiative["name"],
                "district": decision.district,
                "scope": initiative["type"],
                "applied_effects": {
                    indicator: round(effect * multiplier, 3)
                    for indicator, effect in initiative["effects"].items()
                },
            }
        )

    return contributions


def _apply_synergies(districts: dict, decisions: list[Decision]) -> None:
    selected_ids = {decision.initiative_id for decision in decisions}

    for synergy in SYNERGIES:
        if not set(synergy["requires"]).issubset(selected_ids):
            continue

        source_id = synergy["source"]
        source_decisions = [
            decision for decision in decisions if decision.initiative_id == source_id
        ]
        for decision in source_decisions:
            if decision.district:
                _apply_effects(
                    districts[decision.district]["indicators"],
                    synergy["effects"],
                    1,
                )


def _apply_effects(indicators: dict[str, float], effects: dict[str, float], multiplier: float) -> None:
    for indicator, effect in effects.items():
        indicators[indicator] = indicators[indicator] + effect * multiplier


def _clip_all_indicators(districts: dict) -> None:
    for district in districts.values():
        for indicator, value in district["indicators"].items():
            district["indicators"][indicator] = max(0, min(100, value))
