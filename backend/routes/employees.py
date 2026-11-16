from flask import Blueprint, request
from supabase_client import get_supabase
from helpers import ok, fail, handle_errors

employees_bp = Blueprint("employees", __name__, url_prefix="/api/employees")


@employees_bp.get("")
@handle_errors
def list_employees():
    supabase = get_supabase()
    res = supabase.table("employees").select("*").order("name").execute()
    return ok(res.data)


@employees_bp.post("")
@handle_errors
def create_employee():
    body = request.get_json(force=True)
    if not body.get("name"):
        return fail("Employee name is required", 422)

    supabase = get_supabase()
    res = supabase.table("employees").insert({
        "name": body["name"],
        "role": body.get("role", "Staff"),
        "phone": body.get("phone"),
        "email": body.get("email"),
        "hire_date": body.get("hire_date"),
        "is_active": body.get("is_active", True),
    }).execute()
    return ok(res.data, "Employee created", 201)


@employees_bp.put("/<employee_id>")
@handle_errors
def update_employee(employee_id):
    body = request.get_json(force=True)
    supabase = get_supabase()
    res = supabase.table("employees").update({
        "name": body.get("name"),
        "role": body.get("role"),
        "phone": body.get("phone"),
        "email": body.get("email"),
        "is_active": body.get("is_active"),
    }).eq("id", employee_id).execute()
    return ok(res.data, "Employee updated")


@employees_bp.delete("/<employee_id>")
@handle_errors
def delete_employee(employee_id):
    supabase = get_supabase()
    supabase.table("employees").delete().eq("id", employee_id).execute()
    return ok(None, "Employee deleted")
