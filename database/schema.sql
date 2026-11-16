-- ============================================================================
--  CUTS & CO. — MEAT SHOP SME DATABASE SCHEMA
--  Run this entire file in: Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================================

-- Needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. CATEGORIES  (e.g. Beef, Pork, Chicken, Processed)
-- ----------------------------------------------------------------------------
create table if not exists categories (
    id          uuid primary key default gen_random_uuid(),
    name        text not null unique,
    description text,
    created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. SUPPLIERS
-- ----------------------------------------------------------------------------
create table if not exists suppliers (
    id              uuid primary key default gen_random_uuid(),
    name            text not null,
    contact_person  text,
    phone           text,
    email           text,
    address         text,
    created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. EMPLOYEES
-- ----------------------------------------------------------------------------
create table if not exists employees (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    role        text not null default 'Staff' check (role in ('Owner','Manager','Butcher','Cashier','Staff')),
    phone       text,
    email       text,
    hire_date   date default current_date,
    is_active   boolean not null default true,
    created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. CUSTOMERS
-- ----------------------------------------------------------------------------
create table if not exists customers (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    phone       text,
    email       text,
    address     text,
    notes       text,
    created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. PRODUCTS  (the meat cuts / SKUs sold in the shop)
-- ----------------------------------------------------------------------------
create table if not exists products (
    id              uuid primary key default gen_random_uuid(),
    name            text not null,
    category_id     uuid references categories(id) on delete set null,
    supplier_id     uuid references suppliers(id) on delete set null,
    sku             text unique,
    unit            text not null default 'kg' check (unit in ('kg','g','pc','pack','tray')),
    price_per_unit  numeric(10,2) not null check (price_per_unit >= 0),
    cost_per_unit   numeric(10,2) default 0 check (cost_per_unit >= 0),
    stock_quantity  numeric(10,2) not null default 0 check (stock_quantity >= 0),
    reorder_level   numeric(10,2) not null default 5,
    image_url       text,
    is_active       boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_supplier on products(supplier_id);

-- ----------------------------------------------------------------------------
-- 6. ORDERS  (point-of-sale transactions / customer orders)
-- ----------------------------------------------------------------------------
create table if not exists orders (
    id              uuid primary key default gen_random_uuid(),
    order_number    text unique not null default ('ORD-' || to_char(now(),'YYMMDD') || '-' || lpad(floor(random()*10000)::text,4,'0')),
    customer_id     uuid references customers(id) on delete set null,
    employee_id     uuid references employees(id) on delete set null,
    order_date      timestamptz not null default now(),
    status          text not null default 'pending' check (status in ('pending','paid','cancelled','refunded')),
    payment_method  text default 'cash' check (payment_method in ('cash','gcash','card','bank_transfer')),
    total_amount    numeric(10,2) not null default 0,
    notes           text,
    created_at      timestamptz not null default now()
);

create index if not exists idx_orders_customer on orders(customer_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_date on orders(order_date);

-- ----------------------------------------------------------------------------
-- 7. ORDER_ITEMS  (line items per order)
-- ----------------------------------------------------------------------------
create table if not exists order_items (
    id          uuid primary key default gen_random_uuid(),
    order_id    uuid not null references orders(id) on delete cascade,
    product_id  uuid references products(id) on delete set null,
    quantity    numeric(10,2) not null check (quantity > 0),
    unit_price  numeric(10,2) not null check (unit_price >= 0),
    subtotal    numeric(10,2) generated always as (quantity * unit_price) stored
);

create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_order_items_product on order_items(product_id);

-- ----------------------------------------------------------------------------
-- 8. INVENTORY_LOGS  (stock in / stock out / adjustments, full audit trail)
-- ----------------------------------------------------------------------------
create table if not exists inventory_logs (
    id                  uuid primary key default gen_random_uuid(),
    product_id          uuid not null references products(id) on delete cascade,
    change_type         text not null check (change_type in ('stock_in','stock_out','adjustment','sale','waste')),
    quantity            numeric(10,2) not null,
    reason              text,
    reference_order_id  uuid references orders(id) on delete set null,
    employee_id         uuid references employees(id) on delete set null,
    created_at          timestamptz not null default now()
);

create index if not exists idx_inventory_logs_product on inventory_logs(product_id);

-- ============================================================================
--  TRIGGERS
-- ============================================================================

-- Keep products.updated_at fresh on every update
create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
before update on products
for each row execute function set_updated_at();

-- Automatically adjust product stock whenever an inventory_log row is inserted
create or replace function apply_inventory_log()
returns trigger as $$
begin
    if new.change_type in ('stock_in') then
        update products set stock_quantity = stock_quantity + new.quantity where id = new.product_id;
    elsif new.change_type in ('stock_out','sale','waste') then
        update products set stock_quantity = greatest(stock_quantity - new.quantity, 0) where id = new.product_id;
    elsif new.change_type = 'adjustment' then
        update products set stock_quantity = greatest(new.quantity, 0) where id = new.product_id;
    end if;
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_apply_inventory_log on inventory_logs;
create trigger trg_apply_inventory_log
after insert on inventory_logs
for each row execute function apply_inventory_log();

-- ============================================================================
--  ROW LEVEL SECURITY
--  The Flask backend uses the Supabase SERVICE ROLE key (bypasses RLS) so the
--  API works out of the box. These permissive policies also let you query the
--  tables safely with the anon/public key (e.g. for testing in the Supabase
--  dashboard or a future client-side read-only view).
-- ============================================================================

alter table categories       enable row level security;
alter table suppliers        enable row level security;
alter table employees        enable row level security;
alter table customers        enable row level security;
alter table products         enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;
alter table inventory_logs   enable row level security;

create policy "Allow all - categories"     on categories     for all using (true) with check (true);
create policy "Allow all - suppliers"      on suppliers      for all using (true) with check (true);
create policy "Allow all - employees"      on employees      for all using (true) with check (true);
create policy "Allow all - customers"      on customers      for all using (true) with check (true);
create policy "Allow all - products"       on products       for all using (true) with check (true);
create policy "Allow all - orders"         on orders         for all using (true) with check (true);
create policy "Allow all - order_items"    on order_items    for all using (true) with check (true);
create policy "Allow all - inventory_logs" on inventory_logs for all using (true) with check (true);

-- ============================================================================
--  SEED DATA (sample categories, suppliers, employees, products)
-- ============================================================================

insert into categories (name, description) values
    ('Beef',      'Fresh beef cuts'),
    ('Pork',      'Fresh pork cuts'),
    ('Chicken',   'Fresh chicken & poultry'),
    ('Processed', 'Hotdogs, longganisa, tocino, bacon')
on conflict (name) do nothing;

insert into suppliers (name, contact_person, phone, email, address) values
    ('Green Valley Meat Supply', 'Rico Santos',   '0917-111-2222', 'rico@greenvalley.ph',  'Cebu City'),
    ('Fresh Farms Poultry Co.',  'Ana Reyes',     '0918-333-4444', 'ana@freshfarms.ph',    'Mandaue City')
on conflict do nothing;

insert into employees (name, role, phone, email) values
    ('Juan Dela Cruz', 'Owner',  '0919-555-6666', 'juan@cutsandco.ph'),
    ('Maria Lopez',    'Butcher','0920-777-8888', 'maria@cutsandco.ph')
on conflict do nothing;

insert into products (name, category_id, supplier_id, sku, unit, price_per_unit, cost_per_unit, stock_quantity, reorder_level)
select 'Pork Belly (Liempo)', c.id, s.id, 'PRK-001', 'kg', 280.00, 220.00, 25, 5
from categories c, suppliers s where c.name='Pork' and s.name='Green Valley Meat Supply'
on conflict (sku) do nothing;

insert into products (name, category_id, supplier_id, sku, unit, price_per_unit, cost_per_unit, stock_quantity, reorder_level)
select 'Beef Brisket', c.id, s.id, 'BEF-001', 'kg', 420.00, 350.00, 15, 4
from categories c, suppliers s where c.name='Beef' and s.name='Green Valley Meat Supply'
on conflict (sku) do nothing;

insert into products (name, category_id, supplier_id, sku, unit, price_per_unit, cost_per_unit, stock_quantity, reorder_level)
select 'Whole Chicken', c.id, s.id, 'CHK-001', 'kg', 180.00, 140.00, 30, 6
from categories c, suppliers s where c.name='Chicken' and s.name='Fresh Farms Poultry Co.'
on conflict (sku) do nothing;

insert into products (name, category_id, supplier_id, sku, unit, price_per_unit, cost_per_unit, stock_quantity, reorder_level)
select 'Homemade Longganisa', c.id, s.id, 'PRC-001', 'pack', 150.00, 95.00, 3, 5
from categories c, suppliers s where c.name='Processed' and s.name='Green Valley Meat Supply'
on conflict (sku) do nothing;

-- ============================================================================
--  DONE. Grab your Project URL and anon/service_role keys from:
--  Supabase Dashboard -> Project Settings -> API
-- ============================================================================
