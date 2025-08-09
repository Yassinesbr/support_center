import { useState } from "react";
import api from "../../api/axios";
import { Modal } from "../../components/ui/modal";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void; // refresh callback
  isFullscreen?: boolean;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // optional (server may auto-generate)
  birthDate: string; // yyyy-mm-dd
  address: string;
  phone: string;
  hiringDate: string; // yyyy-mm-dd
  subject: string; // or "speciality" if your model uses that naming
};

const initialState: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  birthDate: "",
  address: "",
  phone: "",
  hiringDate: "",
  subject: "",
};

export default function AddTeacherModal({
  open,
  onClose,
  onCreated,
  isFullscreen,
}: Props) {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

    if (!form.firstName || !form.lastName || !form.email) {
      setError("First name, last name, and email are required.");
      return;
    }
    if (!form.birthDate || !form.hiringDate) {
      setError("Birth date and hiring date are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        user: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          ...(form.password ? { password: form.password } : {}),
        },
        birthDate: new Date(form.birthDate).toISOString(),
        address: form.address || null,
        phone: form.phone || null,
        hiringDate: new Date(form.hiringDate).toISOString(),
        subject: form.subject || null,
      };

      await api.post("/teachers", payload);
      onCreated?.();
      handleClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create teacher.";
      setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      isFullscreen={isFullscreen}
      showCloseButton
      className={isFullscreen ? "" : "max-w-3xl"}
    >
      {/* Header */}
      <div className="px-6 pt-6">
        <h3 className="text-lg font-semibold">Add Teacher</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Enter the teacher’s information below.
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
          {/* Identity */}
          <div className="md:col-span-2">
            <div className="text-sm font-semibold mb-2">Identity</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  First name
                </label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={onChange}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Karim"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Last name
                </label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={onChange}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="El Amrani"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="karim@center.com"
                />
              </div>
            </div>
          </div>

          {/* Optional credentials */}
          <div>
            <label className="block text-xs font-medium mb-1">
              Password (optional)
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Temp password"
            />
          </div>

          {/* Personal */}
          <div>
            <label className="block text-xs font-medium mb-1">Birth date</label>
            <input
              type="date"
              name="birthDate"
              value={form.birthDate}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1">Address</label>
            <input
              name="address"
              value={form.address}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="1 Center St"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="0600000003"
            />
          </div>

          {/* Hiring / Subject */}
          <div className="md:col-span-2">
            <div className="text-sm font-semibold mb-2">Employment</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Hiring date
                </label>
                <input
                  type="date"
                  name="hiringDate"
                  value={form.hiringDate}
                  onChange={onChange}
                  className="w-full rounded-lg border px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium mb-1">
                  Subject / Speciality
                </label>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={onChange}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Math / Physics / English..."
                />
              </div>
            </div>
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
          {submitting ? "Creating..." : "Create Teacher"}
        </button>
      </div>
    </Modal>
  );
}
