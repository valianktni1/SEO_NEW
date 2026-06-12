"""Backend API tests for SEO Command Centre"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ethical-wedding-seo.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Root & dashboard ---
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    j = r.json()
    assert j["app"] == "SEO Command Centre"


def test_dashboard(session):
    r = session.get(f"{API}/dashboard")
    assert r.status_code == 200
    j = r.json()
    for k in ["audit_history", "completion_pct", "tasks_done", "tasks_total", "streak_days", "by_category"]:
        assert k in j
    assert j["tasks_total"] == 50


# --- Audit ---
def test_audit_success(session):
    r = session.post(f"{API}/audit", json={"url": "https://perfectweddingsbymark.uk"}, timeout=60)
    assert r.status_code == 200
    j = r.json()
    assert "score" in j and "grade" in j
    assert isinstance(j["checks"], list) and len(j["checks"]) > 5
    assert "recommendations" in j
    assert "summary" in j
    # Categorisation present
    cats = {c["category"] for c in j["checks"]}
    assert {"Technical", "On-page"}.issubset(cats)
    pytest.audit_id = j["id"]


def test_audit_bad_url(session):
    r = session.post(f"{API}/audit", json={"url": "not-a-real-url-12345.example"}, timeout=60)
    assert r.status_code in (400, 422, 502, 500)


def test_audit_list(session):
    r = session.get(f"{API}/audits")
    assert r.status_code == 200
    rows = r.json()
    assert isinstance(rows, list)
    assert any("score" in row for row in rows)


def test_audit_get_by_id(session):
    aid = getattr(pytest, "audit_id", None)
    if not aid:
        pytest.skip("No audit_id from previous test")
    r = session.get(f"{API}/audits/{aid}")
    assert r.status_code == 200
    assert r.json()["id"] == aid


# --- Schema ---
def test_schema(session):
    r = session.post(f"{API}/schema", json={"business_name": "Weddings By Mark"})
    assert r.status_code == 200
    j = r.json()
    assert "json_ld" in j and "script_tag" in j
    assert j["json_ld"]["name"] == "Weddings By Mark"


# --- Locations ---
def test_locations(session):
    r = session.get(f"{API}/locations")
    assert r.status_code == 200
    regions = r.json()["regions"]
    assert len(regions) == 5
    total_towns = sum(len(reg["towns"]) for reg in regions)
    assert total_towns == 74, f"Expected 74 towns, got {total_towns}"


def test_location_page(session):
    r = session.post(f"{API}/location-page", json={"town": "Preston", "region": "Lancashire"})
    assert r.status_code == 200
    j = r.json()
    assert j["slug"] == "wedding-photographer-preston"
    assert "Preston" in j["title"]
    assert "markdown" in j and "schema_jsonld" in j


# --- Meta ---
def test_meta(session):
    r = session.post(f"{API}/meta", json={
        "page_type": "location", "primary_keyword": "wedding photographer", "location": "Preston"
    })
    assert r.status_code == 200
    j = r.json()
    assert len(j["titles"]) == 2
    assert "description" in j and isinstance(j["description"]["length"], int)


# --- Keyword density ---
def test_keyword_density(session):
    text = "Wedding photographer in Preston. Preston wedding photographer specialising in natural wedding photography. " * 5
    r = session.post(f"{API}/keyword-density", json={
        "text": text, "target_keywords": ["wedding photographer", "Preston"]
    })
    assert r.status_code == 200
    j = r.json()
    assert j["total_words"] > 0
    assert len(j["targets"]) == 2
    assert all("status" in t for t in j["targets"])


# --- Tasks ---
def test_tasks_list(session):
    r = session.get(f"{API}/tasks")
    assert r.status_code == 200
    tasks = r.json()["tasks"]
    assert len(tasks) == 50


def test_task_toggle_roundtrip(session):
    # toggle on
    r = session.post(f"{API}/tasks/ssl/toggle", json={"completed": True})
    assert r.status_code == 200
    assert r.json()["completed"] is True

    # verify persistence
    r = session.get(f"{API}/tasks")
    ssl_task = next(t for t in r.json()["tasks"] if t["id"] == "ssl")
    assert ssl_task["completed"] is True

    # dashboard should reflect at least 1 done
    r = session.get(f"{API}/dashboard")
    assert r.json()["tasks_done"] >= 1
    assert r.json()["streak_days"] >= 1

    # toggle off (cleanup)
    r = session.post(f"{API}/tasks/ssl/toggle", json={"completed": False})
    assert r.status_code == 200
    assert r.json()["completed"] is False


def test_task_toggle_unknown(session):
    r = session.post(f"{API}/tasks/nonexistent/toggle", json={"completed": True})
    assert r.status_code == 404


# --- Compare ---
def test_compare(session):
    r = session.post(f"{API}/compare", json={
        "your_url": "https://perfectweddingsbymark.uk",
        "competitor_url": "https://example.com"
    }, timeout=90)
    assert r.status_code == 200
    j = r.json()
    assert "your" in j and "competitor" in j
    assert "score" in j["your"] and "score" in j["competitor"]


# --- Coverage plan ---
def test_coverage_plan(session):
    r = session.get(f"{API}/regions/coverage-plan")
    assert r.status_code == 200
    j = r.json()
    assert j["total_pages"] == 74
    assert len(j["plan"]) == 74
