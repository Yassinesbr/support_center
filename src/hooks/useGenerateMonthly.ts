import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateMonthly } from "../services/BillingService";

export function useGenerateMonthly() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (month: string) => generateMonthly(month),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices", "all"] });
    },
  });
}
