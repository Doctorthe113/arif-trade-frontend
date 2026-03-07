"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, SaveIcon, UserRoundPlusIcon } from "lucide-react";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  useCreateUserMutationValue,
  useUpdateUserMutationValue,
  useUserQueryValue,
} from "@/components/app/app-queries.client";
import AppShell from "@/components/app/app-shell.client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessageValue } from "@/lib/api-client";
import type { UserRoleValue } from "@/lib/api-types";
import { buildAppPath } from "@/lib/app-config";
import { getRoleLabelValue } from "@/lib/formatters";

const createUserSchemaValue = z.object({
  email: z.email("Enter a valid email."),
  isActiveValue: z.enum(["active", "inactive"]),
  name: z.string().min(2, "Name must be at least 2 characters."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["superadmin", "editor", "viewer", "salesman"]),
});

const updateUserSchemaValue = createUserSchemaValue.extend({
  password: z.string().optional(),
});

type CreateUserFormValue = z.infer<typeof createUserSchemaValue>;
type UpdateUserFormValue = z.infer<typeof updateUserSchemaValue>;
type UserFormValue = CreateUserFormValue | UpdateUserFormValue;

const roleOptionsValue: UserRoleValue[] = [
  "superadmin",
  "editor",
  "viewer",
  "salesman",
];

function getUserIdValue(): number | null {
  const rawUserIdValue = new URLSearchParams(window.location.search).get("id");
  const parsedUserIdValue = Number(rawUserIdValue);

  return Number.isFinite(parsedUserIdValue) && parsedUserIdValue > 0
    ? parsedUserIdValue
    : null;
}

