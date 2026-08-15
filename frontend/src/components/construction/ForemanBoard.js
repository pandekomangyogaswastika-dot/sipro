import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ClipboardCheck, Clock, HardHat, Hourglass, Lock, RefreshCw, RotateCcw, TimerOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import EmptyState from "@/components/patterns/EmptyState";
import { ErrorState, LoadingCards } from "@/components/patterns/StateViews";
import ForemanTaskCard from "@/components/construction/ForemanTaskCard";
import UnitScheduleSheet from "@/components/construction/UnitScheduleSheet";
import {
  DelayCauseDialog, RejectItemDialog, SubmitItemDialog, VerifyItemDialog,
} from "@/components/construction/BuildItemDialogs";
import api from "@/services/apiClient";
import { BUILD } from "@/constants/testIds";

/**
 * PAPAN MANDOR — "kerja hari ini" dalam satu layar, nyaman dipakai dari HP.
 *
 * Setiap kartu = satu STEP konstruksi yang sudah menjadi TASK berinstruksi dengan bukti
 * foto wajib dan validasi supervisor. Yang belum boleh dikerjakan tampil sebagai
 * "instruksi menunggu" beserta alasannya, sehingga urutan pekerjaan tidak bisa dilangkahi.
 */
const GROUPS = [
  { key: "overdue", label: "Telat — kerjakan hari ini", icon: TimerOff, tone: "rose",
    hint: "Sudah lewat tenggat. Isi penyebab bila memang tertahan di luar kendali." },
  { key: "rework", label: "Dikembalikan supervisor", icon: RotateCcw, tone: "rose",
    hint: "Wajib melampirkan foto perbaikan yang BARU sebelum diajukan ulang." },
  { key: "in_progress", label: "Sedang dikerjakan", icon: Clock, tone: "sky",
    hint: "Sudah dimulai — ajukan hasil beserta bukti bila pekerjaan selesai." },
  { key: "today", label: "Kerja hari ini", icon: HardHat, tone: "emerald",
    hint: "Gerbang mutu sudah terbuka: pendahulunya terverifikasi & waktu tunggu terlewati." },
  { key: "awaiting_verification", label: "Menunggu verifikasi supervisor", icon: Hourglass,
    tone: "sky", hint: "Hasil kerja Anda sudah diajukan — tinggal diperiksa supervisor." },
  { key: "to_verify", label: "Antrean verifikasi Anda", icon: ClipboardCheck, tone: "amber",
    hint: "Periksa bukti foto & checklist mutu, lalu setujui atau kembalikan." },
  { key: "scheduled_later", label: "Sudah boleh, jadwalnya nanti", icon: Clock, tone: "slate",
    hint: "Gerbang terbuka tetapi rencana mulainya masih di depan." },
  { key: "upcoming", label: "Instruksi menunggu (urutan berikutnya)", icon: Lock,
    tone: "slate", hint: "Belum boleh dikerjakan — baca dulu supaya persiapan material & tukang tidak mepet." },
];

const TONE = {
  rose: "border-rose-200 bg-rose-50 text-rose-800",
  sky: "border-sky-200 bg-sky-50 text-sky-800",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  slate: "border bg-secondary text-muted-foreground",
};

