import React, { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, FileStack, HardHat, ListChecks, Waypoints } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/patterns/EmptyState";
import { AccessDenied, ErrorState } from "@/components/patterns/StateViews";
import BuildMonitorPanel from "@/components/construction/BuildMonitorPanel";
import BuildQueuePanel from "@/components/construction/BuildQueuePanel";
import BuildTemplatePanel from "@/components/construction/BuildTemplatePanel";
import InspectionsPanel from "@/components/construction/InspectionsPanel";
import ProjectPhasesPanel from "@/components/construction/ProjectPhasesPanel";
import ProjectSelect from "@/components/construction/ProjectSelect";
import api from "@/services/apiClient";
import { BUILD, CONSTRUCTION } from "@/constants/testIds";

/**
 * PROGRES & MUTU KONSTRUKSI.
 *
 * Sebelum Fase 31 halaman ini hanya berisi kotak persen yang diketik manual pada fase
 * PROYEK, lalu angka itu ditimpa ke SEMUA unit — jadi tiap rumah tampak punya progres
 * sama dan tidak ada tenggat, bukti, maupun eskalasi.
 *
 * Sekarang dipisah jujur sesuai objeknya:
 *   1. Monitoring Unit      — jadwal berbukti per rumah (progres = pekerjaan terverifikasi)
 *   2. Antrean Kerja        — pekerjaan saya / menunggu verifikasi, lintas unit
 *   3. Infrastruktur Kawasan— pekerjaan milik proyek (jalan, drainase, gerbang)
 *   4. QC & Inspeksi        — inspeksi formal + punch list
 *   5. Template Jadwal      — tahapan per tipe unit yang bisa dikonfigurasi
 */
export default function ConstructionPage() {
  const [projectId, setProjectId] = useState(null);
  const [tab, setTab] = useState("monitor");
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);

  // Panggilan ini sekaligus menjadi PEMERIKSA HAK AKSES halaman: bila 403, seluruh
  // halaman diganti satu penjelasan sopan alih-alih setiap panel memunculkan pesan
  // teknis backend berulang kali.
  const loadPhases = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    try {
      const r = await api.get(`/construction/project/${projectId}/phases`);
      setPhases(r.data.data || []);
      setDenied(false);
    } catch (e) {
      if (e?.response?.status === 403) {
        setDenied(true);
      } else {
        setError(e?.response?.data?.detail || "Gagal memuat pekerjaan kawasan proyek.");
      }
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { loadPhases(); }, [loadPhases]);

  return (
    <div data-testid={CONSTRUCTION.page} className="space-y-4">
      <div className="sticky top-0 z-20 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HardHat className="h-5 w-5 text-primary" />
            <div>
              <h1 className="font-heading text-xl font-semibold">Progres & Mutu Konstruksi</h1>
              <p className="text-xs text-muted-foreground">
                Progres rumah dihitung dari pekerjaan yang diverifikasi beserta buktinya —
                bukan angka yang diketik.
              </p>
            </div>
          </div>
          <ProjectSelect value={projectId} onChange={setProjectId}
            testId={CONSTRUCTION.projectSelect} />
        </div>
      </div>

      {!projectId ? (
        <EmptyState icon={HardHat} title="Pilih proyek"
          description="Pilih proyek untuk memantau jadwal pembangunan tiap rumah, antrean kerja, dan mutu pekerjaan." />
      ) : denied ? (
        <AccessDenied testId={CONSTRUCTION.denied}
          title="Progres & Mutu Konstruksi hanya untuk tim Proyek"
          description="Halaman ini memuat jadwal pembangunan, bukti kerja, dan mutu tiap rumah — dibuka untuk Manajer Proyek, pelaksana lapangan, Keuangan, dan Direksi."
          askWho="Bila Anda memang perlu memantau progres rumah pembeli, mintakan hak akses ke admin sistem." />
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="flex h-auto flex-wrap justify-start">
            <TabsTrigger data-testid={BUILD.tabMonitor} value="monitor">
              <HardHat className="mr-1.5 h-3.5 w-3.5" /> Monitoring Unit
            </TabsTrigger>
            <TabsTrigger data-testid={BUILD.tabQueue} value="queue">
              <ListChecks className="mr-1.5 h-3.5 w-3.5" /> Antrean Kerja
            </TabsTrigger>
            <TabsTrigger data-testid={BUILD.tabPhases} value="phases">
              <Waypoints className="mr-1.5 h-3.5 w-3.5" /> Infrastruktur Kawasan
            </TabsTrigger>
            <TabsTrigger data-testid={BUILD.tabQc} value="qc">
              <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" /> QC & Inspeksi
            </TabsTrigger>
            <TabsTrigger data-testid={BUILD.tabTemplates} value="templates">
              <FileStack className="mr-1.5 h-3.5 w-3.5" /> Template Jadwal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitor">
            <BuildMonitorPanel projectId={projectId} />
          </TabsContent>

          <TabsContent value="queue">
            <BuildQueuePanel projectId={projectId} />
          </TabsContent>

          <TabsContent value="phases">
            <ProjectPhasesPanel projectId={projectId} onChanged={loadPhases} />
          </TabsContent>

          <TabsContent value="qc" className="space-y-3">
            {error ? <ErrorState message={error} onRetry={loadPhases} /> : null}
            {loading ? (
              <p className="text-sm text-muted-foreground">Memuat daftar pekerjaan kawasan…</p>
            ) : null}
            {!loading && !phases.length ? (
              <p className="rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
                Belum ada pekerjaan kawasan pada proyek ini — inspeksi tetap bisa dibuat
                tanpa dikaitkan ke fase kawasan.
              </p>
            ) : null}
            <InspectionsPanel projectId={projectId} phases={phases} />
          </TabsContent>

          <TabsContent value="templates">
            <BuildTemplatePanel projectId={projectId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
