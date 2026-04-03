# ATI Backend Simplified Docs

## Sync Provenance
- Synced source on remote Apache host: `/var/www/html/arif_trade_international`
- Synced into local workspace folder: `arif_trade_international/`
- Route/middleware source of truth: `arif_trade_international/restAPI/index.php`
- Behavior source of truth: `arif_trade_international/restAPI/modules/*/*Controller.php`

## Quick Access
- Base URL is runtime-derived in `/spec` (`base_url` field). Common local default in test script: `http://localhost/arif_trade_international/restAPI`
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

## Route Policy Snapshot (Current Code)
- Public: `GET /health`, `GET /spec`, `POST /auth/login`
- Any authenticated user: `GET /auth/me`, `POST /auth/refresh`
- All roles (`superadmin`, `editor`, `viewer`, `salesman`) read access:
	- `GET /categories`, `GET /categories/{id}`
	- `GET /products`, `GET /products/{id}`
	- `GET /products/{productId}/variants`, `GET /variants/{id}`
	- `GET /units`, `GET /units/{id}`
	- `GET /variants/{variantId}/units`, `GET /variant-units/{id}`
	- `GET /customers`, `GET /customers/{id}`
- `superadmin` + `editor` write access:
	- `POST/PUT /products/{...}`
	- `POST/PUT /products/{productId}/variants` and `/variants/{id}`
	- `POST/PUT /variants/{variantId}/units` and `/variant-units/{id}`
- `superadmin` only:
	- Full `users` CRUD
	- Write ops for `categories`, `units`, `customers`
	- Full `quotations`, `invoices`, `payments`, `inventory` APIs

## Business Workflow (Quotation -> Inventory)
1. Superadmin creates quotation (`POST /quotations`) with items.
2. Superadmin accepts quotation (`PUT /quotations/{id}/status`, status=`accepted`, `customer_id` required).
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
- `PUT /quotations/{id}`
- `DELETE /quotations/{id}`
- `PUT /quotations/{id}/status`

Valid status updates:
- `accepted` (requires `customer_id`)
- `rejected`
- `returned`

### Invoices & Payments
- `GET /invoices`
- `POST /invoices`
- `GET /invoices/{id}`
- `PUT /invoices/{id}`
- `DELETE /invoices/{id}`
- `GET /invoices/{invoiceId}/payments`
- `POST /invoices/{invoiceId}/payments`
- `GET /payments/{id}`
- `PUT /payments/{id}`
- `DELETE /payments/{id}`

### Inventory Audit
- `GET /inventory`
- `POST /inventory`
- `GET /inventory/log`
- `GET /inventory/{id}`
- `PUT /inventory/{id}`
- `DELETE /inventory/{id}`
- Query filters include: `action`, `variant_unit_id`, `product_id`, `user_id`, `from`, `to`, pagination

## Controller-Level Constraints Worth Remembering
- Quotations:
	- `PUT /quotations/{id}` only works when quotation `status` is `pending`.
	- `DELETE /quotations/{id}` only works when `pending` and no linked invoice exists.
	- `POST/PUT` validates all item rows (`variant_unit_id` exists, `quantity > 0`).
- Invoices:
	- `POST /invoices` rejects duplicate invoice per `quotation_id` (409 conflict).
	- `DELETE /invoices/{id}` rejects when payments exist (409 conflict).
	- `GET /invoices` validates filters (`status in active|returned|void`, paging max 200).
- Payments:
	- `POST /invoices/{invoiceId}/payments` and `PUT /payments/{id}` only for `active` invoices.
	- Overpayment is blocked both on create and update.
- Inventory:
	- Supports full CRUD plus alias `GET /inventory/log` -> same as `GET /inventory`.
	- `quantity` cannot be zero on create/update.
	- `action` must be one of `handover | sold | returned`.

## Role Model Notes (Important)
- Current route middleware is strict: all quotation/invoice/payment/inventory endpoints are `superadmin` only.
- Some comments/spec text still describe broader access patterns. For agentic work, trust `restAPI/index.php` route middleware first.

## Frontend-Important Notes
- Return action endpoint exists and is implemented as:
- `PUT /quotations/{id}/status` with body `{ "status": "returned" }`
- Quotation create/update supports customer pre-linking:
- `POST /quotations` and `PUT /quotations/{id}` support optional `customer_id`
- Inventory add/update uses variant-unit endpoints:
- Add: `POST /variants/{variantId}/units`
- Update: `PUT /variant-units/{id}`
- Additional admin invoice/payment edit APIs now exist:
- `PUT /invoices/{id}` and `PUT /payments/{id}`
