import React, { useState } from "react";
import { Plus } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useReference } from "@/context/ReferenceContext";

const NEW_VALUE = "__new__";

/**
 * Dropdown terkontrol yang isinya diambil dari registry backend (/api/reference).
 * Menggantikan input teks bebas untuk field enum/relasi — penyebab utama data kotor
 * (mis. satuan "m3" vs "M3" vs "kubik" dianggap tiga satuan berbeda).
 *
 * Untuk grup dinamis (mis. instansi perizinan, tipe unit) disediakan opsi
 * “+ Nilai baru…” agar daftar tetap bisa bertumbuh tanpa mengizinkan salah ketik massal.
 */
export default function ReferenceSelect({
  group, value, onChange, placeholder = "Pilih…", allowEmpty = false,
  emptyLabel = "Semua", disabled = false, testId, className,
}) {
  const { options, groupMeta } = useReference();
  const meta = groupMeta(group);
  const opts = options(group);
  const [customMode, setCustomMode] = useState(false);
  const [custom, setCustom] = useState("");

  if (customMode) {
    return (
      <div className="flex gap-2">
        <Input autoFocus value={custom} data-testid={testId}
          aria-label={`${meta.label} baru`}
          placeholder={`${meta.label} baru`}
          onChange={(e) => setCustom(e.target.value)} />
        <Button type="button" size="sm" variant="secondary"
          onClick={() => { onChange(custom.trim()); setCustomMode(false); }}>
          Pakai
        </Button>
        <Button type="button" size="sm" variant="ghost"
          onClick={() => { setCustomMode(false); setCustom(""); }}>
          Batal
        </Button>
      </div>
    );
  }

  const known = opts.some((o) => o.value === value);
  const items = known || !value ? opts : [...opts, { value, label: value }];

  return (
    <Select
      value={value || (allowEmpty ? "__all__" : "")}
      disabled={disabled}
      onValueChange={(v) => {
        if (v === NEW_VALUE) { setCustomMode(true); return; }
        onChange(v === "__all__" ? "" : v);
      }}
    >
      <SelectTrigger data-testid={testId} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty ? <SelectItem value="__all__">{emptyLabel}</SelectItem> : null}
        {items.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
        {meta.dynamic ? (
          <SelectItem value={NEW_VALUE}>
            <span className="inline-flex items-center gap-1 text-primary">
              <Plus className="h-3.5 w-3.5" /> Nilai baru…
            </span>
          </SelectItem>
        ) : null}
      </SelectContent>
    </Select>
  );
}
