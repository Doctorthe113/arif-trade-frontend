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
import { buildAppPath } from "@/lib/app-config";

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
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <Card className="w-full max-w-[32rem] border-border/80 bg-card/95">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <ShieldCheckIcon />
              </div>
              <div>
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.28em]">
                  Arif Trade International
                </p>
                <CardTitle
                  className="mt-2 text-[2.4rem] tracking-tight"
                  data-ati-display="true"
                >
                  Sign in
                </CardTitle>
              </div>
            </div>
            <CardDescription className="max-w-md text-sm leading-6">
              Access the internal operations dashboard using your ATI account.
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
                        Use your assigned work email.
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
                        Session refresh is handled automatically.
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
