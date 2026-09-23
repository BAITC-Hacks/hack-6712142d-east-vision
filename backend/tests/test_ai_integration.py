import json
import os
import re
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from ai_service import FALLBACK_SUMMARY, SYSTEM_PROMPT
from data import INITIATIVES
from main import app
from models import AIAnalysis


DECISIONS = {
    "decisions": [
        {"initiative_id": "M1", "district": "Есиль"},
        {"initiative_id": "M2", "district": None},
        {"initiative_id": "M4", "district": "Сарыарка"},
        {"initiative_id": "M7", "district": "Нура"},
        {"initiative_id": "M12", "district": None},
    ]
}

CURRENT_SCENARIO = {
    "decisions": [
        {"initiative_id": "M1", "district": "Алматы"},
        {"initiative_id": "M2", "district": None},
        {"initiative_id": "M4", "district": "Сарыарка"},
        {"initiative_id": "M10", "district": "Байконур"},
        {"initiative_id": "M12", "district": None},
    ]
}


class SuccessfulResponses:
    def parse(self, **kwargs):
        return type(
            "ParsedResponse",
            (),
            {
                "output_parsed": AIAnalysis(
                    summary="Сценарий улучшил итоговый Score.",
                    strengths=["В Есиле T1 изменился с 45 до 49.5 (+4.5)."],
                    risks=["Один критический показатель сохраняется."],
                    tradeoffs=["Бюджет распределён между несколькими направлениями."],
                    recommendations=[
                        "Для Нуры стоит рассмотреть M8 «Центр семейного здоровья / поликлиника»."
                    ],
                )
            },
        )()


class SuccessfulOpenAI:
    def __init__(self, **kwargs):
        self.responses = SuccessfulResponses()


class FailingResponses:
    def parse(self, **kwargs):
        raise TimeoutError("simulated timeout")


class FailingOpenAI:
    def __init__(self, **kwargs):
        self.responses = FailingResponses()


class UngroundedResponses:
    last_request = None

    def parse(self, **kwargs):
        type(self).last_request = kwargs
        return type(
            "ParsedResponse",
            (),
            {
                "output_parsed": AIAnalysis(
                    summary=(
                        "Score вырос, но нулевые изменения могут указывать на стагнацию."
                    ),
                    strengths=[
                        "Отрицательных изменений нет.",
                        "В Байконуре B1 изменился с 52 до 64.5 (+12.5).",
                    ],
                    risks=[
                        "В Нуре S1 = 38.",
                        "Оставшийся бюджет ограничивает возможности.",
                    ],
                    tradeoffs=[
                        "Стоит рассмотреть M7 для Нуры.",
                        "После расходов 81 в Нуре не затронуты S1=38 и S2=35.",
                    ],
                    recommendations=[
                        "Для Алматы снова выбрать M1 и добавить M99.",
                        "Для Нуры рассмотреть M7 «Школа + детсад» для S1=38.",
                        "Для Нуры рассмотреть M8 «Центр семейного здоровья / поликлиника» для S2=35.",
                    ],
                )
            },
        )()


class UngroundedOpenAI:
    def __init__(self, **kwargs):
        self.responses = UngroundedResponses()


class AIIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_missing_key_returns_fallback_and_score(self):
        with patch.dict(os.environ, {"OPENAI_API_KEY": ""}):
            response = self.client.post("/api/simulate", json=DECISIONS)

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["baseline_score"], 52.56)
        self.assertEqual(payload["final_score"], 55.37)
        self.assertEqual(payload["ai_analysis"]["summary"], FALLBACK_SUMMARY)

    def test_structured_ai_result_does_not_change_score(self):
        with (
            patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}),
            patch("ai_service.OpenAI", SuccessfulOpenAI),
        ):
            response = self.client.post("/api/simulate", json=DECISIONS)

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["baseline_score"], 52.56)
        self.assertEqual(payload["final_score"], 55.37)
        self.assertEqual(payload["score_delta"], 2.81)
        self.assertEqual(len(payload["ai_analysis"]["strengths"]), 3)
        self.assertEqual(payload["ai_summary"], payload["ai_analysis"]["summary"])

        contributions = {
            item["initiative_id"]: item
            for item in payload["initiative_contributions"]
        }
        self.assertEqual(
            contributions["M1"]["applied_effects"],
            {"T1": 4.5, "T2": 6.75},
        )
        self.assertEqual(contributions["M1"]["district"], "Есиль")
        self.assertEqual(contributions["M12"]["scope"], "city")
        self.assertIsNone(contributions["M12"]["district"])
        self.assertEqual(contributions["M12"]["applied_effects"], {"C2": 4.375})

    def test_ai_schema_limits_each_list_to_three_items(self):
        properties = AIAnalysis.model_json_schema()["properties"]

        for field in ("strengths", "risks", "tradeoffs", "recommendations"):
            self.assertEqual(properties[field]["maxItems"], 3)

    def test_ai_error_returns_fallback_and_score(self):
        with (
            patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}),
            patch("ai_service.OpenAI", FailingOpenAI),
        ):
            response = self.client.post("/api/simulate", json=DECISIONS)

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["final_score"], 55.37)
        self.assertEqual(payload["ai_analysis"]["summary"], FALLBACK_SUMMARY)

    def test_guardrails_cover_all_critical_indicators(self):
        with (
            patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}),
            patch("ai_service.OpenAI", UngroundedOpenAI),
        ):
            response = self.client.post("/api/simulate", json=CURRENT_SCENARIO)

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        analysis = payload["ai_analysis"]
        risks = " ".join(analysis["risks"])
        all_text = " ".join(
            [analysis["summary"]]
            + analysis["strengths"]
            + analysis["risks"]
            + analysis["tradeoffs"]
            + analysis["recommendations"]
        ).lower()

        self.assertEqual(payload["baseline_score"], 52.56)
        self.assertEqual(payload["final_score"], 54.0)
        self.assertEqual(payload["score_delta"], 1.44)
        self.assertIn("Нура: S1 — школы и детсады = 38", risks)
        self.assertIn("Нура: S2 — поликлиники = 35", risks)
        self.assertNotIn("стагнац", all_text)
        self.assertNotIn("ограничивает возможности", risks.lower())
        self.assertNotIn("оставшийся бюджет", risks.lower())

        self.assertTrue(all(re.search(r"\d", item) for item in analysis["strengths"]))
        recommendation_ids = {
            initiative_id
            for item in analysis["recommendations"]
            for initiative_id in re.findall(r"\bM\d+\b", item)
        }
        self.assertEqual(recommendation_ids, {"M7", "M8"})
        self.assertTrue(recommendation_ids <= set(INITIATIVES))
        self.assertTrue(
            all(
                item.startswith("Для района Нура")
                for item in analysis["recommendations"]
            )
        )
        self.assertEqual(payload["changes"]["Нура"]["S1"]["delta"], 0.0)
        self.assertEqual(payload["changes"]["Нура"]["S2"]["delta"], 0.0)

        request_content = UngroundedResponses.last_request["input"][1]["content"]
        facts = json.loads(request_content.split("\n", 1)[1])
        self.assertEqual(
            set(facts),
            {
                "score_change",
                "top_improvements",
                "critical_problems",
                "negative_changes",
                "applied_synergies",
                "untouched_critical_problems",
                "available_recommendations",
            },
        )
        self.assertEqual(
            [item["delta"] for item in facts["top_improvements"]],
            [12.5, 9.5, 9.0],
        )
        self.assertTrue(
            all(item["delta"] > 0 for item in facts["top_improvements"])
        )
        self.assertEqual(facts["negative_changes"], [])
        self.assertEqual(len(facts["critical_problems"]), 2)
        self.assertEqual(len(facts["untouched_critical_problems"]), 2)
        self.assertEqual(len(facts["applied_synergies"]), 2)
        self.assertEqual(
            [
                item["initiative_id"]
                for item in facts["available_recommendations"]
            ],
            ["M7", "M8"],
        )
        self.assertTrue(
            all(
                item["district"] == "Нура"
                for item in facts["available_recommendations"]
            )
        )

    def test_prompt_contains_strict_analysis_rules(self):
        self.assertIn("самостоятельно определять критические проблемы", SYSTEM_PROMPT)
        self.assertIn("strengths соответствуют только top_improvements", SYSTEM_PROMPT)
        self.assertIn("delta = 0 не является ни strength, ни risk", SYSTEM_PROMPT)
        self.assertIn("remaining_budget из score_change", SYSTEM_PROMPT)
        self.assertIn("только переданные available_recommendations", SYSTEM_PROMPT)


if __name__ == "__main__":
    unittest.main()
