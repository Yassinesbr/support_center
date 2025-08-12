// src/app/pages/students/StudentPaymentsTab.tsx
import { useInvoices } from "../../hooks/useInvoices";
import { usePayInvoice } from "../../hooks/usePayInvoice";
import { usePayInvoiceItem } from "../../hooks/usePayInvoiceItem";
import { useInvoicePdf } from "../../hooks/useInvoicePdf";

export default function StudentPaymentsTab({
  studentId,
}: {
  studentId: string;
}) {
  const { data: invoices = [], isLoading } = useInvoices(studentId);
  const payInvoiceMut = usePayInvoice(studentId);
  const payItemMut = usePayInvoiceItem(studentId);
  const { download } = useInvoicePdf();

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Invoices</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-gray-500">
            <tr>
              <th className="py-2 text-left">Invoice</th>
              <th className="py-2 text-left">Date</th>
              <th className="py-2 text-left">Amount</th>
              <th className="py-2 text-left">Classes (per item)</th>
              <th className="py-2 text-left">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv: any) => (
              <tr key={inv.id} className="border-t align-top">
                <td className="py-3 font-medium">{inv.number}</td>
                <td className="py-3">
                  {new Date(inv.issueDate).toLocaleDateString()}
                </td>
                <td className="py-3">
                  {(inv.subtotalCents / 100).toFixed(2)} {inv.currency}
                </td>

                {/* —— HERE: per-item actions inside the Classes column —— */}
                <td className="py-3">
                  <div className="flex flex-col gap-2">
                    {inv.items.map((it: any) => {
                      const remaining = it.lineTotalCents - (it.paidCents ?? 0);
                      return (
                        <div
                          key={it.id}
                          className="flex items-center justify-between gap-2 rounded border px-2 py-1"
                        >
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {it.class?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {(it.lineTotalCents / 100).toFixed(2)}{" "}
                              {inv.currency} ·{" "}
                              {new Date(it.billedMonth).toLocaleDateString(
                                undefined,
                                { month: "long", year: "numeric" }
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {it.status === "PAID" ? (
                              <span className="text-green-700 bg-green-100 text-xs px-2 py-0.5 rounded-full">
                                PAID
                              </span>
                            ) : (
                              <>
                                <span className="text-yellow-800 bg-yellow-100 text-xs px-2 py-0.5 rounded-full">
                                  DUE
                                </span>
                                <button
                                  className="px-2 py-1 text-xs rounded bg-indigo-600 text-white disabled:opacity-60"
                                  onClick={() =>
                                    payItemMut.mutate({
                                      invoiceId: inv.id,
                                      itemId: it.id,
                                      amountCents: remaining,
                                    })
                                  }
                                  disabled={payItemMut.isPending}
                                  title="Pay this class"
                                >
                                  {payItemMut.isPending
                                    ? "Paying…"
                                    : `Pay ${(remaining / 100).toFixed(2)}`}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </td>

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

                <td className="py-3 text-right">
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
                        {payInvoiceMut.isPending ? "Saving…" : "Mark Paid"}
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
    </div>
  );
}
