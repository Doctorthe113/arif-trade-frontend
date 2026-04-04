import { createFileRoute, Navigate } from "@tanstack/react-router";
import {
	ArrowRightLeft,
	BarChart3,
	ClipboardList,
	FileText,
	Package,
	Shield,
	Users,
	UserCog,
	UserPlus,
} from "lucide-react";

import { AppLayout } from "#/components/app/app-layout";
import { useAuth } from "#/lib/auth";
import { isAuthDisabled } from "#/lib/auth-flags";

export const Route = createFileRoute("/admin")({
	component: AdminLayout,
});

/// Admin layout with nav
function AdminLayout() {
	const { hasRole } = useAuth();

	if (!isAuthDisabled && !hasRole("superadmin")) {
		return <Navigate to="/" />;
	}

	const navGroups = [
		{
			label: "Dashboard",
			items: [
				{ label: "Overview", icon: BarChart3, to: "/salesman/overview" },
				{ label: "Invoices", icon: FileText, to: "/salesman/invoices" },
				{
					label: "Transactions",
					icon: ArrowRightLeft,
					to: "/salesman/transaction",
				},
				{ label: "Inventory", icon: Package, to: "/salesman/inventory" },
				{
					label: "Quotations",
					icon: ClipboardList,
					to: "/salesman/quote",
				},
			],
		},
		{
			label: "Admin",
			items: [
				{
					label: "Admin Dashboard",
					icon: BarChart3,
					to: "/admin/dashboard",
				},
				{
					label: "Reports",
					icon: BarChart3,
					to: "/admin/reports",
				},
				{
					label: "Analytics Inspector",
					icon: BarChart3,
					to: "/admin/analytics-inspector",
				},
				{
					label: "System",
					icon: Shield,
					to: "/admin/system",
				},
				{
					label: "API Docs",
					icon: FileText,
					to: "/admin/api-docs",
				},
				{
					label: "API Inspector",
					icon: FileText,
					to: "/admin/api-inspector",
				},
				{
					label: "Customer Ledger",
					icon: FileText,
					to: "/admin/customer-ledger",
				},
				{
					label: "Due Collection",
					icon: ArrowRightLeft,
					to: "/admin/due-collection",
				},
				{
					label: "Due Inspector",
					icon: FileText,
					to: "/admin/due-inspector",
				},
				{
					label: "Invoices",
					icon: FileText,
					to: "/admin/invoices",
				},
				{
					label: "Invoice Inspector",
					icon: FileText,
					to: "/admin/invoice-inspector",
				},
				{
					label: "Payments",
					icon: ArrowRightLeft,
					to: "/admin/payments",
				},
				{
					label: "Payment Inspector",
					icon: FileText,
					to: "/admin/payment-inspector",
				},
				{
					label: "Quotations",
					icon: ClipboardList,
					to: "/admin/quotations",
				},
				{
					label: "Quotation Inspector",
					icon: FileText,
					to: "/admin/quotation-inspector",
				},
				{
					label: "Inventory",
					icon: Package,
					to: "/admin/inventory",
				},
				{
					label: "Inventory Inspector",
					icon: FileText,
					to: "/admin/inventory-inspector",
				},
				{
					label: "Customers",
					icon: Users,
					to: "/admin/customers",
				},
				{
					label: "Customer Inspector",
					icon: Users,
					to: "/admin/customer-inspector",
				},
				{
					label: "Products",
					icon: Package,
					to: "/admin/products",
				},
				{
					label: "Product Inspector",
					icon: FileText,
					to: "/admin/product-inspector",
				},
				{
					label: "Variants",
					icon: Package,
					to: "/admin/variants",
				},
				{
					label: "Variant Inspector",
					icon: FileText,
					to: "/admin/variant-inspector",
				},
				{
					label: "Categories",
					icon: ClipboardList,
					to: "/admin/categories",
				},
				{
					label: "Category Inspector",
					icon: FileText,
					to: "/admin/category-inspector",
				},
				{
					label: "Units",
					icon: Package,
					to: "/admin/units",
				},
				{
					label: "Unit Inspector",
					icon: FileText,
					to: "/admin/unit-inspector",
				},
				{
					label: "Variant Units",
					icon: Package,
					to: "/admin/variant-units",
				},
				{
					label: "Variant-Unit Inspector",
					icon: FileText,
					to: "/admin/variant-unit-inspector",
				},
				{
					label: "Lots",
					icon: Package,
					to: "/admin/lots",
				},
				{
					label: "Lot Inspector",
					icon: FileText,
					to: "/admin/lot-inspector",
				},
				{
					label: "Users",
					icon: UserCog,
					to: "/admin/users",
				},
				{
					label: "User Inspector",
					icon: FileText,
					to: "/admin/user-inspector",
				},
				{
					label: "Create User",
					icon: UserPlus,
					to: "/admin/create-user",
				},
				{
					label: "Update User",
					icon: UserCog,
					to: "/admin/update-user",
				},
			],
		},
	];

	return (
		<AppLayout
			roleLabel="Super Admin"
			roleIcon={Shield}
			breadcrumb="Admin Panel"
			navGroups={navGroups}
		/>
	);
}
