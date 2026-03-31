import { LoadingSpinner } from "@/components/loading-spinner";

export default function AdminLoading() {
  return (
    <div className="py-16">
      <LoadingSpinner label="Carregando painel..." />
    </div>
  );
}

