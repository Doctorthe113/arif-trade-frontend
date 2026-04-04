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

const sharedRoutesNavGroup: AppNavGroup = {
	label: "Shared",
	items: [
		{ label: "Inventory", icon: Package, to: "/salesman/inventory" },
		{ label: "Quotations", icon: ClipboardList, to: "/salesman/quote" },
	],
};

const salesmanDashboardNavGroup: AppNavGroup = {
	label: "Salesman",
	items: [
		{ label: "Overview", icon: BarChart3, to: "/salesman/overview" },
		{ label: "Invoices", icon: FileText, to: "/salesman/invoices" },
	],
};

const adminOverviewNavGroup: AppNavGroup = {
	label: "Admin Overview",
	items: [
		{ label: "Admin Dashboard", icon: BarChart3, to: "/admin/dashboard" },
		{
			label: "Analytics Inspector",
			icon: BarChart3,
			to: "/admin/analytics-inspector",
		},
		{ label: "Reports", icon: BarChart3, to: "/admin/reports" },
		{ label: "System", icon: Shield, to: "/admin/system" },
	],
};

const adminFinanceNavGroup: AppNavGroup = {
	label: "Finance",
	items: [
		{ label: "Customer Ledger", icon: FileText, to: "/admin/customer-ledger" },
		{
			label: "Due Collection",
			icon: ArrowRightLeft,
			to: "/admin/due-collection",
		},
		{ label: "Due Inspector", icon: FileText, to: "/admin/due-inspector" },
		{ label: "Invoices", icon: FileText, to: "/admin/invoices" },
		{
			label: "Invoice Inspector",
			icon: FileText,
			to: "/admin/invoice-inspector",
		},
		{ label: "Payments", icon: ArrowRightLeft, to: "/admin/payments" },
		{
			label: "Payment Inspector",
			icon: FileText,
			to: "/admin/payment-inspector",
		},
		{ label: "Quotations", icon: ClipboardList, to: "/admin/quotations" },
		{
			label: "Quotation Inspector",
			icon: FileText,
			to: "/admin/quotation-inspector",
		},
	],
};

const adminCatalogNavGroup: AppNavGroup = {
	label: "Catalog",
	items: [
		{ label: "Categories", icon: ClipboardList, to: "/admin/categories" },
		{
			label: "Category Inspector",
			icon: FileText,
			to: "/admin/category-inspector",
		},
		{ label: "Inventory", icon: Package, to: "/admin/inventory" },
		{
			label: "Inventory Inspector",
			icon: FileText,
			to: "/admin/inventory-inspector",
		},
		{ label: "Lots", icon: Package, to: "/admin/lots" },
		{ label: "Lot Inspector", icon: FileText, to: "/admin/lot-inspector" },
		{ label: "Products", icon: Package, to: "/admin/products" },
		{
			label: "Product Inspector",
			icon: FileText,
			to: "/admin/product-inspector",
		},
		{ label: "Units", icon: Package, to: "/admin/units" },
		{ label: "Unit Inspector", icon: FileText, to: "/admin/unit-inspector" },
		{ label: "Variants", icon: Package, to: "/admin/variants" },
		{
			label: "Variant Inspector",
			icon: FileText,
			to: "/admin/variant-inspector",
		},
		{ label: "Variant Units", icon: Package, to: "/admin/variant-units" },
		{
			label: "Variant-Unit Inspector",
			icon: FileText,
			to: "/admin/variant-unit-inspector",
		},
	],
};

const adminPeopleNavGroup: AppNavGroup = {
	label: "People & Access",
	items: [
		{ label: "Customers", icon: Users, to: "/admin/customers" },
		{
			label: "Customer Inspector",
			icon: Users,
			to: "/admin/customer-inspector",
		},
		{ label: "Users", icon: UserCog, to: "/admin/users" },
		{ label: "User Inspector", icon: FileText, to: "/admin/user-inspector" },
		{ label: "Create User", icon: UserPlus, to: "/admin/create-user" },
		{ label: "Update User", icon: UserCog, to: "/admin/update-user" },
	],
};

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

export function getAdminNavGroups(): AppNavGroup[] {
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
