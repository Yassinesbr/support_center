// src/app/pages/students/EnrollmentsCard.tsx
import { useEffect, useMemo, useState } from "react";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Label from "../form/Label";
import Badge from "../ui/badge/Badge";
import api from "../../api/axios";
import {
  setStudentClassPriceOverride,
  clearStudentClassPriceOverride,
} from "../../services/StudentPricingService";
import { useQueryClient } from "@tanstack/react-query";

type Klass = { id: string; name: string };

export default function EnrollmentsCard({
  studentId,
  initialSelectedIds = [],
}: {
  studentId: string;
  initialSelectedIds?: string[];
}) {
  const [classes, setClasses] = useState<Klass[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient(); // React Query client

  // Load all classes
  useEffect(() => {
    (async () => {
      const { data } = await api.get("/classes");
      setClasses(data.items ?? data ?? []);
    })();
  }, []);

  // Hydrate selected from props
  useEffect(() => {
    setSelected(initialSelectedIds ?? []);
  }, [initialSelectedIds.join("|")]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return classes;
    return classes.filter((c) => c.name.toLowerCase().includes(term));
  }, [classes, q]);

  const isChecked = (id: string) => selected.includes(id);
  const toggle = (id: string, checked: boolean) =>
    setSelected((prev) =>
      checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)
    );

  const allVisibleChecked =
    filtered.length > 0 && filtered.every((c) => selected.includes(c.id));
  const toggleAllVisible = () => {
    if (!filtered.length) return;
    setSelected((prev) =>
      allVisibleChecked
        ? prev.filter((id) => !filtered.some((c) => c.id === id))
        : Array.from(new Set([...prev, ...filtered.map((c) => c.id)]))
    );
  };

  const removeById = (id: string) =>
    setSelected((prev) => prev.filter((x) => x !== id));

  const onSave = async () => {
    setSaving(true);
    try {
      await api.put(`/students/${studentId}/classes`, { classIds: selected });

      // Invalidate invoices query so StudentPaymentsTab refreshes
      queryClient.invalidateQueries({
        queryKey: ["invoices", studentId],
      });
      queryClient.invalidateQueries({ queryKey: ["invoices", "all"] });
    } finally {
      setSaving(false);
    }
  };

  // Make sure we're invalidating invoices after setting price overrides
  const handlePriceOverride = async (classId: string, value: string) => {
    const cents =
      value.trim() === "" ? undefined : Math.round(parseFloat(value) * 100);

    try {
      if (cents === undefined) {
        await clearStudentClassPriceOverride(studentId, classId);
      } else {
        await setStudentClassPriceOverride(studentId, classId, cents);
      }

      // Invalidate invoices query to refresh billing data
      queryClient.invalidateQueries({
        queryKey: ["invoices", studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["invoices", "all"],
      });
    } catch (err) {
      console.error("Failed to update price override:", err);
      // Handle error (show toast, etc.)
    }
  };

  return (
    <div className="p-5 lg:p-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-5 lg:mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Enrollments
        </h3>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Selected badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {selected.length === 0 && (
          <Badge size="sm" variant="light" color="light">
            No classes selected
          </Badge>
        )}
        {selected.map((id) => {
          const c = classes.find((k) => k.id === id);
          if (!c) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => removeById(id)}
              className="group"
              title="Remove"
            >
              <Badge
                size="sm"
                variant="light"
                color="primary"
                endIcon={
                  <span className="text-xs opacity-70 group-hover:opacity-100">
                    ×
                  </span>
                }
              >
                {c.name}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label>Search classes</Label>
        <Input
          placeholder="Search by class name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Select all (visible) */}
      <div className="mt-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Checkbox checked={allVisibleChecked} onChange={toggleAllVisible} />
          {allVisibleChecked
            ? "Unselect all (visible)"
            : "Select all (visible)"}
        </label>
      </div>

      {/* List */}
      <div className="mt-2 max-h-72 overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-gray-800">
        {filtered.map((c) => (
          <label key={c.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isChecked(c.id)}
                onChange={(v: boolean) => toggle(c.id, v)}
              />
              <span className="font-medium text-gray-800 dark:text-white/90">
                {c.name}
              </span>
            </div>
            {isChecked(c.id) && (
              <span className="text-xs text-success-600 dark:text-success-500">
                selected
              </span>
            )}
          </label>
        ))}
        {!filtered.length && (
          <div className="py-8 text-sm text-center text-gray-500 dark:text-gray-400">
            No classes found
          </div>
        )}
      </div>

      {/* Price Override Inputs - Add this section */}
      <div className="mt-4">
        <Label>Custom Pricing (MAD)</Label>
        {filtered.map((c) => (
          <div key={c.id} className="flex items-center gap-2 py-2">
            <span className="block w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
              {c.name}
            </span>
            <input
              className="w-28 rounded border p-1 text-sm"
              placeholder="Custom MAD"
              inputMode="decimal"
              defaultValue={
                c.priceOverrideCents != null
                  ? (c.priceOverrideCents / 100).toString()
                  : ""
              }
              onBlur={async (e) => {
                const v = e.currentTarget.value.trim();
                const cents =
                  v === "" ? undefined : Math.round(parseFloat(v) * 100);
                try {
                  if (cents === undefined) {
                    await clearStudentClassPriceOverride(studentId, c.id);
                  } else {
                    await setStudentClassPriceOverride(studentId, c.id, cents);
                  }
                } finally {
                  // Invalidate invoices query so StudentPaymentsTab refreshes
                  queryClient.invalidateQueries({
                    queryKey: ["invoices", studentId],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["invoices", "all"],
                  });
                }
              }}
              title="Set a custom monthly price for this student in this class (leave empty to clear)"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
