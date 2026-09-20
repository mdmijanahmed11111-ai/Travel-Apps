"""
Tests for the new Offline Survival Pack + language endpoints (iteration 7).

Covers:
- GET /api/offline/pack?city=<seeded> returns full structure and premium-gated.
- GET /api/offline/pack?city=<unseeded like Sylhet> triggers Claude fallback and
  returns non-empty Bengali phrases via _generate_ai_phrases.
- PATCH /api/user/language persists on user; GET /api/auth/me reflects it.
"""
import os
import time
import requests
import pytest

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

PREMIUM_EMAIL = "brtest3@example.com"
PREMIUM_PASS = "test1234"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{API}/auth/login",
                      json={"email": PREMIUM_EMAIL, "password": PREMIUM_PASS},
                      timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture
def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---- offline pack ----

class TestOfflinePack:
    def test_pack_paris_seeded(self, auth_headers):
        r = requests.get(f"{API}/offline/pack",
                         params={"city": "Paris", "country": "France"},
                         headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["city"] == "Paris"
        assert "hotspots" in data and isinstance(data["hotspots"], list)
        assert "alerts" in data and isinstance(data["alerts"], list)
        assert "phrases" in data and isinstance(data["phrases"], list) and len(data["phrases"]) > 0
        # Seeded Paris pack has native French
        p0 = data["phrases"][0]
        assert set(["en", "local"]).issubset(p0.keys())
        assert "packed_at" in data

    def test_pack_requires_premium(self):
        # register a fresh non-premium user and try
        email = f"TEST_free_{int(time.time())}@example.com"
        r = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "test1234", "display_name": "TEST Free",
        }, timeout=15)
        assert r.status_code == 200, r.text
        t = r.json()["token"]
        r2 = requests.get(f"{API}/offline/pack", params={"city": "Paris"},
                          headers={"Authorization": f"Bearer {t}"}, timeout=15)
        assert r2.status_code == 402, r2.text

    def test_pack_ai_fallback_bengali_for_sylhet(self, auth_headers):
        # Sylhet is not in PHRASE_PACKS; must call Claude which returns Bengali script
        r = requests.get(f"{API}/offline/pack",
                         params={"city": "Sylhet", "country": "Bangladesh"},
                         headers=auth_headers, timeout=45)
        assert r.status_code == 200, r.text
        data = r.json()
        phrases = data.get("phrases") or []
        assert len(phrases) >= 5, f"AI returned too few phrases: {phrases}"
        # At least one 'local' should include Bengali unicode range (U+0980–U+09FF)
        def has_bn(s: str) -> bool:
            return any("\u0980" <= ch <= "\u09FF" for ch in (s or ""))
        assert any(has_bn(p.get("local", "")) for p in phrases), \
            f"No Bengali script found in AI phrases: {phrases}"


# ---- language patch ----

class TestUserLanguage:
    def test_patch_language_persists(self, auth_headers):
        target = "বাংলা"
        r = requests.patch(f"{API}/user/language",
                           json={"language": target},
                           headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json().get("language") == target

        me = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=15)
        assert me.status_code == 200, me.text
        assert me.json().get("language") == target

        # Reset to English so subsequent runs aren't sticky
        r2 = requests.patch(f"{API}/user/language",
                            json={"language": "English"},
                            headers=auth_headers, timeout=15)
        assert r2.status_code == 200

    def test_patch_language_rejects_empty(self, auth_headers):
        r = requests.patch(f"{API}/user/language", json={"language": ""},
                           headers=auth_headers, timeout=15)
        assert r.status_code == 400
