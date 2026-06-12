-- ============================================================================
-- PegaBao sample data — re-runnable (wipes all rows, resets identities)
-- Run locally:   npm run db:seed
-- On Supabase:   paste into the SQL Editor and run after schema.sql
-- ============================================================================

TRUNCATE reviews, bookings, tradesman_services, services, customers, tradesmen
    RESTART IDENTITY CASCADE;

-- ----------------------------------------------------------------------------
-- Service catalog
-- ----------------------------------------------------------------------------
INSERT INTO services (name, category, description) VALUES
    ('Pipe Repair',              'Plumbing',   'Fix leaking or burst pipes, faucets, and fittings'),
    ('Toilet Installation',      'Plumbing',   'Install or replace toilet fixtures'),
    ('Door Lock Installation',   'Locksmith',  'Install or replace door locks and deadbolts'),
    ('Key Duplication & Lockout','Locksmith',  'Duplicate keys and open locked doors'),
    ('Furniture Repair',         'Carpentry',  'Repair tables, chairs, cabinets, and wooden fixtures'),
    ('Custom Shelving',          'Carpentry',  'Build and install custom shelves and storage'),
    ('Ceiling Fan Installation', 'Electrical', 'Install or replace ceiling fans and light fixtures'),
    ('Outlet & Wiring Repair',   'Electrical', 'Fix faulty outlets, switches, and household wiring');

-- ----------------------------------------------------------------------------
-- Tradesmen
-- ----------------------------------------------------------------------------
INSERT INTO tradesmen (name, email, phone, location, bio, verified) VALUES
    ('Mang Ben Santos', 'ben.santos@example.com',    '0917-111-0001', 'Quezon City', 'Licensed plumber with 15 years of experience in residential repair.', TRUE),
    ('Jun Dela Cruz',   'jun.delacruz@example.com',  '0917-111-0002', 'Marikina',    'Carpenter specializing in custom furniture and repairs.',             TRUE),
    ('Rey Bautista',    'rey.bautista@example.com',  '0917-111-0003', 'Pasig',       'Locksmith available for emergency lockouts, day or night.',           FALSE),
    ('Lito Ramos',      'lito.ramos@example.com',    '0917-111-0004', 'Quezon City', 'Electrician — safety-first wiring and fixture installs.',             TRUE),
    ('Carlo Mendoza',   'carlo.mendoza@example.com', '0917-111-0005', 'Mandaluyong', 'Multi-skilled handyman: plumbing and carpentry odd jobs.',            FALSE);

-- ----------------------------------------------------------------------------
-- Customers
-- ----------------------------------------------------------------------------
INSERT INTO customers (name, email, phone, address) VALUES
    ('Maria Reyes',  'maria.reyes@example.com',  '0918-222-0001', 'Project 4, Quezon City'),
    ('Paolo Garcia', 'paolo.garcia@example.com', '0918-222-0002', 'Concepcion, Marikina'),
    ('Ana Lim',      'ana.lim@example.com',      '0918-222-0003', 'Kapitolyo, Pasig'),
    ('Diego Torres', 'diego.torres@example.com', '0918-222-0004', 'Plainview, Mandaluyong');

-- ----------------------------------------------------------------------------
-- Junction rows: who offers what, at what price and mastery.
-- Subqueries resolve ids by natural key so the seed never relies on
-- hard-coded identity values.
-- ----------------------------------------------------------------------------
INSERT INTO tradesman_services (tradesman_id, service_id, price, mastery) VALUES
    ((SELECT id FROM tradesmen WHERE email = 'ben.santos@example.com'),    (SELECT id FROM services WHERE name = 'Pipe Repair'),               450.00, 'MASTER'),
    ((SELECT id FROM tradesmen WHERE email = 'ben.santos@example.com'),    (SELECT id FROM services WHERE name = 'Toilet Installation'),      1200.00, 'EXPERT'),
    ((SELECT id FROM tradesmen WHERE email = 'jun.delacruz@example.com'),  (SELECT id FROM services WHERE name = 'Furniture Repair'),          600.00, 'EXPERT'),
    ((SELECT id FROM tradesmen WHERE email = 'jun.delacruz@example.com'),  (SELECT id FROM services WHERE name = 'Custom Shelving'),          2500.00, 'MASTER'),
    ((SELECT id FROM tradesmen WHERE email = 'rey.bautista@example.com'),  (SELECT id FROM services WHERE name = 'Door Lock Installation'),    800.00, 'EXPERT'),
    ((SELECT id FROM tradesmen WHERE email = 'rey.bautista@example.com'),  (SELECT id FROM services WHERE name = 'Key Duplication & Lockout'), 300.00, 'MASTER'),
    ((SELECT id FROM tradesmen WHERE email = 'lito.ramos@example.com'),    (SELECT id FROM services WHERE name = 'Ceiling Fan Installation'),  700.00, 'EXPERT'),
    ((SELECT id FROM tradesmen WHERE email = 'lito.ramos@example.com'),    (SELECT id FROM services WHERE name = 'Outlet & Wiring Repair'),    500.00, 'INTERMEDIATE'),
    ((SELECT id FROM tradesmen WHERE email = 'carlo.mendoza@example.com'), (SELECT id FROM services WHERE name = 'Pipe Repair'),               400.00, 'INTERMEDIATE'),
    ((SELECT id FROM tradesmen WHERE email = 'carlo.mendoza@example.com'), (SELECT id FROM services WHERE name = 'Furniture Repair'),          550.00, 'INTERMEDIATE');

