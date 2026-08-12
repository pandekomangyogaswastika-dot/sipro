import React from "react";
import { cn } from "@/lib/utils";
import { formatIDR } from "@/utils/formatters";
import { HOME } from "@/constants/testIds";

const TONE = {
  primary: "text-primary", amber: "text-amber-600", rose: "text-rose-600",
  indigo: "text-indigo-600", emerald: "text-emerald-600", muted: "text-muted-foreground",
};
const DOT = {
  primary: "bg-primary", amber: "bg-amber-500", rose: "bg-rose-500",
  indigo: "bg-indigo-500", emerald: "bg-emerald-500", muted: "bg-slate-400",
};

export default function MetricCard({ label, value, tone = "primary", hint, format }) {
  const display = format === "idr" ? formatIDR(value) : value;
  return (
    <div data-testid={HOME.metricCard} className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", DOT[tone] || DOT.primary)} />
        <p data-testid="metric-card-label" className="text-xs font-medium text-muted-foreground truncate">{label}</p>
      </div>
      <p data-testid="metric-card-value" className={cn("mt-2 text-2xl font-semibold font-heading tabular-nums", TONE[tone] || TONE.primary)}>
        {display}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
