import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-border/60 bg-black/40">
      <div className="container py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-gold">Ticket das Vaquejadas</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Plataforma profissional para divulgação e venda antecipada de ingressos
              e senhas de vaquejadas no Brasil.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link className="text-muted-foreground hover:text-foreground" href="/eventos">
              Eventos
            </Link>
            <Link className="text-muted-foreground hover:text-foreground" href="/suporte">
              Suporte
            </Link>
            <Link className="text-muted-foreground hover:text-foreground" href="/admin">
              Área do organizador
            </Link>
          </div>
        </div>
        <p className="mt-10 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Ticket das Vaquejadas. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

