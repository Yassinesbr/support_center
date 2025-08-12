import { useMutation, useQueryClient } from "@tanstack/react-query";
import { payInvoice } from "../services/BillingService";

export function usePayInvoice(studentId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      amountCents,
      method = "manual",
      reference,
    }: {
      id: string;
      amountCents: number;
      method?: string;
      reference?: string;
    }) => payInvoice(id, { amountCents, method, reference }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices", studentId ?? "all"] });
    },
  });
}
