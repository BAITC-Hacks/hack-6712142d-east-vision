import json
import logging

from openai import OpenAI

from analysis_facts import build_analysis_facts
from analysis_formatter import apply_analysis_guardrails
from config import AI_TIMEOUT_SECONDS, DEFAULT_MODEL, get_setting
from models import AIAnalysis

FALLBACK_SUMMARY = (
    "AI-анализ временно недоступен. Числовой результат симуляции рассчитан успешно."
)

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


def analyze_simulation(simulation_result: dict) -> AIAnalysis:
    api_key = get_setting("OPENAI_API_KEY")
    if not api_key:
        logger.info("OpenAI analysis skipped: OPENAI_API_KEY is not configured.")
        return fallback_analysis()

    try:
        facts = build_analysis_facts(simulation_result)
        client = OpenAI(
            api_key=api_key,
            timeout=AI_TIMEOUT_SECONDS,
            max_retries=0,
        )
        response = client.responses.parse(
            model=get_setting("OPENAI_MODEL") or DEFAULT_MODEL,
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
        return apply_analysis_guardrails(response.output_parsed, facts)
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
