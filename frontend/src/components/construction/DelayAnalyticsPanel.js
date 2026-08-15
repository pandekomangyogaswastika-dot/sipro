import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Lightbulb, TrendingDown, UserCog, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import EmptyState from "@/components/patterns/EmptyState";
import { ErrorState, LoadingCards } from "@/components/patterns/StateViews";
import RefLabel from "@/components/patterns/RefLabel";
import api from "@/services/apiClient";
import { BUILD } from "@/constants/testIds";

/**
 * ANALITIK KETERLAMBATAN — supaya template dikalibrasi dari DATA NYATA, bukan perasaan.
 *
 * Tiga sudut pandang: pekerjaan mana yang paling sering telat, siapa pelaksana yang paling
 * sering telat (beserta penyebab dominan agar adil, bukan menghakimi), dan tipe unit mana
 * yang templatenya paling tidak realistis. Ditutup dengan rekomendasi yang bisa langsung
 * dieksekusi di Template Jadwal.
 */
export default function DelayAnalyticsPanel({ projectId, onOpenTemplates }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await api.get("/build/analytics/delays",
        { params: { project_id: projectId || undefined } });
      setData(r.data?.data || null);
    } catch (e) {
      setError(e?.response?.data?.detail || "Gagal memuat analitik keterlambatan.");
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <LoadingCards count={2} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const s = data.summary || {};
  const steps = data.by_step || [];
  const people = data.by_person || [];
  const types = data.by_unit_type || [];
  const recs = data.recommendations || [];

  if (!steps.length && !s.items_late) {
    return (
      <EmptyState icon={TrendingDown} title="Belum ada keterlambatan tercatat"
        description="Semua pekerjaan masih dalam rencana. Analitik ini akan terisi otomatis begitu ada pekerjaan yang lewat tenggat." />
    );
  }

  return (
    <div data-testid={BUILD.analyticsPanel} className="space-y-4">
      <div data-testid={BUILD.analyticsSummary} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Pekerjaan telat" value={s.items_late}
          hint={`dari ${s.items_total} pekerjaan`} tone="text-rose-700" />
        <Metric label="Selesai tepat waktu" value={`${s.on_time_rate}%`}
          hint={`${s.on_time_done}/${s.items_done} pekerjaan selesai`}
          tone="text-emerald-700" />
        <Metric label="Telat tanpa penjelasan" value={s.unexplained}
          hint="penyebab belum diisi pelaksana" tone="text-amber-700" />
        <Metric label="Rekomendasi kalibrasi" value={recs.length}
          hint="bisa langsung diterapkan ke template" />
      </div>

      {recs.length ? (
        <div className="space-y-2 rounded-xl border border-sky-200 bg-sky-50 p-3">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-900">
            <Lightbulb className="h-4 w-4" /> Rekomendasi kalibrasi dari data nyata
          </p>
          {recs.map((r, i) => (
            <div key={i} data-testid={BUILD.analyticsRec}
              className="rounded-lg border bg-card p-2.5">
              <p className="text-xs font-semibold">{r.title}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{r.detail}</p>
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-primary">{r.action}</p>
                {onOpenTemplates ? (
                  <Button size="sm" variant="outline" data-testid={BUILD.analyticsRecAction}
                    onClick={() => onOpenTemplates(r)}>
                    <Wrench className="mr-1 h-3.5 w-3.5" /> Buka Template Jadwal
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-xl border bg-card p-3">
        <h4 className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold">
          <AlertTriangle className="h-4 w-4 text-rose-600" /> Pekerjaan paling sering telat
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-secondary text-left">
              <tr>
                {["Langkah", "Minggu", "Rumah telat", "Rata-rata", "Maks", "Rasio",
                  "Durasi template", "Penyebab dominan", "Unit"].map((h) => (
                    <th key={h} className="px-2.5 py-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {steps.map((r) => (
                <tr key={r.step_code} data-testid={BUILD.analyticsStepRow} className="border-t">
                  <td className="px-2.5 py-2">
                    <span className="font-mono font-semibold">{r.step_code}</span>
                    <span className="ml-1.5 text-muted-foreground">{r.name}</span>
                  </td>
                  <td className="px-2.5 py-2 tabular-nums">M{r.week}</td>
                  <td className="px-2.5 py-2 tabular-nums font-semibold text-rose-700">
                    {r.units_late}/{r.units_total}
                  </td>
                  <td className="px-2.5 py-2 tabular-nums">{r.avg_days} hari</td>
                  <td className="px-2.5 py-2 tabular-nums">{r.max_days} hari</td>
                  <td className="px-2.5 py-2 tabular-nums">{r.late_rate}%</td>
                  <td className="px-2.5 py-2 tabular-nums text-muted-foreground">
                    {r.planned_days} hari{r.wait_days ? ` +${r.wait_days} tunggu` : ""}
                  </td>
                  <td className="px-2.5 py-2">
                    {r.dominant_cause ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                        <RefLabel group="build_delay_cause" value={r.dominant_cause.cause} />
                        {" "}({r.dominant_cause.count})
                      </span>
                    ) : <span className="text-muted-foreground">belum dijelaskan</span>}
                  </td>
                  <td className="px-2.5 py-2 text-[11px] text-muted-foreground">
                    {(r.unit_codes || []).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-3">
          <h4 className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold">
            <UserCog className="h-4 w-4" /> Pelaksana paling sering telat
          </h4>
          <div className="space-y-1.5">
            {people.map((p) => (
              <div key={p.assigned_to} data-testid={BUILD.analyticsPersonRow}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background p-2.5 text-xs">
                <div className="min-w-0">
                  <p className="font-medium">{p.assigned_to}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {p.items_late} dari {p.items_total} pekerjaan telat · rata-rata{" "}
                    {p.avg_days} hari · selesai {p.items_done}
                    {p.unexplained ? ` · ${p.unexplained} tanpa penjelasan` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold tabular-nums ${p.late_rate >= 40
                    ? "text-rose-700" : "text-amber-700"}`}>{p.late_rate}%</p>
                  {p.dominant_cause ? (
                    <p className="text-[11px] text-muted-foreground">
                      <RefLabel group="build_delay_cause" value={p.dominant_cause.cause} />
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-3">
          <h4 className="mb-2 text-sm font-semibold">Keterlambatan per tipe unit</h4>
          <div className="space-y-1.5">
            {types.map((tp) => (
              <div key={tp.unit_type} data-testid={BUILD.analyticsTypeRow}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background p-2.5 text-xs">
                <div>
                  <p className="font-medium">{tp.unit_type}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {tp.items_late}/{tp.items_total} pekerjaan telat · rata-rata {tp.avg_days} hari
                    {(tp.templates || []).length ? ` · template ${tp.templates.join(", ")}` : ""}
                  </p>
                </div>
                <p className={`font-semibold tabular-nums ${tp.late_rate >= 35
                  ? "text-rose-700" : "text-emerald-700"}`}>{tp.late_rate}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, hint, tone = "" }) {
  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-heading text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
