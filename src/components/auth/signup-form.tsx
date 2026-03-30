"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(6),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof schema>;

export function SignupForm() {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const submit = form.handleSubmit(async (values) => {
    setError(null);
    setSuccess(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });
      if (error) {
        setError(error.message);
        return;
      }
      setSuccess("Conta criada. Você já pode entrar.");
      router.push("/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao cadastrar.");
    }
  });

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input
              type="email"
              placeholder="voce@email.com"
              autoComplete="email"
              {...form.register("email")}
            />
            {form.formState.errors.email?.message ? (
              <p className="text-xs font-semibold text-red-400">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Senha</Label>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...form.register("password")}
            />
            {form.formState.errors.password?.message ? (
              <p className="text-xs font-semibold text-red-400">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Confirmar senha</Label>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword?.message ? (
              <p className="text-xs font-semibold text-red-400">
                {form.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm font-semibold text-red-400">{error}</p>
          ) : null}
          {success ? (
            <p className="text-sm font-semibold text-emerald-400">{success}</p>
          ) : null}

          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Criando…" : "Criar conta"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link className="font-semibold text-gold hover:underline" href="/login">
              Entrar
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
