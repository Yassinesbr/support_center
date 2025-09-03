import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
import Select from "../../components/form/Select";
import api from "../../api/axios";
import {
  useCreateClass,
  useUpdateClass,
  ClassRow,
} from "../../hooks/useClasses";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: (id: string) => void;
  initial?: ClassRow | null; // if set => edit mode
};

export default function AddClassModal({
  open,
  onClose,
  onSaved,
  initial,
}: Props) {
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [price, setPrice] = useState("");
  const [pricingMode, setPricingMode] = useState<"PER_STUDENT" | "FIXED_TOTAL">(
    "PER_STUDENT"
  );
  const [fixedPrice, setFixedPrice] = useState("");
  const [teacherPay, setTeacherPay] = useState("");
  const [teachers, setTeachers] = useState<{ value: string; label: string }[]>(
    []
  );

  useEffect(() => {
    if (!open) return;
    (async () => {
      const res = await api.get("/teachers");
      setTeachers(
        res.data.map((t: any) => ({
          value: t.id,
          label:
            `${t.user?.firstName ?? ""} ${t.user?.lastName ?? ""}`.trim() ||
            t.user?.email,
        }))
      );
    })();
  }, [open]);

  useEffect(() => {
    if (initial) {
      setName(initial.name ?? "");
      setDescription(initial.description ?? "");
      setTeacherId(initial.teacher?.id ?? "");
      setStartAt(initial.startAt ? initial.startAt.substring(0, 16) : "");
      setEndAt(initial.endAt ? initial.endAt.substring(0, 16) : "");
      setPrice(
        initial.monthlyPriceCents !== undefined
          ? (initial.monthlyPriceCents / 100).toString()
          : ""
      );
      // hydrate new fields when editing
      setPricingMode((initial as any)?.pricingMode ?? "PER_STUDENT");
      setFixedPrice(
        (initial as any)?.fixedMonthlyPriceCents !== undefined
          ? ((initial as any).fixedMonthlyPriceCents / 100).toString()
          : ""
      );
      setTeacherPay(
        (initial as any)?.teacherFixedMonthlyPayCents !== undefined
          ? ((initial as any).teacherFixedMonthlyPayCents / 100).toString()
          : ""
      );
    } else {
      setName("");
      setDescription("");
      setTeacherId("");
      setStartAt("");
      setEndAt("");
      setPrice("");
    }
  }, [initial, open]);

  // In the onSubmit function, ensure we're submitting all pricing data:
  const onSubmit = async () => {
    const payload = {
      name,
      description,
      teacherId,
      startAt: startAt ? new Date(startAt).toISOString() : undefined,
      endAt: endAt ? new Date(endAt).toISOString() : undefined,
      pricingMode,
      // Based on pricing mode, include appropriate price
      ...(pricingMode === "PER_STUDENT"
        ? { monthlyPriceCents: price ? Math.round(parseFloat(price) * 100) : 0 }
        : {
            fixedMonthlyPriceCents: fixedPrice
              ? Math.round(parseFloat(fixedPrice) * 100)
              : 0,
          }),
      // Include teacher fixed pay if provided
      ...(teacherPay
        ? {
            teacherFixedMonthlyPayCents: Math.round(
              parseFloat(teacherPay) * 100
            ),
          }
        : {}),
    };

    try {
      if (initial) {
        await updateClass.mutateAsync({ id: initial.id, data: payload });
      } else {
        await createClass.mutateAsync(payload);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      console.error("Failed to save class:", err);
      // Handle error (show toast, etc.)
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-2xl p-6">
      <h3 className="text-lg font-semibold">
        {initial ? "Modify Class" : "Add Class"}
      </h3>
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1">Name</label>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Description</label>
          <textarea
            className="w-full rounded-lg border px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Teacher</label>
          <Select
            options={teachers}
            placeholder="Choose a teacher"
            defaultValue={teacherId}
            onChange={(v) => setTeacherId(v)}
          />
        </div>
        <div className="mb-4">
          <label className="mb-2 block text-sm">Pricing mode</label>
          <select
            className="w-full rounded border p-2"
            value={pricingMode}
            onChange={(e) => setPricingMode(e.target.value as any)}
          >
            <option value="PER_STUDENT">Per student</option>
            <option value="FIXED_TOTAL">Fixed total (per class)</option>
          </select>
        </div>

        {pricingMode === "PER_STUDENT" && (
          <div className="mb-4">
            <label className="mb-2 block text-sm">
              Monthly price per student (MAD)
            </label>
            <input
              className="w-full rounded border p-2"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="e.g. 300"
            />
          </div>
        )}

        {pricingMode === "FIXED_TOTAL" && (
          <div className="mb-4">
            <label className="mb-2 block text-sm">
              Fixed total per class (MAD)
            </label>
            <input
              className="w-full rounded border p-2"
              value={fixedPrice}
              onChange={(e) => setFixedPrice(e.target.value)}
              inputMode="decimal"
              placeholder="e.g. 1200"
            />
          </div>
        )}

        {/* <div className="mb-4">
          <label className="mb-2 block text-sm">
            Teacher fixed monthly pay (MAD) – optional
          </label>
          <input
            className="w-full rounded border p-2"
            value={teacherPay}
            onChange={(e) => setTeacherPay(e.target.value)}
            inputMode="decimal"
            placeholder="e.g. 800"
          />
        </div> */}

        {/* <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">
              Start (optional)
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-lg border px-3 py-2"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              End (optional)
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-lg border px-3 py-2"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
          </div>
        </div> */}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button className="rounded-lg border px-4 py-2" onClick={onClose}>
          Cancel
        </button>
        <button
          className="rounded-lg bg-brand-600 text-white px-4 py-2"
          onClick={onSubmit}
        >
          {initial ? "Save changes" : "Create"}
        </button>
      </div>
    </Modal>
  );
}
