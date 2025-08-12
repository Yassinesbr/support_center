import api from "../api/axios";

export type InvoiceItem = {
  id: string;
  description: string;
  billedMonth: string;
  lineTotalCents: number;
  paidCents?: number | null;
  status?: "DUE" | "PAID" | "WAIVED";
  paidAt?: string | null;
  class?: { id: string; name: string };
};

export type InvoicePayment = {
  id: string;
  amountCents: number;
  paidAt: string;
  method: string;
  reference?: string | null;
};

export type Invoice = {
  id: string;
  number: string;
  issueDate: string;
  dueDate: string;
  status: "DUE" | "PAID" | "OVERDUE" | "CANCELLED";
  currency: string;
  subtotalCents: number;
  items: InvoiceItem[];
  payments?: InvoicePayment[];
  student?: { user?: { firstName?: string; lastName?: string } };
};

export const getInvoices = (studentId?: string) =>
  api
    .get<Invoice[]>("/invoices", { params: { studentId } })
    .then((r) => r.data);

export const payInvoice = (
  id: string,
  payload: { amountCents: number; method?: string; reference?: string }
) => api.post(`/invoices/${id}/pay`, payload).then((r) => r.data);

export const generateMonthly = (month: string) =>
  api.post("/invoices/generate-monthly", { month }).then((r) => r.data);

export const fetchInvoicePdfBlob = (id: string) =>
  api.get(`/invoices/${id}/pdf`, { responseType: "blob" }).then((r) => r.data);
