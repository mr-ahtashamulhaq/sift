"""
Quick endpoint smoke-test for Sift backend.
Usage:
    python test_endpoints.py [base_url] [email] [password]

Examples:
    python test_endpoints.py
    python test_endpoints.py http://localhost:8000 you@example.com yourpassword
"""
import sys
import time
import json
import httpx

BASE = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://localhost:8000"

_PASS = "\033[92m PASS\033[0m"
_FAIL = "\033[91m FAIL\033[0m"
_SKIP = "\033[93m SKIP\033[0m"

results = []


def check(label: str, ok: bool, detail: str = ""):
    tag = _PASS if ok else _FAIL
    msg = f"{tag}  {label}"
    if detail:
        msg += f"\n       {detail}"
    print(msg)
    results.append(ok)
    return ok


def main():
    token = None
    scan_id = None
    # Accept credentials as CLI args so you can test with an existing account.
    email    = sys.argv[2] if len(sys.argv) > 2 else "sift_smoketest@mailinator.com"
    password = sys.argv[3] if len(sys.argv) > 3 else "Str0ng!Pass99"

    print(f"\n  Target: {BASE}\n")

    # ── Health ────────────────────────────────────────────────────────────────
    print("── Health ──────────────────────────────────────────────")
    r = httpx.get(f"{BASE}/health", timeout=15)
    check("GET /health → 200", r.status_code == 200)
    body = r.json()
    check("  supabase reachable", body.get("supabase") == "ok", str(body))
    check("  db connected",       body.get("database") == "ok", str(body))

    # ── SERP debug ────────────────────────────────────────────────────────────
    print("\n── SERP debug ──────────────────────────────────────────")
    try:
        r = httpx.get(f"{BASE}/test/serp", timeout=60)
        check("GET /test/serp → 200", r.status_code == 200, r.text[:200])
        body = r.json()
        check("  raw_status received", "raw_status" in body, str(body)[:200])
        check("  SERP returned data", body.get("raw_status") == 200,
              f"raw_status={body.get('raw_status')}  preview={str(body.get('raw_body_preview',''))[:120]}")
    except httpx.TimeoutException:
        print(f"{_SKIP}  GET /test/serp — timed out (Serper slow/unreachable)")

    # ── Auth ─────────────────────────────────────────────────────────────────
    # Try login first. Only attempt register if the account is truly missing.
    # Supabase free tier rate-limits signup emails — avoid hitting it every run.
    print("\n── Auth ─────────────────────────────────────────────────")
    print(f"  Using: {email}")
    login_r = httpx.post(f"{BASE}/auth/login",
                         json={"email": email, "password": password}, timeout=20)
    if login_r.status_code == 200:
        token = login_r.json().get("access_token")
        check("POST /auth/login → 200", True)
        check("  returns access_token", bool(token))
    else:
        err = login_r.json().get("detail", "")
        if "rate limit" in err.lower():
            print(f"\033[93m WARN\033[0m  Supabase email rate limit hit.")
            print("       Fix: Supabase Dashboard → Authentication → Email → disable 'Enable email confirmations'")
            print("       Then re-run. Or pass your own account: python test_endpoints.py http://localhost:8000 you@email.com pass")
            _summary()
            return
        # Account doesn't exist — try registering (first run only)
        reg_r = httpx.post(f"{BASE}/auth/register",
                           json={"email": email, "password": password, "display_name": "Smoke Tester"},
                           timeout=20)
        if "rate limit" in reg_r.text.lower():
            print(f"\033[93m WARN\033[0m  Supabase email rate limit hit on register.")
            print("       Fix: Supabase Dashboard → Authentication → Email → disable 'Enable email confirmations'")
            print("       Or pass your own credentials: python test_endpoints.py http://localhost:8000 you@email.com pass")
            _summary()
            return
        ok = check("POST /auth/register → 200 (first run)", reg_r.status_code == 200, reg_r.text[:300])
        if ok:
            token = reg_r.json().get("access_token")
            check("  returns access_token", bool(token), f"token={str(token)[:40]}")
            # Confirm login works immediately after register
            login_r2 = httpx.post(f"{BASE}/auth/login",
                                   json={"email": email, "password": password}, timeout=20)
            ok2 = check("POST /auth/login → 200 (after register)", login_r2.status_code == 200, login_r2.text[:200])
            if ok2:
                token = login_r2.json().get("access_token") or token

    if not token:
        print(f"\n{_SKIP}  No token — skipping auth-required tests\n")
        _summary()
        return

    headers = {"Authorization": f"Bearer {token}"}

    # ── Auth: forgot-password (just check it returns 200, no real email) ─────
    r = httpx.post(f"{BASE}/auth/forgot-password",
                   json={"email": "nobody@mailinator.com"}, timeout=15)
    check("POST /auth/forgot-password → 200", r.status_code == 200, r.text[:200])

    # ── Users ─────────────────────────────────────────────────────────────────
    print("\n── Users ────────────────────────────────────────────────")
    r = httpx.get(f"{BASE}/users/me", headers=headers, timeout=15)
    check("GET /users/me → 200", r.status_code == 200, r.text[:200])

    r = httpx.put(f"{BASE}/users/me", headers=headers,
                  json={"display_name": "Tester", "skills": ["Python", "FastAPI"],
                        "hourly_rate": 50, "experience": "mid"},
                  timeout=15)
    check("PUT /users/me → 200", r.status_code == 200, r.text[:200])

    # ── Scan ─────────────────────────────────────────────────────────────────
    print("\n── Scan ─────────────────────────────────────────────────")
    r = httpx.post(f"{BASE}/scan", headers=headers,
                   json={"query": "python developer", "platforms": ["upwork"],
                         "skills": [{"name": "Python", "level": "competent"}], "hourly_rate": 50, "experience": "mid"},
                   timeout=30)
    ok = check("POST /scan → 200", r.status_code == 200, r.text[:300])
    if ok:
        body = r.json()
        scan_id = body.get("scan_id")
        check("  returns scan_id", bool(scan_id), f"scan_id={scan_id}")

    # Poll for results (up to 30 s)
    if scan_id:
        print(f"  Polling scan {scan_id} ...", end="", flush=True)
        for _ in range(12):
            time.sleep(2.5)
            r = httpx.get(f"{BASE}/opportunities/{scan_id}", headers=headers, timeout=15)
            if r.status_code == 200 and r.json().get("status") != "processing":
                break
            print(".", end="", flush=True)
        print()
        check("GET /opportunities/{scan_id} → 200", r.status_code == 200, r.text[:300])

    # ── Scan history ──────────────────────────────────────────────────────────
    print("\n── History ──────────────────────────────────────────────")
    r = httpx.get(f"{BASE}/scans/history", headers=headers, timeout=15)
    check("GET /scans/history → 200", r.status_code == 200, r.text[:200])

    # ── Analyze ───────────────────────────────────────────────────────────────
    print("\n── Analyze ──────────────────────────────────────────────")
    r = httpx.post(f"{BASE}/jobs/analyze", headers=headers,
                   json={"description": "Looking for a Python developer to build a REST API with FastAPI. Budget $500-$1000."},
                   timeout=60)
    check("POST /jobs/analyze → 200", r.status_code == 200, r.text[:300])

    # ── Suggestions ───────────────────────────────────────────────────────────
    print("\n── Suggestions ──────────────────────────────────────────")
    r = httpx.post(f"{BASE}/suggestions", headers=headers,
                   json={"skills": ["Python", "FastAPI"], "experience": "mid"},
                   timeout=60)
    check("POST /suggestions → 200", r.status_code == 200, r.text[:300])

    _summary()


def _summary():
    total = len(results)
    passed = sum(results)
    failed = total - passed
    print(f"\n{'─'*54}")
    print(f"  {passed}/{total} passed", end="")
    if failed:
        print(f"  (\033[91m{failed} failed\033[0m)")
    else:
        print("  \033[92mall green\033[0m")
    print()


if __name__ == "__main__":
    main()
