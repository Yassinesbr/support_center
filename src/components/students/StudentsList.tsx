// import { useStudents } from "../../hooks/useStudents";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

interface Student {
  id: number;
  avatar: string;
  fullName: string;
  email: string;
  className: string;
  contact: string;
  enrollmentDate: string;
}

// Mock students data
const students: Student[] = [
  {
    id: 1,
    avatar: "/images/user/user-17.jpg",
    fullName: "Amina Bakkali",
    email: "amina.bakkali@email.com",
    className: "Computer Science - B1",
    contact: "+212 600-112233",
    enrollmentDate: "2023-09-15",
  },
  {
    id: 2,
    avatar: "/images/user/user-18.jpg",
    fullName: "Youssef El Arabi",
    email: "youssef.arabi@email.com",
    className: "Mathématiques - A2",
    contact: "+212 655-334455",
    enrollmentDate: "2022-09-10",
  },
  {
    id: 3,
    avatar: "/images/user/user-19.jpg",
    fullName: "Sara Chraibi",
    email: "sara.chraibi@email.com",
    className: "Sciences Physiques - C3",
    contact: "+212 644-987654",
    enrollmentDate: "2023-10-01",
  },
  {
    id: 4,
    avatar: "/images/user/user-20.jpg",
    fullName: "Omar Benali",
    email: "omar.benali@email.com",
    className: "Lettres Modernes - D1",
    contact: "+212 611-224466",
    enrollmentDate: "2024-01-20",
  },
  {
    id: 5,
    avatar: "/images/user/user-21.jpg",
    fullName: "Ayoub Fassi",
    email: "ayoub.fassi@email.com",
    className: "Informatique - E2",
    contact: "+212 688-332211",
    enrollmentDate: "2022-11-07",
  },
];

export default function StudentsList() {
  // const { data, isLoading, error } = useStudents();
  // const studentsList = data?.length ? data : students;
  const studentsList = students;
  // if (isLoading) return <div>Loading...</div>;
  // if (error) return <div>Error loading students.</div>;
  return (
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
                Class
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Contact
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
            {studentsList.map((student) => (
              <TableRow
                key={student.id}
                className="hover:bg-gray-50 dark:hover:bg-white/[0.05] cursor-pointer"
              >
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 overflow-hidden rounded-full">
                      <img
                        width={40}
                        height={40}
                        src={student.avatar}
                        alt={student.fullName}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {student.fullName}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {student.email}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {student.className}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {student.contact}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {new Date(student.enrollmentDate).toLocaleDateString("en-GB")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
