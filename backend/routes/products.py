from flask import Blueprint, request
from supabase_client import get_supabase
from helpers import ok, fail, handle_errors

products_bp = Blueprint("products", __name__, url_prefix="/api/products")

SELECT_WITH_JOINS = "*, categories(id, name), suppliers(id, name)"


@products_bp.get("")
@handle_errors
def list_products():
    supabase = get_supabase()
    search = request.args.get("search")
    category_id = request.args.get("category_id")
    low_stock = request.args.get("low_stock")

    query = supabase.table("products").select(SELECT_WITH_JOINS)

    if search:
        query = query.ilike("name", f"%{search}%")
    if category_id:
        query = query.eq("category_id", category_id)

    res = query.order("name").execute()
    data = res.data or []

    if low_stock == "true":
        data = [p for p in data if p["stock_quantity"] <= p["reorder_level"]]

    return ok(data)


@products_bp.get("/<product_id>")
@handle_errors
def get_product(product_id):
    supabase = get_supabase()
    res = supabase.table("products").select(SELECT_WITH_JOINS).eq("id", product_id).single().execute()
    return ok(res.data)


@products_bp.post("")
@handle_errors
def create_product():
    body = request.get_json(force=True)
    if not body.get("name") or body.get("price_per_unit") in (None, ""):
        return fail("Product name and price are required", 422)

    supabase = get_supabase()
    res = supabase.table("products").insert({
        "name": body["name"],
        "category_id": body.get("category_id") or None,
        "supplier_id": body.get("supplier_id") or None,
        "sku": body.get("sku") or None,
        "unit": body.get("unit", "kg"),
        "price_per_unit": body["price_per_unit"],
        "cost_per_unit": body.get("cost_per_unit", 0),
        "stock_quantity": body.get("stock_quantity", 0),
        "reorder_level": body.get("reorder_level", 5),
        "image_url": body.get("image_url"),
        "is_active": body.get("is_active", True),
    }).execute()
    return ok(res.data, "Product created", 201)


@products_bp.put("/<product_id>")
@handle_errors
def update_product(product_id):
    body = request.get_json(force=True)
    supabase = get_supabase()
    res = supabase.table("products").update({
        "name": body.get("name"),
        "category_id": body.get("category_id") or None,
        "supplier_id": body.get("supplier_id") or None,
        "sku": body.get("sku") or None,
        "unit": body.get("unit"),
        "price_per_unit": body.get("price_per_unit"),
        "cost_per_unit": body.get("cost_per_unit"),
        "reorder_level": body.get("reorder_level"),
        "image_url": body.get("image_url"),
        "is_active": body.get("is_active"),
    }).eq("id", product_id).execute()
    return ok(res.data, "Product updated")


@products_bp.delete("/<product_id>")
@handle_errors
def delete_product(product_id):
    supabase = get_supabase()
    supabase.table("products").delete().eq("id", product_id).execute()
    return ok(None, "Product deleted")
