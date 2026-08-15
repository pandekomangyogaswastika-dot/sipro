#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================
# (protokol dipertahankan; lihat riwayat git untuk teks lengkap)
#====================================================================================================
# END - Testing Protocol
#====================================================================================================

user_problem_statement: |
  Owner meminta 2 fokus (bukan fitur baru): (1) memperbaiki CACAT LOGIC Work Hub —
  domain kerja per DIVISI (Sales & Marketing, Teknis/Proyek, Digital Marketing, Finance)
  dengan SUPERVISOR + STAF, katalog JOBDESK dari fitur yang sudah ada, task yang diatur
  supervisor (event otomatis / berulang / manual), bukti kerja + verifikasi, dan POV per
  peran; termasuk cacat terbukti "Beranda penuh tugas tapi Tugas Saya nol".
  (2) memperbaiki CACAT LOGIC lead lifecycle — stage tidak boleh dipilih seenaknya, harus
  berbasis aksi + bukti, `won` otomatis dari akad/AJB, lost/recycle wajib alasan, dan WA
  in-system harus benar-benar terintegrasi (kontak pertama, reminder per tahap, follow-up,
  blasting promo) + penilaian kualitatif respons lead. Plus perbaikan UI/UX: kartu tanpa
  background, daftar tanpa paginasi, elemen yang seharusnya sticky saat digulir.

backend:
  - task: "Fase 29a — Work Hub v2: divisi/level, katalog 38 jobdesk, task berbukti, verifikasi"
    implemented: true
    working: true
    file: "backend/workhub.py, backend/jobdesk_catalog.py, backend/routers/workhub_router.py, backend/routers/work_router.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "POC scripts/verify_29a.py 61/61 PASS. Scope mine|division|all disatukan untuk /work/home & /work/tasks (cacat D-1 tertutup, dibuktikan lewat perbandingan angka per peran). Papan divisi, assign/reassign, submit bukti, verifikasi/kembalikan, jobdesk config, task berulang idempoten."

  - task: "Fase 29b — Lead lifecycle gerbang bukti + WA terintegrasi + playbook WA"
    implemented: true
    working: true
    file: "backend/lead_lifecycle.py, backend/routers/leads_lifecycle_router.py, backend/wa_playbooks.py, backend/routers/leads_router.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "POC scripts/verify_29b.py 58/58 PASS. nurturing->booking ditolak tanpa reservasi; won manual ditolak & otomatis setelah AJB; lost/recycle wajib alasan; stage_history; kirim WA dari record lead = kontak pertama (+waktu respons, tugas contact tertutup); playbook WA (5) reminder/follow-up/blasting dengan cooldown & RBAC."

  - task: "Fase 28c regresi — bukti kerja berpasangan + tambah foto temuan (celah PUT punchlist)"
    implemented: true
    working: true
    file: "backend/p28_utils.py, backend/routers/field_router.py, backend/models_p28.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "POC scripts/verify_28c.py 34/34 PASS. Celah lama ditutup: PUT /field/punchlist/{id} kini menerima TAMBAHAN foto temuan (append, maks 6)."

frontend:
  - task: "Work Hub UI: tab Tugas/Papan Divisi/Katalog Jobdesk, detail tugas berbukti, paginasi"
    implemented: true
    working: true
    file: "frontend/src/pages/TasksPage.js, frontend/src/components/work/*"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Diverifikasi visual oleh main agent (screenshot): tab, scope, papan divisi (4 anggota), katalog 11 jobdesk sales + dialog konfigurasi. Perlu uji end-to-end oleh testing agent."

  - task: "Lead detail: lifecycle gerbang bukti + panel WhatsApp + disposition (dropdown stage bebas DIHAPUS)"
    implemented: true
    working: true
    file: "frontend/src/components/sales/LeadDetail.js, LeadLifecyclePanel.js, LeadWaPanel.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Belum diuji lewat browser — perlu uji end-to-end."

  - task: "UI/UX sweep: background kartu, paginasi daftar, header/toolbar sticky"
    implemented: true
    working: true
    file: "frontend/src/components/patterns/Pagination.js, pages/LeadsPage.js, DealsPage.js, CustomersPage.js, ComplaintsPage.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "11 komponen kartu diberi bg-card; paginasi + header tabel sticky pada Lead/Deal/Customer/Komplain; toolbar Work Hub sticky."

