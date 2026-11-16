from flask import Blueprint, request
from supabase_client import get_supabase
from helpers import ok, fail, handle_errors

inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")

SELECT_WITH_JOINS = "*, products(id, name, unit)"


@inventory_bp.get("")
@handle_errors
def list_logs():
    supabase = get_supabase()
    product_id = request.args.get("product_id")
    query = supabase.table("inventory_logs").select(SELECT_WITH_JOINS)
    if product_id:
        query = query.eq("product_id", product_id)
    res = query.order("created_at", desc=True).limit(200).execute()
    return ok(res.data)


@inventory_bp.post("")
@handle_errors
def create_log():
    """
    Creates a stock movement. The database trigger `trg_apply_inventory_log`
    automatically adjusts products.stock_quantity based on change_type:
      - stock_in              -> adds quantity
      - stock_out / sale / waste -> subtracts quantity
      - adjustment            -> SETS stock_quantity to the given quantity
    """
    body = request.get_json(force=True)
    required = ("product_id", "change_type", "quantity")
    if not all(body.get(f) not in (None, "") for f in required):
        return fail("product_id, change_type and quantity are required", 422)

    if body["change_type"] not in ("stock_in", "stock_out", "adjustment", "sale", "waste"):
        return fail("Invalid change_type", 422)

    supabase = get_supabase()
    res = supabase.table("inventory_logs").insert({
        "product_id": body["product_id"],
        "change_type": body["change_type"],
        "quantity": body["quantity"],
        "reason": body.get("reason"),
        "reference_order_id": body.get("reference_order_id"),
        "employee_id": body.get("employee_id"),
    }).execute()
    return ok(res.data, "Stock movement recorded", 201)
