import { useState } from "react";
import { useInvoices } from "../../hooks/useInvoices";
import { useGenerateMonthly } from "../../hooks/useGenerateMonthly";
import { useInvoicePdf } from "../../hooks/useInvoicePdf";
import { usePayInvoice } from "../../hooks/usePayInvoice"; // Add this import

export default function AdminBillingPage() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: invoices = [], isLoading, refetch } = useInvoices(); // all
  const genMut = useGenerateMonthly();
  const { download } = useInvoicePdf();
  const payMut = usePayInvoice(); // Add this hook

  const handleGenerate = async () => {
    await genMut.mutateAsync(month);
    refetch();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Billing</h1>
        <div className="flex items-center gap-2">
          <input
            type="month"
            className="border rounded px-3 py-2"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            className="px-4 py-2 rounded bg-indigo-600 text-white"
            disabled={genMut.isPending}
          >
            {genMut.isPending ? "Generating..." : "Generate Monthly"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="text-gray-500">
              <tr>
                <th className="py-2 text-left">Invoice #</th>
                <th className="py-2 text-left">Student</th>
                <th className="py-2 text-left">Date</th>
                <th className="py-2 text-left">Amount</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-right">Action</th>
                <th className="py-2 text-right">Pay</th> {/* Add Pay column */}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t">
                  <td className="py-3">{inv.number}</td>
                  <td className="py-3">
                    {inv.student?.user?.firstName} {inv.student?.user?.lastName}
                  </td>
                  <td className="py-3">
                    {new Date(inv.issueDate).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    {(inv.subtotalCents / 100).toFixed(2)} {inv.currency}
                  </td>
                  <td className="py-3">{inv.status}</td>
                  <td className="py-3 text-right">
                    <button
                      className="px-2 py-1 rounded border"
                      onClick={() => download(inv.id, `${inv.number}.pdf`)}
                    >
                      PDF
                    </button>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      className="px-2 py-1 rounded bg-green-600 text-white disabled:opacity-50"
                      disabled={payMut.isPending || inv.status === "paid"}
                      onClick={async () => {
                        await payMut.mutateAsync({
                          id: inv.id,
                          amountCents: inv.subtotalCents,
                          method: "cash", // or let user pick
                        });
                        refetch();
                      }}
                    >
                      {payMut.isPending && payMut.variables?.id === inv.id
                        ? "Paying..."
                        : inv.status === "paid"
                        ? "Paid"
                        : "Pay"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
