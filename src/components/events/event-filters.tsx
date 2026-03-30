"use client";

import * as React from "react";
import { Search } from "lucide-react";

import type { Uf } from "@/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export type EventFiltersValue = {
  query: string;
  state: Uf | "all";
  city: string;
};

const UFS: Array<{ label: string; value: Uf }> = [
  { label: "AC", value: "AC" },
  { label: "AL", value: "AL" },
  { label: "AP", value: "AP" },
  { label: "AM", value: "AM" },
  { label: "BA", value: "BA" },
  { label: "CE", value: "CE" },
  { label: "DF", value: "DF" },
  { label: "ES", value: "ES" },
  { label: "GO", value: "GO" },
  { label: "MA", value: "MA" },
  { label: "MT", value: "MT" },
  { label: "MS", value: "MS" },
  { label: "MG", value: "MG" },
  { label: "PA", value: "PA" },
  { label: "PB", value: "PB" },
  { label: "PR", value: "PR" },
  { label: "PE", value: "PE" },
  { label: "PI", value: "PI" },
  { label: "RJ", value: "RJ" },
  { label: "RN", value: "RN" },
  { label: "RS", value: "RS" },
  { label: "RO", value: "RO" },
  { label: "RR", value: "RR" },
  { label: "SC", value: "SC" },
  { label: "SP", value: "SP" },
  { label: "SE", value: "SE" },
  { label: "TO", value: "TO" },
];

export function EventFilters({
  value,
  onChange,
}: {
  value: EventFiltersValue;
  onChange: (next: EventFiltersValue) => void;
}) {
  const onQueryChange = (query: string) => onChange({ ...value, query });
  const onCityChange = (city: string) => onChange({ ...value, city });
  const onStateChange = (state: Uf | "all") => onChange({ ...value, state });

  return (
    <Card className="border-border/60">
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={value.query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Buscar por nome da vaquejada, cidade ou atração…"
              className="pl-9"
            />
          </div>
          <Select
            value={value.state}
            onValueChange={(v) =>
              onStateChange(v === "all" ? "all" : (v as Uf))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              {UFS.map((uf) => (
                <SelectItem key={uf.value} value={uf.value}>
                  {uf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={value.city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="Cidade"
          />
        </div>
      </CardContent>
    </Card>
  );
}
