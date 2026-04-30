"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

export type Period = {
  label: string;
  from: Date;
  to: Date;
};

const presets = ["Hoje", "Esta semana", "Este mês", "Personalizado"] as const;
type Preset = (typeof presets)[number];

function getRange(preset: Preset, custom?: DateRange): Period {
  const now = new Date();
  switch (preset) {
    case "Hoje":
      return { label: "Hoje", from: startOfDay(now), to: endOfDay(now) };
    case "Esta semana":
      return { label: "Esta semana", from: startOfWeek(now, { locale: ptBR }), to: endOfWeek(now, { locale: ptBR }) };
    case "Este mês":
      return { label: "Este mês", from: startOfMonth(now), to: endOfMonth(now) };
    case "Personalizado":
      return { label: "Personalizado", from: custom?.from ?? startOfDay(now), to: custom?.to ?? endOfDay(now) };
  }
}

export function PeriodFilter({ onChange }: { onChange?: (period: Period) => void }) {
  const [active, setActive] = useState<Preset>("Este mês");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [popoverOpen, setPopoverOpen] = useState(false);

  function select(preset: Preset) {
    setActive(preset);
    if (preset !== "Personalizado") onChange?.(getRange(preset));
  }

  function applyCustom() {
    if (customRange?.from && customRange?.to) {
      onChange?.(getRange("Personalizado", customRange));
      setPopoverOpen(false);
    }
  }

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-[12px]"
      style={{
        background: "rgba(5, 150, 105, 0.06)",
        border: "1px solid rgba(5, 150, 105, 0.18)",
      }}
    >
      {presets.map((p) =>
        p === "Personalizado" ? (
          <Popover key={p} open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger
              render={
                <button
                  onClick={() => select(p)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-sm font-medium transition-all duration-180 cursor-pointer",
                    active !== p && "text-muted-foreground hover:text-foreground"
                  )}
                  style={
                    active === p
                      ? { background: "#059669", color: "#fff", boxShadow: "0 0 14px rgba(5,150,105,0.4)" }
                      : undefined
                  }
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {active === p && customRange?.from && customRange?.to
                    ? `${format(customRange.from, "dd/MM")} – ${format(customRange.to, "dd/MM")}`
                    : "Personalizado"}
                </button>
              }
            />
            <PopoverContent className="w-auto p-3 bg-popover border-border" align="end">
              <Calendar
                mode="range"
                selected={customRange}
                onSelect={setCustomRange}
                locale={ptBR}
                numberOfMonths={2}
              />
              <Button
                size="sm"
                className="mt-2 w-full cursor-pointer"
                disabled={!customRange?.from || !customRange?.to}
                onClick={applyCustom}
              >
                Aplicar
              </Button>
            </PopoverContent>
          </Popover>
        ) : (
          <button
            key={p}
            onClick={() => select(p)}
            className={cn(
              "px-3 py-1.5 rounded-[9px] text-sm font-medium transition-all duration-180 cursor-pointer",
              active !== p && "text-muted-foreground hover:text-foreground"
            )}
            style={
              active === p
                ? { background: "#059669", color: "#fff", boxShadow: "0 0 14px rgba(5,150,105,0.4)" }
                : undefined
            }
          >
            {p}
          </button>
        )
      )}
    </div>
  );
}
