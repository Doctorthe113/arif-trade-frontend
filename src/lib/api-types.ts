export type UserRoleValue = "superadmin" | "editor" | "viewer" | "salesman";

export type AuthUserValue = {
  id: number;
  name: string;
  email: string;
  role: UserRoleValue;
  isActiveValue?: boolean;
  createdAtValue?: string;
  updatedAtValue?: string;
};

export type ApiErrorValue =
  | Record<string, string | string[]>
  | string
  | string[]
  | null;

export type ApiSuccessEnvelopeValue<TDataValue> = {
  success: true;
  message: string;
  data: TDataValue;
};

export type ApiFailureEnvelopeValue = {
  success: false;
  message: string;
  errors?: ApiErrorValue;
};

export type ApiEnvelopeValue<TDataValue> =
  | ApiSuccessEnvelopeValue<TDataValue>
  | ApiFailureEnvelopeValue;

export type PaginationValue = {
  page: number;
  perPageValue: number;
  total: number;
  lastPageValue: number;
};

export type PaginatedDataValue<TItemValue> = {
  data: TItemValue[];
  pagination: PaginationValue;
};

export type StoredSessionValue = {
  token: string;
  expiresAtMs: number;
  user: AuthUserValue | null;
};

export type HealthResponseValue = {
  status: string;
  version: string;
};

export type ApiSpecEndpointValue = {
  method: string;
  path: string;
  summary: string;
  detail?: string;
  auth: boolean;
  roles: string[];
};

export type ApiSpecValue = {
  app: string;
  version: string;
  baseUrlValue: string;
  auth: {
    type: string;
    header: string;
    expiry: string;
    obtain: string;
  };
  roles: Record<string, string>;
  groups: Record<string, ApiSpecEndpointValue[]>;
};

export type LoginResponseValue = {
  token: string;
  expiresInSecondsValue: number;
  user: AuthUserValue;
};

export type RefreshResponseValue = {
  token: string;
  expiresInSecondsValue: number;
};

export type CreateUserPayloadValue = {
  name: string;
  email: string;
  password: string;
  role: UserRoleValue;
};

export type UpdateUserPayloadValue = Partial<{
  name: string;
  email: string;
  password: string;
  role: UserRoleValue;
  isActiveValue: boolean;
}>;
