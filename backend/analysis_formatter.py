from models import AIAnalysis


def apply_analysis_guardrails(
    analysis: AIAnalysis,
    facts: dict,
) -> AIAnalysis:
    data = analysis.model_dump()
    forbidden_phrases = (
        "может вызвать недовольство",
        "снижение интереса",
        "стагнац",
        "ограничивает возможности",
        "комплексные проблемы",
        "недовольств",
        "политическ",
        "экономическ",
    )

    score_values = (
        facts["score_change"]["baseline"],
        facts["score_change"]["final"],
        facts["score_change"]["delta"],
        facts["score_change"]["used_budget"],
        facts["score_change"]["remaining_budget"],
    )
    if _contains_any(data["summary"], forbidden_phrases) or not all(
        _format_number(value) in data["summary"] for value in score_values
    ):
        data["summary"] = _deterministic_summary(facts)

    data["strengths"] = _strength_texts(facts["top_improvements"])
    data["risks"] = _risk_texts(
        facts["critical_problems"],
        facts["negative_changes"],
    )
    data["tradeoffs"] = _tradeoff_texts(facts)
    data["recommendations"] = _recommendation_texts(
        facts["available_recommendations"]
    )

    return AIAnalysis.model_validate(data)


def _strength_texts(improvements: list[dict]) -> list[str]:
    return [
        f'{item["district"]}: {item["indicator"]} — {item["indicator_name"]} '
        f'изменился с {_format_number(item["before"])} до '
        f'{_format_number(item["after"])} '
        f'({_format_signed(item["delta"])}).'
        for item in improvements[:3]
    ]


def _risk_texts(
    critical_problems: list[dict],
    negative_changes: list[dict],
) -> list[str]:
    risks = []
    if critical_problems:
        details = "; ".join(
            f'{item["district"]}: {item["indicator"]} — '
            f'{item["indicator_name"]} = {_format_number(item["value"])}'
            for item in critical_problems
        )
        risks.append(f"Критические показатели: {details}.")

    for item in negative_changes:
        if len(risks) == 3:
            break
        risks.append(
            f'{item["district"]}: {item["indicator"]} — '
            f'{item["indicator_name"]} изменился с '
            f'{_format_number(item["before"])} до '
            f'{_format_number(item["after"])} '
            f'({_format_signed(item["delta"])}).'
        )
    return risks


def _tradeoff_texts(facts: dict) -> list[str]:
    tradeoffs = []
    for item in facts["negative_changes"][:3]:
        tradeoffs.append(
            f'Подтвержденный компромисс в районе {item["district"]}: '
            f'{item["indicator"]} — {item["indicator_name"]} изменился с '
            f'{_format_number(item["before"])} до '
            f'{_format_number(item["after"])} '
            f'({_format_signed(item["delta"])}).'
        )

    if (
        len(tradeoffs) < 3
        and facts["top_improvements"]
        and facts["untouched_critical_problems"]
    ):
        improvement = facts["top_improvements"][0]
        untouched = "; ".join(
            f'{item["district"]} {item["indicator"]}='
            f'{_format_number(item["value"])}'
            for item in facts["untouched_critical_problems"]
        )
        tradeoffs.append(
            f'Сценарий улучшил {improvement["district"]} '
            f'{improvement["indicator"]} на '
            f'{_format_signed(improvement["delta"])}, тогда как не изменил '
            f'критические показатели: {untouched}.'
        )
    return tradeoffs[:3]


def _recommendation_texts(recommendations: list[dict]) -> list[str]:
    texts = []
    for item in recommendations[:3]:
        location = (
            f'Для района {item["district"]}'
            if item["scope"] == "district"
            else "На уровне города"
        )
        texts.append(
            f'{location} стоит рассмотреть '
            f'{item["initiative_id"]} «{item["initiative_name"]}», поскольку '
            f'в районе {item["problem_district"]} '
            f'{item["indicator"]} — {item["indicator_name"]} = '
            f'{_format_number(item["current_value"])}.'
        )
    return texts


def _deterministic_summary(facts: dict) -> str:
    score = facts["score_change"]
    delta = _format_number(score["delta"])
    signed_delta = f"+{delta}" if score["delta"] > 0 else delta
    summary = (
        f'Score изменился с {_format_number(score["baseline"])} '
        f'до {_format_number(score["final"])} ({signed_delta}). '
        f'Использовано {score["used_budget"]} единиц бюджета, '
        f'не использовано {score["remaining_budget"]}.'
    )
    critical = _risk_texts(facts["critical_problems"], [])
    return f"{summary} {critical[0]}" if critical else summary


def _contains_any(text: str, fragments: tuple[str, ...]) -> bool:
    lowered = text.lower()
    return any(fragment in lowered for fragment in fragments)


def _format_number(value: float) -> str:
    number = float(value)
    return str(int(number)) if number.is_integer() else str(number)


def _format_signed(value: float) -> str:
    number = _format_number(value)
    return f"+{number}" if value > 0 else number
