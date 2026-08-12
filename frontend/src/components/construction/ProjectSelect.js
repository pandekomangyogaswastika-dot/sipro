import React, { useEffect, useState } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import api from "@/services/apiClient";

// Shared project picker; auto-selects first project and reports the loaded list.
export default function ProjectSelect({ value, onChange, testId, onLoaded }) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get("/projects");
        const list = res.data.data || [];
        if (!alive) return;
        setProjects(list);
        onLoaded && onLoaded(list);
        if (!value && list.length) onChange(list[0].id);
      } catch { setProjects([]); }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger data-testid={testId} className="w-full sm:w-72">
        <SelectValue placeholder="Pilih proyek" />
      </SelectTrigger>
      <SelectContent>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
