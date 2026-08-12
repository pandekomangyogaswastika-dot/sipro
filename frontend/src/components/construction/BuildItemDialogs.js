import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import PhotoUploader from "@/components/patterns/PhotoUploader";
import ReferenceSelect from "@/components/patterns/ReferenceSelect";
import api from "@/services/apiClient";
import { BUILD } from "@/constants/testIds";

/** Ajukan hasil kerja: catatan + foto bukti + checklist mutu (item kritis wajib lulus). */
export function SubmitItemDialog({ item, unitCode, open, onOpenChange, onDone }) {
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState([]);
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !item) return;
    setNote("");
    setPhotos([]);
    const init = {};
    (item.checklist || []).forEach((c) => {
      init[c.code] = { result: c.result && c.result !== "pending" ? c.result : "", note: c.note || "" };
    });
    setAnswers(init);
  }, [open, item]);

  if (!item) return null;
  const rework = item.status === "rework";
  const critical = (item.checklist || []).filter((c) => c.critical).length;
  const answered = (item.checklist || []).filter((c) => answers[c.code]?.result);
  const missing = (item.checklist || []).filter((c) => !answers[c.code]?.result);
  const criticalFail = (item.checklist || []).filter(
    (c) => c.critical && answers[c.code]?.result === "fail");
  const photoShort = Math.max(0, Number(item.min_photos || 0) - photos.length);

  // Syarat ditampilkan APA ADANYA supaya pelaksana tahu apa yang kurang sebelum
  // menekan tombol — bukan ditolak diam-diam setelah mengirim.
  const problems = [];
  if (note.trim().length < 10) problems.push("Uraian pekerjaan minimal 10 karakter.");
  if (photoShort) {
    problems.push(`Tambah ${photoShort} foto bukti lagi `
      + `(minimal ${item.min_photos} foto untuk pekerjaan ini).`);
  }
  if (rework && !photos.length) {
    problems.push("Pekerjaan ini dikembalikan supervisor — wajib melampirkan foto perbaikan baru.");
  }
  if (missing.length) {
    problems.push(`Checklist mutu belum lengkap: ${missing.map((c) => c.text).join("; ")}`);
  }
  if (criticalFail.length) {
    problems.push("Item mutu KRITIS belum lulus: "
      + `${criticalFail.map((c) => c.text).join("; ")}. Perbaiki dulu.`);
  }
  const ready = !problems.length;

  const submit = async () => {
    if (!ready) {
      toast.error(problems[0]);
      return;
    }
    setBusy(true);
    try {
      const res = await api.post(`/build/items/${item.id}/submit`, {
        note,
        photo_file_ids: photos,
        checklist: (item.checklist || []).map((c) => ({
          code: c.code, result: answers[c.code].result, note: answers[c.code].note || null,
        })),
      });
      toast.success(res.data?.message || "Hasil kerja diajukan.");
      if (res.data?.warning) toast.warning(res.data.warning);
      onOpenChange(false);
      onDone && onDone();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal mengajukan hasil kerja.");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid={BUILD.submitDialog}
        className="max-h-[88vh] overflow-y-auto bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajukan hasil: {item.name}</DialogTitle>
          <DialogDescription>
            Unit {unitCode} · minimal {item.min_photos} foto bukti
            {critical ? ` · ${critical} item mutu KRITIS wajib lulus` : ""}.
            {rework ? " Pekerjaan ini dikembalikan — wajib ada foto perbaikan baru." : ""}
          </DialogDescription>
        </DialogHeader>

        {rework && item.rejected_reason ? (
          <div className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span><b>Catatan supervisor:</b> {item.rejected_reason}</span>
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bnote">Uraian pekerjaan yang dikerjakan</Label>
            <Textarea id="bnote" rows={3} data-testid={BUILD.submitNote} value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={(item.tasks || []).join(", ") || "mis. galian pondasi selesai, urugan pasir dipadatkan"} />
            <p className="text-[11px] text-muted-foreground">Minimal 10 karakter.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Foto bukti pekerjaan</Label>
            <PhotoUploader value={photos} onChange={setPhotos} ownerType="build_item"
              ownerId={item.id} max={6} testId={BUILD.submitPhotos}
              label="Foto bukti pekerjaan"
              watermark={`${unitCode} · ${item.name}`.slice(0, 70)} />
            <p className="text-[11px] text-muted-foreground">
              Foto otomatis diberi watermark unit + tanggal, metadata GPS dibuang, dan
              ditolak bila identik dengan bukti pekerjaan lain.
            </p>
          </div>

          <div className="space-y-2" data-testid={BUILD.itemChecklist}>
            <Label>Checklist mutu {answered.length}/{(item.checklist || []).length}</Label>
            {(item.checklist || []).map((c) => (
              <div key={c.code} className="rounded-lg border bg-background p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs">
                    {c.text}
                    {c.critical ? (
                      <span className="ml-1 rounded bg-rose-100 px-1 text-[10px] font-semibold text-rose-700">
                        KRITIS
                      </span>
                    ) : null}
                  </span>
                  <div className="w-40">
                    <ReferenceSelect group="inspection_item_result"
                      value={answers[c.code]?.result || ""}
                      testId={`${BUILD.submitCheck}-${c.code}`}
                      placeholder="Hasil…"
                      onChange={(v) => setAnswers((s) => ({ ...s, [c.code]: { ...s[c.code], result: v } }))} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div data-testid={BUILD.submitRequirements}
            className={`rounded-lg border p-2.5 text-[11px] ${ready
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-900"}`}>
            <p className="font-semibold">
              {ready ? "Syarat pengajuan sudah lengkap"
                : "Belum bisa diajukan — lengkapi dulu:"}
            </p>
            {ready ? (
              <p>
                Hasil kerja akan masuk antrean verifikasi supervisor
                {item.verifier_hint ? ` (${item.verifier_hint})` : ""}.
              </p>
            ) : problems.map((p, i) => <p key={i}>• {p}</p>)}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Batal</Button>
          <Button data-testid={BUILD.submitSave} onClick={submit} disabled={busy || !ready}>
            {busy ? "Mengirim…" : "Ajukan Hasil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Verifikasi supervisor (pengaju tidak boleh memverifikasi pekerjaannya sendiri). */
export function VerifyItemDialog({ item, open, onOpenChange, onDone }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setNote(""); }, [open]);
  if (!item) return null;

  const run = async () => {
    setBusy(true);
    try {
      const res = await api.post(`/build/items/${item.id}/verify`, { note: note || null });
      toast.success(res.data?.message || "Pekerjaan diverifikasi.");
      onOpenChange(false);
      onDone && onDone();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal memverifikasi.");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid={BUILD.verifyDialog} className="bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Verifikasi pekerjaan
          </DialogTitle>
          <DialogDescription>
            {item.name} · diajukan {item.submitted_by || "-"} dengan
            {" "}{(item.evidence || []).length} bukti. Menyetujui akan membuka pekerjaan
            berikutnya dan menaikkan progres unit sebesar {item.weight}%.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="vnote">Catatan verifikasi (opsional)</Label>
          <Textarea id="vnote" rows={3} data-testid={BUILD.verifyNote} value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="mis. diperiksa langsung di lapangan, hasil sesuai spesifikasi" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Batal</Button>
          <Button data-testid={BUILD.verifySave} onClick={run} disabled={busy}>
            {busy ? "Menyimpan…" : "Setujui"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Kembalikan pekerjaan (alasan wajib) → tugas perbaikan otomatis untuk pelaksana. */
export function RejectItemDialog({ item, open, onOpenChange, onDone }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setReason(""); }, [open]);
  if (!item) return null;
  const problem = reason.trim().length < 10
    ? "Alasan minimal 10 karakter — pelaksana harus tahu apa yang harus diperbaiki." : "";

  const run = async () => {
    if (problem) { toast.error(problem); return; }
    setBusy(true);
    try {
      await api.post(`/build/items/${item.id}/reject`, { reason: reason.trim() });
      toast.success("Dikembalikan — tugas perbaikan dibuat untuk pelaksana.");
      onOpenChange(false);
      onDone && onDone();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal mengembalikan pekerjaan.");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid={BUILD.rejectDialog} className="bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kembalikan untuk perbaikan</DialogTitle>
          <DialogDescription>{item.name} — jelaskan apa yang belum sesuai.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="rreason">Alasan pengembalian</Label>
          <Textarea id="rreason" rows={3} data-testid={BUILD.rejectReason} value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="mis. ada rongga di sudut belakang, spesi belum penuh" />
        </div>
        <Hint testId={BUILD.rejectHint} problems={problem ? [problem] : []}
          okText="Alasan sudah jelas — pelaksana otomatis menerima tugas perbaikan." />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Batal</Button>
          <Button variant="destructive" data-testid={BUILD.rejectSave} onClick={run}
            disabled={busy || !!problem}>
            {busy ? "Menyimpan…" : "Kembalikan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Menerobos gerbang mutu — alasan SSOT + penjelasan, dilaporkan ke direksi. */
export function OverrideGateDialog({ item, open, onOpenChange, onDone }) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setReason(""); setNote(""); } }, [open]);
  if (!item) return null;
  const problems = [];
  if (!reason) problems.push("Pilih alasan menerobos gerbang dari daftar.");
  if (note.trim().length < 15) {
    problems.push("Penjelasan minimal 15 karakter — override selalu diaudit direksi.");
  }

  const run = async () => {
    if (problems.length) { toast.error(problems[0]); return; }
    setBusy(true);
    try {
      const res = await api.post(`/build/items/${item.id}/override`,
        { reason_code: reason, note: note.trim() });
      toast.success(res.data?.message || "Gerbang dibuka & dicatat.");
      onOpenChange(false);
      onDone && onDone();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal menerobos gerbang.");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid={BUILD.overrideDialog} className="bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" /> Terobos gerbang mutu
          </DialogTitle>
          <DialogDescription>
            {item.name} — gerbang ada untuk mencegah cacat bangunan. Tindakan ini DICATAT
            pada jejak audit dan langsung diberitahukan ke direksi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900">
            {(item.gate_reasons || []).map((r, i) => <p key={i}>• {r.detail}</p>)}
          </div>
          <div className="space-y-1.5">
            <Label>Alasan</Label>
            <ReferenceSelect group="build_override_reason" value={reason} onChange={setReason}
              testId={BUILD.overrideReason} placeholder="Pilih alasan…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="onote">Penjelasan</Label>
            <Textarea id="onote" rows={3} data-testid={BUILD.overrideNote} value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="mis. pondasi sudah dicek langsung bersama pengawas, kondisi terkunci penuh" />
          </div>
        </div>
        <Hint testId={BUILD.overrideHint} problems={problems}
          okText="Override akan dicatat pada jejak audit dan dilaporkan ke direksi." />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Batal</Button>
          <Button data-testid={BUILD.overrideSave} onClick={run}
            disabled={busy || !!problems.length}>
            {busy ? "Menyimpan…" : "Terobos & catat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Penyebab keterlambatan (kode SSOT) supaya bisa dianalisis, bukan teks bebas. */
export function DelayCauseDialog({ item, open, onOpenChange, onDone }) {
  const [cause, setCause] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open && item) { setCause(item.delay_cause || ""); setNote(item.delay_note || ""); }
  }, [open, item]);
  if (!item) return null;
  const problem = !cause ? "Pilih penyebab keterlambatan dari daftar." : "";

  const run = async () => {
    if (problem) { toast.error(problem); return; }
    setBusy(true);
    try {
      await api.post(`/build/items/${item.id}/delay-cause`,
        { cause, note: note.trim() || null });
      toast.success("Penyebab keterlambatan dicatat.");
      onOpenChange(false);
      onDone && onDone();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal menyimpan penyebab.");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid={BUILD.delayDialog} className="bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Penyebab keterlambatan</DialogTitle>
          <DialogDescription>
            {item.name} — rencana selesai {String(item.planned_finish || "").slice(0, 10)}.
            Penyebab dipakai untuk laporan pekerjaan paling rawan telat.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Penyebab</Label>
            <ReferenceSelect group="build_delay_cause" value={cause} onChange={setCause}
              testId={BUILD.delayCause} placeholder="Pilih penyebab…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dnote">Penjelasan & rencana pemulihan</Label>
            <Textarea id="dnote" rows={3} data-testid={BUILD.delayNote} value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="mis. besi datang Kamis, tukang ditambah 2 orang untuk mengejar" />
          </div>
        </div>
        <Hint testId={BUILD.delayHint} problems={problem ? [problem] : []}
          okText="Penyebab dipakai laporan pekerjaan paling rawan telat — bukan teks bebas." />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Batal</Button>
          <Button data-testid={BUILD.delaySave} onClick={run} disabled={busy || !!problem}>
            {busy ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Panel syarat: menampilkan APA YANG KURANG sebelum tombol ditekan, bukan menolak
 * diam-diam setelah dikirim. Dipakai semua dialog Fase 31 agar konsisten.
 */
export function Hint({ testId, problems = [], okText }) {
  const ok = !problems.length;
  return (
    <div data-testid={testId}
      className={`rounded-lg border p-2.5 text-[11px] ${ok
        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
        : "border-amber-200 bg-amber-50 text-amber-900"}`}>
      {ok ? <p>{okText}</p> : (
        <>
          <p className="font-semibold">Belum bisa disimpan — lengkapi dulu:</p>
          {problems.map((p, i) => <p key={i}>• {p}</p>)}
        </>
      )}
    </div>
  );
}
