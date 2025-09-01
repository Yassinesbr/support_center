import React, { useState } from "react";
import { useStudents } from "../../hooks/useStudents";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Avatar from "../ui/avatar/Avatar";
import Badge from "../ui/badge/Badge";
import Loader from "../Loader/Loader";

interface Student {
  id: string;
  userId: string;
  birthDate: string;
  address: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  enrollmentDate: string;
  paymentStatus: string;
  monthlyTotalCents?: number; // <-- add this
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
}

export default function StudentsList({ search }: { search: string }) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useStudents(search);
  const studentsList: Student[] = data ?? [];

  if (isLoading)
    return (
      <div>
        <Loader />
      </div>
    );

  if (error) return <div>Error loading students.</div>;

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Student
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Email
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Phone
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Parent Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Monthly
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Payment Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Enrollment Date
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {studentsList.length === 0 ? (
                <TableRow>
                  <TableCell className="py-10 text-center text-gray-500 text-theme-md dark:text-gray-400">
                    No student found.
                  </TableCell>
                </TableRow>
              ) : (
                studentsList.map((student) => (
                  <TableRow
                    key={student.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.05] cursor-pointer"
                    onClick={() => navigate(`/students/${student.id}`)}
                  >
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 overflow-hidden rounded-full">
                          <Avatar
                            alt={`${student.user.firstName} ${student.user.lastName}`}
                            firstName={student.user.firstName}
                            lastName={student.user.lastName}
                            size="medium"
                          />
                        </div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {student.user.firstName} {student.user.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {student.user.email}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {student.phone}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {student.parentName}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-900 text-theme-sm dark:text-gray-100">
                      {(student.monthlyTotalCents
                        ? (student.monthlyTotalCents / 100).toFixed(2)
                        : "0.00") + " MAD"}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant={
                          student.paymentStatus === "paid"
                            ? "success"
                            : student.paymentStatus === "partial"
                            ? "warning"
                            : "error"
                        }
                      >
                        {student.paymentStatus.charAt(0).toUpperCase() +
                          student.paymentStatus.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {new Date(student.enrollmentDate).toLocaleDateString(
                        "en-GB"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