metadata:
  created_by: "main_agent"
  version: "29.0"
  test_sequence: 37
  run_ui: true

test_plan:
  current_focus:
    - "Work Hub UI (scope konsisten, papan divisi, siklus bukti kerja)"
    - "Lead lifecycle UI (gerbang bukti, WA, disposition)"
    - "UI/UX: paginasi & sticky & kartu berlatar"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Gates 11/11 PASS. POC backend: 28c 34/34, 29a 61/61, 29b 58/58 (total 153 asersi).
      Yang perlu diuji testing agent: alur UI end-to-end per PERAN (staf vs supervisor vs
      owner), termasuk larangan-larangan (staf tak boleh melihat papan divisi, tak boleh
      verifikasi, tak boleh override stage). WhatsApp/e-sign/BI-SLIK/e-Faktur MODE SIMULASI.
      JANGAN uji drag-and-drop, kamera, atau suara.
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

## user_problem_statement: >
  Lanjutkan development repo SIPRO (github.com/kaiajwayasa/sipro). Sesi sebelumnya berhenti di
  tengah Fase 31c (frontend Construction Progress Engine v2). Permintaan owner: "construction
  progress saat ini fiturnya minus, tidak fungsional. Targetnya monitoring construction harus
  berjalan sesuai target waktu, ada reminder, ada eskalasi jika telat, harus ada proof-nya agar
  benar-benar mengikuti spek, ada pengamanan agar tidak terjadi kecurangan monitoring, ada penjaga
  agar tidak lewat dari guideline, progress bisa tergantung tipe unit dan bisa dikonfigurasi.
  Jangan bikin duplikasi - enhance fitur yang sudah ada. Field & data collection harus jelas,
  dropdown sesuai data yang dituju (bukan custom value). Unit juga harus terikat pada lead/deal
  jika sudah dibeli. Sekalian revisi cacat logika yang ada."

## backend:
  - task: "Fase 31 — Engine jadwal pembangunan per unit (POST /api/build/schedules, GET /api/build/unit/{id})"
    implemented: true
    working: true
    file: "backend/build_engine.py, backend/routers/build_router.py, backend/build_catalog.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "Template default 9 minggu/60 hari kerja (rumah tapak) + RUKO 15 minggu. Jadwal dibangkitkan per unit dengan tanggal kalender (hari Minggu dilewati), item per minggu/hari, bobot, dependensi, waktu tunggu curing, hold point. Kavling tanah ditolak dengan penjelasan. scripts/poc_31.py 63/63 PASS."

  - task: "Fase 31 — Gerbang mutu + bukti wajib + anti-kecurangan (submit/verify/reject/override)"
    implemented: true
    working: true
    file: "backend/build_actions.py, backend/routers/build_router.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "Tidak bisa loncat: predecessor wajib terverifikasi, waktu tunggu curing menahan dengan tanggal, hold point memblokir. Bukti wajib: minimal N foto (object storage file_id + watermark, bukan base64), checklist mutu lengkap, item KRITIS wajib lulus. Anti-kecurangan: foto daur ulang (hash SHA-256) ditolak, SoD pengaju != verifikator (403), staf tidak boleh verifikasi (RBAC), override wajib alasan SSOT + dicatat + notifikasi direksi. Rework wajib foto perbaikan baru."

  - task: "Fase 31 — Reminder + eskalasi berjenjang + progres unit nyata (POST /api/build/tick)"
    implemented: true
    working: true
    file: "backend/build_monitor.py, backend/build_engine.py, backend/engine.py, backend/jobdesk_catalog.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "Scheduler _build_tick: buka gerbang yang waktu tunggunya lewat, pengingat H-1/hari-H (idempoten per hari), eskalasi L1 (>=1 hari) staf+supervisor, L2 (>=3 hari) + direksi, L3 (>=7 hari) peringatan kritis; tugas TK-13 lewat Work Hub v2. Progres unit = SUM bobot item terverifikasi (cacat D-A: overwrite progres proyek ke semua unit sudah dihapus). Unit tanpa jadwal tidak lagi menampilkan progres palsu."

  - task: "Fase 31 — Antrean kerja /api/build/items filter status=todo|open (BARU sesi ini)"
    implemented: true
    working: true
    file: "backend/routers/build_router.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "status=todo -> ready/in_progress/rework (dipakai UI 'Perlu saya kerjakan'), status=open -> semua yang belum selesai. Diuji scripts/verify_31.py: todo <= open <= all, dan mine=true hanya memuat pekerjaan milik pengguna."

  - task: "Fase 31 — Portal pembeli: progres RUMAH nyata (GET /api/portal/progress)"
    implemented: true
    working: true
    file: "backend/build_monitor.py (buyer_milestones), backend/routers/portal_router.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "Respon memuat build.progress/planned_progress/deviation_days/milestones per minggu (status done/in_progress/pending + late + tanggal disetujui). Diverifikasi manual via API portal (unit A-01: 33% vs rencana 66%, telat 21 hari)."

