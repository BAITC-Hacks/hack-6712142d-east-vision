import json
import logging
import os
from pathlib import Path

from dotenv import dotenv_values
from openai import OpenAI

from data import INDICATORS, INITIATIVES
from models import AIAnalysis

DEFAULT_MODEL = "gpt-4o-mini"
AI_TIMEOUT_SECONDS = 15.0
FALLBACK_SUMMARY = (
    "AI-анализ временно недоступен. Числовой результат симуляции рассчитан успешно."
)

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

SYSTEM_PROMPT = """Ты анализируешь уже рассчитанный сценарий управления городом.

Все числа, Score, изменения показателей, критические значения и синергии уже
рассчитаны backend и являются источником истины.

Правила:
1. Не пересчитывай и не изменяй числа.
2. Не придумывай данные, которых нет во входном контексте facts.
3. Основывай выводы на конкретных районах, показателях и изменениях.
4. Обязательно учитывай все critical_problems.
5. Если рекомендуешь меру, используй только available_recommendations, которые
   backend выбрал из существующего каталога инициатив. Сохраняй точные ID, названия
   и район для district-меры.
6. Если данных недостаточно для вывода, не делай его.
7. Пиши кратко, конкретно и только на русском языке.

Backend уже определил содержание разделов. Запрещено самостоятельно определять критические проблемы,
сильные стороны, рекомендации или синергии:
- summary формулируй по score_change и остальным facts;
- strengths соответствуют только top_improvements и обязательно
  содержат district, indicator, before, after и delta;
- risks включают каждый critical_problems и только переданные negative_changes;
- tradeoffs допустимы только на основе negative_changes и
  untouched_critical_problems; если такого факта нет, верни пустой массив;
- recommendations переформулируют только переданные available_recommendations;
- applied_synergies описывай только в переданном виде.

delta = 0 не является ни strength, ни risk. remaining_budget из score_change —
только информационное значение. Не относить его автоматически к strengths или risks.

Запрещены фразы «может вызвать недовольство», «снижение интереса», «стагнация»,
«ограничивает возможности», «комплексные проблемы», а также социальные,
политические или экономические последствия, которых нет в facts.

Верни только поля summary, strengths, risks, tradeoffs и recommendations в заданном
Structured Output. В каждом списке должно быть не более трех пунктов.
"""

logger = logging.getLogger(__name__)
ENV_FILE = Path(__file__).with_name(".env")


def analyze_simulation(simulation_result: dict) -> AIAnalysis:
    api_key = _get_setting("OPENAI_API_KEY")
    if not api_key:
        logger.info("OpenAI analysis skipped: OPENAI_API_KEY is not configured.")
        return fallback_analysis()

    try:
        facts = _build_analysis_facts(simulation_result)
        client = OpenAI(
            api_key=api_key,
            timeout=AI_TIMEOUT_SECONDS,
            max_retries=0,
        )
        response = client.responses.parse(
            model=_get_setting("OPENAI_MODEL") or DEFAULT_MODEL,
            input=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        "Переформулируй только переданные deterministic facts. "
                        "Ничего не выбирай и не добавляй самостоятельно:\n"
                        + json.dumps(
                            facts,
                            ensure_ascii=False,
                            separators=(",", ":"),
                        )
                    ),
                },
            ],
            text_format=AIAnalysis,
        )
        if response.output_parsed is None:
            raise ValueError("OpenAI response did not contain structured output.")
        return _apply_analysis_guardrails(response.output_parsed, facts)
    except Exception as error:
        logger.warning(
            "OpenAI analysis failed; returning fallback (%s: %s).",
            type(error).__name__,
            error,
        )
        return fallback_analysis()


def fallback_analysis() -> AIAnalysis:
    return AIAnalysis(
        summary=FALLBACK_SUMMARY,
        strengths=[],
        risks=[],
        tradeoffs=[],
        recommendations=[],
    )


def _get_setting(name: str) -> str | None:
    if name in os.environ:
        return os.environ[name] or None

    file_value = dotenv_values(ENV_FILE).get(name)
    return file_value if file_value else None


def _build_analysis_facts(simulation_result: dict) -> dict:
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


def _apply_analysis_guardrails(
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
