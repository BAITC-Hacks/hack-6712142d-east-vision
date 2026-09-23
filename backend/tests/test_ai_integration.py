import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from ai_service import FALLBACK_SUMMARY
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


class SuccessfulResponses:
    def parse(self, **kwargs):
        return type(
            "ParsedResponse",
            (),
            {
                "output_parsed": AIAnalysis(
                    summary="Сценарий улучшил итоговый Score.",
                    strengths=["Транспортные показатели получили поддержку."],
                    risks=["Один критический показатель сохраняется."],
                    tradeoffs=["Бюджет распределён между несколькими направлениями."],
                    recommendations=["Сосредоточиться на оставшемся критическом показателе."],
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
        self.assertEqual(len(payload["ai_analysis"]["strengths"]), 1)
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


if __name__ == "__main__":
    unittest.main()
