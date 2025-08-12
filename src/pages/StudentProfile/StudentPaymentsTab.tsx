// src/app/pages/students/StudentPaymentsTab.tsx
import { useState, useMemo } from "react";
import { useInvoices } from "../../hooks/useInvoices";
import { usePayInvoice } from "../../hooks/usePayInvoice";
import { usePayInvoiceItem } from "../../hooks/usePayInvoiceItem";
import { useInvoicePdf } from "../../hooks/useInvoicePdf";
import { Modal } from "../../components/ui/modal";

const cc = (cents: number, cur = "MAD") => `${(cents / 100).toFixed(2)} ${cur}`;

export default function StudentPaymentsTab({
  studentId,
}: {
  studentId: string;
}) {
  const { data: invoices = [], isLoading, refetch } = useInvoices(studentId);
  const payInvoiceMut = usePayInvoice(studentId);
  const payItemMut = usePayInvoiceItem(studentId);
  const { download } = useInvoicePdf();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const openRow = (inv: any) => {
    setSelected(inv);
    setOpen(true);
  };

  const closeModal = () => {
    setSelected(null);
    setOpen(false);
  };

  const paidInfo = useMemo(() => {
    if (!selected?.payments?.length) return null;
    const latest = [...selected.payments].sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
    )[0];
    return latest;
  }, [selected]);

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Invoices</h3>

      <div className="overflow-x-auto bg-white rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="text-gray-500">
            <tr>
              <th className="py-3 pl-4 text-left">Invoice</th>
              <th className="py-3 text-left">Date</th>
              <th className="py-3 text-left">Amount</th>
              <th className="py-3 text-left">Classes</th>
              <th className="py-3 text-left">Status</th>
              <th className="py-3 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={() => openRow(inv)}
              >
                <td className="py-3 pl-4 font-medium">{inv.number}</td>
                <td className="py-3">
                  {new Date(inv.issueDate).toLocaleDateString()}
                </td>
                <td className="py-3">{cc(inv.subtotalCents, inv.currency)}</td>
                <td className="py-3">{inv.items?.length || 0}</td>
                <td className="py-3">
                  <span
                    className={
                      inv.status === "PAID"
                        ? "bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs"
                        : inv.status === "OVERDUE"
                        ? "bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs"
                        : "bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs"
                    }
                  >
                    {inv.status}
                  </span>
                </td>
                <td
                  className="py-3 pr-4 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="inline-flex gap-2">
                    <button
                      onClick={() => download(inv.id, `${inv.number}.pdf`)}
                      className="px-2 py-1 rounded border"
                    >
                      PDF
                    </button>
                    {inv.status !== "PAID" && (
                      <button
                        onClick={() =>
                          payInvoiceMut.mutate({
                            id: inv.id,
                            amountCents: inv.subtotalCents,
                          })
                        }
                        className="px-3 py-1 rounded bg-indigo-600 text-white disabled:opacity-60"
                        disabled={payInvoiceMut.isPending}
                        title="Mark entire invoice paid"
                      >
                        {payInvoiceMut.isPending ? "Paying…" : "Mark Paid"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
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

      {/* Modal */}
      <Modal
        isOpen={open}
        className="max-w-3xl p-6"
        onClose={closeModal}
        title="Invoice Details"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{selected.number}</div>
                <div className="text-sm text-gray-500">
                  Issued: {new Date(selected.issueDate).toLocaleDateString()}
                </div>
              </div>
              <span
                className={
                  selected.status === "PAID"
                    ? "bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs"
                    : "bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs"
                }
              >
                {selected.status}
              </span>
            </div>

            {/* Classes list */}
            <div>
              <div className="mb-2 text-sm text-gray-500">Classes</div>
              <ul className="space-y-2">
                {selected.items.map((it) => {
                  const remaining = it.lineTotalCents - (it.paidCents ?? 0);
                  return (
                    <li
                      key={it.id}
                      className="flex items-center justify-between rounded border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {it.class?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {cc(it.lineTotalCents, selected.currency)} ·{" "}
                          {new Date(it.billedMonth).toLocaleDateString(
                            undefined,
                            {
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </div>
                      </div>
                      {it.status === "PAID" ? (
                        <span className="text-green-700 bg-green-100 text-xs px-2 py-0.5 rounded-full">
                          PAID
                        </span>
                      ) : (
                        <button
                          className="px-3 py-1 rounded bg-indigo-600 text-white text-xs disabled:opacity-60"
                          onClick={() =>
                            payItemMut.mutate({
                              invoiceId: selected.id,
                              itemId: it.id,
                              amountCents: remaining,
                            })
                          }
                          disabled={payItemMut.isPending}
                        >
                          {payItemMut.isPending
                            ? "Paying…"
                            : `Pay ${cc(remaining, selected.currency)}`}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Pay all button */}
            {selected.status !== "PAID" &&
              selected.items.some((it) => it.status !== "PAID") && (
                <div className="flex justify-end">
                  <button
                    className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-60"
                    onClick={() =>
                      payInvoiceMut.mutate({
                        id: selected.id,
                        amountCents: selected.subtotalCents,
                      })
                    }
                    disabled={payInvoiceMut.isPending}
                  >
                    {payInvoiceMut.isPending ? "Paying…" : "Pay All"}
                  </button>
                </div>
              )}

            {/* Paid info */}
            {selected.status === "PAID" && paidInfo && (
              <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                Paid on {new Date(paidInfo.paidAt).toLocaleString()} —{" "}
                {cc(paidInfo.amountCents, selected.currency)} ({paidInfo.method}
                )
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