export default function ForemanBoard({ projectId, focusItemId, onFocusHandled }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openIns, setOpenIns] = useState({});
  const [dialog, setDialog] = useState({ kind: null, item: null });
  const [unitId, setUnitId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await api.get("/build/board/today",
        { params: { project_id: projectId || undefined } });
      setData(r.data?.data || null);
    } catch (e) {
      setError(e?.response?.status === 403
        ? "Papan Mandor hanya untuk tim Proyek (pelaksana lapangan, Manajer Proyek, Direksi)."
        : (e?.response?.data?.detail || "Gagal memuat papan mandor."));
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // Deep link dari tugas Work Hub: buka instruksi pekerjaan yang dimaksud + dialog ajukan.
  useEffect(() => {
    if (!focusItemId || !data) return;
    const all = Object.values(data.groups || {}).flat();
    const row = all.find((x) => x.id === focusItemId);
    if (row) {
      setOpenIns((s) => ({ ...s, [row.id]: true }));
      const el = document.querySelector(`[data-step="${row.step_code}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    onFocusHandled && onFocusHandled();
  }, [focusItemId, data, onFocusHandled]);

  const after = () => { setDialog({ kind: null, item: null }); load(); };

  const start = async (row) => {
    try {
      await api.post(`/build/items/${row.id}/start`);
      toast.success("Ditandai sedang dikerjakan.");
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Gagal memulai pekerjaan."); }
  };

  if (loading && !data) return <LoadingCards count={3} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const counts = data.counts || {};
  const groups = data.groups || {};
  const nothing = !Object.values(groups).some((g) => (g || []).length);

  return (
    <div data-testid={BUILD.boardPanel} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-3">
        <div data-testid={BUILD.boardCounts} className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold">{data.as_of}</span>
          <Chip tone="rose" label={`${counts.overdue || 0} telat`} />
          <Chip tone="emerald" label={`${counts.today || 0} hari ini`} />
          <Chip tone="sky" label={`${counts.in_progress || 0} dikerjakan`} />
          <Chip tone="rose" label={`${counts.rework || 0} perbaikan`} />
          {data.is_supervisor || counts.to_verify ? (
            <Chip tone="amber" label={`${counts.to_verify || 0} perlu diverifikasi`} />
          ) : null}
          <Chip tone="slate" label={`${counts.upcoming || 0} menunggu urutan`} />
        </div>
        <div className="flex items-center gap-2">
          {data.policy?.geo_required ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
              Lokasi wajib direkam
            </span>
          ) : null}
          <Button size="sm" variant="outline" data-testid={BUILD.boardRefresh} onClick={load}
            disabled={loading}>
            <RefreshCw className={`mr-1 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Muat ulang
          </Button>
        </div>
      </div>

      {nothing ? (
        <div data-testid={BUILD.boardEmpty}>
          <EmptyState icon={HardHat} title="Tidak ada pekerjaan untuk Anda hari ini"
            description={"Semua pekerjaan yang ditugaskan sudah beres atau masih menunggu "
              + "urutan. Papan ini akan terisi otomatis begitu gerbang pekerjaan berikutnya terbuka."} />
        </div>
      ) : null}

      {GROUPS.map((g) => {
        const rows = groups[g.key] || [];
        if (!rows.length) return null;
        const Icon = g.icon;
        const mode = g.key === "upcoming" ? "waiting"
          : g.key === "to_verify" ? "verify"
            : g.key === "awaiting_verification" ? "waiting" : "work";
        return (
          <section key={g.key} data-testid={BUILD.boardGroup} data-group={g.key}
            className="space-y-2">
            <div className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-1.5 ${TONE[g.tone]}`}>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold">
                <Icon className="h-3.5 w-3.5" /> {g.label} ({rows.length})
              </p>
              <p className="text-[11px] opacity-90">{g.hint}</p>
            </div>
            {rows.map((row) => (
              <ForemanTaskCard key={row.id} row={row} mode={mode}
                open={!!openIns[row.id]}
                onToggle={() => setOpenIns((s) => ({ ...s, [row.id]: !s[row.id] }))}
                onStart={start}
                onSubmit={(x) => setDialog({ kind: "submit", item: x })}
                onVerify={(x) => setDialog({ kind: "verify", item: x })}
                onReject={(x) => setDialog({ kind: "reject", item: x })}
                onDelay={(x) => setDialog({ kind: "delay", item: x })}
                onOpenUnit={(x) => setUnitId(x.unit_id)} />
            ))}
          </section>
        );
      })}

      <SubmitItemDialog item={dialog.kind === "submit" ? dialog.item : null}
        unitCode={dialog.item?.unit_code} open={dialog.kind === "submit"}
        onOpenChange={(v) => !v && setDialog({ kind: null, item: null })} onDone={after} />
      <VerifyItemDialog item={dialog.kind === "verify" ? dialog.item : null}
        open={dialog.kind === "verify"}
        onOpenChange={(v) => !v && setDialog({ kind: null, item: null })} onDone={after} />
      <RejectItemDialog item={dialog.kind === "reject" ? dialog.item : null}
        open={dialog.kind === "reject"}
        onOpenChange={(v) => !v && setDialog({ kind: null, item: null })} onDone={after} />
      <DelayCauseDialog item={dialog.kind === "delay" ? dialog.item : null}
        open={dialog.kind === "delay"}
        onOpenChange={(v) => !v && setDialog({ kind: null, item: null })} onDone={after} />
      <UnitScheduleSheet unitId={unitId} open={!!unitId}
        onOpenChange={(v) => !v && setUnitId(null)} onChanged={load} />
    </div>
  );
}

function Chip({ tone, label }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONE[tone]}`}>
      {label}
    </span>
  );
}
