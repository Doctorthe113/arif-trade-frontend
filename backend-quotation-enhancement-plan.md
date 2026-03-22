# Quotation Editing + Partial Return Backend Plan

## Current Backend Capability (Verified)
- `GET /quotations`
- `POST /quotations`
- `GET /quotations/{id}`
- `PUT /quotations/{id}/status` with only `accepted | rejected | returned`
- Return flow is full-return only (all items), no per-item return quantity.
- No endpoint exists to edit quotation fields/items after creation.

## Gap vs Required Features
- Missing full quotation edit API (everything except quotation `id`).
- Missing partial return input (`return_quantity` per item).

## Proposed Endpoints

### 1) Update quotation details
- `PUT /quotations/{id}`
- Roles: `superadmin`, `editor`
- Allowed when status is `pending` only.
- Request body:
```json
{
  "customer_id": 12,
  "note": "updated note",
  "items": [
    { "variant_unit_id": 44, "quantity": 10 },
    { "variant_unit_id": 57, "quantity": 3 }
  ]
}
```
- Behavior:
  - Replace all quotation items atomically.
  - Re-snapshot `unit_price` from current `variant_units.unit_price`.
  - Keep `id`, `salesman_id`, and `requested_at` unchanged.

### 2) Partial return for accepted quotations
- `POST /quotations/{id}/returns`
- Roles: `superadmin`, `editor`
- Allowed when status is `accepted`.
- Request body:
```json
{
  "items": [
    { "quotation_item_id": 201, "quantity": 2 },
    { "quotation_item_id": 202, "quantity": 1 }
  ],
  "note": "damaged shipment"
}
```
- Behavior:
  - Validate each return quantity > 0.
  - Validate cumulative returned quantity does not exceed sold quantity.
  - Restore stock only for returned quantities.
  - Write inventory log entries with action `returned_partial`.
  - Update invoice totals/due using returned value.
  - If all items fully returned, set quotation status to `returned` and invoice status to `returned`.

## Data Model Additions
- New table: `quotation_item_returns`
  - `id`, `quotation_id`, `quotation_item_id`, `variant_unit_id`, `quantity`, `unit_price`, `returned_amount`, `note`, `returned_by`, `created_at`
- Optional table for audit readability: `invoice_adjustments`
  - `id`, `invoice_id`, `type` (`return`), `amount`, `reference_type`, `reference_id`, `note`, `created_by`, `created_at`

## Service Layer Changes
- Add `QuotationService::updateQuotation(...)` transactional method.
- Add `QuotationService::returnItems(...)` transactional method.
- Keep existing `returnQuote(...)` as full-return shortcut that internally calls `returnItems(...)` for all remaining quantities.

## Validation Rules
- `items` required and non-empty for update and partial return.
- `customer_id` must exist when provided.
- `quotation_item_id` must belong to the target quotation.
- Prevent edits once quotation is `accepted`, `rejected`, or `returned`.

## API Response Shape
- Follow existing envelope and error style.
- Return updated quotation summary and affected invoice totals after update/return.

## Frontend Rollout Notes
- Add `Edit Quotation` dialog using existing RHF + zod pattern.
- Add `Return Items` dialog with per-item max return quantity from backend response.
- Use optimistic invalidation for `quotations`, `invoices`, and `inventory/log` queries.
