from flask import Blueprint, request
from supabase_client import get_supabase
from helpers import ok, fail, handle_errors

suppliers_bp = Blueprint("suppliers", __name__, url_prefix="/api/suppliers")


@suppliers_bp.get("")
@handle_errors
def list_suppliers():
    supabase = get_supabase()
    res = supabase.table("suppliers").select("*").order("name").execute()
    return ok(res.data)


@suppliers_bp.get("/<supplier_id>")
@handle_errors
def get_supplier(supplier_id):
    supabase = get_supabase()
    res = supabase.table("suppliers").select("*").eq("id", supplier_id).single().execute()
    return ok(res.data)


@suppliers_bp.post("")
@handle_errors
def create_supplier():
    body = request.get_json(force=True)
    if not body.get("name"):
        return fail("Supplier name is required", 422)

    supabase = get_supabase()
    res = supabase.table("suppliers").insert({
        "name": body["name"],
        "contact_person": body.get("contact_person"),
        "phone": body.get("phone"),
        "email": body.get("email"),
        "address": body.get("address"),
    }).execute()
    return ok(res.data, "Supplier created", 201)


@suppliers_bp.put("/<supplier_id>")
@handle_errors
def update_supplier(supplier_id):
    body = request.get_json(force=True)
    supabase = get_supabase()
    res = supabase.table("suppliers").update({
        "name": body.get("name"),
        "contact_person": body.get("contact_person"),
        "phone": body.get("phone"),
        "email": body.get("email"),
        "address": body.get("address"),
    }).eq("id", supplier_id).execute()
    return ok(res.data, "Supplier updated")


@suppliers_bp.delete("/<supplier_id>")
@handle_errors
def delete_supplier(supplier_id):
    supabase = get_supabase()
    supabase.table("suppliers").delete().eq("id", supplier_id).execute()
    return ok(None, "Supplier deleted")
