from __future__ import annotations

import unittest

from fastapi.testclient import TestClient

from app.main import app


class CorsTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_amentor_origins_are_allowed_explicitly(self):
        for origin in ("https://amentor.ro", "https://www.amentor.ro"):
            with self.subTest(origin=origin):
                response = self.client.options(
                    "/health",
                    headers={
                        "Origin": origin,
                        "Access-Control-Request-Method": "GET",
                    },
                )

                self.assertEqual(response.status_code, 200)
                self.assertEqual(
                    response.headers["access-control-allow-origin"],
                    origin,
                )
                self.assertEqual(
                    response.headers["access-control-allow-credentials"],
                    "true",
                )


if __name__ == "__main__":
    unittest.main()
