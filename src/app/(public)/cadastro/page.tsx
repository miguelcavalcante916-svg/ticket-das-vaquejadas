import { SignupForm } from "@/components/auth/signup-form";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Cadastro",
};

export default function CadastroPage() {
  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Badge variant="gold">Novo</Badge>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
            Criar conta
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie sua conta para comprar ingressos e acompanhar status de pagamentos.
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}

