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
    <div className="glass-card p-5 flex min-h-[144px] flex-col justify-between gap-4">
      <div className="flex items-start justify-between relative z-[1]">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground leading-tight">
          {title}
        </p>
        {icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#34d582] shrink-0"
            style={{
              background: "rgba(52, 213, 130, 0.085)",
              border: "1px solid rgba(52, 213, 130, 0.18)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-2 relative z-[1]">
        <div>
          <span
            className={cn(
              "text-[1.75rem] font-bold leading-none tracking-normal",
              highlight === "success" && "text-[#34d582]",
              highlight === "danger" && "text-destructive",
              !highlight && "text-foreground"
            )}
            style={
              highlight === "success"
                ? { textShadow: "0 0 12px rgba(52, 213, 130, 0.34)" }
                : undefined
            }
          >
            {value}
          </span>
          {suffix && <p className="mt-1 text-sm text-muted-foreground">{suffix}</p>}
        </div>

        {hasChange && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full",
              isNeutral
                ? "text-muted-foreground"
                : isPositive
                ? "text-[#34d582]"
                : "text-red-400"
            )}
            style={
              isNeutral
                ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }
                : isPositive
                ? { background: "rgba(52, 213, 130, 0.11)", border: "1px solid rgba(52, 213, 130, 0.24)" }
                : { background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.25)" }
            }
          >
            {isNeutral ? (
              <Minus className="w-3 h-3" />
            ) : isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(change ?? 0)}%
          </div>
        )}
      </div>
    </div>
  );
}
