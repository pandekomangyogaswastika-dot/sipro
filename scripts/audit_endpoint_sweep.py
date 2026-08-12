#!/usr/bin/env python3
"""audit_endpoint_sweep.py — SIPRO (adopsi pola kn/KN3).

Login sebagai owner (full-access), hit SETIAP GET route /api dari openapi.json,
resolve query wajib bila diketahui, catat status + emptiness + error.
FAIL bila ada 5xx atau 4xx tak terduga (selain akses yang memang diblok).
"""
import sys
import requests

BASE = "http://localhost:8001"
API = BASE + "/api"
PW = "Sipro#2026"

# Query wajib untuk route tertentu (agar tidak 422).
QUERY_DEFAULTS = {
    "/api/activities": {"entity_type": "lead", "entity_id": "sweep-probe"},
}
# Endpoint streaming (SSE) yang TIDAK boleh disweep (koneksi long-lived -> akan timeout).
SKIP_STREAMING = {"/api/notifications/stream"}
errors = []


def login(email):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": PW}, timeout=10)
    r.raise_for_status()
    return r.json()["access_token"]


def main():
    token = login("owner@sipro.co.id")
    headers = {"Authorization": f"Bearer {token}"}
    spec = requests.get(f"{BASE}/openapi.json", timeout=10).json()
    paths = spec.get("paths", {})
    get_routes = [(p, i) for p, i in paths.items() if "get" in i and p.startswith("/api")]
    print(f"Menyapu {len(get_routes)} GET route /api sebagai owner...\n")

    for p, _info in sorted(get_routes):
        if p in SKIP_STREAMING:
            print(f"  [SKIP] GET {p} (streaming SSE endpoint — long-lived, tidak disweep)")
            continue
        if "{" in p:
            print(f"  [SKIP] GET {p} (butuh path param — belum ada resolver di Fase 0)")
            continue
        params = QUERY_DEFAULTS.get(p, {})
        try:
            r = requests.get(f"{BASE}{p}", headers=headers, params=params, timeout=10)
        except Exception as e:  # noqa: BLE001
            print(f"  [ERROR] GET {p} -> exception {e}")
            errors.append(p)
            continue
        status = r.status_code
        note = ""
        if status == 200:
            try:
                j = r.json()
                d = j.get("data") if isinstance(j, dict) else None
                if isinstance(d, list):
                    note = f" (data: {len(d)} item)"
                elif isinstance(d, dict):
                    note = " (objek)"
            except Exception:
                pass
            print(f"  [OK {status}] GET {p}{note}")
        elif status in (401, 403):
            print(f"  [WARN {status}] GET {p} (akses ditolak untuk owner — tinjau)")
        else:
            print(f"  [ERROR {status}] GET {p}")
            errors.append(p)

    print("-" * 50)
    if errors:
        print(f"ENDPOINT SWEEP FAILED: {len(errors)} route bermasalah")
        sys.exit(1)
    print("ENDPOINT SWEEP PASSED")


if __name__ == "__main__":
    main()
