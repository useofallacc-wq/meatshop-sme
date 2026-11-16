from flask import Blueprint, request
from supabase_client import get_supabase
from helpers import ok, fail, handle_errors

customers_bp = Blueprint("customers", __name__, url_prefix="/api/customers")


@customers_bp.get("")
@handle_errors
def list_customers():
    supabase = get_supabase()
    search = request.args.get("search")
    query = supabase.table("customers").select("*")
    if search:
        query = query.ilike("name", f"%{search}%")
    res = query.order("name").execute()
    return ok(res.data)


@customers_bp.get("/<customer_id>")
@handle_errors
def get_customer(customer_id):
    supabase = get_supabase()
    res = supabase.table("customers").select("*").eq("id", customer_id).single().execute()
    return ok(res.data)


@customers_bp.post("")
@handle_errors
def create_customer():
    body = request.get_json(force=True)
    if not body.get("name"):
        return fail("Customer name is required", 422)

    supabase = get_supabase()
    res = supabase.table("customers").insert({
        "name": body["name"],
        "phone": body.get("phone"),
        "email": body.get("email"),
        "address": body.get("address"),
        "notes": body.get("notes"),
    }).execute()
    return ok(res.data, "Customer created", 201)


@customers_bp.put("/<customer_id>")
@handle_errors
def update_customer(customer_id):
    body = request.get_json(force=True)
    supabase = get_supabase()
    res = supabase.table("customers").update({
        "name": body.get("name"),
        "phone": body.get("phone"),
        "email": body.get("email"),
        "address": body.get("address"),
        "notes": body.get("notes"),
    }).eq("id", customer_id).execute()
    return ok(res.data, "Customer updated")


@customers_bp.delete("/<customer_id>")
@handle_errors
def delete_customer(customer_id):
    supabase = get_supabase()
    supabase.table("customers").delete().eq("id", customer_id).execute()
    return ok(None, "Customer deleted")
