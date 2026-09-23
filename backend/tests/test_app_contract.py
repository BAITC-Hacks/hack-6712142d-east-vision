import os
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from config import ENV_FILE, get_setting
from data import BUDGET, DISTRICTS, INDICATORS, INITIATIVES
from main import app


class AppContractTests(unittest.TestCase):
    def test_routes_and_validation_status_codes(self):
        with TestClient(app) as client:
            self.assertEqual(client.get('/api/health').json(), {'status': 'ok'})
            data = client.get('/api/data')
            self.assertEqual(data.status_code, 200)
            self.assertEqual(data.json(), {
                'budget': BUDGET,
                'districts': DISTRICTS,
                'indicators': INDICATORS,
                'initiatives': list(INITIATIVES.values()),
            })
            self.assertEqual(client.post('/api/simulate', json={}).status_code, 422)
            self.assertEqual(
                client.post('/api/simulate', json={'decisions': []}).status_code,
                400,
            )

    def test_cors_preflight(self):
        with TestClient(app) as client:
            response = client.options('/api/simulate', headers={
                'Origin': 'http://localhost:5173',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'content-type',
            })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers['access-control-allow-origin'],
            'http://localhost:5173',
        )
        self.assertEqual(response.headers['access-control-allow-credentials'], 'true')


class SettingsTests(unittest.TestCase):
    def test_env_path_still_points_to_backend(self):
        self.assertEqual(ENV_FILE, Path(__file__).resolve().parents[1] / '.env')

    def test_environment_including_empty_value_takes_precedence(self):
        for value in ('test-key', ''):
            with self.subTest(value=value), patch.dict(
                os.environ, {'OPENAI_API_KEY': value}
            ), patch('config.dotenv_values') as read_env:
                self.assertEqual(get_setting('OPENAI_API_KEY'), value or None)
                read_env.assert_not_called()

    def test_env_file_is_read_again_for_each_call(self):
        with patch.dict(os.environ, {}, clear=True), patch(
            'config.dotenv_values',
            side_effect=[{'OPENAI_MODEL': 'first'}, {'OPENAI_MODEL': 'second'}],
        ):
            self.assertEqual(get_setting('OPENAI_MODEL'), 'first')
            self.assertEqual(get_setting('OPENAI_MODEL'), 'second')


if __name__ == '__main__':
    unittest.main()
