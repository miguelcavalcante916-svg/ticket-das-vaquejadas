import { LoadingSpinner } from "@/components/loading-spinner";

export default function PublicLoading() {
  return (
    <div className="container py-16">
      <LoadingSpinner label="Carregando pagina..." />
    </div>
  );
}