-- ----------------------------------------------------------------------------
-- Bookings + reviews. Completed bookings get a review via a CTE so the
-- review's booking_id always references the row just inserted.
-- ----------------------------------------------------------------------------
WITH b AS (
    INSERT INTO bookings (customer_id, tradesman_id, service_id, scheduled_for, status, total_price)
    VALUES ((SELECT id FROM customers WHERE email = 'maria.reyes@example.com'),
            (SELECT id FROM tradesmen WHERE email = 'ben.santos@example.com'),
            (SELECT id FROM services  WHERE name  = 'Pipe Repair'),
            now() - interval '30 days', 'COMPLETED', 450.00)
    RETURNING id
)
INSERT INTO reviews (booking_id, rating, comment)
SELECT id, 5, 'Fixed our kitchen leak in under an hour. Highly recommended!' FROM b;

WITH b AS (
    INSERT INTO bookings (customer_id, tradesman_id, service_id, scheduled_for, status, total_price)
    VALUES ((SELECT id FROM customers WHERE email = 'paolo.garcia@example.com'),
            (SELECT id FROM tradesmen WHERE email = 'ben.santos@example.com'),
            (SELECT id FROM services  WHERE name  = 'Toilet Installation'),
            now() - interval '21 days', 'COMPLETED', 1200.00)
    RETURNING id
)
INSERT INTO reviews (booking_id, rating, comment)
SELECT id, 4, 'Clean installation, arrived a bit late but great work.' FROM b;

WITH b AS (
    INSERT INTO bookings (customer_id, tradesman_id, service_id, scheduled_for, status, total_price)
    VALUES ((SELECT id FROM customers WHERE email = 'ana.lim@example.com'),
            (SELECT id FROM tradesmen WHERE email = 'jun.delacruz@example.com'),
            (SELECT id FROM services  WHERE name  = 'Custom Shelving'),
            now() - interval '14 days', 'COMPLETED', 2500.00)
    RETURNING id
)
INSERT INTO reviews (booking_id, rating, comment)
SELECT id, 5, 'Beautiful shelves, exactly what we asked for.' FROM b;

WITH b AS (
    INSERT INTO bookings (customer_id, tradesman_id, service_id, scheduled_for, status, total_price)
    VALUES ((SELECT id FROM customers WHERE email = 'diego.torres@example.com'),
            (SELECT id FROM tradesmen WHERE email = 'rey.bautista@example.com'),
            (SELECT id FROM services  WHERE name  = 'Key Duplication & Lockout'),
            now() - interval '10 days', 'COMPLETED', 300.00)
    RETURNING id
)
INSERT INTO reviews (booking_id, rating, comment)
SELECT id, 5, 'Came at midnight when we were locked out. Lifesaver!' FROM b;

WITH b AS (
    INSERT INTO bookings (customer_id, tradesman_id, service_id, scheduled_for, status, total_price)
    VALUES ((SELECT id FROM customers WHERE email = 'maria.reyes@example.com'),
            (SELECT id FROM tradesmen WHERE email = 'lito.ramos@example.com'),
            (SELECT id FROM services  WHERE name  = 'Ceiling Fan Installation'),
            now() - interval '7 days', 'COMPLETED', 700.00)
    RETURNING id
)
INSERT INTO reviews (booking_id, rating, comment)
SELECT id, 4, 'Fan works great, cleaned up after the job.' FROM b;

WITH b AS (
    INSERT INTO bookings (customer_id, tradesman_id, service_id, scheduled_for, status, total_price)
    VALUES ((SELECT id FROM customers WHERE email = 'ana.lim@example.com'),
            (SELECT id FROM tradesmen WHERE email = 'carlo.mendoza@example.com'),
            (SELECT id FROM services  WHERE name  = 'Pipe Repair'),
            now() - interval '5 days', 'COMPLETED', 400.00)
    RETURNING id
)
INSERT INTO reviews (booking_id, rating, comment)
SELECT id, 3, 'Leak is fixed but took two visits.' FROM b;

-- Bookings still in progress (no review allowed yet — not COMPLETED)
INSERT INTO bookings (customer_id, tradesman_id, service_id, scheduled_for, status, total_price) VALUES
    ((SELECT id FROM customers WHERE email = 'paolo.garcia@example.com'),
     (SELECT id FROM tradesmen WHERE email = 'jun.delacruz@example.com'),
     (SELECT id FROM services  WHERE name  = 'Furniture Repair'),
     now() + interval '2 days', 'ACCEPTED', 600.00),
    ((SELECT id FROM customers WHERE email = 'diego.torres@example.com'),
     (SELECT id FROM tradesmen WHERE email = 'lito.ramos@example.com'),
     (SELECT id FROM services  WHERE name  = 'Outlet & Wiring Repair'),
     now() + interval '4 days', 'PENDING', 500.00),
    ((SELECT id FROM customers WHERE email = 'maria.reyes@example.com'),
     (SELECT id FROM tradesmen WHERE email = 'rey.bautista@example.com'),
     (SELECT id FROM services  WHERE name  = 'Door Lock Installation'),
     now() - interval '3 days', 'CANCELLED', 800.00);
