from flask import Blueprint, request
from supabase_client import get_supabase
from helpers import ok, fail, handle_errors

orders_bp = Blueprint("orders", __name__, url_prefix="/api/orders")

ORDER_SELECT = "*, customers(id, name, phone), employees(id, name)"
ITEM_SELECT = "*, products(id, name, unit)"


@orders_bp.get("")
@handle_errors
def list_orders():
    supabase = get_supabase()
    status = request.args.get("status")
    query = supabase.table("orders").select(ORDER_SELECT)
    if status:
        query = query.eq("status", status)
    res = query.order("order_date", desc=True).execute()
    return ok(res.data)


@orders_bp.get("/<order_id>")
@handle_errors
def get_order(order_id):
    supabase = get_supabase()
    order = supabase.table("orders").select(ORDER_SELECT).eq("id", order_id).single().execute()
    items = supabase.table("order_items").select(ITEM_SELECT).eq("order_id", order_id).execute()
    result = order.data
    result["items"] = items.data
    return ok(result)


@orders_bp.post("")
@handle_errors
def create_order():
    """
    Expects:
    {
      "customer_id": "...", "employee_id": "...", "payment_method": "cash",
      "items": [ {"product_id": "...", "quantity": 2, "unit_price": 280.00}, ... ]
    }
    Creates the order, its line items, computes the total, and writes a
    'sale' inventory_log per item so stock is deducted automatically.
    """
    body = request.get_json(force=True)
    items = body.get("items") or []

    if not items:
        return fail("At least one order item is required", 422)

    supabase = get_supabase()

    total_amount = sum(float(i["quantity"]) * float(i["unit_price"]) for i in items)

    order_res = supabase.table("orders").insert({
        "customer_id": body.get("customer_id") or None,
        "employee_id": body.get("employee_id") or None,
        "status": body.get("status", "paid"),
        "payment_method": body.get("payment_method", "cash"),
        "total_amount": total_amount,
        "notes": body.get("notes"),
    }).execute()

    order = order_res.data[0]
    order_id = order["id"]

    item_rows = [{
        "order_id": order_id,
        "product_id": item["product_id"],
        "quantity": item["quantity"],
        "unit_price": item["unit_price"],
    } for item in items]

    supabase.table("order_items").insert(item_rows).execute()

    # Deduct stock for each sold item (skipped automatically if order is just "pending")
    if order["status"] == "paid":
        for item in items:
            supabase.table("inventory_logs").insert({
                "product_id": item["product_id"],
                "change_type": "sale",
                "quantity": item["quantity"],
                "reason": f"Order {order.get('order_number', order_id)}",
                "reference_order_id": order_id,
                "employee_id": body.get("employee_id") or None,
            }).execute()

    return ok(order, "Order created", 201)


@orders_bp.put("/<order_id>/status")
@handle_errors
def update_order_status(order_id):
    body = request.get_json(force=True)
    new_status = body.get("status")
    if new_status not in ("pending", "paid", "cancelled", "refunded"):
        return fail("Invalid status", 422)

    supabase = get_supabase()
    res = supabase.table("orders").update({"status": new_status}).eq("id", order_id).execute()
    return ok(res.data, "Order status updated")


@orders_bp.delete("/<order_id>")
@handle_errors
def delete_order(order_id):
    supabase = get_supabase()
    supabase.table("orders").delete().eq("id", order_id).execute()
    return ok(None, "Order deleted")
