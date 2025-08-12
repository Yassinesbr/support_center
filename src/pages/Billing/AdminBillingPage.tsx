// src/pages/Billing/AdminBillingPage.tsx
import { useMemo, useState } from "react";
import { useInvoices } from "../../hooks/useInvoices";
import { useGenerateMonthly } from "../../hooks/useGenerateMonthly";
import { useInvoicePdf } from "../../hooks/useInvoicePdf";
import { usePayInvoice } from "../../hooks/usePayInvoice";
import { Modal } from "../../components/ui/modal";

type Invoice = {
  id: string;
  number: string;
  issueDate: string;
  dueDate: string;
  status: "DUE" | "PAID" | "OVERDUE" | "CANCELLED";
  currency: string;
  subtotalCents: number;
  student?: { user?: { firstName?: string; lastName?: string } };
  items: {
    id: string;
    description: string;
    billedMonth: string;
    lineTotalCents: number;
    status?: "DUE" | "PAID" | "WAIVED";
    paidAt?: string | null;
    class?: { id: string; name: string };
  }[];
  payments?: {
    id: string;
    amountCents: number;
    paidAt: string;
    method: string;
  }[];
};

const cc = (cents: number, cur = "MAD") => `${(cents / 100).toFixed(2)} ${cur}`;

export default function AdminBillingPage() {
  // Month picker state
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Data & actions
  const { data: invoices = [], isLoading, refetch } = useInvoices(); // all invoices
  const genMut = useGenerateMonthly();
  const { download } = useInvoicePdf();
  const payMut = usePayInvoice(); // can accept studentId param but not needed here

  // Modal state
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);

  const handleGenerate = async () => {
    await genMut.mutateAsync(month);
    refetch();
  };

  const openRow = (inv: Invoice) => {
    setSelected(inv);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setSelected(null);
  };

  const paidInfo = useMemo(() => {
    if (!selected?.payments?.length) return null;
    // show latest payment
    const latest = [...selected.payments].sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
    )[0];
    return latest;
  }, [selected]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h1 className="text-xl font-semibold">Invoices</h1>
        <div className="flex items-center gap-2">
          <input
            type="month"
            className="border rounded px-3 py-2"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-60"
            disabled={genMut.isPending}
            title="Generate monthly invoices for all students"
          >
            {genMut.isPending ? "Generating…" : "Generate Monthly"}
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="text-gray-500">
              <tr>
                <th className="py-3 pl-4 text-left">Name</th>
                <th className="py-3 text-left">Date</th>
                <th className="py-3 text-left">Price</th>
                <th className="py-3 text-left">Status</th>
                <th className="py-3 pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: Invoice) => {
                const studentName =
                  [inv.student?.user?.firstName, inv.student?.user?.lastName]
                    .filter(Boolean)
                    .join(" ") || "—";
                return (
                  <tr
                    key={inv.id}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => openRow(inv)}
                  >
                    {/* Name (Invoice number) */}
                    <td className="py-3 pl-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-red-100 text-red-600 text-[10px] font-semibold">
                          PDF
                        </span>
                        <div className="flex flex-col">
                          <span className="font-medium">{inv.number}</span>
                          <span className="text-xs text-gray-500 truncate">
                            {studentName}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>

                    {/* Price */}
                    <td className="py-3">
                      {cc(inv.subtotalCents, inv.currency)}
                    </td>

                    {/* Status (badge) */}
                    <td className="py-3">
                      <span
                        className={[
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          inv.status === "PAID"
                            ? "bg-green-100 text-green-700"
                            : inv.status === "OVERDUE"
                            ? "bg-red-100 text-red-700"
                            : inv.status === "CANCELLED"
                            ? "bg-gray-200 text-gray-600"
                            : "bg-yellow-100 text-yellow-800",
                        ].join(" ")}
                      >
                        {inv.status === "PAID"
                          ? "Paid"
                          : inv.status === "OVERDUE"
                          ? "Unpaid"
                          : inv.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3 pr-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-2">
                        <button
                          className="rounded border px-2 py-1"
                          onClick={() => download(inv.id, `${inv.number}.pdf`)}
                          title="Download PDF"
                        >
                          Download
                        </button>
                        {inv.status !== "PAID" && (
                          <button
                            className="px-3 py-1 rounded bg-indigo-600 text-white disabled:opacity-60"
                            disabled={payMut.isPending}
                            onClick={async () => {
                              await payMut.mutateAsync({
                                id: inv.id,
                                amountCents: inv.subtotalCents,
                                method: "cash",
                              });
                              refetch();
                            }}
                            title="Mark invoice as paid"
                          >
                            {payMut.isPending ? "Paying…" : "Pay"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Row-click modal */}
      <Modal
        isOpen={open}
        onClose={closeModal}
        className="max-w-3xl p-6"
        title="Invoice details"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{selected.number}</div>
                <div className="text-sm text-gray-500">
                  Student:{" "}
                  {[
                    selected.student?.user?.firstName,
                    selected.student?.user?.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </div>
              </div>
              <span
                className={[
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  selected.status === "PAID"
                    ? "bg-green-100 text-green-700"
                    : selected.status === "OVERDUE"
                    ? "bg-red-100 text-red-700"
                    : selected.status === "CANCELLED"
                    ? "bg-gray-200 text-gray-600"
                    : "bg-yellow-100 text-yellow-800",
                ].join(" ")}
              >
                {selected.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Issue date</div>
                <div className="font-medium">
                  {new Date(selected.issueDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Due date</div>
                <div className="font-medium">
                  {new Date(selected.dueDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Total</div>
                <div className="font-medium">
                  {cc(selected.subtotalCents, selected.currency)}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm text-gray-500">Items</div>
              <ul className="space-y-2">
                {selected.items.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center justify-between rounded border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {it.class?.name || it.description}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(it.billedMonth).toLocaleDateString(
                          undefined,
                          {
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">
                        {cc(it.lineTotalCents, selected.currency)}
                      </span>
                      <span
                        className={[
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          it.status === "PAID"
                            ? "bg-green-100 text-green-700"
                            : it.status === "WAIVED"
                            ? "bg-gray-200 text-gray-600"
                            : "bg-yellow-100 text-yellow-800",
                        ].join(" ")}
                      >
                        {it.status ?? "DUE"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {selected.status !== "PAID" ? (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  className="rounded border px-3 py-2"
                  onClick={() =>
                    download(selected.id, `${selected.number}.pdf`)
                  }
                >
                  Download PDF
                </button>
                <button
                  className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-60"
                  disabled={payMut.isPending}
                  onClick={async () => {
                    await payMut.mutateAsync({
                      id: selected.id,
                      amountCents: selected.subtotalCents,
                      method: "cash",
                    });
                    await refetch();
                    closeModal();
                  }}
                >
                  {payMut.isPending ? "Paying…" : "Confirm payment"}
                </button>
              </div>
            ) : (
              <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                <div className="font-medium">Already paid</div>
                {paidInfo && (
                  <div>
                    Paid on {new Date(paidInfo.paidAt).toLocaleString()} —{" "}
                    {cc(paidInfo.amountCents, selected.currency)} (
                    {paidInfo.method})
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
