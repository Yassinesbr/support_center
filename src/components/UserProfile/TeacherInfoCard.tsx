export default function TeacherInfoCard({
  firstName,
  lastName,
  email,
  birthDate,
  phone,
  subject,
  hiringDate,
  salary,
}: {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  phone: string;
  subject: string;
  hiringDate: string;
  salary: string;
}) {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {firstName} {lastName}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {email}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Birth Date
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {new Date(birthDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Phone
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {phone}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Subject
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {subject}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Hiring Date
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {new Date(hiringDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Salary
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {salary}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                phone
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {phone}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
