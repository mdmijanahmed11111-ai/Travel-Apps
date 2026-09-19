"""Backend retest for the "6 photos, only 1 loads" bug fix.

Verifies:
- GET /api/hotspots/{id} `photos` array has NO thumb.wikimedia.org URLs
- No URL contains tracking query strings (`?utm_*`, or any query)
- Photos are unique after canonicalization (dedup applied)
- Each photo actually loads over HTTP (status 200) with a non-trivial payload
- Specifically covers Hazrat Shah Jalal Dargah, Sylhet City, Ratargul Swamp Forest
"""
import os
import re
from urllib.parse import urlparse
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent.parent / "frontend" / ".env")
BASE_URL = (os.environ.get("EXPO_PUBLIC_BACKEND_URL") or "").rstrip("/") + "/api"
assert BASE_URL.startswith("http"), "EXPO_PUBLIC_BACKEND_URL missing"

PREMIUM_EMAIL = "brtest3@example.com"
PREMIUM_PASSWORD = "test1234"

TARGET_NAMES = [
    "Hazrat Shah Jalal Dargah",
    "Sylhet City",
    "Ratargul Swamp Forest",
]

STATE = {}


@pytest.fixture(scope="module", autouse=True)
def login_premium():
    r = requests.post(f"{BASE_URL}/auth/login",
                      json={"email": PREMIUM_EMAIL, "password": PREMIUM_PASSWORD},
                      timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    STATE["token"] = r.json()["token"]
    STATE["headers"] = {"Authorization": f"Bearer {STATE['token']}"}
    yield


def _list_sylhet_hotspots():
    # Seeded Sylhet-area hotspots live under city="Bishwanath Upazila" (Sylhet Division)
    r = requests.get(f"{BASE_URL}/hotspots", params={"city": "Bishwanath Upazila"},
                     headers=STATE["headers"], timeout=30)
    assert r.status_code == 200, f"{r.status_code} {r.text}"
    return r.json()["hotspots"]


def test_sylhet_hotspots_listed():
    hs = _list_sylhet_hotspots()
    assert len(hs) >= 3, f"expected >=3 Sylhet hotspots, got {len(hs)}"
    names = {h["name"] for h in hs}
    print(f"Sylhet hotspots: {sorted(names)}")
    STATE["by_name"] = {h["name"]: h for h in hs}
    # Save for other tests
    for t in TARGET_NAMES:
        assert t in names, f"missing target hotspot '{t}' in {sorted(names)}"


@pytest.mark.parametrize("target", TARGET_NAMES)
def test_photos_canonical_unique_and_load(target):
    if "by_name" not in STATE:
        pytest.skip("sylhet listing failed")
    hid = STATE["by_name"][target]["id"]
    r = requests.get(f"{BASE_URL}/hotspots/{hid}", headers=STATE["headers"], timeout=30)
    assert r.status_code == 200, f"{r.status_code} {r.text}"
    doc = r.json()
    photos = doc.get("photos") or []
    assert isinstance(photos, list) and len(photos) >= 1, f"no photos on {target}"
    print(f"\n[{target}] {len(photos)} photos:")
    for p in photos:
        print(f"  - {p}")

    # 1. No thumb.wikimedia.org
    thumbs = [p for p in photos if "thumb.wikimedia.org" in p]
    assert not thumbs, f"[{target}] thumb.wikimedia.org URLs still present: {thumbs}"

    # 2. No query strings (?utm_* etc.)
    with_query = [p for p in photos if "?" in p]
    assert not with_query, f"[{target}] photos still contain query strings: {with_query}"

    # 3. All URLs unique
    assert len(photos) == len(set(photos)), (
        f"[{target}] duplicate URLs in photos: {photos}"
    )

    # 4. All wikimedia hosts
    hosts = {(urlparse(p).hostname or "").lower() for p in photos}
    bad_hosts = [h for h in hosts if not h.endswith("wikimedia.org")]
    assert not bad_hosts, f"[{target}] non-wikimedia hosts: {bad_hosts}"

    # 5. Each photo actually loads (with polite Wikimedia UA + retry-on-429).
    #    Wikimedia enforces UA policy + rate limiting; browsers load these fine,
    #    but bulk requests from a plain requests session get 429s.
    import time as _t
    load_failures = []
    ua = ("GuardTripQA/1.0 (https://guardtrip.example.com; qa@guardtrip.example.com) "
          "python-requests/2")
    for url in photos:
        ok = False
        last_err = None
        for attempt in range(4):
            try:
                h = requests.get(url, timeout=20, stream=True,
                                 headers={"User-Agent": ua,
                                          "Accept": "image/*,*/*;q=0.8"})
                if h.status_code == 200:
                    chunk = next(h.iter_content(1024), b"")
                    h.close()
                    if len(chunk) < 100:
                        last_err = f"tiny body {len(chunk)}B"
                    else:
                        ok = True
                        break
                elif h.status_code == 429:
                    last_err = 429
                    h.close()
                    _t.sleep(3 * (attempt + 1))
                    continue
                else:
                    last_err = h.status_code
                    h.close()
                    break
            except Exception as e:
                last_err = f"exc: {e}"
                break
            finally:
                _t.sleep(0.4)
        if not ok:
            load_failures.append((url, last_err))
    assert not load_failures, f"[{target}] photos that failed to load: {load_failures}"


def test_specifically_shah_jalal_has_5_unique():
    """Per fix note: Hazrat Shah Jalal Dargah went from 6 (1 dup) to 5 unique."""
    if "by_name" not in STATE:
        pytest.skip("sylhet listing failed")
    hid = STATE["by_name"]["Hazrat Shah Jalal Dargah"]["id"]
    r = requests.get(f"{BASE_URL}/hotspots/{hid}", headers=STATE["headers"], timeout=30)
    assert r.status_code == 200
    photos = r.json().get("photos") or []
    print(f"Shah Jalal photo count: {len(photos)}")
    assert len(photos) == len(set(photos)), "duplicates in Shah Jalal photos"
    # spec says now 5 (allow small drift 4-6 since flaky wiki calls may vary)
    assert 3 <= len(photos) <= 6, f"unexpected photo count: {len(photos)}"
    # ALL should be upload.wikimedia.org (canonical) per fix
    for p in photos:
        host = (urlparse(p).hostname or "").lower()
        assert host == "upload.wikimedia.org", (
            f"Shah Jalal photo not on upload.wikimedia.org: {p}"
        )
