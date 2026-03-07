"use client";

import {
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserPenIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import {
  useDeleteUserMutationValue,
  useUsersQueryValue,
} from "@/components/app/app-queries.client";
import AppShell from "@/components/app/app-shell.client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiErrorMessageValue } from "@/lib/api-client";
import type { AuthUserValue, UserRoleValue } from "@/lib/api-types";
import { buildAppPath } from "@/lib/app-config";
import { formatDateTimeValue, getRoleLabelValue } from "@/lib/formatters";

const roleOptionsValue: Array<UserRoleValue | "all"> = [
  "all",
  "superadmin",
  "editor",
  "viewer",
  "salesman",
];

function UserStatusBadgeValue({ userValue }: { userValue: AuthUserValue }) {
  return userValue.isActiveValue ? (
    <Badge variant="secondary">Active</Badge>
  ) : (
    <Badge variant="outline">Inactive</Badge>
  );
}

export default function UsersScreen() {
  const [deleteTargetValue, setDeleteTargetValue] =
    React.useState<AuthUserValue | null>(null);
  const [pageValue, setPageValue] = React.useState(1);
  const [roleValue, setRoleValue] = React.useState<UserRoleValue | "all">(
    "all",
  );
  const [searchValue, setSearchValue] = React.useState("");

  const usersQueryValue = useUsersQueryValue({
    pageValue,
    perPageValue: 10,
    roleValue,
  });
  const deleteUserMutationValue = useDeleteUserMutationValue();

  const filteredUsersValue = React.useMemo(() => {
    const normalizedQueryValue = searchValue.trim().toLowerCase();

    if (!normalizedQueryValue) {
      return usersQueryValue.data?.data ?? [];
    }

    return (usersQueryValue.data?.data ?? []).filter((userValue) =>
      [userValue.email, userValue.name, userValue.role]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQueryValue),
    );
  }, [searchValue, usersQueryValue.data?.data]);

  const handleDeleteValue = async () => {
    if (!deleteTargetValue) {
      return;
    }

    try {
      await deleteUserMutationValue.mutateAsync(deleteTargetValue.id);
      toast.success("User deleted.");
      setDeleteTargetValue(null);
    } catch (errorValue) {
      toast.error(getApiErrorMessageValue(errorValue));
    }
  };

  return (
    <AppShell
      descriptionValue="Manage ATI users, role assignments, and activation state from the live backend."
      titleValue="Users"
    >
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User directory</CardTitle>
            <CardDescription>
              Role filter is server-backed. Search filters current page
              instantly.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <FieldGroup className="grid gap-4 md:grid-cols-2 lg:flex lg:flex-row">
                <Field>
                  <FieldLabel htmlFor="users-search">
                    Search current page
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="users-search"
                      onChange={(eventValue) =>
                        setSearchValue(eventValue.target.value)
                      }
                      placeholder="Search name, email, role"
                      value={searchValue}
                    />
                    <FieldDescription>
                      Client-side filter on fetched rows.
                    </FieldDescription>
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel htmlFor="users-role">Role filter</FieldLabel>
                  <Select
                    onValueChange={(nextRoleValue) => {
                      setPageValue(1);
                      setRoleValue(nextRoleValue as UserRoleValue | "all");
                    }}
                    value={roleValue}
                  >
                    <SelectTrigger id="users-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {roleOptionsValue.map((optionValue) => (
                          <SelectItem key={optionValue} value={optionValue}>
                            {optionValue === "all"
                              ? "All roles"
                              : getRoleLabelValue(optionValue)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>

              <Button asChild>
                <a href={buildAppPath("/user-form")}>
                  <PlusIcon data-icon="inline-start" />
                  Create user
                </a>
              </Button>
            </div>

            <Card className="gap-0 overflow-hidden border-dashed">
              <CardContent className="px-0">
                {usersQueryValue.isLoading ? (
                  <div className="grid gap-3 p-6">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsersValue.length > 0 ? (
                        filteredUsersValue.map((userValue) => (
                          <TableRow key={userValue.id}>
                            <TableCell className="font-medium">
                              {userValue.name}
                            </TableCell>
                            <TableCell>{userValue.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                <ShieldCheckIcon />
                                {getRoleLabelValue(userValue.role)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <UserStatusBadgeValue userValue={userValue} />
                            </TableCell>
                            <TableCell>
                              {formatDateTimeValue(userValue.createdAtValue)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost">
                                    <MoreHorizontalIcon />
                                    <span className="sr-only">
                                      Open row actions
                                    </span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuGroup>
                                    <DropdownMenuItem asChild>
                                      <a
                                        href={`${buildAppPath("/user-form")}?id=${userValue.id}`}
                                      >
                                        <UserPenIcon />
                                        Edit
                                      </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setDeleteTargetValue(userValue)
                                      }
                                      variant="destructive"
                                    >
                                      <Trash2Icon />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            className="py-10 text-center text-muted-foreground"
                            colSpan={6}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <SearchIcon />
                              No users found on this page.
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Page {usersQueryValue.data?.pagination.page ?? 1} of{" "}
                {usersQueryValue.data?.pagination.lastPageValue ?? 1}. Total{" "}
                {usersQueryValue.data?.pagination.total ?? 0}.
              </p>
              <div className="flex gap-3">
                <Button
                  disabled={pageValue <= 1}
                  onClick={() =>
                    setPageValue((currentPageValue) =>
                      Math.max(1, currentPageValue - 1),
                    )
                  }
                  variant="outline"
                >
                  Previous
                </Button>
                <Button
                  disabled={
                    pageValue >=
                    (usersQueryValue.data?.pagination.lastPageValue ?? 1)
                  }
                  onClick={() =>
                    setPageValue((currentPageValue) => currentPageValue + 1)
                  }
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog
          onOpenChange={(openValue) => {
            if (!openValue) {
              setDeleteTargetValue(null);
            }
          }}
          open={Boolean(deleteTargetValue)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete user</DialogTitle>
              <DialogDescription>
                Permanently remove {deleteTargetValue?.name}. Self-delete is
                blocked by backend.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => setDeleteTargetValue(null)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={deleteUserMutationValue.isPending}
                onClick={handleDeleteValue}
                variant="destructive"
              >
                <Trash2Icon data-icon="inline-start" />
                {deleteUserMutationValue.isPending ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
