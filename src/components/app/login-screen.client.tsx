"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon, KeyRoundIcon, ShieldCheckIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useLoginMutationValue } from "@/components/app/auth-context.client";
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
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getApiErrorMessageValue } from "@/lib/api-client";
import { buildAppPath, getApiBaseUrl } from "@/lib/app-config";

const loginSchemaValue = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValue = z.infer<typeof loginSchemaValue>;

export default function LoginScreen() {
  const loginMutationValue = useLoginMutationValue();
  const formValue = useForm<LoginFormValue>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
    resolver: zodResolver(loginSchemaValue),
  });

  const handleSubmitValue = formValue.handleSubmit(async (valuesValue) => {
    try {
      await loginMutationValue.mutateAsync(valuesValue);
      toast.success("Login successful.");
      window.location.replace(buildAppPath("/dashboard"));
    } catch (errorValue) {
      toast.error(getApiErrorMessageValue(errorValue));
    }
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(180deg,_rgba(248,250,252,1),_rgba(239,246,255,1))] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-emerald-200/70 bg-card/90 shadow-xl backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <ShieldCheckIcon />
              </div>
              <div>
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.28em]">
                  Arif Trade International
                </p>
                <CardTitle className="mt-2 text-4xl tracking-tight">
                  Medical operations admin
                </CardTitle>
              </div>
            </div>
            <CardDescription className="max-w-2xl text-base">
              Static admin frontend. Client-only auth and data. Build-time API
              binding.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border bg-background/80 p-4">
              <p className="font-medium">Role-safe</p>
              <p className="mt-2 text-muted-foreground text-sm">
                `superadmin`, `editor`, `viewer`, `salesman` workflows.
              </p>
            </div>
            <div className="rounded-2xl border bg-background/80 p-4">
              <p className="font-medium">Static deploy</p>
              <p className="mt-2 text-muted-foreground text-sm">
                GitHub Pages friendly. No server rendering.
              </p>
            </div>
            <div className="rounded-2xl border bg-background/80 p-4">
              <p className="font-medium">API source</p>
              <p className="mt-2 break-all text-muted-foreground text-sm">
                {getApiBaseUrl()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Authenticate with PHP REST API using JWT bearer token.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-6" onSubmit={handleSubmitValue}>
              <FieldGroup>
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
                        placeholder="admin@ati.local"
                        type="email"
                      />
                      <FieldDescription>
                        Use your registered ATI account.
                      </FieldDescription>
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
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <Input
                        {...field}
                        autoComplete="current-password"
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder="••••••••"
                        type="password"
                      />
                      <FieldDescription>
                        Token lasts 8 hours after sign in.
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              <Button disabled={loginMutationValue.isPending} type="submit">
                <KeyRoundIcon data-icon="inline-start" />
                {loginMutationValue.isPending ? "Signing in…" : "Sign in"}
                {!loginMutationValue.isPending && (
                  <ArrowRightIcon data-icon="inline-end" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
