Implemented a full admin-route consolidation plus Next.js-style route folder migration.

What I Changed

Reduced duplicate admin routes by removing 14 inspector-style routes that overlapped existing management pages.
Migrated all surviving admin leaf routes to folder/index structure, e.g. index.tsx, index.tsx, index.tsx.
Updated admin navigation to only expose canonical routes (removed inspector links) and added structural comments in nav-groups.ts:25.
Merged due-inspector capabilities into due-collection by adding month/customer/date filtering and clearer sectioned markup comments in index.tsx:65.
Regenerated route registry in routeTree.gen.ts via build.
Route Reduction

Removed duplicated paths such as:
/admin/category-inspector
/admin/customer-inspector
/admin/due-inspector
/admin/inventory-inspector
/admin/invoice-inspector
/admin/lot-inspector
/admin/payment-inspector
/admin/product-inspector
/admin/quotation-inspector
/admin/unit-inspector
/admin/user-inspector
/admin/variant-inspector
/admin/variant-unit-inspector
Admin leaf-route count dropped by 14.
Architecture/Structure Outcome

Admin routes now follow consistent folder-based convention:
/admin/<segment>/index.tsx pattern across the surviving admin pages.
Navigation architecture is cleaner:
one route per primary workflow in Finance/Catalog/People groups.
Markup section comments were added where useful (v0-like block separation), especially in the merged due page.
Validation

Build passes: bun run build.

Edited files pass Biome check:

bunx biome check nav-groups.ts index.tsx
I did not touch the unrelated existing repo change shown as modified at arif_trade_international.

If you want, I can do phase 2 and convert remaining “inspector-named” routes (analytics/api) into cleaner names like /admin/analytics and /admin/api/inspector while keeping behavior unchanged.

I can also add nested dynamic detail routes (example: /admin/invoices/[id]-style equivalent in TanStack) if you want deep inspection back without bringing back many top-level menu routes.