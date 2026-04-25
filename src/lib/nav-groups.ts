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

// Shared cross-role links
const sharedRoutesNavGroup: AppNavGroup = {
	label: "Shared",
	items: [
		{ label: "Inventory", icon: Package, to: "/salesman/inventory" },
		{ label: "Quotations", icon: ClipboardList, to: "/salesman/quote" },
	],
};

// Salesman primary routes
const salesmanDashboardNavGroup: AppNavGroup = {
	label: "Salesman",
	items: [
		{ label: "Overview", icon: BarChart3, to: "/salesman/overview" },
		{ label: "Invoices", icon: FileText, to: "/salesman/invoices" },
	],
};

// Admin overview routes
const adminOverviewNavGroup: AppNavGroup = {
	label: "Admin Overview",
	items: [
		{ label: "Admin Dashboard", icon: BarChart3, to: "/admin/dashboard" },
		{ label: "Analytics", icon: BarChart3, to: "/admin/analytics-inspector" },
		{ label: "Reports", icon: BarChart3, to: "/admin/reports" },
		{ label: "System", icon: Shield, to: "/admin/system" },
	],
};

// Admin finance routes
const adminFinanceNavGroup: AppNavGroup = {
	label: "Finance",
	items: [
		{ label: "Customer Ledger", icon: FileText, to: "/admin/customer-ledger" },
		{
			label: "Due Collection",
			icon: ArrowRightLeft,
			to: "/admin/due-collection",
		},
		{ label: "Invoices", icon: FileText, to: "/admin/invoices" },
		{ label: "Payments", icon: ArrowRightLeft, to: "/admin/payments" },
		{ label: "Quotations", icon: ClipboardList, to: "/admin/quotations" },
	],
};

// Admin catalog routes
const adminCatalogNavGroup: AppNavGroup = {
	label: "Catalog",
	items: [
		{ label: "Categories", icon: ClipboardList, to: "/admin/categories" },
		{ label: "Inventory", icon: Package, to: "/admin/inventory" },
		{ label: "Lots", icon: Package, to: "/admin/lots" },
		{ label: "Products", icon: Package, to: "/admin/products" },
		{ label: "Units", icon: Package, to: "/admin/units" },
		{ label: "Variants", icon: Package, to: "/admin/variants" },
		{ label: "Variant Units", icon: Package, to: "/admin/variant-units" },
	],
};

// Admin people routes
const adminPeopleNavGroup: AppNavGroup = {
	label: "People & Access",
	items: [
		{ label: "Customers", icon: Users, to: "/admin/customers" },
		{ label: "Users", icon: UserCog, to: "/admin/users" },
		{ label: "Create User", icon: UserPlus, to: "/admin/create-user" },
		{ label: "Update User", icon: UserCog, to: "/admin/update-user" },
	],
};

// Admin integration routes
const adminApiNavGroup: AppNavGroup = {
	label: "API",
	items: [
		{ label: "API Docs", icon: FileText, to: "/admin/api-docs" },
		{ label: "API Inspector", icon: FileText, to: "/admin/api-inspector" },
	],
};

const adminSemanticNavGroups: AppNavGroup[] = [
	adminOverviewNavGroup,
	adminFinanceNavGroup,
	adminCatalogNavGroup,
	adminPeopleNavGroup,
	adminApiNavGroup,
];

export function getAdminNavGroups(isSuperAdminUser: boolean): AppNavGroup[] {
	if (isSuperAdminUser) {
		return [
			sharedRoutesNavGroup,
			salesmanDashboardNavGroup,
			...adminSemanticNavGroups,
		];
	}

	return [sharedRoutesNavGroup, ...adminSemanticNavGroups];
}

export function getSalesmanNavGroups(isSuperAdminUser: boolean): AppNavGroup[] {
	if (isSuperAdminUser) {
		return [
			sharedRoutesNavGroup,
			salesmanDashboardNavGroup,
			...adminSemanticNavGroups,
		];
	}

	return [sharedRoutesNavGroup, salesmanDashboardNavGroup];
}
