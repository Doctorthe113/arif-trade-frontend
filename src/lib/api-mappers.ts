import type {
  ApiSpecEndpointValue,
  ApiSpecValue,
  AuthUserValue,
  LoginResponseValue,
  PaginatedDataValue,
  PaginationValue,
  RefreshResponseValue,
  UserRoleValue,
} from "@/lib/api-types";

type JsonRecordValue = Record<string, unknown>;

function asNumberValue(value: unknown, fallbackNumberValue = 0): number {
  return typeof value === "number"
    ? value
    : Number(value ?? fallbackNumberValue);
}

function asStringValue(value: unknown, fallbackStringValue = ""): string {
  return typeof value === "string" ? value : fallbackStringValue;
}

function asBooleanValue(value: unknown, fallbackBooleanValue = false): boolean {
  return typeof value === "boolean"
    ? value
    : Boolean(value ?? fallbackBooleanValue);
}

function asRecordValue(value: unknown): JsonRecordValue {
  return typeof value === "object" && value !== null
    ? (value as JsonRecordValue)
    : {};
}

function asArrayValue(value: unknown): JsonRecordValue[] {
  return Array.isArray(value)
    ? value.map((itemValue) => asRecordValue(itemValue))
    : [];
}

export function mapAuthUserValue(rawUserValue: JsonRecordValue): AuthUserValue {
  return {
    createdAtValue: asStringValue(rawUserValue.created_at),
    email: asStringValue(rawUserValue.email),
    id: asNumberValue(rawUserValue.id),
    isActiveValue:
      rawUserValue.is_active === undefined
        ? undefined
        : asBooleanValue(rawUserValue.is_active),
    name: asStringValue(rawUserValue.name),
    role: asStringValue(rawUserValue.role) as UserRoleValue,
    updatedAtValue: asStringValue(rawUserValue.updated_at),
  };
}

export function mapPaginationValue(
  rawPaginationValue: JsonRecordValue,
): PaginationValue {
  return {
    lastPageValue: asNumberValue(rawPaginationValue.last_page, 1),
    page: asNumberValue(rawPaginationValue.page, 1),
    perPageValue: asNumberValue(rawPaginationValue.per_page, 20),
    total: asNumberValue(rawPaginationValue.total),
  };
}

export function mapPaginatedDataValue<TItemValue>(
  rawPaginatedValue: JsonRecordValue,
  itemMapperValue: (itemValue: JsonRecordValue) => TItemValue,
): PaginatedDataValue<TItemValue> {
  return {
    data: asArrayValue(rawPaginatedValue.data).map((itemValue) =>
      itemMapperValue(itemValue),
    ),
    pagination: mapPaginationValue(asRecordValue(rawPaginatedValue.pagination)),
  };
}

export function mapLoginResponseValue(
  rawLoginValue: JsonRecordValue,
): LoginResponseValue {
  return {
    expiresInSecondsValue: asNumberValue(rawLoginValue.expires_in),
    token: asStringValue(rawLoginValue.token),
    user: mapAuthUserValue(asRecordValue(rawLoginValue.user)),
  };
}

export function mapRefreshResponseValue(
  rawRefreshValue: JsonRecordValue,
): RefreshResponseValue {
  return {
    expiresInSecondsValue: asNumberValue(rawRefreshValue.expires_in),
    token: asStringValue(rawRefreshValue.token),
  };
}

function mapApiSpecEndpointValue(
  rawEndpointValue: JsonRecordValue,
): ApiSpecEndpointValue {
  return {
    auth: asBooleanValue(rawEndpointValue.auth),
    detail: asStringValue(rawEndpointValue.detail),
    method: asStringValue(rawEndpointValue.method),
    path: asStringValue(rawEndpointValue.path),
    roles: Array.isArray(rawEndpointValue.roles)
      ? rawEndpointValue.roles.map((roleValue) => asStringValue(roleValue))
      : [],
    summary: asStringValue(rawEndpointValue.summary),
  };
}

export function mapApiSpecValue(rawSpecValue: JsonRecordValue): ApiSpecValue {
  const rawGroupsValue = asRecordValue(rawSpecValue.groups);

  return {
    app: asStringValue(rawSpecValue.app),
    auth: {
      expiry: asStringValue(asRecordValue(rawSpecValue.auth).expiry),
      header: asStringValue(asRecordValue(rawSpecValue.auth).header),
      obtain: asStringValue(asRecordValue(rawSpecValue.auth).obtain),
      type: asStringValue(asRecordValue(rawSpecValue.auth).type),
    },
    baseUrlValue: asStringValue(rawSpecValue.base_url),
    groups: Object.fromEntries(
      Object.entries(rawGroupsValue).map(
        ([groupNameValue, groupItemsValue]) => [
          groupNameValue,
          asArrayValue(groupItemsValue).map((itemValue) =>
            mapApiSpecEndpointValue(itemValue),
          ),
        ],
      ),
    ),
    roles: Object.fromEntries(
      Object.entries(asRecordValue(rawSpecValue.roles)).map(
        ([roleNameValue, roleDescriptionValue]) => [
          roleNameValue,
          asStringValue(roleDescriptionValue),
        ],
      ),
    ),
    version: asStringValue(rawSpecValue.version),
  };
}
