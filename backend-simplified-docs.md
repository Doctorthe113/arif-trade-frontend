# ATI Backend Simplified Docs

## Quick Access
- Base URL: `http://localhost:8080`
- Live spec JSON: `GET /spec`
- Health check: `GET /health`
- Auth: JWT bearer token (`Authorization: Bearer <token>`)

## Codebase Structure (Scanned)
- Front controller and route wiring: `arif_trade_international/restAPI/index.php`
- Core framework layer: `arif_trade_international/restAPI/core/`
- Domain modules: `arif_trade_international/restAPI/modules/`
- SQL schema/seeds: `arif_trade_international/restAPI/sql/`

## Module Responsibilities
- `auth`: login, token refresh, me profile
- `users`: superadmin user management
- `categories`: product category CRUD
- `products`: product CRUD + nested variant/unit detail fetch
- `variants`: product variant CRUD
- `units`: unit definitions (piece, box, etc.)
- `variantunits`: stock + price rows per `(variant, unit)` pair
- `customers`: doctor/pharmacy/etc. customer records
- `quotations`: quotation request lifecycle + stock workflow service
- `invoices`: sales invoice list/details
- `payments`: invoice payment records
- `inventory`: inventory movement audit log
- `docs`: `/spec` response generator

## Business Workflow (Quotation -> Inventory)
1. Salesman submits quotation (`POST /quotations`) with items.
2. Admin/editor accepts quotation (`PUT /quotations/{id}/status`, status=`accepted`, `customer_id` required).
3. Accept flow does:
- deducts `variant_units.stock_quantity`
- inserts `inventory_log` rows with action `handover`
- creates `sales_invoices` row
4. Return flow uses same status endpoint with status=`returned`.
5. Return flow does:
- restores stock quantities
- inserts `inventory_log` rows with action `returned`
- marks linked invoice as `returned`

## Key Endpoints by Area

### Auth
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/refresh`

### Users (superadmin)
- `GET /users`
- `POST /users`
- `GET /users/{id}`
- `PUT /users/{id}`
- `DELETE /users/{id}`

### Catalog
- `GET /categories`, `POST /categories`, `PUT /categories/{id}`, `DELETE /categories/{id}`
- `GET /products`, `POST /products`, `GET /products/{id}`, `PUT /products/{id}`, `DELETE /products/{id}`
- `GET /products/{productId}/variants`, `POST /products/{productId}/variants`
- `GET /variants/{id}`, `PUT /variants/{id}`, `DELETE /variants/{id}`
- `GET /units`, `POST /units`, `PUT /units/{id}`, `DELETE /units/{id}`
- `GET /variants/{variantId}/units`, `POST /variants/{variantId}/units`
- `GET /variant-units/{id}`, `PUT /variant-units/{id}`, `DELETE /variant-units/{id}`

### Customers
- `GET /customers`
- `POST /customers`
- `GET /customers/{id}`
- `PUT /customers/{id}`
- `DELETE /customers/{id}`

### Quotations
- `GET /quotations`
- `POST /quotations`
- `GET /quotations/{id}`
- `PUT /quotations/{id}/status`

Valid status updates:
- `accepted` (requires `customer_id`)
- `rejected`
- `returned`

### Invoices & Payments
- `GET /invoices`
- `GET /invoices/{id}`
- `GET /invoices/{invoiceId}/payments`
- `POST /invoices/{invoiceId}/payments`
- `DELETE /payments/{id}`

### Inventory Audit
- `GET /inventory/log`
- Query filters include: `action`, `variant_unit_id`, `product_id`, `user_id`, `from`, `to`, pagination

## Role Model (from live spec)
- `superadmin`: full access
- `editor`: quotation status management, stock workflow, payments
- `viewer`: read-only reporting/log access
- `salesman`: product browsing + quotation requests, own quote visibility

## Frontend-Important Notes
- Return action endpoint exists and is implemented as:
- `PUT /quotations/{id}/status` with body `{ "status": "returned" }`
- Quotation create supports doctor pre-linking:
- `POST /quotations` body supports optional `customer_id`
- Inventory add/update uses variant-unit endpoints:
- Add: `POST /variants/{variantId}/units`
- Update: `PUT /variant-units/{id}`
