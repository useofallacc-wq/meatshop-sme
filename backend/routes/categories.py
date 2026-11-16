from flask import Blueprint, request
from supabase_client import get_supabase
from helpers import ok, fail, handle_errors

categories_bp = Blueprint("categories", __name__, url_prefix="/api/categories")


@categories_bp.get("")
@handle_errors
def list_categories():
    supabase = get_supabase()
    res = supabase.table("categories").select("*").order("name").execute()
    return ok(res.data)


@categories_bp.get("/<category_id>")
@handle_errors
def get_category(category_id):
    supabase = get_supabase()
    res = supabase.table("categories").select("*").eq("id", category_id).single().execute()
    return ok(res.data)


@categories_bp.post("")
@handle_errors
def create_category():
    body = request.get_json(force=True)
    if not body.get("name"):
        return fail("Category name is required", 422)

    supabase = get_supabase()
    res = supabase.table("categories").insert({
        "name": body["name"],
        "description": body.get("description"),
    }).execute()
    return ok(res.data, "Category created", 201)


@categories_bp.put("/<category_id>")
@handle_errors
def update_category(category_id):
    body = request.get_json(force=True)
    supabase = get_supabase()
    res = supabase.table("categories").update({
        "name": body.get("name"),
        "description": body.get("description"),
    }).eq("id", category_id).execute()
    return ok(res.data, "Category updated")


@categories_bp.delete("/<category_id>")
@handle_errors
def delete_category(category_id):
    supabase = get_supabase()
    supabase.table("categories").delete().eq("id", category_id).execute()
    return ok(None, "Category deleted")
