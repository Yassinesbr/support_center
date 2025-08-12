import { fetchInvoicePdfBlob } from "../services/BillingService";

export function useInvoicePdf() {
  const download = async (id: string, filename?: string) => {
    const blob = await fetchInvoicePdfBlob(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename ?? `invoice-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return { download };
}
