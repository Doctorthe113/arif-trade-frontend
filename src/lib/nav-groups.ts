import type { LucideIcon } from "lucide-react";
import {
	ArrowRightLeft,
	BarChart3,
	ClipboardList,
	FileText,
	Package,
	Shield,
	UserCog,
	UserPlus,
	Users,
} from "lucide-react";

export type AppNavItem = {
	label: string;
	icon: LucideIcon;
	to: string;
};

export type AppNavGroup = {
	label: string;
	items: AppNavItem[];
};

const sharedSalesNavGroup: AppNavGroup = {
	label: "Sales",
	items: [
		{ label: "Overview", icon: BarChart3, to: "/salesman/overview" },
		{ label: "Invoices", icon: FileText, to: "/salesman/invoices" },
		{ label: "Inventory", icon: Package, to: "/salesman/inventory" },
	],
};

const adminNavGroup: AppNavGroup = {
	label: "Admin",
	items: [
		{
			label: "Admin Dashboard",
			icon: BarChart3,
			to: "/admin/dashboard",
		},
		{
			label: "Analytics Inspector",
			icon: BarChart3,
			to: "/admin/analytics-inspector",
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
			label: "Create User",
			icon: UserPlus,
			to: "/admin/create-user",
		},
		{
			label: "Customer Inspector",
			icon: Users,
			to: "/admin/customer-inspector",
		},
		{
			label: "Customer Ledger",
			icon: FileText,
			to: "/admin/customer-ledger",
		},
		{
			label: "Customers",
			icon: Users,
			to: "/admin/customers",
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
			label: "Invoice Inspector",
			icon: FileText,
			to: "/admin/invoice-inspector",
		},
		{
			label: "Invoices",
			icon: FileText,
			to: "/admin/invoices",
		},
		{
			label: "Lot Inspector",
			icon: FileText,
			to: "/admin/lot-inspector",
		},
		{
			label: "Lots",
			icon: Package,
			to: "/admin/lots",
		},
		{
			label: "Payment Inspector",
			icon: FileText,
			to: "/admin/payment-inspector",
		},
		{
			label: "Payments",
			icon: ArrowRightLeft,
			to: "/admin/payments",
		},
		{
			label: "Product Inspector",
			icon: FileText,
			to: "/admin/product-inspector",
		},
		{
			label: "Products",
			icon: Package,
			to: "/admin/products",
		},
		{
			label: "Quotation Inspector",
			icon: FileText,
			to: "/admin/quotation-inspector",
		},
		{
			label: "Quotations",
			icon: ClipboardList,
			to: "/admin/quotations",
		},
		{
			label: "Reports",
			icon: BarChart3,
			to: "/admin/reports",
		},
		{
			label: "System",
			icon: Shield,
			to: "/admin/system",
		},
		{
			label: "Unit Inspector",
			icon: FileText,
			to: "/admin/unit-inspector",
		},
		{
			label: "Units",
			icon: Package,
			to: "/admin/units",
		},
		{
			label: "Update User",
			icon: UserCog,
			to: "/admin/update-user",
		},
		{
			label: "User Inspector",
			icon: FileText,
			to: "/admin/user-inspector",
		},
		{
			label: "Users",
			icon: UserCog,
			to: "/admin/users",
		},
		{
			label: "Variant Inspector",
			icon: FileText,
			to: "/admin/variant-inspector",
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
			label: "Variants",
			icon: Package,
			to: "/admin/variants",
		},
	],
};

export function getAdminNavGroups(): AppNavGroup[] {
	return [sharedSalesNavGroup, adminNavGroup];
}

export function getSalesmanNavGroups(isSuperAdminUser: boolean): AppNavGroup[] {
	if (isSuperAdminUser) {
		return [sharedSalesNavGroup, adminNavGroup];
	}

	return [sharedSalesNavGroup];
}
