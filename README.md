# Cuts & Co. — Meat Shop SME Management System

A simple, modern, functional management system for a small meat shop:
dashboard, products, stock/inventory, orders (POS-style), customers, and
shop setup (categories, suppliers, staff).

- **Database:** Supabase (PostgreSQL)
- **Backend:** Python (Flask REST API) using the official `supabase-py` client
- **Frontend:** Plain HTML, CSS, and JavaScript (no build step, no framework)

## 1. Project structure

```
meatshop-sme/
├── backend/
│   ├── app.py                 Flask entry point
│   ├── supabase_client.py     Shared Supabase client
│   ├── helpers.py             Shared response helpers
│   ├── requirements.txt
│   ├── .env.example           Copy to .env and fill in your Supabase keys
│   └── routes/
│       ├── categories.py
│       ├── suppliers.py
│       ├── employees.py
│       ├── customers.py
│       ├── products.py
│       ├── inventory.py
│       ├── orders.py
│       └── dashboard.py
├── frontend/
│   ├── index.html             Dashboard
│   ├── products.html
│   ├── inventory.html
│   ├── orders.html
│   ├── customers.html
│   ├── settings.html          Categories / Suppliers / Staff
│   ├── css/style.css
│   └── js/ (api.js + one file per page)
└── database/
    └── schema.sql             Run this in Supabase SQL Editor
```

## 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor → New query**, paste the entire contents of
   `database/schema.sql`, and run it. This creates all 8 tables
   (`categories`, `suppliers`, `employees`, `customers`, `products`,
   `orders`, `order_items`, `inventory_logs`), their relationships,
   triggers, indexes, RLS policies, and a bit of seed data.
3. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **service_role key** (used by the backend — never expose this in a browser)

## 3. Set up the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then edit .env with your Supabase URL + service_role key

python app.py
```

The API runs at `http://127.0.0.1:5000`. Visit `http://127.0.0.1:5000/api/health`
to confirm it's running.

## 4. Run the frontend

No build tools needed — it's plain HTML/CSS/JS.

- Easiest: open `frontend/index.html` directly in your browser, **or**
- Recommended: serve it with a simple static server so relative paths behave consistently:

```bash
cd frontend
python -m http.server 5500
```

Then visit `http://127.0.0.1:5500`.

If you deploy the backend somewhere other than `127.0.0.1:5000`, update
`API_BASE` at the top of `frontend/js/api.js`.

## 5. How the data flows

- The frontend never talks to Supabase directly — every request goes to the
  Flask API, which uses the Supabase **service role** key to read/write.
- Placing an order inserts into `orders` + `order_items`, and automatically
  writes `inventory_logs` rows (`change_type = 'sale'`), which a database
  trigger uses to deduct `products.stock_quantity` — so stock always stays
  accurate without any manual math.
- Recording a stock movement in the Inventory page works the same way:
  it inserts into `inventory_logs`, and the trigger adjusts the product's
  stock automatically (`stock_in` adds, `stock_out`/`waste` subtracts,
  `adjustment` sets an exact value).

## 6. Tables at a glance

| Table              | Purpose                                             |
|--------------------|------------------------------------------------------|
| `categories`       | Product groupings (Beef, Pork, Chicken, Processed)   |
| `suppliers`        | Where products/meat are sourced from                 |
| `employees`        | Shop staff / cashiers / butchers                     |
| `customers`        | Shop customers                                       |
| `products`         | The meat cuts/items sold, with price & stock levels  |
| `orders`           | Each sales transaction                               |
| `order_items`      | Line items per order                                 |
| `inventory_logs`   | Full audit trail of every stock change               |

Enjoy running the shop! 🥩
