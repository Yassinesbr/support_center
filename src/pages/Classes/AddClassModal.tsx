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
    } else {
      setName("");
      setDescription("");
      setTeacherId("");
      setStartAt("");
      setEndAt("");
      setPrice("");
    }
  }, [initial, open]);

  const onSubmit = async () => {
    const payload = {
      name,
      description,
      teacherId,
      startAt: startAt ? new Date(startAt).toISOString() : undefined,
      endAt: endAt ? new Date(endAt).toISOString() : undefined,
      monthlyPriceCents:
        price.trim() !== "" ? Math.round(parseFloat(price) * 100) : undefined,
    };
    const isEdit = !!initial?.id;
    const data = isEdit
      ? await updateClass.mutateAsync({ id: initial!.id, data: payload })
      : await createClass.mutateAsync(payload);
    onSaved?.(data.id);
    onClose();
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
        <div>
          <label className="block text-xs font-medium mb-1">
            Monthly price (MAD)
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full rounded-lg border px-3 py-2"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
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
        </div>
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
