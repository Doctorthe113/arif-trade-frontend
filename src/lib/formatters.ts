import type { UserRoleValue } from "@/lib/api-types";

export function formatCurrencyValue(amountNumberValue: number): string {
  return new Intl.NumberFormat("en-BD", {
    currency: "BDT",
    maximumFractionDigits: 2,
    style: "currency",
  })
    .format(amountNumberValue)
    .replace("BDT", "৳");
}

export function formatDateTimeValue(dateStringValue?: string): string {
  if (!dateStringValue) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateStringValue));
}

export function formatRelativeMinutesValue(expiresAtMsValue: number): string {
  const remainingMinutesValue = Math.max(
    0,
    Math.round((expiresAtMsValue - Date.now()) / 60_000),
  );

  if (remainingMinutesValue <= 0) {
    return "Expired";
  }

  if (remainingMinutesValue < 60) {
    return `${remainingMinutesValue} min left`;
  }

  const remainingHoursValue = (remainingMinutesValue / 60).toFixed(1);
  return `${remainingHoursValue} hr left`;
}

export function getRoleLabelValue(roleValue: UserRoleValue): string {
  return roleValue === "superadmin"
    ? "Super Admin"
    : roleValue.charAt(0).toUpperCase() + roleValue.slice(1);
}
