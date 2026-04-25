import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  change?: number;
  suffix?: string;
  icon?: React.ReactNode;
  highlight?: "success" | "danger" | "neutral";
};

export function StatCard({ title, value, change, suffix, icon, highlight }: StatCardProps) {
  const hasChange = change !== undefined;
  const isPositive = (change ?? 0) > 0;
  const isNeutral = change === 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <span
            className={cn(
              "text-2xl font-bold",
              highlight === "success" && "text-emerald-400",
              highlight === "danger" && "text-destructive",
              highlight === "neutral" && "text-foreground",
              !highlight && "text-foreground"
            )}
          >
            {value}
          </span>
          {suffix && (
            <span className="ml-1 text-sm text-muted-foreground">{suffix}</span>
          )}
        </div>
        {hasChange && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md",
              isNeutral
                ? "bg-muted text-muted-foreground"
                : isPositive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {isNeutral ? (
              <Minus className="w-3 h-3" />
            ) : isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
    </div>
  );
}
