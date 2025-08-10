// src/pages/Classes/AddClassModal.tsx
import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
import api from "../../api/axios";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

type Teacher = {
  id: string;
  user?: { firstName?: string; lastName?: string; email: string };
};

const initialState = {
  name: "",
  description: "",
  teacherId: "",
  startAt: "",
  endAt: "",
};

export default function AddClassModal({ open, onClose, onCreated }: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoadingTeachers(true);
      try {
        const { data } = await api.get<Teacher[]>("/teachers");
        setTeachers(data);
      } finally {
        setLoadingTeachers(false);
      }
    })();
  }, [open]);

  const onChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const reset = () => {
    setForm(initialState);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    setError(null);
    if (!form.name || !form.teacherId || !form.startAt || !form.endAt) {
      setError("Name, teacher, start and end are required.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/classes", {
        name: form.name,
        description: form.description || undefined,
        teacherId: form.teacherId,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
      });
      onCreated?.();
      handleClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create class.";
      setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      showCloseButton
      className="max-w-3xl"
    >
      {/* Header */}
      <div className="px-6 pt-6">
        <h3 className="text-lg font-semibold">Add Class</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Enter the class information below.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Body */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium mb-1">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="e.g. Math 101"
            />
          </div>
          {/* Teacher */}
          <div>
            <label className="block text-xs font-medium mb-1">Teacher</label>
            <select
              name="teacherId"
              value={form.teacherId}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2"
              disabled={loadingTeachers}
            >
              <option value="">
                {loadingTeachers ? "Loading..." : "Select a teacher"}
              </option>
              {teachers.map((t) => {
                const name =
                  [t.user?.firstName, t.user?.lastName]
                    .filter(Boolean)
                    .join(" ") || t.user?.email;
                return (
                  <option key={t.id} value={t.id}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>
          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Optional"
              rows={3}
            />
          </div>
          {/* Start */}
          <div>
            <label className="block text-xs font-medium mb-1">Start</label>
            <input
              type="datetime-local"
              name="startAt"
              value={form.startAt}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
          {/* End */}
          <div>
            <label className="block text-xs font-medium mb-1">End</label>
            <input
              type="datetime-local"
              name="endAt"
              value={form.endAt}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 flex justify-end gap-2">
        <button
          onClick={handleClose}
          className="rounded-lg border px-4 py-2 text-sm"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          onClick={submit}
          className="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Creating..." : "Create Class"}
        </button>
      </div>
    </Modal>
  );
}
