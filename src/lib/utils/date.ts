import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

function toDate(input: Date | string) {
  return typeof input === "string" ? parseISO(input) : input;
}

export function formatDateBR(input: Date | string) {
  return format(toDate(input), "dd 'de' MMM 'de' yyyy", { locale: ptBR });
}

export function formatDateShortBR(input: Date | string) {
  return format(toDate(input), "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTimeBR(input: Date | string) {
  return format(toDate(input), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