export default function UserFormScreen() {
  const userIdValue = React.useMemo(() => getUserIdValue(), []);
  const isEditModeValue = Boolean(userIdValue);
  const userQueryValue = useUserQueryValue(userIdValue);
  const createUserMutationValue = useCreateUserMutationValue();
  const updateUserMutationValue = useUpdateUserMutationValue();

  const formValue = useForm<UserFormValue>({
    defaultValues: {
      email: "",
      isActiveValue: "active",
      name: "",
      password: "",
      role: "viewer",
    },
    mode: "onBlur",
    resolver: zodResolver(
      isEditModeValue ? updateUserSchemaValue : createUserSchemaValue,
    ),
  });

  React.useEffect(() => {
    if (!userQueryValue.data) {
      return;
    }

    formValue.reset({
      email: userQueryValue.data.email,
      isActiveValue: userQueryValue.data.isActiveValue ? "active" : "inactive",
      name: userQueryValue.data.name,
      password: "",
      role: userQueryValue.data.role,
    });
  }, [formValue, userQueryValue.data]);

  const handleSubmitValue = formValue.handleSubmit(async (valuesValue) => {
    try {
      if (isEditModeValue && userIdValue) {
        await updateUserMutationValue.mutateAsync({
          payloadValue: {
            email: valuesValue.email,
            isActiveValue: valuesValue.isActiveValue === "active",
            name: valuesValue.name,
            password: valuesValue.password || undefined,
            role: valuesValue.role,
          },
          userIdValue,
        });
        toast.success("User updated.");
      } else {
        await createUserMutationValue.mutateAsync({
          email: valuesValue.email,
          name: valuesValue.name,
          password: valuesValue.password ?? "",
          role: valuesValue.role,
        });
        toast.success("User created.");
      }

      window.location.replace(buildAppPath("/users"));
    } catch (errorValue) {
      toast.error(getApiErrorMessageValue(errorValue));
    }
  });

  return (
    <AppShell
      descriptionValue="Create or update ATI users with role-based access and active status."
      titleValue={isEditModeValue ? "Edit user" : "Create user"}
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle data-ati-display="true">
              {isEditModeValue ? "Edit account" : "Create account"}
            </CardTitle>
            <CardDescription>
              All validation runs client-side before request. Final authority
              stays in backend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userQueryValue.isLoading ? (
              <div className="grid gap-3">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            ) : (
              <form
                className="flex flex-col gap-6"
                onSubmit={handleSubmitValue}
              >
                <FieldSet>
                  <FieldLegend>Identity</FieldLegend>
                  <FieldGroup>
                    <Controller
                      control={formValue.control}
                      name="name"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>
                            Full name
                          </FieldLabel>
                          <Input
                            {...field}
                            id={field.name}
                            aria-invalid={fieldState.invalid}
                            placeholder="Ali Hassan"
                          />
                          <FieldDescription>
                            Visible across admin activity.
                          </FieldDescription>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      control={formValue.control}
                      name="email"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                          <Input
                            {...field}
                            autoComplete="email"
                            id={field.name}
                            aria-invalid={fieldState.invalid}
                            placeholder="ali@ati.local"
                            type="email"
                          />
                          <FieldDescription>Must stay unique.</FieldDescription>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      control={formValue.control}
                      name="password"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>
                            {isEditModeValue ? "New password" : "Password"}
                          </FieldLabel>
                          <Input
                            {...field}
                            autoComplete="new-password"
                            id={field.name}
                            aria-invalid={fieldState.invalid}
                            placeholder={
                              isEditModeValue
                                ? "Leave blank to keep current"
                                : "Minimum 8 characters"
                            }
                            type="password"
                          />
                          <FieldDescription>
                            {isEditModeValue
                              ? "Optional during edit."
                              : "Required for new account."}
                          </FieldDescription>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </FieldSet>

                <FieldSet>
                  <FieldLegend>Access</FieldLegend>
                  <FieldGroup>
                    <Controller
                      control={formValue.control}
                      name="role"
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          orientation="responsive"
                        >
                          <div className="flex flex-col gap-1.5">
                            <FieldLabel htmlFor="user-role">Role</FieldLabel>
                            <FieldDescription>
                              Backend enforces final permission matrix.
                            </FieldDescription>
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </div>
                          <Select
                            name={field.name}
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger
                              aria-invalid={fieldState.invalid}
                              id="user-role"
                            >
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {roleOptionsValue.map((roleValue) => (
                                  <SelectItem key={roleValue} value={roleValue}>
                                    {getRoleLabelValue(roleValue)}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                    />
                    <Controller
                      control={formValue.control}
                      name="isActiveValue"
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          orientation="responsive"
                        >
                          <div className="flex flex-col gap-1.5">
                            <FieldLabel htmlFor="user-status">
                              Account status
                            </FieldLabel>
                            <FieldDescription>
                              Inactive users cannot log in.
                            </FieldDescription>
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </div>
                          <Select
                            name={field.name}
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger
                              aria-invalid={fieldState.invalid}
                              id="user-status"
                            >
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">
                                  Inactive
                                </SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </FieldSet>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button asChild type="button" variant="outline">
                    <a href={buildAppPath("/users")}>
                      <ArrowLeftIcon data-icon="inline-start" />
                      Back to users
                    </a>
                  </Button>
                  <Button
                    disabled={
                      createUserMutationValue.isPending ||
                      updateUserMutationValue.isPending
                    }
                    type="submit"
                  >
                    {isEditModeValue ? (
                      <SaveIcon data-icon="inline-start" />
                    ) : (
                      <UserRoundPlusIcon data-icon="inline-start" />
                    )}
                    {createUserMutationValue.isPending ||
                    updateUserMutationValue.isPending
                      ? "Saving…"
                      : isEditModeValue
                        ? "Save changes"
                        : "Create user"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle data-ati-display="true">Guidance</CardTitle>
            <CardDescription>
              Phase 1 only covers users and auth.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground text-sm">
            <p>Use `superadmin` for full control.</p>
            <p>Use `editor` for quotations and payment actions.</p>
            <p>Use `viewer` for read-only access.</p>
            <p>Use `salesman` for request submission flow.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
