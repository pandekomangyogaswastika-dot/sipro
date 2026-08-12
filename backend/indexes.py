"""Index unik untuk natural key (temuan audit: 23 natural key tanpa proteksi DB).

Sebelum ini duplikat hanya dicegah oleh pengecekan aplikasi (`find_one` lalu `insert`),
yang bocor saat dua request datang bersamaan (race condition) atau saat data masuk lewat
jalur lain. Index unik menutup celah tersebut di level MongoDB.

Dipisah dari seed.py karena seed.py sudah menyentuh batas ukuran file (gate compliance).
Dijalankan idempoten di lifespan; index yang gagal (karena data duplikat lama) dilaporkan
tanpa menggagalkan startup.
"""
import logging

from pymongo.errors import DuplicateKeyError, OperationFailure

from db import db

logger = logging.getLogger("sipro.indexes")

# (koleksi, keys, nama index)
UNIQUE_INDEXES = [
    ("orgs", [("id", 1)], "uq_orgs_id"),
    ("projects", [("org_id", 1), ("code", 1)], "uq_projects_code"),
    ("units", [("org_id", 1), ("project_id", 1), ("code", 1)], "uq_units_code"),
    ("materials", [("org_id", 1), ("project_id", 1), ("code", 1)], "uq_materials_code"),
    ("wa_templates", [("org_id", 1), ("code", 1)], "uq_wa_templates_code"),
    ("document_templates", [("org_id", 1), ("code", 1)], "uq_doc_templates_code"),
    ("channel_accounts", [("org_id", 1), ("code", 1)], "uq_channels_code"),
    ("spk", [("org_id", 1), ("spk_number", 1)], "uq_spk_number"),
    ("purchase_orders", [("org_id", 1), ("po_number", 1)], "uq_po_number"),
    ("grns", [("org_id", 1), ("grn_number", 1)], "uq_grn_number"),
    ("progress_claims", [("org_id", 1), ("claim_number", 1)], "uq_claim_number"),
    ("change_orders", [("org_id", 1), ("co_number", 1)], "uq_co_number"),
    ("inspections", [("org_id", 1), ("inspection_number", 1)], "uq_inspection_number"),
    ("material_requisitions", [("org_id", 1), ("req_number", 1)], "uq_req_number"),
    ("journal_entries", [("org_id", 1), ("entry_no", 1)], "uq_entry_no"),
    ("documents", [("org_id", 1), ("doc_number", 1)], "uq_doc_number"),
    ("leads", [("org_id", 1), ("phone", 1)], "uq_leads_phone"),
    ("boq_items", [("org_id", 1), ("project_id", 1), ("cost_code", 1)], "uq_boq_cost_code"),
    ("construction_phases", [("org_id", 1), ("project_id", 1), ("name", 1)], "uq_phase_name"),
    ("commission_schemes", [("org_id", 1), ("name", 1)], "uq_comm_scheme_name"),
    ("payment_schemes", [("org_id", 1), ("name", 1)], "uq_pay_scheme_name"),
    ("faktur_pajak", [("org_id", 1), ("number", 1)], "uq_faktur_number"),
    ("inspection_templates", [("org_id", 1), ("code", 1)], "uq_qc_template_code"),
    ("subcontractors", [("org_id", 1), ("code", 1)], "uq_subcon_code"),
    ("customers", [("org_id", 1), ("nik", 1)], "uq_customers_nik"),
    ("portal_users", [("org_id", 1), ("phone", 1)], "uq_portal_phone"),
    # ---------------- Fase 27 ----------------
    ("cash_advances", [("org_id", 1), ("no", 1)], "uq_cashbon_no"),
    ("fixed_assets", [("org_id", 1), ("code", 1)], "uq_asset_code"),
    # Kunci idempotensi penyusutan di level DB: satu aset hanya boleh punya SATU
    # entri penyusutan per periode (mencegah jurnal dobel bila tombol diklik dua kali).
    ("asset_depreciations", [("org_id", 1), ("asset_id", 1), ("period", 1)], "uq_asset_depr"),
    ("loans", [("org_id", 1), ("no", 1)], "uq_loan_no"),
    ("agents", [("org_id", 1), ("name", 1)], "uq_agent_name"),
    ("marketing_fees", [("org_id", 1), ("no", 1)], "uq_marketing_fee_no"),
    # ---------------- Fase 31: jadwal pembangunan per unit ----------------
    ("build_templates", [("org_id", 1), ("code", 1)], "uq_build_template_code"),
    # Satu unit hanya boleh punya SATU jadwal aktif (mencegah progres ganda).
    ("build_schedules", [("org_id", 1), ("unit_id", 1)], "uq_build_schedule_unit"),
    ("build_items", [("org_id", 1), ("schedule_id", 1), ("step_code", 1)], "uq_build_item_step"),
]

# Natural key yang boleh kosong (partial index: hanya baris yang punya nilai dijaga).
PARTIAL = {
    "uq_boq_cost_code": "cost_code",
    "uq_doc_number": "doc_number",
    "uq_leads_phone": "phone",
    "uq_faktur_number": "number",
    "uq_spk_number": "spk_number",
    "uq_po_number": "po_number",
    "uq_grn_number": "grn_number",
    "uq_claim_number": "claim_number",
    "uq_co_number": "co_number",
    "uq_inspection_number": "inspection_number",
    "uq_req_number": "req_number",
    "uq_entry_no": "entry_no",
    "uq_customers_nik": "nik",
    "uq_portal_phone": "phone",
    "uq_cashbon_no": "no",
    "uq_asset_code": "code",
    "uq_loan_no": "no",
    "uq_marketing_fee_no": "no",
}


async def ensure_unique_indexes() -> dict:
    """Buat semua index unik. Kembalikan {created: [...], conflicts: [...]}"""
    created, already, conflicts = [], [], []
    for coll, keys, name in UNIQUE_INDEXES:
        kwargs = {"unique": True, "name": name}
        field = PARTIAL.get(name)
        if field:
            kwargs["partialFilterExpression"] = {field: {"$type": "string"}}
        try:
            await db[coll].create_index(keys, **kwargs)
            created.append(name)
        except (DuplicateKeyError, OperationFailure) as e:
            msg = str(e)
            if "already exists with a different name" in msg or "IndexOptionsConflict" in msg:
                already.append(name)  # sudah terlindungi index unik lain (nama berbeda)
            else:
                conflicts.append({"index": name, "collection": coll, "error": msg[:200]})
    if conflicts:
        logger.warning("Index unik gagal dibuat (ada data duplikat lama): %s",
                       [c["index"] for c in conflicts])
    return {"created": created, "already_protected": already, "conflicts": conflicts}
