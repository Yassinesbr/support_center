import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getInvoices, Invoice } from "../services/BillingService";

export function useInvoices(
  studentId?: string,
  options?: UseQueryOptions<Invoice[], unknown, Invoice[]>
) {
  return useQuery({
    queryKey: ["invoices", studentId ?? "all"],
    queryFn: () => getInvoices(studentId),
    staleTime: 60_000,
    ...options,
  });
}