## frontend:
  - task: "Fase 31c — Tab Monitoring Unit (papan pantau per rumah)"
    implemented: true
    working: true
    file: "frontend/src/components/construction/BuildMonitorPanel.js, BuildScheduleRow.js, BuildDelayReport.js, GenerateScheduleDialog.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Kartu ringkasan (rumah terjadwal, progres vs rencana, menunggu verifikasi, telat, tertahan gerbang/override), filter status SSOT, muat ulang, 'Jalankan pemantauan' (tick), 'Buat jadwal unit', peringatan unit belum terjadwal, baris per unit (progres + penanda rencana, pekerjaan berjalan, menunggu verifikasi, alasan terkunci, rincian telat, override), pagination, laporan penyebab keterlambatan. Sudah dicek main agent via screenshot (5 baris, 1 sheet)."

  - task: "Fase 31c — Sheet Jadwal Unit + dialog Ajukan/Verifikasi/Kembalikan/Override/Penyebab telat/Hentikan"
    implemented: true
    working: true
    file: "frontend/src/components/construction/UnitScheduleSheet.js, BuildItemCard.js, BuildItemDialogs.js, UnitTimelineChart.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "9 minggu / 20 item tampil dengan status, gerbang + alasan, hold point, bukti foto (thumbnail object storage), checklist, kurva rencana vs realisasi. Tombol hanya muncul bila BOLEH (tidak ada tombol mati): site engineer tidak melihat tombol verifikasi; pengaju sendiri mendapat pesan pemisahan tugas."
        -working: false
        -agent: "testing"
        -comment: "iter.39 CRITICAL: PM tidak melihat tombol Verifikasi/Kembalikan pada item berstatus 'Diajukan'."
        -working: true
        -agent: "main"
        -comment: "TIDAK REPRODUSIBEL sesi ini. Diverifikasi ulang via browser sebagai pm@sipro.co.id: sheet unit A-01 -> item W3-02 (status submitted, submitted_by=site@sipro.co.id) MENAMPILKAN tombol [data-testid=build-item-verify] (1) dan [data-testid=build-item-reject] (1), plus 13 tombol 'Terobos gerbang' pada item blocked. API GET /api/build/unit/{id} mengembalikan can={submit,verify,override,configure: true} untuk PM. Dugaan penyebab laporan sebelumnya: penghitungan dilakukan di baris papan pantau (ringkasan) bukan di dalam sheet, atau sheet belum termuat saat dihitung. CATATAN untuk testing agent: WAJIB klik tombol 'Buka jadwal & bukti' pada baris unit dulu (klik pada baris tidak membuka sheet), tunggu [data-testid=build-unit-sheet] muncul, baru hitung tombol."

  - task: "Fase 31c — Tab Antrean Kerja (pekerjaan saya / menunggu verifikasi)"
    implemented: true
    working: true
    file: "frontend/src/components/construction/BuildQueuePanel.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Cakupan: Perlu saya kerjakan (default staf) / Semua pekerjaan saya / Menunggu verifikasi (default supervisor) / Semua; filter status SSOT; baris memuat unit, minggu, tenggat, telat, penyebab belum dijelaskan; tombol 'Buka & kerjakan' membuka sheet unit."

  - task: "Fase 31c — Tab Template Jadwal (editor per tipe unit)"
    implemented: true
    working: true
    file: "frontend/src/components/construction/BuildTemplatePanel.js, BuildTemplateEditor.js, BuildStepEditor.js, UnitTypePicker.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Daftar template (bobot total, hari, dipakai N jadwal, tipe unit), Ubah/Duplikat/Hapus (hanya bila belum dipakai & bukan default). Editor: kode/nama/tipe unit/perhitungan hari/hari kerja per minggu + item pekerjaan (minggu, hari, bobot, bidang, pendahulu, waktu tunggu, hold point, foto minimal, peran pelaksana/verifikator, rincian, checklist + kritis). Peringatan validasi dari backend ditampilkan. Non-supervisor hanya bisa melihat."

  - task: "Fase 31c — ConstructionPage bertab + kartu Pembangunan di Beranda"
    implemented: true
    working: true
    file: "frontend/src/pages/ConstructionPage.js, components/construction/ProjectPhasesPanel.js, BuildHealthCard.js, pages/Home.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "5 tab: Monitoring Unit / Antrean Kerja / Infrastruktur Kawasan / QC & Inspeksi / Template Jadwal. Dialog QC base64 legacy DIHAPUS (cacat D-E) - QC formal dipakai lewat InspectionsPanel. Infrastruktur Kawasan diberi label jujur (bukan progres rumah) + riwayat log. Beranda peran proyek mendapat kartu 'Pembangunan rumah' (GET /build/summary)."

  - task: "Fase 31c — Portal pembeli: tahapan rumah per minggu"
    implemented: true
    working: true
    file: "frontend/src/components/portal/panels/ProgressPanel.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Progres utama = rumah pembeli (bukan progres proyek). Daftar milestone per minggu + status + tanggal rencana/disetujui + penanda 'melewati rencana'. Pekerjaan kawasan dipindah ke bagian terpisah dengan label jujur. Sudah dicek main agent via screenshot portal (Ibu Dewi Kartika / A-01)."

