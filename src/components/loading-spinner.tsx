import { cn } from "@/lib/utils";

export function LoadingSpinner({
  className,
  label = "Carregando…",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 text-sm text-muted-foreground", className)}>
      <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      <span>{label}</span>
    </div>
  );
}

