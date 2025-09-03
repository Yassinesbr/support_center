import api from "../api/axios";

export const setStudentClassPriceOverride = (
  studentId: string,
  classId: string,
  priceOverrideCents?: number
) =>
  api
    .put(`/students/${studentId}/classes/${classId}/price-override`, {
      priceOverrideCents,
    })
    .then((r) => r.data);

export const clearStudentClassPriceOverride = (
  studentId: string,
  classId: string
) =>
  api
    .delete(`/students/${studentId}/classes/${classId}/price-override`)
    .then((r) => r.data);
