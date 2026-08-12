import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatIDR } from "@/utils/formatters";
import api from "@/services/apiClient";
import { CLAIMS } from "@/constants/testIds";

export default function SubmitClaimDialog({ open, onOpenChange, onDone }) {
  const [spks, setSpks] = useState([]);
  const [spkId, setSpkId] = useState("");
  const [pct, setPct] = useState("");
  const [period, setPeriod] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSpkId(""); setPct(""); setPeriod("");
    api.get("/subcon/spk").then((r) => {
      const list = (r.data.data || []).filter((s) => ["active", "draft"].includes(s.status) && (s.progress_pct || 0) < 100);
      setSpks(list);
    }).catch(() => setSpks([]));
  }, [open]);

  const spk = useMemo(() => spks.find((s) => s.id === spkId), [spks, spkId]);
  const estGross = useMemo(() => {
    if (!spk || !pct) return 0;
    const delta = Number(pct) - (spk.progress_pct || 0);
    return delta > 0 ? Math.round((delta / 100) * (spk.contract_value || 0)) : 0;
  }, [spk, pct]);

  const submit = async () => {
    if (!spkId) { toast.error("Pilih SPK."); return; }
    if (!pct || Number(pct) <= (spk?.progress_pct || 0)) {
      toast.error(`Progres harus lebih dari ${spk?.progress_pct || 0}%.`); return;
    }
    setBusy(true);
    try {
      await api.post("/subcon/claims", {
        spk_id: spkId, progress_pct: Number(pct), period: period || undefined,
      });
      toast.success("Termin diajukan.");
      onOpenChange(false); onDone && onDone();
    } catch (e) { toast.error(e?.response?.data?.detail || "Gagal mengajukan termin."); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajukan Termin (Progress Claim)</DialogTitle>
          <DialogDescription>Pilih SPK & progres kumulatif. Nilai termin dihitung dari selisih progres × nilai kontrak.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>SPK</Label>
            <Select value={spkId} onValueChange={setSpkId}>
              <SelectTrigger data-testid={CLAIMS.submitSpk}>
                <SelectValue placeholder={spks.length ? "Pilih SPK…" : "Tidak ada SPK aktif"} />
              </SelectTrigger>
              <SelectContent>
                {spks.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.spk_number} · {s.subcontractor_name} · {s.progress_pct || 0}% · {formatIDR(s.contract_value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Progres kumulatif (%)</Label>
              <Input type="number" data-testid={CLAIMS.submitPct} value={pct}
                onChange={(e) => setPct(e.target.value)} min={(spk?.progress_pct || 0) + 1} max={100}
                placeholder={spk ? `> ${spk.progress_pct || 0}` : ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Periode (opsional)</Label>
              <Input data-testid={CLAIMS.submitPeriod} value={period}
                onChange={(e) => setPeriod(e.target.value)} placeholder="mis. Termin 2" />
            </div>
          </div>
          {spk ? (
            <div className="rounded-lg bg-secondary p-3 text-sm">
              Estimasi nilai termin: <span className="font-semibold tabular-nums">{formatIDR(estGross)}</span>
              <span className="text-muted-foreground"> (dari {spk.progress_pct || 0}% ke {pct || "–"}%)</span>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button data-testid={CLAIMS.submitSave} onClick={submit} disabled={busy || !spkId}>
            {busy ? "Mengajukan…" : "Ajukan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
