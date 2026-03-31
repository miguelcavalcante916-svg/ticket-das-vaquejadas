import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Badge variant="gold">Acesso</Badge>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
            Entrar no sistema
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use seu e-mail e senha para acessar ingressos e área do organizador.
          </p>
        </div>
        <Suspense fallback={<LoadingSpinner label="Carregando…" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
