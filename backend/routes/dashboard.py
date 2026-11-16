from datetime import datetime, timezone
from flask import Blueprint
from supabase_client import get_supabase
from helpers import ok, handle_errors

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.get("/summary")
@handle_errors
def summary():
    supabase = get_supabase()

    products = supabase.table("products").select("id, name, stock_quantity, reorder_level, unit").execute().data or []
    customers_count = len(supabase.table("customers").select("id").execute().data or [])
    orders = supabase.table("orders").select("id, total_amount, status, order_date").execute().data or []

    today = datetime.now(timezone.utc).date()
    today_orders = [o for o in orders if o["order_date"][:10] == str(today) and o["status"] == "paid"]
    paid_orders = [o for o in orders if o["status"] == "paid"]

    low_stock = [p for p in products if p["stock_quantity"] <= p["reorder_level"]]

    recent_orders = (
        supabase.table("orders")
        .select("*, customers(name)")
        .order("order_date", desc=True)
        .limit(5)
        .execute()
        .data
    )

    return ok({
        "total_products": len(products),
        "total_customers": customers_count,
        "total_orders": len(orders),
        "low_stock_count": len(low_stock),
        "low_stock_items": low_stock[:10],
        "today_sales": sum(o["total_amount"] for o in today_orders),
        "today_order_count": len(today_orders),
        "lifetime_sales": sum(o["total_amount"] for o in paid_orders),
        "recent_orders": recent_orders,
    })
