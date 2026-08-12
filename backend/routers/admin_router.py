"""Admin routes: users management + RBAC permission matrix (SSOT)."""
from fastapi import APIRouter, Depends, HTTPException

from db import db, ORG_ID
from core_utils import new_id, now_iso, serialize_doc, parse_pagination
from security import hash_password
from rbac import require_permission, get_matrix, DEFAULT_PERMISSIONS, ALL_ROLES, audit_log
from models import UserCreate, UserUpdate, PermissionUpdate

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
async def list_users(skip: int = 0, limit: int = 50,
                     user: dict = Depends(require_permission("users", "view"))):
    skip, limit = parse_pagination(skip, limit)
    q = {"org_id": user.get("org_id", ORG_ID)}
    total = await db.users.count_documents(q)
    rows = await db.users.find(q, {"_id": 0, "password_hash": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"data": serialize_doc(rows), "total": total}


@router.post("/users")
async def create_user(payload: UserCreate,
                      user: dict = Depends(require_permission("users", "create"))):
    email = payload.email.lower()
    if payload.role not in ALL_ROLES:
        raise HTTPException(status_code=400, detail="Peran tidak valid")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    ts = now_iso()
    doc = {
        "id": new_id(), "org_id": user.get("org_id", ORG_ID), "name": payload.name,
        "email": email, "role": payload.role, "phone": payload.phone,
        "password_hash": hash_password(payload.password), "is_active": True,
        "created_at": ts, "updated_at": ts,
    }
    await db.users.insert_one(doc)
    await audit_log(user, "create", "users", doc["id"], {"email": email, "role": payload.role})
    doc.pop("password_hash", None)
    return {"data": serialize_doc(doc)}


@router.put("/users/{user_id}")
async def update_user(user_id: str, payload: UserUpdate,
                      user: dict = Depends(require_permission("users", "update"))):
    target = await db.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")
    updates = {}
    if payload.name is not None:
        updates["name"] = payload.name
    if payload.role is not None:
        if payload.role not in ALL_ROLES:
            raise HTTPException(status_code=400, detail="Peran tidak valid")
        updates["role"] = payload.role
    if payload.phone is not None:
        updates["phone"] = payload.phone
    if payload.is_active is not None:
        updates["is_active"] = payload.is_active
    if payload.password:
        updates["password_hash"] = hash_password(payload.password)
    updates["updated_at"] = now_iso()
    await db.users.update_one({"id": user_id}, {"$set": updates})
    await audit_log(user, "update", "users", user_id, {k: v for k, v in updates.items() if k != "password_hash"})
    fresh = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return {"data": serialize_doc(fresh)}


@router.get("/permissions")
async def get_permissions(user: dict = Depends(require_permission("permissions", "view"))):
    matrix = await get_matrix()
    return {"data": {"matrix": matrix, "roles": ALL_ROLES, "resources": list(DEFAULT_PERMISSIONS.keys())}}


@router.put("/permissions")
async def update_permissions(payload: PermissionUpdate,
                             user: dict = Depends(require_permission("permissions", "manage"))):
    await db.permission_settings.update_one(
        {"key": "rbac_matrix"},
        {"$set": {"key": "rbac_matrix", "matrix": payload.matrix, "updated_at": now_iso(),
                  "updated_by": user.get("email")}},
        upsert=True,
    )
    await audit_log(user, "update", "permissions", "rbac_matrix")
    return {"data": {"matrix": payload.matrix}}


@router.get("/audit-logs")
async def list_audit_logs(resource: str = None, action: str = None, actor: str = None,
                          skip: int = 0, limit: int = 50,
                          user: dict = Depends(require_permission("audit_logs", "view"))):
    """Jejak audit yang sebelumnya DITULIS tapi TIDAK BISA DILIHAT (tak ada endpoint)."""
    skip, limit = parse_pagination(skip, limit)
    q = {"org_id": user.get("org_id", ORG_ID)}
    if resource:
        q["resource"] = resource
    if action:
        q["action"] = action
    if actor:
        q["actor"] = actor
    total = await db.audit_logs.count_documents(q)
    rows = await db.audit_logs.find(q, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    resources = await db.audit_logs.distinct("resource", {"org_id": user.get("org_id", ORG_ID)})
    actions = await db.audit_logs.distinct("action", {"org_id": user.get("org_id", ORG_ID)})
    return {"data": serialize_doc(rows), "total": total,
            "filters": {"resources": sorted(r for r in resources if r),
                        "actions": sorted(a for a in actions if a)}}
