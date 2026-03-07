# TODO: ATI Frontend Roadmap

Phase 1 (Auth + Shell + Users) completed. Future developments tracked below.

## Infrastructure & Configuration
- [ ] Implement robust error boundary at `AppProviders` level.
- [ ] Add breadcrumb breadcrumbs at `AppShell` for deeper nesting levels.
- [ ] Configure `CSP` headers for static build production.

## Feature Modules

### 1. Categories & Products
- [ ] Category tree management (list/create/edit).
- [ ] Product listing (Search/filter by category/status).
- [ ] Product details screen with multiple variants support.

### 2. Quotation Engine
- [ ] Advanced form with dynamic line items.
- [ ] Unit of Measure (UOM) selection per item.
- [ ] PDF generation (client-side or server-proxy).
- [ ] Status workflow (Draft -> Pending -> Approved -> Invoiced).

### 3. Invoicing & Payments
- [ ] Invoice creation from approved quotations.
- [ ] Payment logging (Partial/Full/Advance).
- [ ] Balance tracking per customer.

### 4. Inventory Tracking
- [ ] Real-time stock visibility.
- [ ] Inventory transaction logs (In-out history).
- [ ] Low stock alerts on dashboard.

## Technical Debt & Polish
- [ ] **Performance**: Implement tree-shaking and lazy-loading for heavy UI components.
- [ ] **Accessibility**: Full ARIA-compliant audit on custom `Field` and composite components.
- [ ] **Documentation**: Write detailed `api-mappers` guide for new data modules.
- [ ] **Design**: Medical theme refinement (Custom clinical color palette).

## Backend Alignment
- [ ] **CORS**: Ensure backend production URL supports the static hosting origin.
- [ ] **Rate Limiting**: Monitor API client retry performance against backend limits.