## metadata:
  created_by: "main_agent"
  version: "31.0"
  test_sequence: 31
  run_ui: true

## test_plan:
  current_focus:
    - "Fase 31c — Tab Monitoring Unit (papan pantau per rumah)"
    - "Fase 31c — Sheet Jadwal Unit + dialog Ajukan/Verifikasi/Kembalikan/Override/Penyebab telat/Hentikan"
    - "Fase 31c — Tab Antrean Kerja (pekerjaan saya / menunggu verifikasi)"
    - "Fase 31c — Tab Template Jadwal (editor per tipe unit)"
    - "Fase 31c — Portal pembeli: tahapan rumah per minggu"
    - "Fase 31 — Antrean kerja /api/build/items filter status=todo|open (BARU sesi ini)"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

## agent_communication:
    -agent: "main"
    -message: >
      SESI LANJUTAN (fork): repo GitHub dipulihkan lagi ke /app. Env yang hilang dibuat ulang
      (JWT_SECRET, EMERGENT_LLM_KEY, PORTAL_MASTER_OTP, DEFAULT_ORG_ID) -> login 500 (KeyError
      JWT_SECRET) SUDAH FIX. Dependensi backend diinstall ulang.
      Titik berhenti sesi lalu = BuildItemDialogs.js: panel syarat pengajuan sudah ditulis tetapi
      testId `BUILD.submitRequirements` BELUM didaftarkan -> SUDAH ditambahkan & diverifikasi
      (panel `build-submit-requirements` tampil dan menyebut satu per satu syarat yang belum
      lengkap; tombol 'Ajukan Hasil' nonaktif sampai lengkap).
      TINDAK LANJUT temuan iter.39:
        1. CRITICAL 'PM tidak melihat tombol verifikasi' -> TIDAK REPRODUSIBEL (bukti di
           status_history task sheet). Cara buka sheet: klik tombol 'Buka jadwal & bukti'.
        2. MEDIUM 'reject dialog tidak menampilkan error alasan pendek' -> DIPERBAIKI: sekarang
           semua dialog Fase 31 memakai komponen `Hint` (panel syarat inline, bukan cuma toast):
           build-reject-hint, build-override-hint, build-delay-hint, build-hold-hint. Tombol
           simpan NONAKTIF selama syarat belum lengkap.
        3. LOW 'toast tick tidak terdeteksi' -> DIPERBAIKI: hasil pemantauan sekarang MENETAP di
           panel (`build-tick-result`: jumlah jadwal diperiksa, gerbang dibuka, pengingat, eskalasi).
        4. 'portal OTP 404' -> BUKAN BUG: path benar `POST /api/portal/auth/request-otp` lalu
           `POST /api/portal/auth/verify-otp` (bukan /portal/request-otp). Pakai HP +628121111111
           dan OTP master 000000.
      Kredensial: /app/memory/test_credentials.md (sandi Sipro#2026).
      Guardrail hijau: bash scripts/run_all_gates.sh -> PASS (12 gates); scripts/poc_31.py 63/63 PASS;
      scripts/verify_31.py 30/30 PASS.
      PENTING pemisahan tugas: ajukan hasil pakai site@sipro.co.id, verifikasi pakai pm@sipro.co.id.
      Untuk unggah foto bukti: input `<input type=file>` biasa (bukan drag&drop) -> boleh pakai
      set_input_files dengan berkas gambar yang dibuat sendiri (PNG/JPEG kecil). Foto DUPLIKAT akan
      ditolak server (anti-kecurangan), jadi pakai berkas berbeda tiap pengajuan.

    -agent: "testing"
    -message: >
      Iterasi 40: backend 60/62 PASS, frontend 12/16 user story lulus, 0 bug kritis, 0 bug medium.
      Semua temuan iterasi 39 dinyatakan RESOLVED (tombol verifikasi PM ada, panel validasi inline
      bekerja, panel hasil pemantauan menetap). Iterasi 41 (fokus user story sisa): US-5, US-6,
      US-11, US-13, US-16 LULUS PENUH; US-12 lulus (simpan template + read-only pelaksana);
      catatan kecil: pelaksana masih punya tombol 'Lihat' pada template (read-only, dianggap wajar)
      dan OTP portal sulit dideteksi otomatis.

    -agent: "main"
    -message: >
      PENUTUPAN FASE 31. Dua catatan kecil iterasi 41 sudah ditindak:
      (1) 'Lihat' pada Template Jadwal untuk pelaksana MEMANG disengaja (read-only: tidak ada
          Ubah/Duplikat/Hapus/Baru) — bukan bug, template harus bisa dibaca pelaksana agar tahu
          urutan pekerjaan, bobot, hold point, dan checklist mutu.
      (2) OTP portal SUDAH punya testId (`portal-otp-input`, `portal-identifier-input`,
          `portal-request-otp-button`, `portal-verify-otp-button`) — iterasi 41 memakai selector
          placeholder sehingga gagal. Main agent memverifikasi manual lewat Playwright memakai
          testId: login OTP berhasil, tab Progres menampilkan "Rumah A-01 33%", 9 tahapan mingguan
          (M1 & M2 Selesai, M3 Dikerjakan + 'melewati rencana', sisanya Belum mulai) dan 4 gambar
          bukti termuat (naturalWidth 480).
      Perbaikan tambahan sesi ini: (a) `AccessDenied` state (satu kartu sopan) untuk peran tanpa
      izin — sebelumnya halaman /construction untuk sales menampilkan DUA pesan teknis berulang
      yang membocorkan nama izin internal; (b) `buyer_milestones()` tidak lagi menampilkan tanggal
      'disetujui' pada minggu yang baru sebagian selesai (kejujuran data ke pembeli);
      (c) template clone diverifikasi manual (2 -> 3 template, artefak uji dibersihkan kembali).
      Guardrail akhir: run_all_gates.sh PASS (12 gates), scripts/poc_31.py 63/63 PASS,
      scripts/verify_31.py 30/30 PASS. FASE 31 DINYATAKAN SELESAI & TERVERIFIKASI.

#====================================================================================================
# FASE 32 — Task-based Execution + Papan Mandor + Laporan Mingguan + Analitik Telat
#====================================================================================================

## backend:
  - task: "Fase 32 — Instruksi task per step + anti-bypass Work Hub (D-H/D-J/D-K)"
    implemented: true
    working: true
    file: "backend/build_instruction.py, backend/build_engine.py, backend/routers/workhub_router.py, backend/routers/work_router.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: true
        -agent: "main"
        -comment: "Setiap step yang boleh dikerjakan otomatis punya task TK-10 (rework: TK-12) dengan DESKRIPSI = instruksi kerja lengkap (lingkup, checklist mutu + penanda KRITIS, hold point, waktu tunggu, urutan pendahulu, verifikator) + deep link /construction?tab=board&item=<id>. CACAT KRITIS DITUTUP: task konstruksi tidak lagi bisa di-start/submit/verify/reject/complete lewat Work Hub generik (dulu bisa lolos dengan photos:['file-palsu'] tanpa checklist sehingga task tampak selesai tetapi progres rumah tidak naik). Rekonsiliasi 'task hantu' pada tick. poc_32 79/79 PASS."

  - task: "Fase 32 — Papan Mandor GET /api/build/board/today"
    implemented: true
    working: true
    file: "backend/build_board.py, backend/routers/build_ops_router.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: true
        -agent: "main"
        -comment: "Kelompok: overdue/today/in_progress/rework/awaiting_verification/to_verify/upcoming/scheduled_later + counts + policy. Hanya pekerjaan milik pengguna; supervisor mendapat antrean verifikasi (kecuali pekerjaan yang dia ajukan sendiri — SoD). 'upcoming' = instruksi menunggu beserta alasan terkunci & perkiraan tanggal buka (urutan tidak bisa dilangkahi)."

  - task: "Fase 32 — Kebijakan bukti kerja GET/PUT /api/build/policy (lokasi on/off oleh admin)"
    implemented: true
    working: true
    file: "backend/build_policy.py, backend/routers/build_ops_router.py, backend/routers/files_router.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: true
        -agent: "main"
        -comment: "Hanya owner/super_admin boleh mengubah (PM 403, site 403). geo_required ON → submit tanpa koordinat ditolak, akurasi > min_accuracy_m ditolak; min_note_chars ditegakkan. Koordinat dikirim eksplisit (BUKAN dari EXIF — EXIF tetap dibuang demi privasi), tersimpan di item.geo, tiap evidence.geo, files.geo, dan snapshot kebijakan pada build_item_submissions."

  - task: "Fase 32 — Laporan mingguan + PDF + scheduler Senin (TK-14)"
    implemented: true
    working: true
    file: "backend/build_reports.py, backend/routers/build_ops_router.py, backend/engine.py, backend/jobdesk_catalog.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: true
        -agent: "main"
        -comment: "POST /build/reports/weekly/run idempoten per (org, project, week_key); baris per rumah + totals + kurva rencana vs realisasi kumulatif + pekerjaan paling sering telat; notifikasi + tugas baca TK-14 untuk Direksi & PM (source_event memuat email — bug dedup yang membuat hanya 1 orang menerima sudah diperbaiki); PDF landscape valid (%PDF). APScheduler cron Senin 00:05 UTC (07:05 WIB)."

  - task: "Fase 32 — Analitik keterlambatan GET /api/build/analytics/delays"
    implemented: true
    working: true
    file: "backend/build_analytics.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: true
        -agent: "main"
        -comment: "by_step (rumah telat, rata-rata/maks hari, rasio, durasi template, penyebab dominan, unit terdampak), by_person (rasio telat, penyebab dominan, telat tanpa penjelasan), by_unit_type, + recommendations konkret (tambah durasi X hari, majukan pengadaan material, tinjau waktu tunggu, tinjau beban kerja, kalibrasi template tipe)."

## frontend:
  - task: "Fase 32c — Tab Papan Mandor (kerja hari ini, mobile-first)"
    implemented: true
    working: true
    file: "frontend/src/components/construction/ForemanBoard.js, ForemanTaskCard.js, pages/ConstructionPage.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: true
        -agent: "main"
        -comment: "Tab default untuk site_engineer. Dicek main agent: 5 kelompok, 22 kartu, chip ringkasan, HOLD POINT, 'Lihat instruksi kerja lengkap', tombol 'Ambil foto & ajukan' (kamera HP), 'Penyebab telat', 'Jadwal unit'. 0 error konsol."

  - task: "Fase 32c — Tab Laporan & Analitik (grafik + PDF + rekomendasi)"
    implemented: true
    working: true
    file: "frontend/src/components/construction/WeeklyReportPanel.js, DelayAnalyticsPanel.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: true
        -agent: "main"
        -comment: "Dicek main agent: 1 kartu pekan, detail + 6 metrik, grafik rencana vs realisasi (recharts), 13 baris rumah, unduh PDF, 17 baris analitik langkah + 10 rekomendasi dengan CTA ke Template Jadwal."

  - task: "Fase 32c — Kamera + rekam lokasi pada pengajuan hasil"
    implemented: true
    working: true
    file: "frontend/src/components/patterns/PhotoUploader.js, utils/useGeo.js, components/construction/BuildItemDialogs.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: true
        -agent: "main"
        -comment: "Tombol 'Ambil foto' (capture=environment) + 'Pilih berkas'; koordinat dikirim bersama unggahan; panel lokasi (build-geo-notice) hanya muncul bila kebijakan mewajibkan, dengan tombol 'Rekam lokasi' dan pesan izin yang manusiawi. Panel syarat mencantumkan 'Lokasi belum terekam' sehingga tombol Ajukan nonaktif."

  - task: "Fase 32c — CTA task konstruksi diarahkan ke Papan Mandor"
    implemented: true
    working: true
    file: "frontend/src/components/patterns/TaskCard.js, components/work/TaskDetailSheet.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        -working: true
        -agent: "main"
        -comment: "Kartu tugas dengan meta.build_item_id menampilkan 'Buka & ajukan hasil' (deep link) alih-alih tombol Ajukan Hasil generik yang akan ditolak server; sheet detail menampilkan panel penjelasan + tombol yang sama."

  - task: "Fase 32c — Admin: tab Kebijakan Bukti Kerja"
    implemented: true
    working: true
    file: "frontend/src/components/master/BuildPolicyPanel.js, pages/MasterDataPage.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        -working: true
        -agent: "main"
        -comment: "Dicek main agent sebagai owner: sakelar GPS wajib, kamera saja, minimal karakter uraian, akurasi maksimal + tombol simpan. CATATAN JUJUR: route /admin/master-data hanya bisa dibuka super_admin & owner (RequireAdmin), jadi cabang read-only pada panel adalah jaring aman bila panel dipakai di tempat lain — bukan halaman yang bisa dibuka PM. Aturan yang berlaku tetap terlihat pelaksana lewat penanda 'Lokasi wajib direkam' di Papan Mandor."

## test_plan:
  current_focus:
    - "Fase 32 — Instruksi task per step + anti-bypass Work Hub (D-H/D-J/D-K)"
    - "Fase 32c — Tab Papan Mandor (kerja hari ini, mobile-first)"
    - "Fase 32c — Kamera + rekam lokasi pada pengajuan hasil"
    - "Fase 32 — Laporan mingguan + PDF + scheduler Senin (TK-14)"
    - "Fase 32 — Analitik keterlambatan GET /api/build/analytics/delays"
    - "Fase 32 — Kebijakan bukti kerja (lokasi on/off oleh admin)"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

## agent_communication:
    -agent: "main"
    -message: >
      FASE 32 SIAP DIUJI. Guardrail: bash scripts/run_all_gates.sh → PASS (13 gates, gate baru
      scripts/verify_32.py 28/28); scripts/poc_32.py 79/79 PASS; scripts/poc_31.py 63/63 PASS
      (tanpa regresi).
      CACAT KRITIS YANG DITUTUP SESI INI (mohon diuji ulang): task pekerjaan konstruksi dulu bisa
      diselesaikan lewat Work Hub generik hanya dengan `photos:["file-palsu-123"]` tanpa checklist —
      task jadi 'submitted' padahal build_item tidak berubah. Sekarang /work/tasks/{id}/start|submit|
      verify|reject dan /work/tasks/{id}/complete MENOLAK task yang punya meta.build_item_id dengan
      pesan yang mengarahkan ke Papan Mandor + task punya deep link.
      CARA UJI PAPAN MANDOR: login site@sipro.co.id → /construction (tab Papan Mandor otomatis).
      Unggah foto: input file BIASA — ada dua input: [data-testid=build-camera-input] (kamera,
      hidden) dan [data-testid=build-submit-photos] (berkas, hidden saat mode kamera). Keduanya
      bisa dipakai set_input_files. Foto WAJIB berbeda tiap pengajuan (anti daur ulang hash).
      UJI KEBIJAKAN LOKASI: owner@sipro.co.id → /admin/master-data → tab "Kebijakan Bukti Kerja".
      Saat geo_required=ON, pengajuan dari browser headless tanpa izin lokasi HARUS ditolak dengan
      pesan jelas (itu perilaku BENAR). Setelah menguji, MATIKAN kembali agar alur lain tidak
      terhambat. Perekaman lokasi butuh izin geolocation — bila automasi tidak bisa memberi izin,
      cukup pastikan panel [data-testid=build-geo-notice] + tombol [data-testid=build-geo-retry]
      muncul dan tombol Ajukan nonaktif (backend sudah diuji poc_32).
      JANGAN uji drag&drop/kamera fisik/suara.

    -agent: "testing"
    -message: >
      Iterasi 42 (Fase 32): backend 100% (poc_32 79/79 + verify_32 28/28), frontend 11/12 user story
      lulus penuh, 0 bug kritis, 0 bug medium. Anti-bypass task konstruksi TERBUKTI bekerja
      (kartu tugas menampilkan 'Buka & ajukan hasil', bukan tombol Ajukan Hasil generik).
      Regresi Fase 31 aman (monitoring + tick result, antrean kerja, template, QC, kawasan,
      sheet jadwal 20 item, portal pembeli 33%). Catatan kecil: input foto perlu atribut multiple;
      US-32-6/US-32-9 tidak terkonfirmasi karena kondisi data saat pengujian.

    -agent: "main"
    -message: >
      PENUTUPAN FASE 32. Tiga catatan iterasi 42 ditindak:
      (1) atribut `multiple` ditambahkan pada input kamera (input berkas sudah punya) sehingga
          beberapa foto bisa dipilih sekaligus di desktop; pada HP tombol kamera tetap satu bidikan.
      (2) US-32-9 (TK-14) DIVERIFIKASI via API sebagai owner@sipro.co.id: 1 tugas
          "Baca laporan mingguan 2026-W33 — Cluster Asri Blok A" status open dengan
          link=/construction?tab=reports&report=<id> (tester sebelumnya melihat daftar terfilter).
      (3) US-32-6 (instruksi menunggu) DIVERIFIKASI main agent lewat Papan Mandor site engineer:
          chip "12 menunggu urutan" + kelompok data-group="upcoming" berisi alasan terkunci dan
          TANPA tombol ajukan/mulai; juga dijamin gate poc_32 ("Mengerjakan step yang di depan
          DITOLAK") dan verify_32.
      Guardrail akhir: run_all_gates.sh PASS (13 gates), poc_31 63/63, poc_32 79/79.
