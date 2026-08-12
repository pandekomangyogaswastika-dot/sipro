import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, HardHat, ClipboardCheck, CheckCircle2, XCircle, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusPill from "@/components/patterns/StatusPill";
import MetricCard from "@/components/patterns/MetricCard";
import EmptyState from "@/components/patterns/EmptyState";
import { LoadingCards, ErrorState } from "@/components/patterns/StateViews";
import SubmitClaimDialog from "@/components/subcon/SubmitClaimDialog";
import { useAuth } from "@/context/AuthContext";
import { formatIDR } from "@/utils/formatters";
import api from "@/services/apiClient";
import { CLAIMS } from "@/constants/testIds";

const SUBMIT_ROLES = ["owner", "super_admin", "project_manager", "site_engineer"];
const APPROVE_ROLES = ["owner", "super_admin", "finance"];

export default function ClaimsPanel() {
  const { user } = useAuth();
  const canSubmit = SUBMIT_ROLES.includes(user?.role);
  const canApprove = APPROVE_ROLES.includes(user?.role);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [verifyFor, setVerifyFor] = useState(null);
  const [vpct, setVpct] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await api.get("/subcon/claims");
      setData(r.data);
    } catch (e) { setError(e?.response?.data?.detail || "Gagal memuat termin."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (fn, okMsg) => {
    setBusy(true);
    try { await fn(); toast.success(okMsg); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Aksi gagal."); }
    finally { setBusy(false); }
  };

  const openVerify = (c) => { setVerifyFor(c); setVpct(c.claimed_pct || 0); };
  const submitVerify = () => act(
    () => api.post(`/subcon/claims/${verifyFor.id}/verify`, { verified_pct: Number(vpct) }),
    "Opname disimpan.").then(() => setVerifyFor(null));

  const s = data?.summary;
  return (
    <div data-testid={CLAIMS.panel} className="space-y-4">
      {s ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard label="Total Termin" value={s.total} tone="primary" />
          <MetricCard label="Menunggu Proses" value={s.open} tone="amber" />
          <MetricCard label="Disetujui (Tertagih)" value={s.approved_value} tone="emerald" format="idr" />
          <MetricCard label="Retensi Ditahan" value={s.retention_held} tone="indigo" format="idr" />
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Pengajuan termin progres subkontraktor → opname → disetujui (jadi tagihan AP + retensi).</p>
        {canSubmit ? (
          <Button size="sm" data-testid={CLAIMS.submitBtn} onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Ajukan Termin
          </Button>
        ) : null}
      </div>

      {loading ? <LoadingCards count={4} /> : error ? <ErrorState message={error} onRetry={load} /> :
        !data?.data?.length ? (
          <EmptyState icon={HardHat} title="Belum ada termin"
            description="Ajukan termin progres untuk SPK yang aktif."
            actionLabel={canSubmit ? "Ajukan Termin" : undefined} onAction={() => setAddOpen(true)} />
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader><TableRow>
                <TableHead>No. Termin</TableHead><TableHead>SPK / Subkon</TableHead><TableHead>Periode</TableHead>
                <TableHead>Progres</TableHead><TableHead className="text-right">Nilai</TableHead>
                <TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {data.data.map((c) => (
                  <TableRow key={c.id} data-testid={CLAIMS.row}>
                    <TableCell className="font-medium">{c.claim_number}</TableCell>
                    <TableCell className="text-sm">{c.spk_number}<br /><span className="text-muted-foreground">{c.subcontractor_name}</span></TableCell>
                    <TableCell className="text-sm">{c.period}</TableCell>
                    <TableCell className="tabular-nums text-sm">{c.prev_pct}% → {c.verified_pct ?? c.claimed_pct}%</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatIDR(c.status === "approved" ? c.gross : c.gross_est)}
                      {c.status === "approved" ? <div className="text-[11px] text-muted-foreground">net {formatIDR(c.net)}</div> : null}
                    </TableCell>
                    <TableCell><StatusPill status={c.status} group="claim_status" /></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        {c.status === "submitted" && canSubmit ? (
                          <Button size="sm" variant="outline" data-testid={CLAIMS.verifyBtn} onClick={() => openVerify(c)}>
                            <ClipboardCheck className="mr-1 h-3.5 w-3.5" /> Opname
                          </Button>
                        ) : null}
                        {["submitted", "verified"].includes(c.status) && canApprove ? (
                          <>
                            <Button size="sm" data-testid={CLAIMS.approveBtn} disabled={busy}
                              onClick={() => act(() => api.post(`/subcon/claims/${c.id}/approve`), "Termin disetujui & ditagihkan.")}>
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Setujui
                            </Button>
                            <Button size="sm" variant="ghost" data-testid={CLAIMS.rejectBtn} disabled={busy}
                              onClick={() => act(() => api.post(`/subcon/claims/${c.id}/reject`, { note: "Ditolak" }), "Termin ditolak.")}>
                              <XCircle className="h-3.5 w-3.5 text-rose-600" />
                            </Button>
                          </>
                        ) : null}
                        {c.status === "approved" ? <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><Receipt className="h-3.5 w-3.5" /> Tertagih</span> : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

      <SubmitClaimDialog open={addOpen} onOpenChange={setAddOpen} onDone={load} />

      <Dialog open={!!verifyFor} onOpenChange={(v) => !v && setVerifyFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Opname Progres</DialogTitle>
            <DialogDescription>
              {verifyFor ? `${verifyFor.claim_number} · diajukan ${verifyFor.prev_pct}% → ${verifyFor.claimed_pct}%` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Progres terverifikasi (%)</Label>
            <Input type="number" data-testid={CLAIMS.verifyPct} value={vpct}
              onChange={(e) => setVpct(e.target.value)} min={verifyFor?.prev_pct} max={verifyFor?.claimed_pct} />
            <p className="text-xs text-muted-foreground">Antara {verifyFor?.prev_pct}% dan {verifyFor?.claimed_pct}%.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyFor(null)}>Batal</Button>
            <Button data-testid={CLAIMS.verifySave} onClick={submitVerify} disabled={busy}>Simpan Opname</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
