import api from "../api/axios";

export type Invoice = {
  id: string;
  number: string;
  issueDate: string;
  dueDate: string;
  status: "DUE" | "PAID" | "OVERDUE" | "CANCELLED";
  currency: string;
  subtotalCents: number;
  items: { id: string; class: { id: string; name: string } }[];
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
