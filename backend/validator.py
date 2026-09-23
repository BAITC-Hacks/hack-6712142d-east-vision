from collections import Counter

from data import BUDGET, DISTRICTS, INCOMPATIBILITIES, INITIATIVES
from models import Decision


class DecisionValidationError(ValueError):
    pass


def validate_decisions(decisions: list[Decision]) -> tuple[list[Decision], int]:
    if len(decisions) != 5:
        raise DecisionValidationError("Нужно выбрать ровно 5 решений.")

    initiative_ids = [decision.initiative_id for decision in decisions]
    unknown_ids = [item_id for item_id in initiative_ids if item_id not in INITIATIVES]
    if unknown_ids:
        raise DecisionValidationError(
            f"Неизвестные мероприятия: {', '.join(unknown_ids)}."
        )

    repeated_ids = [item_id for item_id, count in Counter(initiative_ids).items() if count > 1]
    if repeated_ids:
        raise DecisionValidationError(
            f"Повторы мероприятий запрещены: {', '.join(repeated_ids)}."
        )

    total_cost = sum(INITIATIVES[item_id]["cost"] for item_id in initiative_ids)
    if total_cost > BUDGET:
        raise DecisionValidationError(
            f"Общая стоимость {total_cost} превышает бюджет {BUDGET}."
        )

    for decision in decisions:
        initiative = INITIATIVES[decision.initiative_id]
        if initiative["type"] == "district":
            if not decision.district:
                raise DecisionValidationError(
                    f"Мероприятие {decision.initiative_id} требует район."
                )
            if decision.district not in DISTRICTS:
                raise DecisionValidationError(
                    f"Неизвестный район для {decision.initiative_id}: {decision.district}."
                )
        if initiative["type"] == "city" and decision.district is not None:
            raise DecisionValidationError(
                f"Городское мероприятие {decision.initiative_id} не должно содержать район."
            )

    category_counts = Counter(INITIATIVES[item_id]["category"] for item_id in initiative_ids)
    overloaded_categories = [
        category for category, count in category_counts.items() if count > 2
    ]
    if overloaded_categories:
        raise DecisionValidationError(
            "Не более 2 мероприятий из одного направления. Нарушены: "
            + ", ".join(overloaded_categories)
            + "."
        )

    _validate_incompatibilities(decisions)
    return decisions, total_cost


def _validate_incompatibilities(decisions: list[Decision]) -> None:
    selected_ids = {decision.initiative_id for decision in decisions}

    for rule in INCOMPATIBILITIES:
        first_id, second_id = rule["initiatives"]
        if not {first_id, second_id}.issubset(selected_ids):
            continue

        if rule["scope"] == "global":
            raise DecisionValidationError(
                f"Мероприятия {first_id} и {second_id} несовместимы глобально."
            )

        first_districts = {
            decision.district
            for decision in decisions
            if decision.initiative_id == first_id
        }
        second_districts = {
            decision.district
            for decision in decisions
            if decision.initiative_id == second_id
        }
        common_districts = first_districts.intersection(second_districts)
        if common_districts:
            districts = ", ".join(sorted(district for district in common_districts if district))
            raise DecisionValidationError(
                f"Мероприятия {first_id} и {second_id} нельзя выбирать в одном районе: {districts}."
            )
