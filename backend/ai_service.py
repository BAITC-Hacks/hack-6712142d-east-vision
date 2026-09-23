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

SYSTEM_PROMPT = """Ты анализируешь уже рассчитанный сценарий управления городом.

Все числа получены deterministic backend и являются единственным источником истины.
Ты не рассчитываешь Score самостоятельно, не изменяешь показатели и не делаешь
прогнозов за пределами горизонта симуляции.

Правила доказательности:
1. Каждое утверждение должно опираться на конкретные входные данные и содержать
   сами подтверждающие числа. Предпочитай формат: район + код и название индикатора
   + before/after/delta + связанная мера.
2. Если данных для утверждения недостаточно, не делай его. Не используй общие фразы
   вроде «не все районы растут» или «бюджет ограничивает возможности».
3. Не утверждай, что показатель изменился, если delta = 0.
4. Не называй инициативу причиной изменения, если initiative_contributions или
   applied_synergies прямо не связывают их.
5. Не придумывай скрытые зависимости, новые числа, показатели, меры, социальное
   недовольство, экономический эффект, рост населения или политическую реакцию.
6. Не используй слова «эффективно», «успешно» и «оптимально» без числового основания.
7. Не подменяй факт предположением: запрещены «может привести», «может снизить»,
   «в долгосрочной перспективе», «менее охваченные районы» и подобные выводы,
   которых нет в переданных полях.
8. Пустой массив лучше неподтвержденного пункта. Не заполняй раздел ради количества.

Требования к разделам:
- summary: 2-3 коротких предложения. Обязательно укажи baseline_score, final_score,
  score_delta, used_budget, remaining_budget и главный подтвержденный вывод. Если
  critical_indicators не пуст, главный вывод обязан назвать район, коды и значения.
- strengths: максимум 3 пункта. Приоритет — наибольшие положительные delta,
  затем applied_synergies и улучшения слабых районов. Если applied_synergies не
  пуст, зарезервируй минимум один пункт для синергии. Синергию описывай как
  инициативы + район + индикатор + точный bonus. Для обычной delta обязательно
  называй связанную initiative_contributions меру. Каждый пункт подкрепи числами.
- risks: максимум 3 пункта. Все critical_indicators ниже 40 обязательно упомяни;
  объединяй показатели одного района в один пункт, если нужно уложиться в лимит.
- tradeoffs: максимум 3 конкретных пункта. Допустимы только факты одного из видов:
  отрицательный delta со связанной мерой; used_budget и оставшийся critical_indicators;
  концентрация выбранных district-мер с точным числом мер и районом. Не рассуждай о
  lag, будущем эффекте или возможных последствиях: этих данных во входе нет. Не
  повторяй один и тот же факт в двух формулировках; если есть только один доказуемый
  компромисс, верни один пункт.
- recommendations: максимум 3 пункта. Предлагай только инициативы из
  initiative_catalog, которых НЕТ в decisions, и направляй их на оставшиеся
  critical_indicators или самые низкие показатели. Укажи ID, точное название,
  район для district-меры, код и название показателя, а также числовой effect из
  каталога. Не описывай рекомендацию как уже полученный результат.

Обязательный порядок построения ответа:
1. strengths[0] — наибольший подтвержденный положительный delta со связанной мерой.
2. Если applied_synergies содержит элементы, strengths[1] ОБЯЗАТЕЛЬНО описывает
   applied_synergies[0] дословно по фактам: обе инициативы, район, код и название
   индикатора, bonus. Не заменяй этот пункт другой delta.
3. risks должны покрыть все critical_indicators; показатели одного района можно
   объединить в один естественный пункт.
4. Сначала дай по одной рекомендации для каждого critical indicator. Выбирай
   неуказанную в decisions инициативу, в effects которой есть положительный эффект
   для того же кода. Только после этого можно рекомендовать меры для иных низких
   показателей.

Каждый пункт — 1-2 естественных предложения, а не перечень полей через «+».
Пиши кратко и только на русском языке. Для индикаторов используй одновременно код
и человекочитаемое название.
"""

logger = logging.getLogger(__name__)
ENV_FILE = Path(__file__).with_name(".env")


def analyze_simulation(simulation_result: dict) -> AIAnalysis:
    api_key = _get_setting("OPENAI_API_KEY")
    if not api_key:
        logger.info("OpenAI analysis skipped: OPENAI_API_KEY is not configured.")
        return fallback_analysis()

    try:
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
                        "Проанализируй этот рассчитанный сценарий. Не выполняй "
                        "собственные вычисления и верни только заданную структуру:\n"
                        + json.dumps(
                            _build_analysis_payload(simulation_result),
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
        return response.output_parsed
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


def _build_analysis_payload(simulation_result: dict) -> dict:
    decisions = [
        decision.model_dump() if hasattr(decision, "model_dump") else decision
        for decision in simulation_result["decisions"]
    ]
    return {
        "baseline_score": simulation_result["baseline_score"],
        "final_score": simulation_result["final_score"],
        "score_delta": simulation_result["score_delta"],
        "used_budget": simulation_result["used_budget"],
        "remaining_budget": simulation_result["remaining_budget"],
        "decisions": decisions,
        "district_scores": simulation_result["score"]["district_scores"],
        "changes": simulation_result["changes"],
        "critical_indicators": simulation_result["critical_indicators"],
        "applied_synergies": simulation_result["applied_synergies"],
        "initiative_contributions": simulation_result["initiative_contributions"],
        "indicator_names": INDICATORS,
        "initiative_catalog": [
            {
                "id": initiative["id"],
                "name": initiative["name"],
                "category": initiative["category"],
                "type": initiative["type"],
                "cost": initiative["cost"],
                "effects": initiative["effects"],
            }
            for initiative in INITIATIVES.values()
        ],
    }
