"""Auth + subscription flow tests for GuardTrip.

Covers: /api/ health, register, login, /auth/me, /subscriptions/activate,
premium gating on a protected endpoint.
"""
import os
import uuid
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="module")
def fresh_email():
    return f"TEST_flow_{uuid.uuid4().hex[:8]}@guardtrip.example.com"


# --- Health --------------------------------------------------------------
def test_health(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    body = r.json()
    assert body.get("status") == "ok"


# --- Register ------------------------------------------------------------
def test_register(s, fresh_email):
    payload = {
        "email": fresh_email,
        "password": "test1234",
        "display_name": "Flow Tester",
        "gender": "female",
        "language": "English",
        "travel_style": "Solo Female",
    }
    r = s.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "token" in body and body["token"]
    assert body["user"]["email"] == fresh_email.lower()
    assert body["user"]["is_premium"] is False
    pytest.token = body["token"]
    pytest.uid = body["user"]["id"]


def test_register_duplicate_rejected(s, fresh_email):
    r = s.post(f"{API}/auth/register", json={
        "email": fresh_email, "password": "test1234", "display_name": "Dup",
    })
    assert r.status_code == 400


# --- Login ---------------------------------------------------------------
def test_login_existing_premium(s):
    r = s.post(f"{API}/auth/login", json={"email": "brtest3@example.com", "password": "test1234"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["user"]["is_premium"] is True


def test_login_bad_password(s, fresh_email):
    r = s.post(f"{API}/auth/login", json={"email": fresh_email, "password": "wrong"})
    assert r.status_code == 401


# --- /auth/me ------------------------------------------------------------
def test_me_with_token(s):
    r = s.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {pytest.token}"})
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == pytest.uid
    assert body["is_premium"] is False


def test_me_without_token(s):
    r = s.get(f"{API}/auth/me")
    assert r.status_code == 401


# --- Premium gating ------------------------------------------------------
def test_premium_gated_endpoint_blocks_non_premium(s):
    r = s.get(f"{API}/cities", headers={"Authorization": f"Bearer {pytest.token}"})
    assert r.status_code == 402


# --- Activate subscription ----------------------------------------------
def test_activate_month_subscription(s):
    r = s.post(
        f"{API}/subscriptions/activate",
        headers={"Authorization": f"Bearer {pytest.token}"},
        json={"tier": "month"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["success"] is True
    assert body["user"]["is_premium"] is True
    assert body["user"]["subscription_tier"] == "month"


def test_me_reflects_premium_after_activate(s):
    r = s.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {pytest.token}"})
    assert r.status_code == 200
    assert r.json()["is_premium"] is True


def test_premium_endpoint_now_accessible(s):
    r = s.get(f"{API}/cities", headers={"Authorization": f"Bearer {pytest.token}"})
    assert r.status_code == 200
    assert "cities" in r.json()
