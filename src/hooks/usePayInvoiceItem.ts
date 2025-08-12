// src/hooks/usePayInvoiceItem.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

export function usePayInvoiceItem(studentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      itemId,
      amountCents,
      method = "manual",
      reference,
    }: {
      invoiceId: string;
      itemId: string;
      amountCents: number;
      method?: string;
      reference?: string;
    }) =>
      api
        .post(`/invoices/${invoiceId}/items/${itemId}/pay`, {
          amountCents,
          method,
          reference,
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices", studentId ?? "all"] });
    },
  });
}
