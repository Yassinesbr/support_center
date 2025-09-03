import { useState } from "react";
import { Modal } from "../../components/ui/Modal"; // <-- your modal path
import api from "../../api/axios";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void; // refresh callback
  isFullscreen?: boolean;
};

// Align these with your backend DTO
type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  birthDate: string; // yyyy-mm-dd
  address: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  enrollmentDate: string; // yyyy-mm-dd
  paymentStatus: "paid" | "unpaid" | "partial";
};

const initialState: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  birthDate: "",
  address: "",
  phone: "",
  parentName: "",
  parentPhone: "",
  enrollmentDate: "",
  paymentStatus: "unpaid",
};

export default function AddStudentModal({
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

    // light validation
    if (!form.firstName || !form.lastName || !form.email) {
      setError("First name, last name, and email are required.");
      return;
    }
    if (!form.birthDate || !form.enrollmentDate) {
      setError("Birth date and enrollment date are required.");
      return;
    }

    setSubmitting(true);
    try {
      // Adjust payload to your API (flat vs nested)
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
        parentName: form.parentName || null,
        parentPhone: form.parentPhone || null,
        enrollmentDate: new Date(form.enrollmentDate).toISOString(),
        paymentStatus: form.paymentStatus,
      };

      await api.post("/students", payload);
      onCreated?.();
      handleClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create student.";
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
      className={isFullscreen ? "" : "max-w-3xl"} // keep your rounded/white from the modal itself
    >
      {/* Header */}
      <div className="px-6 pt-6">
        <h3 className="text-lg font-semibold">Add Student</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Enter the student’s information below.
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
                  placeholder="Alice"
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
                  placeholder="Johnson"
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
                  placeholder="alice@center.com"
                />
              </div>
            </div>
          </div>

          {/* Optional credentials */}
          {/* <div>
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
          </div> */}

          <div>
            <label className="block text-xs font-medium mb-1">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="0600000001"
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

          {/* Parent */}
          <div className="md:col-span-2">
            <div className="text-sm font-semibold mb-2">Parent / Tutor</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Parent name
                </label>
                <input
                  name="parentName"
                  value={form.parentName}
                  onChange={onChange}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Mr/Ms Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Parent phone
                </label>
                <input
                  name="parentPhone"
                  value={form.parentPhone}
                  onChange={onChange}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="0600000002"
                />
              </div>
            </div>
          </div>

          {/* Enrollment */}
          <div className="md:col-span-2">
            <div className="text-sm font-semibold mb-2">Enrollment</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Enrollment date
                </label>
                <input
                  type="date"
                  name="enrollmentDate"
                  value={form.enrollmentDate}
                  onChange={onChange}
                  className="w-full rounded-lg border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Payment status
                </label>
                <select
                  name="paymentStatus"
                  value={form.paymentStatus}
                  onChange={onChange}
                  className="w-full rounded-lg border px-3 py-2"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
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
          {submitting ? "Creating..." : "Create Student"}
        </button>
      </div>
    </Modal>
  );
}
