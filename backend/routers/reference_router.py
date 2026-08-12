"""Reference registry endpoint — SSOT enum untuk frontend.

Frontend TIDAK BOLEH lagi meng-hardcode daftar dropdown. Semua diambil dari sini,
sehingga backend & frontend memakai nilai + label yang sama.
"""
from fastapi import APIRouter, Depends, HTTPException

import reference as ref
from db import db, ORG_ID
from security import get_current_user

router = APIRouter(prefix="/reference", tags=["reference"])


async def _dynamic_values(org_id: str) -> dict:
    """Lengkapi grup dinamis dengan nilai yang sudah dipakai di DB (agar tak hilang).

    Mendukung `source` tunggal maupun `sources` (beberapa koleksi) — mis. grup `vendor`
    dikumpulkan dari master subkontraktor + vendor yang pernah dipakai di tagihan & PO.
    """
    out = {}
    for name, group in ref.GROUPS.items():
        srcs = group.get("sources") or ([group["source"]] if group.get("source") else [])
        if not (group.get("dynamic") and srcs):
            continue
        vals = []
        for src in srcs:
            try:
                vals += await db[src["collection"]].distinct(src["field"], {"org_id": org_id})
            except Exception:  # noqa: BLE001
                continue
        out[name] = sorted({v for v in vals if isinstance(v, str) and v.strip()})
    return out


@router.get("")
async def get_reference(user: dict = Depends(get_current_user)):
    org = user.get("org_id", ORG_ID)
    registry = ref.public_registry(await _dynamic_values(org))
    return {"data": registry, "total": len(registry),
            "maps": {"channel_to_source": ref.CHANNEL_TO_SOURCE,
                     "source_score": ref.SOURCE_SCORE}}


@router.get("/{group}")
async def get_reference_group(group: str, user: dict = Depends(get_current_user)):
    if group not in ref.GROUPS:
        raise HTTPException(status_code=404, detail=f"Grup reference '{group}' tidak ada.")
    org = user.get("org_id", ORG_ID)
    registry = ref.public_registry(await _dynamic_values(org))
    return {"data": registry[group]}
